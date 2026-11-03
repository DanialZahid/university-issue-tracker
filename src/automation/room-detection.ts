type RoomPattern = {
  regex: RegExp;
  format: (m: RegExpExecArray) => string;
};

// Keyword-anchored on purpose: only campus formats count as a room, so
// ordinary numbers in a sentence are never picked up.
const PATTERNS: RoomPattern[] = [
  // ac103, AC 103, ac-103 -> AC-103
  {
    regex: /(?<![a-z0-9])ac[\s-]?(\d{3})(?!\d)/i,
    format: (m) => `AC-${m[1] ?? ''}`,
  },
  // lab 4, lab2, clab 4, c lab 4, c-lab5 -> C-Lab 04
  {
    regex: /(?<![a-z0-9])(?:c[\s-]?)?lab[\s-]?(\d{1,2})(?!\d)/i,
    format: (m) => `C-Lab ${(m[1] ?? '').padStart(2, '0')}`,
  },
  // room 103 -> AC-103 (three digits only, so "room 12" is ignored)
  {
    regex: /(?<![a-z0-9])room\s*#?\s*(\d{3})(?!\d)/i,
    format: (m) => `AC-${m[1] ?? ''}`,
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
