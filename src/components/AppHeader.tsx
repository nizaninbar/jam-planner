import logoUrl from '../assets/logo.svg';
import { SettingsMenu } from './SettingsMenu';

interface AppHeaderProps {
  bandId: string;
  bandName: string;
  googleLinked: boolean;
  onAttachGoogle: () => void;
  onSignOut: () => void;
}

const SIGN_OUT_CONFIRM = 'להתנתק?';
const SIGN_OUT_CONFIRM_NO_GOOGLE =
  'חשבון Google לא מחובר, ולכן אחרי ההתנתקות תצטרכו קישור הזמנה חדש כדי להיכנס שוב. מומלץ לחבר את Google קודם.\n\nלהתנתק בכל זאת?';

export function AppHeader({ bandId, bandName, googleLinked, onAttachGoogle, onSignOut }: AppHeaderProps) {
  const handleSignOut = () => {
    if (window.confirm(googleLinked ? SIGN_OUT_CONFIRM : SIGN_OUT_CONFIRM_NO_GOOGLE)) {
      onSignOut();
    }
  };

  return (
    <header className="app-header">
      <span className="app-brand" dir="ltr">
        <img className="app-logo" src={logoUrl} alt="" />
        Jam Planner
      </span>
      <span className="band-pill">{bandName}</span>
      <SettingsMenu
        bandId={bandId}
        googleLinked={googleLinked}
        onAttachGoogle={onAttachGoogle}
        onSignOut={handleSignOut}
      />
    </header>
  );
}
