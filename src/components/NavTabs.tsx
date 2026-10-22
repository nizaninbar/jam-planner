export type Section = 'calendar' | 'playlists' | 'songs' | 'admin';

const TABS: { section: Section; icon: string; label: string }[] = [
  { section: 'calendar', icon: '🗓️', label: 'לוח שנה' },
  { section: 'playlists', icon: '🎵', label: 'פלייליסטים' },
  { section: 'songs', icon: '🎸', label: 'שירים' },
  { section: 'admin', icon: '🔑', label: 'ניהול' },
];

interface NavTabsProps {
  active: Section;
  showAdmin: boolean;
  onSelect: (section: Section) => void;
}

export function NavTabs({ active, showAdmin, onSelect }: NavTabsProps) {
  return (
    <nav className="nav-tabs">
      {TABS.filter((tab) => showAdmin || tab.section !== 'admin').map((tab) => (
        <button
          key={tab.section}
          type="button"
          className={tab.section === active ? 'nav-tab nav-tab-active' : 'nav-tab'}
          aria-current={tab.section === active ? 'page' : undefined}
          onClick={() => onSelect(tab.section)}
        >
          <span className="nav-tab-icon">{tab.icon}</span>
          <span className="nav-tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
