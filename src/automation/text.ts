function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Whole word or phrase, with optional plural.
export function phraseRegex(phrase: string): RegExp {
  return new RegExp(`(?<![a-z0-9])${escapeRegex(phrase)}(?:s|es)?(?![a-z0-9])`);
}
