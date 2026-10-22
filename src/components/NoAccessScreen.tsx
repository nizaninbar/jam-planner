interface NoAccessScreenProps {
  message?: string | null;
  signedIn: boolean;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
}

export function NoAccessScreen({ message, signedIn, onGoogleSignIn, onSignOut }: NoAccessScreenProps) {
  return (
    <div className="no-access">
      <div className="no-access-card">
        <span className="app-brand" dir="ltr">
          🎸 Jam Planner
        </span>
        <h2>אין גישה</h2>
        <p className="muted">
          כדי להיכנס צריך קישור הזמנה אישי ממנהל הלהקה. אם כבר צירפת חשבון Google, אפשר להיכנס איתו.
        </p>
        {message && <p className="error-text">{message}</p>}
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
