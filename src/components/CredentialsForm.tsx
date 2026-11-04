import { useState, type FormEvent } from 'react';
import { validateCredentials } from '../data/authService';

interface CredentialsFormProps {
  submitLabel: string;
  /** Validate the format first (when creating credentials); sign-in skips it. */
  validate: boolean;
  onSubmit: (username: string, password: string) => Promise<void>;
  /** Called after a successful submit. */
  onDone?: () => void;
}

export function CredentialsForm({ submitLabel, validate, onSubmit, onDone }: CredentialsFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate ? validateCredentials(username, password) : null;
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(username, password);
      onDone?.();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  };

  return (
    <form className="credentials-form" onSubmit={(e) => void handleSubmit(e)}>
      <input
        type="text"
        dir="ltr"
        placeholder="שם משתמש"
        aria-label="שם משתמש"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        dir="ltr"
        placeholder="סיסמה"
        aria-label="סיסמה"
        autoComplete={validate ? 'new-password' : 'current-password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="toggle-btn toggle-available" disabled={busy || !username || !password}>
        {submitLabel}
      </button>
    </form>
  );
}
