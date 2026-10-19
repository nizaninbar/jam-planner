export type Section = 'calendar' | 'playlists' | 'songs';

const TABS: { section: Section; label: string }[] = [
  { section: 'calendar', label: '🗓️ לוח שנה' },
  { section: 'playlists', label: '🎵 פלייליסטים' },
  { section: 'songs', label: '🎸 שירים' },
];

interface NavTabsProps {
  active: Section;
  onSelect: (section: Section) => void;
}

export function NavTabs({ active, onSelect }: NavTabsProps) {
  return (
    <nav className="nav-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.section}
          type="button"
          className={tab.section === active ? 'nav-tab nav-tab-active' : 'nav-tab'}
          onClick={() => onSelect(tab.section)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
