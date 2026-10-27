interface AppHeaderProps {
  bandName: string;
  googleLinked: boolean;
  onSignOut: () => void;
}

const SIGN_OUT_CONFIRM = 'להתנתק?';
const SIGN_OUT_CONFIRM_NO_GOOGLE =
  'חשבון Google לא מחובר, ולכן אחרי ההתנתקות תצטרכו קישור הזמנה חדש כדי להיכנס שוב. מומלץ לחבר את Google קודם.\n\nלהתנתק בכל זאת?';

export function AppHeader({ bandName, googleLinked, onSignOut }: AppHeaderProps) {
  const handleSignOut = () => {
    if (window.confirm(googleLinked ? SIGN_OUT_CONFIRM : SIGN_OUT_CONFIRM_NO_GOOGLE)) {
      onSignOut();
    }
  };

  return (
    <header className="app-header">
      <span className="app-brand" dir="ltr">
        🎸 Jam Planner
      </span>
      <span className="band-pill">{bandName}</span>
      <button type="button" className="text-btn" onClick={handleSignOut}>
        התנתק
      </button>
    </header>
  );
}
