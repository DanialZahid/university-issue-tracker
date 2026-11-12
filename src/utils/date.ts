const TIME_ZONE = 'Asia/Karachi';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: TIME_ZONE,
});

// Newer ICU puts a narrow no-break space before AM/PM. Use a normal space.
function clean(value: string): string {
  return value.replace(/\u202f/g, ' ');
}

export function formatDate(date: Date): string {
  return clean(dateFormatter.format(date));
}

export function formatDateTime(date: Date): string {
  return clean(dateTimeFormatter.format(date));
}

export function formatAge(date: Date, now: Date = new Date()): string {
  const hours = Math.floor((now.getTime() - date.getTime()) / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return hours === 1 ? '1 hour' : `${hours} hours`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
}

export function toYmd(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

// Noon UTC, so the same calendar day in both UTC and Pakistan time.
export function fromYmd(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12));
}

// Start of a campus day. Pakistan is UTC+5 all year (no daylight saving).
export function campusDayStart(value: string): Date {
  return new Date(`${value}T00:00:00+05:00`);
}

const ymdFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE });
const shortDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: TIME_ZONE,
});

export function campusYmd(date: Date): string {
  return ymdFormatter.format(date);
}

export function formatShortDay(date: Date): string {
  return shortDayFormatter.format(date);
}
