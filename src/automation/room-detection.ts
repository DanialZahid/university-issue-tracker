type RoomPattern = {
  regex: RegExp;
  format: (m: RegExpExecArray) => string;
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

// Checked in order, first match wins. The title is searched before the description.
const PATTERNS: RoomPattern[] = [
  {
    regex: /\broom\s+#?((?:[a-z]{1,3}-[a-z]{1,8}\s)?[a-z-]*\d[a-z0-9-]*)/i,
    format: (m) => `Room ${m[1] ?? ''}`,
  },
  {
    regex: /\b([a-z]{1,3}-lab)\s*(\d{1,3})\b/i,
    format: (m) => `${m[1] ?? ''} ${m[2] ?? ''}`,
  },
  {
    regex: /\b(classroom|lab|hall|auditorium|studio)\s+#?(\d{1,3}[a-z]?)\b/i,
    format: (m) => `${capitalize(m[1] ?? '')} ${m[2] ?? ''}`,
  },
];

export function detectRoom(title: string, description: string): string | null {
  for (const text of [title, description]) {
    for (const { regex, format } of PATTERNS) {
      const match = regex.exec(text);
      if (match) return format(match).trim().replace(/-+$/, '').slice(0, 100);
    }
  }
  return null;
}
