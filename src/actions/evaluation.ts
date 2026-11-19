'use server';

import { z } from 'zod';
import { isAiConfigured } from '@/ai/gemini';
import { evaluateComplaint, evaluatePair } from '@/eval/run';
import type { ComplaintResult, PairResult, StepOutcome } from '@/eval/types';
import { getRealSuperuser } from '@/utils/session';

// Only the fixed test items can be run, by index, so this cannot be used to
// send arbitrary text to the AI provider.
const stepSchema = z.object({
  index: z.number().int().min(0).max(500),
  withAi: z.boolean(),
});

const denied = { status: 'error', message: 'Not allowed.' } as const;

export async function runComplaintStep(
  input: z.infer<typeof stepSchema>,
): Promise<StepOutcome<ComplaintResult>> {
  if (!(await getRealSuperuser())) return denied;
  const { index, withAi } = stepSchema.parse(input);
  return evaluateComplaint(index, withAi && isAiConfigured());
}

export async function runPairStep(
  input: z.infer<typeof stepSchema>,
): Promise<StepOutcome<PairResult>> {
  if (!(await getRealSuperuser())) return denied;
  const { index, withAi } = stepSchema.parse(input);
  return evaluatePair(index, withAi && isAiConfigured());
}
