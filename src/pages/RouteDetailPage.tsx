import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { RouteDto, StopDto, KnowledgeEntryDto } from '../types';
import { KnowledgeEntryCard } from '../components/KnowledgeEntryCard';

export function RouteDetailPage() {
  const { routeId } = useParams<{ routeId: string }>();
  const id = Number(routeId);

  const [route, setRoute] = useState<RouteDto | null>(null);
  const [stops, setStops] = useState<StopDto[]>([]);
  const [routeNotes, setRouteNotes] = useState<KnowledgeEntryDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.routes.getById(id),
      api.stops.getAllForRoute(id),
      api.knowledgeEntries.getFiltered({ routeId: id }),
    ])
      .then(([routeData, stopsData, notesData]) => {
        setRoute(routeData);
        setStops(stopsData);
        setRouteNotes(notesData);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return <p className="text-[var(--hazard)]">Couldn't load route: {error}</p>;
  }

  if (!route) {
    return <p className="text-[var(--ink-muted)]">Loading route...</p>;
  }

  return (
    <div>
      <Link to="/" className="mb-4 inline-block text-sm text-[var(--navy)] hover:underline">
        &larr; All routes
      </Link>
      <h1 className="text-3xl">{route.name}</h1>
      {route.description && (
        <p className="mt-1 text-[var(--ink-muted)]">{route.description}</p>
      )}

      {routeNotes.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg">Route-wide notes</h2>
          <div className="grid gap-3">
            {routeNotes.map((entry) => (
              <KnowledgeEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg">Stops</h2>
        {stops.length === 0 ? (
          <p className="text-[var(--ink-muted)]">No stops on this route yet.</p>
        ) : (
          <ol className="space-y-2">
            {stops
              .slice()
              .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
              .map((stop) => (
                <li key={stop.id}>
                  <Link
                    to={`/stops/${stop.id}`}
                    className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-white px-4 py-3 shadow-sm transition hover:shadow-md"
                  >
                    <span className="font-mono text-sm text-[var(--ink-muted)]">
                      {stop.sequenceOrder}
                    </span>
                    <span className="text-[var(--ink)]">{stop.customerName}</span>
                  </Link>
                </li>
              ))}
          </ol>
        )}
      </section>
    </div>
  );
}
