import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { KnowledgeEntryDto, AttachmentDto } from '../types';
import { CATEGORY_STYLES } from '../components/categoryStyles';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function KnowledgeEntryDetailPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const id = Number(entryId);

  const [entry, setEntry] = useState<KnowledgeEntryDto | null>(null);
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadAttachments() {
    api.attachments
      .getAllForEntry(id)
      .then(setAttachments)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    api.knowledgeEntries
      .getById(id)
      .then(setEntry)
      .catch((err) => setError(err.message));
    loadAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      await api.attachments.upload(id, file);
      loadAttachments();
    } catch (err) {
      // Note: until Cloudflare R2 credentials are configured on the
      // backend, uploads will fail here even for valid files - that's
      // expected during local dev before Phase 4's R2 setup is complete.
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(attachmentId: number) {
    try {
      await api.attachments.delete(attachmentId);
      loadAttachments();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  if (error) {
    return <p className="text-[var(--hazard)]">Couldn't load entry: {error}</p>;
  }

  if (!entry) {
    return <p className="text-[var(--ink-muted)]">Loading...</p>;
  }

  const style = CATEGORY_STYLES[entry.category];

  return (
    <div>
      <Link
        to={entry.routeId ? `/routes/${entry.routeId}` : `/stops/${entry.stopId}`}
        className="mb-4 inline-block text-sm text-[var(--navy)] hover:underline"
      >
        &larr; Back
      </Link>

      <div className="overflow-hidden rounded-md border border-[var(--border)] bg-white shadow-sm">
        <div className="h-2" style={{ backgroundColor: style.tab }} />
        <div className="p-6">
          <span
            className="rounded px-2 py-0.5 text-xs font-mono uppercase tracking-wide"
            style={{ backgroundColor: style.badgeBg, color: style.badgeText }}
          >
            {style.label}
          </span>
          <h1 className="mt-3 text-2xl">{entry.title}</h1>
          <p className="mt-3 whitespace-pre-wrap text-[var(--ink)]">{entry.body}</p>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg">Attachments</h2>
          <label className="cursor-pointer rounded bg-[var(--navy)] px-3 py-1.5 text-sm text-white hover:bg-[var(--navy-dark)]">
            {uploading ? 'Uploading...' : 'Add file'}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>

        {uploadError && (
          <p className="mb-3 rounded border border-[var(--hazard)]/30 bg-[var(--hazard)]/10 px-3 py-2 text-sm text-[var(--hazard)]">
            {uploadError}
          </p>
        )}

        {attachments.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">No files attached yet.</p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((att) => (
              <li
                key={att.id}
                className="flex items-center justify-between rounded-md border border-[var(--border)] bg-white px-4 py-2"
              >
                <a href={att.downloadUrl} target="_blank" rel="noreferrer" className="text-sm text-[var(--navy)] hover:underline">
                  {att.fileName}
                </a>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--ink-muted)]">
                    {formatFileSize(att.fileSizeBytes)}
                  </span>
                  <button
                    onClick={() => handleDelete(att.id)}
                    className="text-xs text-[var(--hazard)] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
