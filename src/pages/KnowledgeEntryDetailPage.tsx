import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { KnowledgeEntryDto, AttachmentDto, KnowledgeCategory } from '../types';
import { CATEGORY_STYLES } from '../components/categoryStyles';
import { DeleteButton } from '../components/DeleteButton';
import {
  labelClass,
  inputClass,
  fieldWrapperClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../components/formStyles';
import { useAuth } from '../context/AuthContext';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function KnowledgeEntryDetailPage() {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const { entryId } = useParams<{ entryId: string }>();
  const id = Number(entryId);

  const [entry, setEntry] = useState<KnowledgeEntryDto | null>(null);
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editCategory, setEditCategory] = useState<KnowledgeCategory>('OTHER');
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  function startEditing() {
    if (!entry) return;
    setEditTitle(entry.title);
    setEditBody(entry.body);
    setEditCategory(entry.category);
    setEditError(null);
    setEditing(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!entry) return;
    setSaving(true);
    setEditError(null);
    try {
      const updated = await api.knowledgeEntries.update(id, {
        title: editTitle,
        body: editBody,
        category: editCategory,
        routeId: entry.routeId,
        stopId: entry.stopId,
      });
      setEntry(updated);
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntry() {
    if (!entry) return;
    await api.knowledgeEntries.delete(id);
    navigate(entry.routeId ? `/routes/${entry.routeId}` : `/stops/${entry.stopId}`);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      await api.attachments.upload(id, file);
      loadAttachments();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteAttachment(attachmentId: number) {
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

      {editing ? (
        <form
          onSubmit={handleSaveEdit}
          className="mb-8 rounded-md border border-[var(--border)] bg-white p-4"
        >
          {editError && (
            <p className="mb-3 rounded border border-[var(--hazard)]/30 bg-[var(--hazard)]/10 px-3 py-2 text-sm text-[var(--hazard)]">
              {editError}
            </p>
          )}
          <div className={fieldWrapperClass}>
            <label className={labelClass}>Title</label>
            <input
              className={inputClass}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>
          <div className={fieldWrapperClass}>
            <label className={labelClass}>Details</label>
            <textarea
              className={inputClass}
              rows={3}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              required
            />
          </div>
          <div className={fieldWrapperClass}>
            <label className={labelClass}>Category</label>
            <select
              className={inputClass}
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as KnowledgeCategory)}
            >
              {Object.entries(CATEGORY_STYLES).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
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
        <div className="overflow-hidden rounded-md border border-[var(--border)] bg-white shadow-sm">
          <div className="h-2" style={{ backgroundColor: style.tab }} />
          <div className="p-6">
            <div className="flex items-start justify-between">
              <span
                className="rounded px-2 py-0.5 text-xs font-mono uppercase tracking-wide"
                style={{ backgroundColor: style.badgeBg, color: style.badgeText }}
              >
                {style.label}
              </span>
              {loggedIn && (
                <div className="flex shrink-0 items-center gap-3">
                  <button onClick={startEditing} className="text-sm text-[var(--navy)] hover:underline">
                    Edit
                  </button>
                  <DeleteButton
                    label="Delete"
                    confirmMessage={`Delete "${entry.title}"? This also deletes any attached files. This cannot be undone.`}
                    onConfirm={handleDeleteEntry}
                  />
                </div>
              )}
            </div>
            <h1 className="mt-3 text-2xl">{entry.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-[var(--ink)]">{entry.body}</p>
          </div>
        </div>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg">Attachments</h2>
          {loggedIn ? (
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
          ) : (
            <span className="text-sm text-[var(--ink-muted)]">Log in to add files</span>
          )}
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
                  {loggedIn && (
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="text-xs text-[var(--hazard)] hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
