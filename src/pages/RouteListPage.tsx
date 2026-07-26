import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { RouteDto } from '../types';

export function RouteListPage() {
  const [routes, setRoutes] = useState<RouteDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.routes
      .getAll()
      .then(setRoutes)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p className="text-[var(--hazard)]">Couldn't load routes: {error}</p>;
  }

  if (!routes) {
    return <p className="text-[var(--ink-muted)]">Loading routes...</p>;
  }

  if (routes.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[var(--border)] p-8 text-center text-[var(--ink-muted)]">
        No routes yet. Routes are created from the backend for now.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl">Routes</h1>
        <Link
          to="/routes/new"
          className="rounded bg-[var(--navy)] px-3 py-1.5 text-sm text-white hover:bg-[var(--navy-dark)]"
        >
          + New Route
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {routes.map((route) => (
          <Link
            key={route.id}
            to={`/routes/${route.id}`}
            className="rounded-md border border-[var(--border)] bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-lg text-[var(--ink)]">{route.name}</h2>
            {route.description && (
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{route.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
