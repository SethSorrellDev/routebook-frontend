import { describe, it, expect, beforeEach } from 'vitest';
import {
  setCredentials,
  clearCredentials,
  getAuthHeader,
  getAuthUsername,
  isLoggedIn,
} from './auth';

describe('auth', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('isLoggedIn returns false when nothing is stored', () => {
    expect(isLoggedIn()).toBe(false);
    expect(getAuthHeader()).toBeNull();
    expect(getAuthUsername()).toBeNull();
  });

  it('setCredentials stores a correctly base64-encoded Basic auth header', () => {
    setCredentials('admin', 'secret123');
    const expected = `Basic ${btoa('admin:secret123')}`;
    expect(getAuthHeader()).toBe(expected);
  });

  it('setCredentials makes isLoggedIn true and stores the username separately', () => {
    setCredentials('admin', 'secret123');
    expect(isLoggedIn()).toBe(true);
    expect(getAuthUsername()).toBe('admin');
  });

  it('clearCredentials removes everything, reverting to logged-out state', () => {
    setCredentials('admin', 'secret123');
    clearCredentials();
    expect(isLoggedIn()).toBe(false);
    expect(getAuthHeader()).toBeNull();
    expect(getAuthUsername()).toBeNull();
  });

  it('handles special characters in the password correctly (e.g. from the real rotated prod password)', () => {
    setCredentials('admin', 'Rb9$kLm2vQx7!nWpZ4tF');
    const expected = `Basic ${btoa('admin:Rb9$kLm2vQx7!nWpZ4tF')}`;
    expect(getAuthHeader()).toBe(expected);
  });
});
