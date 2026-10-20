interface AppHeaderProps {
  bandName: string;
}

export function AppHeader({ bandName }: AppHeaderProps) {
  return (
    <header className="app-header">
      <span className="app-brand" dir="ltr">
        🎸 Jam Planner
      </span>
      <span className="band-pill">{bandName}</span>
    </header>
  );
}
