import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { RouteDto, StopDto, KnowledgeEntryDto, DriverDto } from '../types';
import { KnowledgeEntryCard } from '../components/KnowledgeEntryCard';
import { AddStopForm } from '../components/AddStopForm';
import { AddKnowledgeEntryForm } from '../components/AddKnowledgeEntryForm';
import { DeleteButton } from '../components/DeleteButton';
import {
  labelClass,
  inputClass,
  fieldWrapperClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../components/formStyles';
import { useAuth } from '../context/AuthContext';

export function RouteDetailPage() {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const { routeId } = useParams<{ routeId: string }>();
  const id = Number(routeId);

  const [route, setRoute] = useState<RouteDto | null>(null);
  const [stops, setStops] = useState<StopDto[]>([]);
  const [routeNotes, setRouteNotes] = useState<KnowledgeEntryDto[]>([]);
  const [drivers, setDrivers] = useState<DriverDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showAddStop, setShowAddStop] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDriverId, setEditDriverId] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.routes.getById(id),
      api.stops.getAllForRoute(id),
      api.knowledgeEntries.getFiltered({ routeId: id }),
      api.drivers.getAll(),
    ])
      .then(([routeData, stopsData, notesData, driversData]) => {
        setRoute(routeData);
        setStops(stopsData);
        setRouteNotes(notesData);
        setDrivers(driversData);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  function startEditing() {
    if (!route) return;
    setEditName(route.name);
    setEditDescription(route.description ?? '');
    setEditDriverId(route.driverId != null ? String(route.driverId) : '');
    setEditError(null);
    setEditing(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setEditError(null);
    try {
      const updated = await api.routes.update(id, {
        name: editName,
        description: editDescription || null,
        driverId: editDriverId ? Number(editDriverId) : null,
      });
      setRoute(updated);
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRoute() {
    await api.routes.delete(id);
    navigate('/');
  }

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

      {editing ? (
        <form
          onSubmit={handleSaveEdit}
          className="mb-6 rounded-md border border-[var(--border)] bg-white p-4"
        >
          {editError && (
            <p className="mb-3 rounded border border-[var(--hazard)]/30 bg-[var(--hazard)]/10 px-3 py-2 text-sm text-[var(--hazard)]">
              {editError}
            </p>
          )}
          <div className={fieldWrapperClass}>
            <label className={labelClass}>Route name</label>
            <input
              className={inputClass}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>
          <div className={fieldWrapperClass}>
            <label className={labelClass}>Description</label>
            <textarea
              className={inputClass}
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>
          <div className={fieldWrapperClass}>
            <label className={labelClass}>Driver</label>
            <select
              className={inputClass}
              value={editDriverId}
              onChange={(e) => setEditDriverId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName} ({d.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className={primaryButtonClass} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" className={secondaryButtonClass} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl">{route.name}</h1>
            {route.description && (
              <p className="mt-1 text-[var(--ink-muted)]">{route.description}</p>
            )}
          </div>
          {loggedIn && (
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={startEditing}
                className="text-sm text-[var(--navy)] hover:underline"
              >
                Edit
              </button>
              <DeleteButton
                label="Delete route"
                confirmMessage={`Delete "${route.name}"? This also deletes all its stops and knowledge entries. This cannot be undone.`}
                onConfirm={handleDeleteRoute}
              />
            </div>
          )}
        </div>
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
