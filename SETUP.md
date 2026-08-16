# Setup

## Prerequisites

- **Node.js**: 22.x (current LTS). Vite 6+ and Tailwind CSS v4 both require a reasonably current Node — check with `node --version`.
- **npm**: bundled with Node (10.x confirmed working)
- The [RouteBook backend](https://github.com/SethSorrellDev/RouteBook) running locally on port 8080 — this frontend has no standalone mode; every page fetches from the API

## Install

```bash
git clone <repo-url> routebook-frontend
cd routebook-frontend
npm install
```

## Running the dev server

First, make sure the backend is running (see [RouteBook/SETUP.md](https://github.com/SethSorrellDev/RouteBook/blob/master/SETUP.md)) — it needs to be up on `http://localhost:8080` before the frontend can load any data.

Then:

```bash
npm run dev
```

Vite prints a local URL, typically `http://localhost:5173`. Open it in a browser.

The dev server proxies any `/api/*` request to `http://localhost:8080` (configured in `vite.config.ts`), so no CORS setup is needed and the frontend code just calls relative paths like `/api/routes`.

## Testing

```bash
npm run test
```

24 tests via Vitest + React Testing Library, covering:
- **`auth.test.ts`** — `sessionStorage`-based credential storage/retrieval
- **`client.test.ts`** — the API client's error handling (`ApiError` shape), Authorization header attachment, and 204 No Content handling, with `fetch` mocked
- **`KnowledgeEntryCard.test.tsx`** — the signature card component renders correctly across categories
- **`DeleteButton.test.tsx`** — the confirm-before-delete flow, including the pending state
- **`LoginControl.test.tsx`** — the full login flow (blank fields, wrong credentials, successful login, logout) against a real `AuthProvider` with mocked network calls

Runs automatically in CI on every push and PR, alongside `npm run build` (which also catches TypeScript type errors via `tsc -b`).

Run `npm run test:watch` for watch mode during development.

## Building for production

```bash
npm run build
```

Outputs a static build to `dist/`.

## Live deployment

Deployed as a Render static site at [routebook-frontend.onrender.com](https://routebook-frontend.onrender.com), talking to the backend deployed separately as a Render web service. The static site has a rewrite rule (`/* → /index.html`) configured in Render's dashboard so client-side routes work on direct navigation/refresh — this is a Render-side config, not something in this repo, so it needs to be re-added if the site is ever recreated.

## Troubleshooting

- **Blank page / "Couldn't load routes" errors**: almost always means the backend isn't running, or isn't on port 8080 (locally) or unreachable (in production — check `VITE_API_BASE_URL` was set correctly at build time). Check the backend for `Started RouteBookApplication`.
- **A raw, unstyled "Not Found" page on a direct/refreshed URL like `/search?q=...` in production**: means the static site's SPA rewrite rule is missing — see "Live deployment" above.
- **`npm audit` reporting vulnerabilities in `react-router-dom`**: this package has had several rapid security patch releases; run `npm audit fix --force` and re-check `npm audit` — if the only remaining advisory is about "RSC Mode," it doesn't apply here (this project uses plain client-side routing, not React Server Components), and is safe to leave as-is rather than downgrading to chase a clean report.
- **A JSX tag or generic bracket looks wrong / TypeScript parse errors on a file that looks fine**: when pasting large code blocks into a terminal, some terminal/clipboard combinations have been observed to silently drop a lone `<` character (e.g. `Record<` becoming `Record`, or `<a href=...>` losing its `<a`). If a file fails to parse in a way that doesn't match what was written, `cat -A` the file and look for a dropped `<` before assuming the code itself is wrong.
