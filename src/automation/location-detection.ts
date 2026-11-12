import { phraseRegex } from './text';

const ALIASES: Record<string, string[]> = {
  'Administration Building': [
    'administration building',
    'admin building',
    'admin block',
  ],
  'Computer Labs': ['computer lab'],
  Cafeteria: ['cafeteria', 'cafe', 'canteen'],
  'Parking Area': ['parking'],
  'Sports Complex': ['sports complex', 'gym'],
  'Main Gate': ['main gate', 'gate'],
};

// block a, Block-B, blockc -> Block A/B/C
const BLOCK = /(?<![a-z0-9])block[\s-]?([abc])(?![a-z0-9])/i;
// building A (capital letter only, so "building a fence" is ignored)
const BUILDING = /(?<![A-Za-z0-9])[Bb]uilding[\s-]?([ABC])(?![A-Za-z0-9])/;

type Hit = { index: number; name: string };

function findIn(text: string, names: string[]): Hit | null {
  const lower = text.toLowerCase();
  let best: Hit | null = null;
  const consider = (index: number, name: string) => {
    if (names.includes(name) && (best === null || index < best.index)) {
      best = { index, name };
    }
  };

  for (const name of names) {
    for (const phrase of ALIASES[name] ?? [name.toLowerCase()]) {
      const m = phraseRegex(phrase).exec(lower);
      if (m) consider(m.index, name);
    }
  }
  for (const rx of [BLOCK, BUILDING]) {
    const m = rx.exec(text);
    const letter = m?.[1]?.toUpperCase();
    if (m && letter) consider(m.index, `Block ${letter}`);
  }
  return best;
}

// Title first; inside one text, the earliest mention wins.
export function detectLocation(
  title: string,
  description: string,
  names: string[],
): string | null {
  for (const text of [title, description]) {
    const hit = findIn(text, names);
    if (hit) return hit.name;
  }
  return null;
}
