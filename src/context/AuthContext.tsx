import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import {
  login as identityLogin,
  clearCredentials,
  isLoggedIn as checkStored,
  getAuthEmail,
  IdentityError,
  AUTH_EXPIRED_EVENT,
} from '../api/auth';

interface AuthContextValue {
  loggedIn: boolean;
  /** The signed-in user's email. */
  username: string | null;
  /** Returns an error message on failure, or null on success. */
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Single source of truth for login state, shared across the header's
 * LoginControl and every write-gated button (New Route, Add Stop, Add
 * Note, Add file) scattered across different pages. Sign-in is delegated
 * to identity-service; RouteBook separately decides whether the account
 * may write (the 403 from /api/auth/verify).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(checkStored());
  const [username, setUsername] = useState<string | null>(getAuthEmail());

  // The API client fires this when a session can no longer be refreshed.
  useEffect(() => {
    function handleExpired() {
      setLoggedIn(false);
      setUsername(null);
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  async function login(email: string, password: string): Promise<string | null> {
    if (!email.trim() || !password.trim()) {
      return 'Email and password are both required.';
    }

    try {
      await identityLogin(email.trim(), password);
    } catch (err) {
      return err instanceof IdentityError ? err.message : 'Could not sign in - try again.';
    }

    try {
      await api.auth.verify();
      setLoggedIn(true);
      setUsername(email.trim());
      return null;
    } catch (err) {
      clearCredentials();
      return err instanceof ApiError && err.status === 403
        ? "This account is signed in but isn't authorized to edit RouteBook."
        : 'Could not verify login - try again.';
    }
  }

  function logout() {
    clearCredentials();
    setLoggedIn(false);
    setUsername(null);
  }

  return (
    <AuthContext.Provider value={{ loggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
