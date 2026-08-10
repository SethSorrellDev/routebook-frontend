import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import { setCredentials, clearCredentials, isLoggedIn as checkStored, getAuthUsername } from '../api/auth';

interface AuthContextValue {
  loggedIn: boolean;
  username: string | null;
  /** Returns an error message on failure, or null on success. */
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Single source of truth for login state, shared across the header's
 * LoginControl and every write-gated button (New Route, Add Stop, Add
 * Note, Add file) scattered across different pages. Without this, each
 * component would need its own copy of "am I logged in," which drifts
 * out of sync the moment one of them logs in/out.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(checkStored());
  const [username, setUsername] = useState<string | null>(getAuthUsername());

  async function login(u: string, p: string): Promise<string | null> {
    if (!u.trim() || !p.trim()) {
      return 'Username and password are both required.';
    }

    setCredentials(u, p);
    try {
      await api.auth.verify();
      setLoggedIn(true);
      setUsername(u);
      return null;
    } catch (err) {
      clearCredentials();
      return err instanceof ApiError && err.status === 401
        ? 'Incorrect username or password.'
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
