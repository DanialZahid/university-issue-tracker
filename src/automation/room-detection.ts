type RoomPattern = {
  regex: RegExp;
  format: (m: RegExpExecArray) => string;
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

// Keyword-anchored on purpose: only known campus keywords count as a room,
// so ordinary numbers in a sentence are never picked up.
const PATTERNS: RoomPattern[] = [
  // ac103, AC 103, ac-103 -> AC-103
  {
    regex: /(?<![a-z0-9])ac[\s-]?(\d{3})(?!\d)/i,
    format: (m) => `AC-${m[1] ?? ''}`,
  },
  // clab 4, c lab 4, C-Lab 02 -> C-Lab 04 | lab2, lab 4 -> Lab 2
  {
    regex: /(?<![a-z0-9])(c[\s-]?)?lab[\s-]?(\d{1,2})(?!\d)/i,
    format: (m) =>
      m[1] ? `C-Lab ${(m[2] ?? '').padStart(2, '0')}` : `Lab ${Number(m[2])}`,
  },
  // room 204 -> Room 204
  {
    regex: /(?<![a-z0-9])room\s*#?\s*(\d{1,4}[a-z]?)(?![a-z0-9])/i,
    format: (m) => `Room ${(m[1] ?? '').toUpperCase()}`,
  },
  // classroom 5, hall 2, auditorium 1, studio 3
  {
    regex:
      /(?<![a-z0-9])(classroom|hall|auditorium|studio)\s*#?\s*(\d{1,3}[a-z]?)(?![a-z0-9])/i,
    format: (m) => `${capitalize(m[1] ?? '')} ${(m[2] ?? '').toUpperCase()}`,
  },
];

// The title is searched first. If it has a room, the description is ignored.
// Inside one text, the earliest mention wins.
export function detectRoom(title: string, description: string): string | null {
  for (const text of [title, description]) {
    let best: { index: number; value: string } | null = null;
    for (const { regex, format } of PATTERNS) {
      const match = regex.exec(text);
      if (match && (best === null || match.index < best.index)) {
        best = { index: match.index, value: format(match) };
      }
    }
    if (best) return best.value.slice(0, 100);
  }
  return null;
}
