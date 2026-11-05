import type { Event } from '../types/band';

/** How long before an event's start its reminder goes out unless an admin picks another moment. */
export const DEFAULT_REMINDER_HOURS_BEFORE = 5;

/** ISO instant of the default reminder for a date ("YYYY-MM-DD") + time ("HH:MM"), in local time. */
export function defaultRemindAt(date: string, time: string): string {
  const start = new Date(`${date}T${time}`);
  return new Date(start.getTime() - DEFAULT_REMINDER_HOURS_BEFORE * 3_600_000).toISOString();
}

/** The default reminder for a new event, or undefined when there's no time or that moment has passed. */
export function initialRemindAt(date: string, time?: string): string | undefined {
  if (!time) {
    return undefined;
  }
  const at = defaultRemindAt(date, time);
  return new Date(at).getTime() > Date.now() ? at : undefined;
}

/**
 * What the reminder should become when an event's time changes. A reminder an admin set by hand is
 * left alone (undefined = don't touch); one that is still the default follows the time.
 */
export function remindAtAfterTimeChange(event: Event, newTime: string | null): string | null | undefined {
  const wasDefault =
    !event.remindAt ||
    (event.time !== undefined &&
      new Date(event.remindAt).getTime() === new Date(defaultRemindAt(event.date, event.time)).getTime());
  if (!wasDefault) {
    return undefined;
  }
  return (newTime ? initialRemindAt(event.date, newTime) : undefined) ?? null;
}
