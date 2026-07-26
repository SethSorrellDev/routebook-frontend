import { Link } from 'react-router-dom';
import type { KnowledgeEntryDto } from '../types';
import { CATEGORY_STYLES } from './categoryStyles';

/**
 * The suite's signature element: an index-card-style tile with a
 * die-cut colored tab on the left edge, echoing a physical binder's
 * tabbed dividers. The tab color encodes the category at a glance.
 */
export function KnowledgeEntryCard({ entry }: { entry: KnowledgeEntryDto }) {
  const style = CATEGORY_STYLES[entry.category];

  return (
    <Link
      to={`/knowledge-entries/${entry.id}`}
      className="flex overflow-hidden rounded-md border border-[var(--border)] bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="w-2 shrink-0" style={{ backgroundColor: style.tab }} />
      <div className="flex-1 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--ink)]">{entry.title}</h3>
          <span
            className="rounded px-2 py-0.5 text-xs font-mono uppercase tracking-wide"
            style={{ backgroundColor: style.badgeBg, color: style.badgeText }}
          >
            {style.label}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-[var(--ink-muted)]">{entry.body}</p>
      </div>
    </Link>
  );
}
