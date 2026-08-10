import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { RouteDto, StopDto, KnowledgeEntryDto } from '../types';
import { KnowledgeEntryCard } from '../components/KnowledgeEntryCard';
import { AddStopForm } from '../components/AddStopForm';
import { AddKnowledgeEntryForm } from '../components/AddKnowledgeEntryForm';
import { secondaryButtonClass } from '../components/formStyles';
import { useAuth } from '../context/AuthContext';

export function RouteDetailPage() {
  const { loggedIn } = useAuth();
  const { routeId } = useParams<{ routeId: string }>();
  const id = Number(routeId);

  const [route, setRoute] = useState<RouteDto | null>(null);
  const [stops, setStops] = useState<StopDto[]>([]);
  const [routeNotes, setRouteNotes] = useState<KnowledgeEntryDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showAddStop, setShowAddStop] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

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

  const nextSequenceOrder =
    stops.length === 0 ? 1 : Math.max(...stops.map((s) => s.sequenceOrder)) + 1;

  return (
    <div>
      <Link to="/" className="mb-4 inline-block text-sm text-[var(--navy)] hover:underline">
        &larr; All routes
      </Link>
      <h1 className="text-3xl">{route.name}</h1>
      {route.description && (
        <p className="mt-1 text-[var(--ink-muted)]">{route.description}</p>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg">Route-wide notes</h2>
          {loggedIn ? (
            !showAddNote && (
              <button className={secondaryButtonClass} onClick={() => setShowAddNote(true)}>
                + Add note
              </button>
            )
          ) : (
            <span className="text-xs text-[var(--ink-muted)]">Log in to add notes</span>
          )}
        </div>

        {loggedIn && showAddNote && (
          <AddKnowledgeEntryForm
            target={{ type: 'route', id }}
            onCreated={(entry) => {
              setRouteNotes((prev) => [...prev, entry]);
              setShowAddNote(false);
            }}
            onCancel={() => setShowAddNote(false)}
          />
        )}

        {routeNotes.length > 0 && (
          <div className="grid gap-3">
            {routeNotes.map((entry) => (
              <KnowledgeEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
        {routeNotes.length === 0 && !showAddNote && (
          <p className="text-sm text-[var(--ink-muted)]">No route-wide notes yet.</p>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg">Stops</h2>
          {loggedIn ? (
            !showAddStop && (
              <button className={secondaryButtonClass} onClick={() => setShowAddStop(true)}>
                + Add stop
              </button>
            )
          ) : (
            <span className="text-xs text-[var(--ink-muted)]">Log in to add stops</span>
          )}
        </div>

        {loggedIn && showAddStop && (
          <AddStopForm
            routeId={id}
            nextSequenceOrder={nextSequenceOrder}
            onCreated={(stop) => {
              setStops((prev) => [...prev, stop]);
              setShowAddStop(false);
            }}
            onCancel={() => setShowAddStop(false)}
          />
        )}

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
