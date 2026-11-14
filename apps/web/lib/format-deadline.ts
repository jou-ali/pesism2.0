const TZ = 'Asia/Kolkata';

/**
 * The one deadline formatter for the whole site — match cards, the matchday section, and every
 * share poster. Always renders in IST regardless of the server/browser's own timezone, since the
 * tournament runs on a single fixed timezone. Produces e.g. "Sun, 23 Nov · 11:59 PM IST".
 */
export function formatMatchdayDeadline(iso: string): string {
  const d = new Date(iso);
  const datePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return `${datePart} · ${timePart} IST`;
}

/**
 * Converts a <input type="datetime-local"> value (e.g. "2026-11-23T23:59") to a UTC instant,
 * treating the typed value as Asia/Kolkata wall-clock time — regardless of what timezone the
 * admin's own browser happens to be in. IST has no DST, so the offset is always +05:30.
 */
export function istLocalInputToIso(localValue: string): string {
  return new Date(`${localValue}:00+05:30`).toISOString();
}

/** The reverse of istLocalInputToIso, for pre-filling a datetime-local input from a stored UTC instant. */
export function isoToIstLocalInput(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
