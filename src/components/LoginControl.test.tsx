import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginControl } from './LoginControl';
import { AuthProvider } from '../context/AuthContext';

function renderLoginControl() {
  return render(
    <AuthProvider>
      <LoginControl />
    </AuthProvider>
  );
}

function mockVerifyResponse(ok: boolean, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 401,
      json: () => Promise.resolve(body),
    } as Response)
  );
}

describe('LoginControl', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('shows a "Log in" link when logged out', () => {
    renderLoginControl();
    expect(screen.getByText('Log in')).toBeInTheDocument();
  });

  it('shows a validation error when submitting with blank fields', async () => {
    renderLoginControl();
    fireEvent.click(screen.getByText('Log in'));
    fireEvent.click(screen.getByText('Log in')); // the form's submit button, now visible

    expect(await screen.findByText('Username and password are both required.')).toBeInTheDocument();
  });

  it('shows an error and stays logged out when credentials are rejected', async () => {
    mockVerifyResponse(false, {
      status: 401,
      message: 'Authentication required for this operation',
      timestamp: '2026-01-01T00:00:00Z',
      fieldErrors: null,
    });

    renderLoginControl();
    fireEvent.click(screen.getByText('Log in'));
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByText('Log in'));

    expect(await screen.findByText('Incorrect username or password.')).toBeInTheDocument();
    expect(screen.queryByText(/Logged in as/)).not.toBeInTheDocument();
  });

  it('logs in successfully and shows the username when credentials are correct', async () => {
    mockVerifyResponse(true, { username: 'admin' });

    renderLoginControl();
    fireEvent.click(screen.getByText('Log in'));
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'admin' } });
    fireEvent.click(screen.getByText('Log in'));

    expect(await screen.findByText('Logged in as admin')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('logging out returns to the "Log in" state', async () => {
    mockVerifyResponse(true, { username: 'admin' });

    renderLoginControl();
    fireEvent.click(screen.getByText('Log in'));
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'admin' } });
    fireEvent.click(screen.getByText('Log in'));

    await screen.findByText('Logged in as admin');
    fireEvent.click(screen.getByText('Log out'));

    await waitFor(() => expect(screen.getByText('Log in')).toBeInTheDocument());
  });
});
