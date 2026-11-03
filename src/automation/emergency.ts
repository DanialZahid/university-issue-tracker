import { normalizeText, phraseRegex } from './text';

export const EMERGENCY_WORDS = [
  'fire',
  'smoke',
  'gas leak',
  'short circuit',
  'electric shock',
  'sparks',
  'sparking',
  'injured',
  'injury',
  'unconscious',
  'ambulance',
  'assault',
];

const EMERGENCY = EMERGENCY_WORDS.map(phraseRegex);

export function hasEmergency(text: string): boolean {
  // "Fire extinguisher expired" is a safety check, not a fire.
  const cleaned = normalizeText(text).replace(
    /fire extinguishers?/g,
    'extinguisher',
  );
  return EMERGENCY.some((rx) => rx.test(cleaned));
}
