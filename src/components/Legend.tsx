export function Legend() {
  return (
    <div className="legend">
      <div className="legend-item">
        <div className="dot dot-green" />
        הרכב מלא (פנוי לחזרה)
      </div>
      <div className="legend-item">
        <div className="dot dot-red" />
        חסרים נגנים
      </div>
      <div className="legend-item">
        <div className="dot dot-gold" />
        הופעה 🎸
      </div>
      <div className="legend-item">
        <div className="dot dot-blue" />
        חזרה 🎤
      </div>
    </div>
  );
}
