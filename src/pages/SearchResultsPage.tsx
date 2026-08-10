import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { KnowledgeEntryDto } from '../types';
import { KnowledgeEntryCard } from '../components/KnowledgeEntryCard';

// Server-side search: the backend runs a real case-insensitive DB query
// on title/body (see KnowledgeEntryRepository.search), so this page just
// passes the query through rather than fetching every entry and
// filtering client-side.
export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [results, setResults] = useState<KnowledgeEntryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResults(null);
    api.knowledgeEntries
      .getFiltered({ q: query })
      .then(setResults)
      .catch((err) => setError(err.message));
  }, [query]);

  if (error) {
    return <p className="text-[var(--hazard)]">Couldn't search: {error}</p>;
  }

  if (!results) {
    return <p className="text-[var(--ink-muted)]">Searching...</p>;
  }

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
