import logoUrl from '../assets/logo.svg';
import type { LoginMethods } from '../data/authService';
import { SettingsMenu } from './SettingsMenu';

interface AppHeaderProps {
  bandId: string;
  bandName: string;
  methods: LoginMethods;
  onAttachGoogle: () => void;
  onAttachPassword: (username: string, password: string) => Promise<void>;
  onSignOut: () => void;
}

const SIGN_OUT_CONFIRM = 'להתנתק?';
const SIGN_OUT_CONFIRM_NO_LOGIN =
  'לא הוגדרה כניסה (שם משתמש וסיסמה או Google), ולכן אחרי ההתנתקות תצטרכו קישור הזמנה חדש כדי להיכנס שוב. מומלץ להגדיר כניסה קודם.\n\nלהתנתק בכל זאת?';

export function AppHeader({ bandId, bandName, methods, onAttachGoogle, onAttachPassword, onSignOut }: AppHeaderProps) {
  const handleSignOut = () => {
    if (window.confirm(methods.google || methods.password ? SIGN_OUT_CONFIRM : SIGN_OUT_CONFIRM_NO_LOGIN)) {
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
        methods={methods}
        onAttachGoogle={onAttachGoogle}
        onAttachPassword={onAttachPassword}
        onSignOut={handleSignOut}
      />
    </header>
  );
}
