import { useState } from 'react';

/**
 * Shared confirm-then-delete button used on route/stop/knowledge-entry
 * detail pages. Uses the browser's native confirm() dialog rather than
 * a custom modal - simple, reliable, and appropriate for a low-traffic
 * internal tool where a custom confirmation UI isn't worth building.
 */
export function DeleteButton({
  label,
  confirmMessage,
  onConfirm,
}: {
  label: string;
  confirmMessage: string;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={deleting}
      className="text-sm text-[var(--hazard)] hover:underline disabled:opacity-50"
    >
      {deleting ? 'Deleting...' : label}
    </button>
  );
}
