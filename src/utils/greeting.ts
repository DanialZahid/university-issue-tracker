const hourFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  hourCycle: 'h23',
  timeZone: 'Asia/Karachi',
});

// Worked out in campus time on the server, so it never flickers.
export function greetingFor(now: Date = new Date()): string {
  const hour = Number(hourFormatter.format(now));
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export function plural(count: number, one: string, many: string): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`;
}
