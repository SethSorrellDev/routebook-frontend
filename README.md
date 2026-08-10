# RouteBook Frontend

![CI](https://github.com/SethSorrellDev/routebook-frontend/actions/workflows/ci.yml/badge.svg)

**Live app**: https://routebook-frontend.onrender.com (talks to the live backend at https://routebook-da3w.onrender.com - both on Render's free tier, so expect a 30-60 second wake-up delay after 15 minutes of inactivity)

The React frontend for RouteBook — a route-knowledge management tool for Cintas SSR routes. Talks to the [RouteBook backend](../RouteBook) (Spring Boot REST API).

## Tech stack

- React 18 + TypeScript
- Vite (build tool, dev server with API proxy)
- Tailwind CSS v4
- React Router v7

## Design direction

Built as a "field binder, digitized" — not a generic SaaS dashboard. Warm paper-toned background, condensed industrial headings (Oswald), monospace treatment for gate codes and data (IBM Plex Mono), and a signature element: knowledge-entry cards styled like index cards with a die-cut colored tab on the left edge, color-coded by category (hazard = burnt orange, gate code = navy, parking = sage, contact = purple, access = tan, other = gray).

## Core features

- **Route-first browsing** — route list → route detail (stops + route-wide notes) → stop detail (stop-specific notes) → knowledge entry detail (with attachments)
- **Search** — a persistent header search box filtering across all knowledge entries by title/body text
- **Create/edit forms** — new routes (with inline new-driver creation), new stops (creates the underlying Location and Stop in one submit), and new knowledge entries at both the route and stop level
- **File attachments** — upload/view/delete files on any knowledge entry, backed by Cloudflare R2 via the backend

## Documentation

- [SETUP.md](SETUP.md) — running the dev server, connecting to the backend
- [ARCHITECTURE.md](ARCHITECTURE.md) — component structure, API client, design system
- [USER_GUIDE.md](USER_GUIDE.md) — walkthrough for end users (SSRs)

## Project status

| Phase | Scope | Status |
|---|---|---|
| 5 | Scaffold, routing, API client, all core read pages | Done |
| 6 | Create/edit forms | Done |
| 7 | Documentation, GitHub publish | In progress |
