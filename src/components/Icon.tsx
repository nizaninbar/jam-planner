export type IconName =
  | 'close'
  | 'up'
  | 'down'
  | 'edit'
  | 'check'
  | 'share'
  | 'info'
  | 'sun'
  | 'moon'
  | 'bell'
  | 'bell-off'
  | 'settings'
  | 'logout';

// One consistent set of line icons (emoji look different on every OS). Decorative: the parent button
// carries the aria-label.
const PATHS: Record<IconName, string> = {
  close: 'M5 5l10 10M15 5L5 15',
  up: 'M4 13l6-6 6 6',
  down: 'M4 7l6 6 6-6',
  edit: 'M3 17l1-4L14 3l3 3L7 16zM12 5l3 3',
  check: 'M4 10.5l4 4 8-9',
  share: 'M10 3v10M6 7l4-4 4 4M4 12v4h12v-4',
  info: 'M10 9v5M10 6v.5M10 18a8 8 0 100-16 8 8 0 000 16z',
  sun: 'M10 14a4 4 0 100-8 4 4 0 000 8zM10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6L16 16M16 4l-1.4 1.4M5.4 14.6L4 16',
  moon: 'M16.5 11.5A7 7 0 118.5 3.5a5.5 5.5 0 008 8z',
  bell: 'M5 8a5 5 0 0110 0c0 5 2 6 2 6H3s2-1 2-6zM8.5 17h3',
  'bell-off': 'M5 8a5 5 0 018-4M15 8c0 3 .6 4.7 1.3 5.6M3 14s2-1 2-6M8.5 17h3M3 3l14 14',
  settings: 'M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18M4.3 4.3l1.8 1.8M13.9 13.9l1.8 1.8M15.7 4.3l-1.8 1.8M6.1 13.9l-1.8 1.8',
  logout: 'M8 3H4v14h4M12 6l4 4-4 4M16 10H8',
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
