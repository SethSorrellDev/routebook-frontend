import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { KnowledgeEntryDto } from '../types';
import { KnowledgeEntryCard } from '../components/KnowledgeEntryCard';

export function StopDetailPage() {
  const { stopId } = useParams<{ stopId: string }>();
  const id = Number(stopId);

  const [entries, setEntries] = useState<KnowledgeEntryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <h1 className="mb-6 text-3xl">Stop Notes</h1>
      {entries.length === 0 ? (
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
