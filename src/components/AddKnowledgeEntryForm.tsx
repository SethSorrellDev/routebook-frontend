import { useState } from 'react';
import { api, ApiError } from '../api/client';
import type { KnowledgeCategory, KnowledgeEntryDto } from '../types';
import { CATEGORY_STYLES } from './categoryStyles';
import {
  labelClass,
  inputClass,
  fieldWrapperClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './formStyles';

type Target = { type: 'route'; id: number } | { type: 'stop'; id: number };

/**
 * Reusable quick-add form for a KnowledgeEntry, fixed to a single target
 * (either a route or a stop) - the caller decides which, matching the
 * backend's XOR rule. Used on both RouteDetailPage and StopDetailPage.
 */
export function AddKnowledgeEntryForm({
  target,
  onCreated,
  onCancel,
}: {
  target: Target;
  onCreated: (entry: KnowledgeEntryDto) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<KnowledgeCategory>('OTHER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const entry = await api.knowledgeEntries.create({
        title,
        body,
        category,
        routeId: target.type === 'route' ? target.id : null,
        stopId: target.type === 'stop' ? target.id : null,
      });
      onCreated(entry);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create entry');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 rounded-md border border-[var(--border)] bg-white p-4"
    >
      {error && (
        <p className="mb-3 rounded border border-[var(--hazard)]/30 bg-[var(--hazard)]/10 px-3 py-2 text-sm text-[var(--hazard)]">
          {error}
        </p>
      )}
      <div className={fieldWrapperClass}>
        <label className={labelClass}>Title</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className={fieldWrapperClass}>
        <label className={labelClass}>Details</label>
        <textarea
          className={inputClass}
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      </div>
      <div className={fieldWrapperClass}>
        <label className={labelClass}>Category</label>
        <select
          className={inputClass}
          value={category}
          onChange={(e) => setCategory(e.target.value as KnowledgeCategory)}
        >
          {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
            <option key={key} value={key}>
              {style.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" className={primaryButtonClass} disabled={submitting}>
          {submitting ? 'Saving...' : 'Save note'}
        </button>
        <button type="button" className={secondaryButtonClass} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
