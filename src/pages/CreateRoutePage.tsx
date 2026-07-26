import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { DriverDto } from '../types';
import {
  labelClass,
  inputClass,
  fieldWrapperClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../components/formStyles';

export function CreateRoutePage() {
  const navigate = useNavigate();

  const [drivers, setDrivers] = useState<DriverDto[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [driverId, setDriverId] = useState<string>('');

  const [showNewDriver, setShowNewDriver] = useState(false);
  const [newDriverEmployeeId, setNewDriverEmployeeId] = useState('');
  const [newDriverFirstName, setNewDriverFirstName] = useState('');
  const [newDriverLastName, setNewDriverLastName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    api.drivers.getAll().then(setDrivers).catch(() => {
      // Non-fatal: form still works, just without a driver dropdown pre-filled.
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors(null);

    try {
      let finalDriverId: number | null = driverId ? Number(driverId) : null;

      if (showNewDriver && newDriverEmployeeId && newDriverFirstName && newDriverLastName) {
        const newDriver = await api.drivers.create({
          employeeId: newDriverEmployeeId,
          firstName: newDriverFirstName,
          lastName: newDriverLastName,
          email: null,
        });
        finalDriverId = newDriver.id;
      }

      const route = await api.routes.create({
        name,
        description: description || null,
        driverId: finalDriverId,
      });

      navigate(`/routes/${route.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setError('Something went wrong creating the route.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-3xl">New Route</h1>

      {error && (
        <p className="mb-4 rounded border border-[var(--hazard)]/30 bg-[var(--hazard)]/10 px-3 py-2 text-sm text-[var(--hazard)]">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className={fieldWrapperClass}>
          <label className={labelClass}>Route name</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Route 14 - Frankfort"
            required
          />
          {fieldErrors?.name && (
            <p className="mt-1 text-xs text-[var(--hazard)]">{fieldErrors.name}</p>
          )}
        </div>

        <div className={fieldWrapperClass}>
          <label className={labelClass}>Description</label>
          <textarea
            className={inputClass}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Normal route covering..."
          />
        </div>

        <div className={fieldWrapperClass}>
          <label className={labelClass}>Driver</label>
          <select
            className={inputClass}
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            disabled={showNewDriver}
          >
            <option value="">Unassigned</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.firstName} {d.lastName} ({d.employeeId})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewDriver((v) => !v)}
            className="mt-2 text-xs text-[var(--navy)] hover:underline"
          >
            {showNewDriver ? 'Cancel new driver' : '+ Add a new driver instead'}
          </button>
        </div>

        {showNewDriver && (
          <div className="mb-4 rounded border border-[var(--border)] bg-[var(--paper-dark)] p-3">
            <div className={fieldWrapperClass}>
              <label className={labelClass}>Employee ID</label>
              <input
                className={inputClass}
                value={newDriverEmployeeId}
                onChange={(e) => setNewDriverEmployeeId(e.target.value)}
                placeholder="EMP-1002"
              />
            </div>
            <div className={fieldWrapperClass}>
              <label className={labelClass}>First name</label>
              <input
                className={inputClass}
                value={newDriverFirstName}
                onChange={(e) => setNewDriverFirstName(e.target.value)}
              />
            </div>
            <div className="mb-0">
              <label className={labelClass}>Last name</label>
              <input
                className={inputClass}
                value={newDriverLastName}
                onChange={(e) => setNewDriverLastName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button type="submit" className={primaryButtonClass} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create route'}
          </button>
          <button type="button" className={secondaryButtonClass} onClick={() => navigate('/')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
