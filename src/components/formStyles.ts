// Shared Tailwind classes for form controls, kept in one place so every
// form (route/stop/knowledge-entry creation) looks consistent.
export const labelClass = "mb-1 block text-sm font-medium text-[var(--ink)]";
export const inputClass =
  "w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--navy)]/30";
export const fieldWrapperClass = "mb-4";
export const primaryButtonClass =
  "rounded bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--navy-dark)] disabled:opacity-50";
export const secondaryButtonClass =
  "rounded border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--paper-dark)]";
