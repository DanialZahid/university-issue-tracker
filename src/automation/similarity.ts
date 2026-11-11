// Rule-based "is this the same issue?" check, used while a complaint is typed.
// Pure functions, so they can be tested and explained without a database.

const STOP_WORDS = new Set([
  // Short filler words ("ac" and "pc" are kept on purpose).
  'in',
  'is',
  'on',
  'of',
  'to',
  'at',
  'it',
  'my',
  'no',
  'be',
  'by',
  'an',
  'as',
  'we',
  'us',
  'so',
  'or',
  'if',
  'do',
  'up',
  'am',
  'the',
  'and',
  'for',
  'not',
  'are',
  'was',
  'has',
  'have',
  'with',
  'from',
  'this',
  'that',
  'there',
  'here',
  'our',
  'out',
  'its',
  'been',
  'being',
  'again',
  'still',
  'please',
  'very',
  'some',
  'any',
  'all',
  'can',
  'cannot',
  'will',
  'working',
  'work',
  'issue',
  'problem',
  'room',
  'lab',
  'class',
]);

// Meaningful words of a title: lower case, no punctuation, no filler words,
// simple plurals folded ("chairs" matches "chair").
export function titleWords(title: string): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    // Numbers are dropped: the room is compared separately.
    .filter((w) => w.length >= 2 && !/^\d+$/.test(w) && !STOP_WORDS.has(w))
    .map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w));
  return [...new Set(words)];
}

// Share of the shorter title's words found in the other one, from 0 to 1.
export function wordOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const other = new Set(b);
  const shared = a.filter((w) => other.has(w)).length;
  return shared / Math.min(a.length, b.length);
}

// Category and location already match (the query guarantees it), so the
// score is word overlap plus a bonus when the room is the same.
export function similarityScore(
  typed: { words: string[]; room: string },
  existing: { title: string; room: string | null },
): number {
  const overlap = wordOverlap(typed.words, titleWords(existing.title));
  const sameRoom =
    typed.room !== '' &&
    existing.room !== null &&
    typed.room.toLowerCase() === existing.room.toLowerCase();
  return overlap + (sameRoom ? 0.3 : 0);
}

// At least half the meaningful words match, or fewer with the same room.
export const SIMILAR_THRESHOLD = 0.5;
