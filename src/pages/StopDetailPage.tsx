import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { KnowledgeEntryDto } from '../types';
import { KnowledgeEntryCard } from '../components/KnowledgeEntryCard';
import { AddKnowledgeEntryForm } from '../components/AddKnowledgeEntryForm';
import { secondaryButtonClass } from '../components/formStyles';
import { useAuth } from '../context/AuthContext';

export function StopDetailPage() {
  const { loggedIn } = useAuth();
  const { stopId } = useParams<{ stopId: string }>();
  const id = Number(stopId);

  const [entries, setEntries] = useState<KnowledgeEntryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);

  useEffect(() => {
    api.knowledgeEntries
      .getFiltered({ stopId: id })
      .then(setEntries)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return <p className="text-[var(--hazard)]">Couldn't load stop notes: {error}</p>;
  }

  if (!entries) {
    return <p className="text-[var(--ink-muted)]">Loading...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl">Stop Notes</h1>
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
    </div>
  );
}
