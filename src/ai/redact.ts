// Removes personal details before any text leaves the platform. Pure, so it
// can be tested on its own.

const RULES: { pattern: RegExp; label: string }[] = [
  { pattern: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, label: '[email]' },
  // Student IDs, for example IU05-0121-0178.
  { pattern: /\b[A-Z]{2}\d{2}-\d{4}-\d{4}\b/gi, label: '[student id]' },
  // Phone numbers: +92 300 1234567, 0300-1234567, and similar.
  { pattern: /(?:\+92|0092|\b0)[\s-]?3\d{2}[\s-]?\d{7}\b/g, label: '[phone]' },
  { pattern: /\+?\d[\d\s-]{9,}\d/g, label: '[phone]' },
  // CNIC: 12345-1234567-1
  { pattern: /\b\d{5}-\d{7}-\d\b/g, label: '[id number]' },
];

export function redact(text: string): string {
  return RULES.reduce(
    (out, { pattern, label }) => out.replace(pattern, label),
    text,
  );
}
