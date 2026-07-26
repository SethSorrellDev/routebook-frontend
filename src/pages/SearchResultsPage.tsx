import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { KnowledgeEntryDto } from '../types';
import { KnowledgeEntryCard } from '../components/KnowledgeEntryCard';

// No backend search endpoint exists yet, so this fetches all knowledge
// entries and filters client-side by title/body text match. Fine at
// this data scale; would move server-side if the dataset grows large.
export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [allEntries, setAllEntries] = useState<KnowledgeEntryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.knowledgeEntries
      .getFiltered()
      .then(setAllEntries)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p className="text-[var(--hazard)]">Couldn't search: {error}</p>;
  }

  if (!allEntries) {
    return <p className="text-[var(--ink-muted)]">Loading...</p>;
  }

  const lowerQuery = query.toLowerCase();
  const results = allEntries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(lowerQuery) ||
      entry.body.toLowerCase().includes(lowerQuery)
  );

  return (
    <div>
      <h1 className="mb-1 text-3xl">Search</h1>
      <p className="mb-6 text-sm text-[var(--ink-muted)]">
        {results.length} result{results.length === 1 ? '' : 's'} for "{query}"
      </p>
      {results.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No matching notes found.</p>
      ) : (
        <div className="grid gap-3">
          {results.map((entry) => (
            <KnowledgeEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
