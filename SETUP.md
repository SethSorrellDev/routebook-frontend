# Setup

## Prerequisites

- **Node.js**: 22.x (current LTS). Vite 6+ and Tailwind CSS v4 both require a reasonably current Node — check with `node --version`.
- **npm**: bundled with Node (10.x confirmed working)
- The [RouteBook backend](../RouteBook) running locally on port 8080 — this frontend has no standalone mode; every page fetches from the API

## Install

```bash
git clone <repo-url> routebook-frontend
cd routebook-frontend
npm install
```

## Running the dev server

First, make sure the backend is running (see [RouteBook/SETUP.md](../RouteBook/SETUP.md)) — it needs to be up on `http://localhost:8080` before the frontend can load any data.

Then:

```bash
npm run dev
```

Vite prints a local URL, typically `http://localhost:5173`. Open it in a browser.

The dev server proxies any `/api/*` request to `http://localhost:8080` (configured in `vite.config.ts`), so no CORS setup is needed and the frontend code just calls relative paths like `/api/routes`.

## Building for production

```bash
npm run build
```

Outputs a static build to `dist/`. This hasn't yet been deployed anywhere — see the project roadmap for planned Render/static-host deployment.

## Troubleshooting

- **Blank page / "Couldn't load routes" errors**: almost always means the backend isn't running, or isn't on port 8080. Check the backend terminal for `Started RouteBookApplication`.
- **`npm audit` reporting vulnerabilities in `react-router-dom`**: this package has had several rapid security patch releases; run `npm audit fix --force` and re-check `npm audit` — if the only remaining advisory is about "RSC Mode," it doesn't apply here (this project uses plain client-side routing, not React Server Components), and is safe to leave as-is rather than downgrading to chase a clean report.
- **A JSX tag or generic bracket looks wrong / TypeScript parse errors on a file that looks fine**: when pasting large code blocks into a terminal, some terminal/clipboard combinations have been observed to silently drop a lone `<` character (e.g. `Record<` becoming `Record`, or `<a href=...>` losing its `<a`). If a file fails to parse in a way that doesn't match what was written, `cat -A` the file and look for a dropped `<` before assuming the code itself is wrong.
