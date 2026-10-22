interface AppHeaderProps {
  bandName: string;
  onSignOut: () => void;
}

export function AppHeader({ bandName, onSignOut }: AppHeaderProps) {
  return (
    <header className="app-header">
      <span className="app-brand" dir="ltr">
        🎸 Jam Planner
      </span>
      <span className="band-pill">{bandName}</span>
      <button type="button" className="icon-btn" onClick={onSignOut} aria-label="התנתק" title="התנתק">
        ⎋
      </button>
    </header>
  );
}
