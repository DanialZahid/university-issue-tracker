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
