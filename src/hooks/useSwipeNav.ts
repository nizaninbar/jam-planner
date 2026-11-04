import { useEffect, useRef } from 'react';

const MIN_DISTANCE = 70;
const MAX_VERTICAL_RATIO = 0.6;

// Detects a horizontal swipe on touch devices. Calls `onSwipe(-1)` for a swipe toward the left edge
// and `onSwipe(1)` toward the right. Ignores swipes starting on inputs or horizontally scrollable areas.
export function useSwipeNav(onSwipe: (direction: -1 | 1) => void, enabled: boolean) {
  const handler = useRef(onSwipe);
  useEffect(() => {
    handler.current = onSwipe;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let start: { x: number; y: number } | null = null;

    const blocked = (el: EventTarget | null) => {
      for (let node = el as HTMLElement | null; node && node !== document.body; node = node.parentElement) {
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName) || node.isContentEditable) {
          return true;
        }
        if (node.scrollWidth > node.clientWidth && /(auto|scroll)/.test(getComputedStyle(node).overflowX)) {
          return true;
        }
      }
      return false;
    };

    const onStart = (e: TouchEvent) => {
      start = e.touches.length === 1 && !blocked(e.target) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start) {
        return;
      }
      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      start = null;
      if (Math.abs(dx) >= MIN_DISTANCE && Math.abs(dy) <= Math.abs(dx) * MAX_VERTICAL_RATIO) {
        handler.current(dx < 0 ? -1 : 1);
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
    };
  }, [enabled]);
}
