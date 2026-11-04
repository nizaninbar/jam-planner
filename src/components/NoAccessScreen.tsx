import { CredentialsForm } from './CredentialsForm';

interface NoAccessScreenProps {
  message?: string | null;
  signedIn: boolean;
  onGoogleSignIn: () => void;
  onPasswordSignIn: (username: string, password: string) => Promise<void>;
  onSignedIn: () => void;
  onSignOut: () => void;
}

export function NoAccessScreen({
  message,
  signedIn,
  onGoogleSignIn,
  onPasswordSignIn,
  onSignedIn,
  onSignOut,
}: NoAccessScreenProps) {
  return (
    <div className="no-access">
      <div className="no-access-card">
        <span className="app-brand" dir="ltr">
          🎸 Jam Planner
        </span>
        <h2>אין גישה</h2>
        <p className="muted">
          כדי להיכנס צריך קישור הזמנה אישי ממנהל הלהקה. אם כבר הגדרת שם משתמש וסיסמה או צירפת חשבון
          Google, אפשר להיכנס איתם.
        </p>
        <p className="muted">
          לא הגדרת כניסה לפני שהתנתקת או הסרת את האפליקציה? בקש מהמנהל קישור הזמנה חדש, ואז הגדר שם
          משתמש וסיסמה בהגדרות.
        </p>
        {message && <p className="error-text">{message}</p>}
        <CredentialsForm submitLabel="כניסה" validate={false} onSubmit={onPasswordSignIn} onDone={onSignedIn} />
        <button type="button" className="toggle-btn toggle-available" onClick={onGoogleSignIn}>
          כניסה עם Google
        </button>
        {signedIn && (
          <button type="button" className="modal-close" onClick={onSignOut}>
            התנתק
          </button>
        )}
      </div>
    </div>
  );
}
