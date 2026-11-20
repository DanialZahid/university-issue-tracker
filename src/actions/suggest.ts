'use server';

import { z } from 'zod';
import { analyzeComplaint } from '@/ai/hybrid';
import { isAiEnabled } from '@/ai/gemini';
import { listLocationNames } from '@/db/complaint';
import { LIMITS } from '@/schemas/complaint';
import { requireUser } from '@/utils/session';

const inputSchema = z.object({
  title: z.string().trim().min(LIMITS.title.min).max(LIMITS.title.max),
  description: z
    .string()
    .trim()
    .min(LIMITS.description.min)
    .max(LIMITS.description.max),
});

export type FieldSuggestion = {
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string | null;
  room: string | null;
};

// Live suggestions while the form is typed. Returns null when the AI is off,
// the input is too short, or the AI did not answer, so the form keeps the
// suggestions from its own rules.
export async function suggestFields(
  input: z.infer<typeof inputSchema>,
): Promise<FieldSuggestion | null> {
  await requireUser();
  if (!isAiEnabled()) return null;
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return null;

  const result = await analyzeComplaint({
    ...parsed.data,
    locations: await listLocationNames(),
    timeoutMs: 6_000,
  });
  if (result.source !== 'ai') return null;
  return {
    category: result.category,
    priority: result.priority,
    location: result.location,
    room: result.room,
  };
}
