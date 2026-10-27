// Placeholder month grid shown while the session and band load: 5 weeks of 7 cells, same grid as the real one.
export function CalendarSkeleton() {
  return (
    <div className="app-shell" role="status" aria-label="טוען">
      <div className="calendar-container skeleton">
        <div className="skeleton-bar skeleton-nav" />
        <div className="grid">
          {Array.from({ length: 35 }, (_, i) => (
            <div className="day-cell skeleton-bar" key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
