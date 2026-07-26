import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';

/**
 * Top bar carries the route-browsing entry point (logo -> route list)
 * plus a persistent search box. Search submits to /search?q=... rather
 * than filtering inline, since results need their own page once the
 * result set can span multiple routes/stops.
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
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <Link to="/" className="font-display text-xl tracking-wide">
            RouteBook
          </Link>
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gate codes, hazards, notes..."
              className="w-full max-w-md rounded border border-[var(--navy-dark)] bg-white/95 px-3 py-1.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
