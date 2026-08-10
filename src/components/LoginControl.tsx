import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginControl() {
  const { loggedIn, username, login, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    const result = await login(inputUsername, inputPassword);
    setVerifying(false);

    if (result) {
      setError(result);
    } else {
      setError(null);
      setShowForm(false);
      setInputUsername('');
      setInputPassword('');
    }
  }

  if (loggedIn) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/90">
        <span>Logged in as {username}</span>
        <button onClick={logout} className="text-white/70 underline hover:text-white">
          Log out
        </button>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <input
            type="text"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            placeholder="Username"
            className="w-28 rounded border border-white/30 bg-white/10 px-2 py-1 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
            autoFocus
          />
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            placeholder="Password"
            className="w-28 rounded border border-white/30 bg-white/10 px-2 py-1 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
          />
          <button
            type="submit"
            disabled={verifying}
            className="rounded bg-white/20 px-2 py-1 text-sm text-white hover:bg-white/30 disabled:opacity-50"
          >
            {verifying ? 'Checking...' : 'Log in'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setError(null);
            }}
            className="text-xs text-white/60 hover:text-white"
          >
            Cancel
          </button>
        </form>
        {error && <span className="text-xs text-orange-200">{error}</span>}
      </div>
    );
  }

  return (
    <button onClick={() => setShowForm(true)} className="text-sm text-white/80 hover:text-white hover:underline">
      Log in
    </button>
  );
}
