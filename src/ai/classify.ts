import 'server-only';
import { z } from 'zod';
import { CATEGORY_NAMES } from '@/automation/category-detection';
import { generateJson } from './gemini';
import { redact } from './redact';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const LANGUAGES = ['english', 'roman-urdu', 'urdu', 'mixed'] as const;

export type AiClassification = {
  category: (typeof CATEGORY_NAMES)[number];
  priority: (typeof PRIORITIES)[number];
  location: string | null;
  room: string | null;
  language: (typeof LANGUAGES)[number];
  summary: string;
};

const SYSTEM = `You sort complaints for a university campus. Students and staff write in English, Urdu, or Roman Urdu (Urdu typed in English letters), sometimes mixed.

Return the category, priority, location, room, language, and a one-sentence summary in English for the department head (at most 20 words, no names).

Priority:
- CRITICAL: immediate danger to people, for example fire, smoke, sparks, gas smell or leak, injury, people trapped.
- HIGH: a hazard without immediate danger, an outage affecting many people, or a deadline or exam within days.
- LOW: cosmetic issues, suggestions, minor comfort.
- MEDIUM: everything else.

Location: one of the listed campus locations only if the text names it or clearly refers to it (a numbered lab means Computer Labs), otherwise null.
Room: classrooms as AC-123 (also when written "room 123"), labs as C-Lab 04 (two digits). Null if no room is given.`;

export async function classifyComplaint(input: {
  title: string;
  description: string;
  locations: string[];
}): Promise<AiClassification> {
  const locations = [...input.locations];
  const schema = {
    type: 'object',
    properties: {
      category: { type: 'string', enum: [...CATEGORY_NAMES] },
      priority: { type: 'string', enum: [...PRIORITIES] },
      location: { type: ['string', 'null'], enum: [...locations, null] },
      room: { type: ['string', 'null'] },
      language: { type: 'string', enum: [...LANGUAGES] },
      summary: { type: 'string' },
    },
    required: [
      'category',
      'priority',
      'location',
      'room',
      'language',
      'summary',
    ],
  };

  const raw = await generateJson({
    system: SYSTEM,
    prompt: [
      `Categories: ${CATEGORY_NAMES.join(', ')}.`,
      `Locations: ${locations.join(', ')}.`,
      '',
      `Title: ${redact(input.title)}`,
      `Description: ${redact(input.description)}`,
    ].join('\n'),
    schema,
  });

  // Never trust the shape: anything outside the lists falls back safely.
  const parsed = z
    .object({
      category: z.enum(CATEGORY_NAMES).catch('Other'),
      priority: z.enum(PRIORITIES).catch('MEDIUM'),
      location: z
        .string()
        .nullable()
        .catch(null)
        .transform((l) => (l && locations.includes(l) ? l : null)),
      room: z.string().trim().max(30).nullable().catch(null),
      language: z.enum(LANGUAGES).catch('english'),
      summary: z.string().trim().max(300).catch(''),
    })
    .parse(raw);
  return { ...parsed, room: parsed.room || null };
}
