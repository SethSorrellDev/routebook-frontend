import { useState } from 'react';
import { api, ApiError } from '../api/client';
import type { StopDto } from '../types';
import {
  labelClass,
  inputClass,
  fieldWrapperClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './formStyles';

/**
 * Creates a Location and a Stop in sequence - the backend has no way to
 * create a Stop without an existing Location, so this form collects both
 * sets of fields and chains the two API calls on submit.
 */
export function AddStopForm({
  routeId,
  nextSequenceOrder,
  onCreated,
  onCancel,
}: {
  routeId: number;
  nextSequenceOrder: number;
  onCreated: (stop: StopDto) => void;
  onCancel: () => void;
}) {
  const [customerName, setCustomerName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const location = await api.locations.create({
        addressLine1,
        addressLine2: null,
        city,
        state,
        zipCode,
        latitude: null,
        longitude: null,
      });

      const stop = await api.stops.create(routeId, {
        customerName,
        sequenceOrder: nextSequenceOrder,
        locationId: location.id,
      });

      onCreated(stop);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create stop');
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
        <label className={labelClass}>Customer name</label>
        <input
          className={inputClass}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
      </div>
      <div className={fieldWrapperClass}>
        <label className={labelClass}>Address</label>
        <input
          className={inputClass}
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          required
        />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div>
          <label className={labelClass}>City</label>
          <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input
            className={inputClass}
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase())}
            maxLength={2}
            required
          />
        </div>
        <div>
          <label className={labelClass}>ZIP</label>
          <input className={inputClass} value={zipCode} onChange={(e) => setZipCode(e.target.value)} required />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className={primaryButtonClass} disabled={submitting}>
          {submitting ? 'Saving...' : 'Add stop'}
        </button>
        <button type="button" className={secondaryButtonClass} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
