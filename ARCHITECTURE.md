# Architecture

## Directory structuresrc/
├── api/
│ └── client.ts Typed fetch wrapper for every backend endpoint
├── types/
│ └── index.ts TypeScript interfaces mirroring backend DTOs exactly
├── components/
│ ├── Layout.tsx Top nav bar + search box + page outlet
│ ├── KnowledgeEntryCard.tsx The signature tabbed-card component
│ ├── categoryStyles.ts Color/label mapping per KnowledgeCategory
│ ├── formStyles.ts Shared Tailwind classes for form controls
│ ├── AddStopForm.tsx Inline form: creates a Location + Stop
│ └── AddKnowledgeEntryForm.tsx Inline form: creates a KnowledgeEntry (route- or stop-targeted)
├── pages/
│ ├── RouteListPage.tsx
│ ├── CreateRoutePage.tsx
│ ├── RouteDetailPage.tsx
│ ├── StopDetailPage.tsx
│ ├── KnowledgeEntryDetailPage.tsx
│ └── SearchResultsPage.tsx
├── App.tsx Route definitions
└── main.tsx Entry point## API client

`api/client.ts` exports a single `api` object, namespaced by resource (`api.drivers`, `api.routes`, `api.stops`, `api.locations`, `api.knowledgeEntries`, `api.attachments`). Every method returns a typed Promise. Non-2xx responses throw an `ApiError` carrying the backend's `{status, message, fieldErrors}` shape directly, so components can catch it and read `.message` / `.fieldErrors` without re-parsing anything.

Types in `types/index.ts` are hand-written to mirror the backend's DTOs field-for-field — flat, with foreign keys as plain numeric IDs, matching the backend's flat-DTO design decision. There's no code generation from the OpenAPI spec (the backend doesn't expose one); these are kept in sync manually.

## Dev server proxy

`vite.config.ts` proxies `/api/*` requests to `http://localhost:8080` during development, so the frontend can call relative paths (`/api/routes`) without CORS configuration on the backend.

## Routing/ Route list
/routes/new Create route form
/routes/:routeId Route detail (stops + route-wide notes)
/stops/:stopId Stop detail (stop-specific notes)
/knowledge-entries/:entryId Knowledge entry detail + attachments
/search?q=... Search resultsAll routes render inside `Layout`, which provides the persistent header (logo + search box).

## Search implementation

There's no backend search endpoint. `SearchResultsPage` fetches every knowledge entry (`GET /api/knowledge-entries` with no filters) and filters client-side on title/body substring match. This is fine at the current data scale; a real search endpoint (or a search index) would be the right move if the number of entries grows large enough that fetching everything becomes slow.

## Forms and the Location/Stop creation chain

The backend has no way to create a `Stop` without an existing `Location` (a `Stop` always references one). `AddStopForm` handles this by making two sequential API calls on submit: first `POST /api/locations`, then `POST /api/routes/{routeId}/stops` using the new location's ID. If the first call succeeds but the second fails, a Location without a Stop is left behind — this is a known gap (no rollback/transaction spanning both calls) that would be worth addressing before this became a production tool handling real data at volume.

## Design system

- **Colors**: warm paper background (`#f7f4ec`), deep workwear-navy primary (`#1e3a5f`), burnt-orange hazard accent (`#c2540a`), sage for parking/confirmed notes (`#5c7a5e`) — defined as CSS custom properties in `index.css`, referenced via Tailwind's arbitrary-value syntax (`bg-[var(--navy)]`)
- **Type**: Oswald (condensed, uppercase) for headings, Inter for body text, IBM Plex Mono for codes/data — all loaded via Google Fonts import in `index.css`
- **Category tab colors** live in `components/categoryStyles.ts`, mapped once and reused everywhere a category badge or card tab appears
