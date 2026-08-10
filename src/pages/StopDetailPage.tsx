import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { StopDto, KnowledgeEntryDto } from '../types';
import { KnowledgeEntryCard } from '../components/KnowledgeEntryCard';
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

export function StopDetailPage() {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const { stopId } = useParams<{ stopId: string }>();
  const id = Number(stopId);

  const [stop, setStop] = useState<StopDto | null>(null);
  const [entries, setEntries] = useState<KnowledgeEntryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editSequenceOrder, setEditSequenceOrder] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.stops.getById(id), api.knowledgeEntries.getFiltered({ stopId: id })])
      .then(([stopData, entriesData]) => {
        setStop(stopData);
        setEntries(entriesData);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  function startEditing() {
    if (!stop) return;
    setEditCustomerName(stop.customerName);
    setEditSequenceOrder(String(stop.sequenceOrder));
    setEditError(null);
    setEditing(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!stop) return;
    setSaving(true);
    setEditError(null);
    try {
      const updated = await api.stops.update(id, {
        customerName: editCustomerName,
        sequenceOrder: Number(editSequenceOrder),
        routeId: stop.routeId,
        locationId: stop.locationId,
      });
      setStop(updated);
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteStop() {
    if (!stop) return;
    await api.stops.delete(id);
    navigate(`/routes/${stop.routeId}`);
  }

  if (error) {
    return <p className="text-[var(--hazard)]">Couldn't load stop: {error}</p>;
  }

  if (!stop || !entries) {
    return <p className="text-[var(--ink-muted)]">Loading...</p>;
  }

  return (
    <div>
      <Link
        to={`/routes/${stop.routeId}`}
        className="mb-4 inline-block text-sm text-[var(--navy)] hover:underline"
      >
        &larr; Back to route
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
            <label className={labelClass}>Customer name</label>
            <input
              className={inputClass}
              value={editCustomerName}
              onChange={(e) => setEditCustomerName(e.target.value)}
              required
            />
          </div>
          <div className={fieldWrapperClass}>
            <label className={labelClass}>Sequence order</label>
            <input
              type="number"
              className={inputClass}
              value={editSequenceOrder}
              onChange={(e) => setEditSequenceOrder(e.target.value)}
              required
            />
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
            <h1 className="text-3xl">{stop.customerName}</h1>
            <p className="mt-1 font-mono text-sm text-[var(--ink-muted)]">
              Stop #{stop.sequenceOrder}
            </p>
          </div>
          {loggedIn && (
            <div className="flex shrink-0 items-center gap-3">
              <button onClick={startEditing} className="text-sm text-[var(--navy)] hover:underline">
                Edit
              </button>
              <DeleteButton
                label="Delete stop"
                confirmMessage={`Delete "${stop.customerName}"? This also deletes all its knowledge entries. This cannot be undone.`}
                onConfirm={handleDeleteStop}
              />
            </div>
          )}
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg">Stop Notes</h2>
          {loggedIn ? (
            !showAddNote && (
              <button className={secondaryButtonClass} onClick={() => setShowAddNote(true)}>
                + Add note
              </button>
            )
          ) : (
            <span className="text-sm text-[var(--ink-muted)]">Log in to add notes</span>
          )}
        </div>

        {loggedIn && showAddNote && (
          <AddKnowledgeEntryForm
            target={{ type: 'stop', id }}
            onCreated={(entry) => {
              setEntries((prev) => [...(prev ?? []), entry]);
              setShowAddNote(false);
            }}
            onCancel={() => setShowAddNote(false)}
          />
        )}

        {entries.length === 0 && !showAddNote ? (
          <p className="text-[var(--ink-muted)]">No knowledge entries for this stop yet.</p>
        ) : (
          <div className="grid gap-3">
            {entries.map((entry) => (
              <KnowledgeEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
