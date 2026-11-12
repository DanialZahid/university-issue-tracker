import { normalizeText, phraseRegex } from './text';
import { hasEmergency } from './emergency';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const CRITICAL_WORDS = [
  'flood',
  'flooding',
  'collapse',
  'collapsed',
  'emergency',
  'threat',
  'harassment',
];

const HIGH_WORDS = [
  'urgent',
  'urgently',
  'asap',
  'immediately',
  'tomorrow',
  'deadline',
  'no power',
  'power outage',
  'no water',
  'leak',
  'leaking',
  'theft',
  'stolen',
  'unsafe',
  'as soon as possible',
  'right away',
  'quickly',
  'high priority',
  'extinguisher',
  'cannot access',
  'cannot log in',
  'cannot use',
  'all students',
  'many students',
  'hundreds',
  'all users',
  'no one can',
  'nobody can',
  'whole class',
  'everyone',
];

// Common ways of writing the same thing, so one word list covers them.
const SPELLINGS: [RegExp, string][] = [
  [/[\u2018\u2019]/g, "'"],
  [/\b(?:can't|cant|can not|unable to)\b/g, 'cannot'],
  [/\b(?:sign[\s-]?in|log[\s-]?in|login)\b/g, 'log in'],
];

const LOW_WORDS = [
  'suggestion',
  'suggest',
  'request',
  'minor',
  'cosmetic',
  'paint',
  'no rush',
  'when possible',
  'would be nice',
  'typo',
  'spelling',
  'fyi',
];

const CRITICAL = CRITICAL_WORDS.map(phraseRegex);
const HIGH = HIGH_WORDS.map(phraseRegex);
const LOW = LOW_WORDS.map(phraseRegex);

export function detectPriority(
  title: string,
  description: string,
  categoryName: string,
): PriorityLevel {
  // "Fire extinguisher expired" is a safety check, not a fire.
  const text = SPELLINGS.reduce(
    (t, [rx, to]) => t.replace(rx, to),
    normalizeText(`${title} ${description}`).replace(
      /fire extinguishers?/g,
      'extinguisher',
    ),
  );

  if (hasEmergency(text) || CRITICAL.some((rx) => rx.test(text))) {
    return 'CRITICAL';
  }

  if (categoryName === 'Safety' || HIGH.some((rx) => rx.test(text))) {
    return 'HIGH';
  }
  if (LOW.some((rx) => rx.test(text))) return 'LOW';
  return 'MEDIUM';
}

export const priorityLabels: Record<PriorityLevel, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};
