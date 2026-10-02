import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginControl } from './LoginControl';
import { AuthProvider } from '../context/AuthContext';

const tokens = { accessToken: 'a', refreshToken: 'r', tokenType: 'Bearer', expiresIn: 900 };

function renderLoginControl() {
  return render(
    <AuthProvider>
      <LoginControl />
    </AuthProvider>
  );
}

/** Responses are returned in order: identity-service login first, then RouteBook verify. */
function mockFetchSequence(...responses: Array<{ ok: boolean; status: number; body: unknown }>) {
  const fetchMock = vi.fn();
  for (const r of responses) {
    fetchMock.mockResolvedValueOnce({ ok: r.ok, status: r.status, json: () => Promise.resolve(r.body) } as Response);
  }
  vi.stubGlobal('fetch', fetchMock);
}

function submitCredentials(email: string, password: string) {
  fireEvent.click(screen.getByText('Log in'));
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByText('Log in'));
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

    expect(await screen.findByText('Email and password are both required.')).toBeInTheDocument();
  });

  it("shows identity-service's message and stays logged out when credentials are rejected", async () => {
    mockFetchSequence({ ok: false, status: 400, body: { timestamp: 'x', error: 'Invalid email or password' } });

    renderLoginControl();
    submitCredentials('admin@example.com', 'wrongpassword');

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.queryByText(/Logged in as/)).not.toBeInTheDocument();
  });

  it('explains when the account is valid but not allowed to edit', async () => {
    mockFetchSequence(
      { ok: true, status: 200, body: tokens },
      { ok: false, status: 403, body: { status: 403, message: 'Forbidden', timestamp: 'x', fieldErrors: null } }
    );

    renderLoginControl();
    submitCredentials('other@example.com', 'testpass123');

    expect(await screen.findByText(/isn't authorized to edit RouteBook/)).toBeInTheDocument();
    expect(screen.queryByText(/Logged in as/)).not.toBeInTheDocument();
    expect(sessionStorage.length).toBe(0); // the session is dropped, not left half-logged-in
  });

  it('logs in successfully and shows the email when everything checks out', async () => {
    mockFetchSequence(
      { ok: true, status: 200, body: tokens },
      { ok: true, status: 200, body: { username: 'some-user-id' } }
    );

    renderLoginControl();
    submitCredentials('admin@example.com', 'testpass123');

    expect(await screen.findByText('Logged in as admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('logging out returns to the "Log in" state', async () => {
    mockFetchSequence(
      { ok: true, status: 200, body: tokens },
      { ok: true, status: 200, body: { username: 'some-user-id' } }
    );

    renderLoginControl();
    submitCredentials('admin@example.com', 'testpass123');

    await screen.findByText('Logged in as admin@example.com');
    fireEvent.click(screen.getByText('Log out'));

    await waitFor(() => expect(screen.getByText('Log in')).toBeInTheDocument());
  });
});
