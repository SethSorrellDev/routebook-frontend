import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LoginControl } from './LoginControl';

/**
 * Top bar carries the route-browsing entry point (logo -> route list)
 * plus a persistent search box. Search submits to /search?q=... rather
 * than filtering inline, since results need their own page once the
 * result set can span multiple routes/stops.
 *
 * Below the sm breakpoint the bar wraps to two rows: logo + login on
 * row one (login pushed right via ml-auto within that flex line),
 * search full-width on row two. At sm: and up it returns to a single
 * non-wrapping row matching the original desktop layout.
 */
export function Layout() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--border)] bg-[var(--navy)] text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:gap-6 sm:px-6 sm:py-4">
          <Link to="/" className="font-display text-lg tracking-wide sm:text-xl">
            RouteBook
          </Link>
          <form onSubmit={handleSearch} className="order-3 w-full sm:order-none sm:flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gate codes, hazards, notes..."
              className="w-full rounded border border-[var(--navy-dark)] bg-white/95 px-3 py-1.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-white/50 sm:max-w-md"
            />
          </form>
          <div className="ml-auto sm:ml-0">
            <LoginControl />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
