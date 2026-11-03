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
  'cannot access',
  'cannot log in',
  'unable to access',
  'all students',
  'whole class',
  'everyone',
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
  const text = normalizeText(`${title} ${description}`).replace(
    /fire extinguishers?/g,
    'extinguisher',
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
