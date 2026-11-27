import logoUrl from '../assets/logo.svg';
import type { LoginMethods } from '../data/authService';
import { SettingsMenu } from './SettingsMenu';

interface AppHeaderProps {
  bandId: string;
  bandName: string;
  /** Every band the user belongs to; a switcher shows when there is more than one. */
  bands: { id: string; name: string }[];
  onSwitchBand: (bandId: string) => void;
  /** The signed-in member's name; absent for accounts not linked to a member. */
  userName?: string;
  methods: LoginMethods;
  onAttachGoogle: () => void;
  onAttachPassword: (username: string, password: string) => Promise<void>;
  onSignOut: () => void;
}

const SIGN_OUT_CONFIRM = 'להתנתק?';
const SIGN_OUT_CONFIRM_NO_LOGIN =
  'לא הוגדרה כניסה (שם משתמש וסיסמה או Google), ולכן אחרי ההתנתקות תצטרכו קישור הזמנה חדש כדי להיכנס שוב. מומלץ להגדיר כניסה קודם.\n\nלהתנתק בכל זאת?';

export function AppHeader({ bandId, bandName, bands, onSwitchBand, userName, methods, onAttachGoogle, onAttachPassword, onSignOut }: AppHeaderProps) {
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
      {bands.length > 1 ? (
        <select
          className="band-pill band-switcher"
          aria-label="החלפת להקה"
          value={bandId}
          onChange={(e) => onSwitchBand(e.target.value)}
        >
          {bands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      ) : (
        <span className="band-pill">{bandName}</span>
      )}
      {userName && <span className="header-greeting">היי {userName} 👋</span>}
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
