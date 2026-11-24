import 'server-only';
import { classifyComplaint } from '@/ai/classify';
import { AiRetryableError, embed } from '@/ai/gemini';
import { cosine } from '@/ai/vector';
import { detectCategory } from '@/automation/category-detection';
import { hasEmergency } from '@/automation/emergency';
import { detectLocation } from '@/automation/location-detection';
import { detectPriority } from '@/automation/priority-detection';
import { detectRoom } from '@/automation/room-detection';
import { similarityScore, titleWords } from '@/automation/similarity';
import complaints from './complaints.json';
import pairs from './pairs.json';
import type {
  ComplaintResult,
  PairResult,
  StepOutcome,
  TestComplaint,
  TestPair,
} from './types';

export const TEST_COMPLAINTS = complaints as TestComplaint[];
export const TEST_PAIRS = pairs as TestPair[];

// The same list the app uses (scripts/seed-reference.ts).
export const LOCATIONS = [
  'Block A',
  'Block B',
  'Block C',
  'Computer Labs',
  'Library',
  'Cafeteria',
  'Garden',
  'Auditorium',
  'Administration Building',
  'Sports Complex',
  'Hostel',
  'Parking Area',
  'Main Gate',
  'No specific place',
];

// A provider request that hangs would otherwise run until the hosting
// platform's time limit and come back as a bare 504. Giving up earlier turns
// it into a normal retry that the runner can show and log.
const AI_STEP_TIMEOUT_MS = 45_000;

async function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new AiRetryableError(
            5_000,
            `no reply from the AI within ${AI_STEP_TIMEOUT_MS / 1000}s`,
          ),
        ),
      AI_STEP_TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function outcome<T>(error: unknown): StepOutcome<T> | null {
  if (error instanceof AiRetryableError) {
    return {
      status: 'retry',
      waitMs: error.retryAfterMs,
      reason: error.message,
    };
  }
  // A single request that timed out is retried too, so a slow provider
  // never leaves a complaint without an AI answer in the results.
  if (error instanceof Error && error.name === 'TimeoutError') {
    return { status: 'retry', waitMs: 8_000, reason: 'request timed out' };
  }
  return null;
}

export async function evaluateComplaint(
  index: number,
  withAi: boolean,
): Promise<StepOutcome<ComplaintResult>> {
  const t = TEST_COMPLAINTS[index];
  if (!t) return { status: 'error', message: 'No such test complaint.' };

  const detected = detectCategory(t.title, t.description);
  const rules = {
    category: detected.category,
    categoryScore: detected.score,
    emergency: hasEmergency(`${t.title} ${t.description}`),
    priority: detectPriority(t.title, t.description, detected.category),
    location: detectLocation(t.title, t.description, LOCATIONS),
    room: detectRoom(t.title, t.description),
  };

  if (!withAi) {
    return {
      status: 'ok',
      result: { id: t.id, rules, ai: null, aiError: null, aiMs: null },
    };
  }
  const start = performance.now();
  try {
    const ai = await withTimeout(
      classifyComplaint({
        title: t.title,
        description: t.description,
        locations: LOCATIONS,
      }),
    );
    const aiMs = Math.round(performance.now() - start);
    return {
      status: 'ok',
      result: { id: t.id, rules, ai, aiError: null, aiMs },
    };
  } catch (error) {
    return (
      outcome(error) ?? {
        status: 'ok',
        result: {
          id: t.id,
          rules,
          ai: null,
          aiError: error instanceof Error ? error.message : String(error),
          aiMs: null,
        },
      }
    );
  }
}

export async function evaluatePair(
  index: number,
  withAi: boolean,
): Promise<StepOutcome<PairResult>> {
  const p = TEST_PAIRS[index];
  if (!p) return { status: 'error', message: 'No such test pair.' };

  const ruleScore = similarityScore(
    { words: titleWords(p.a), room: p.roomA ?? '' },
    { title: p.b, room: p.roomB },
  );
  if (!withAi) {
    return {
      status: 'ok',
      result: {
        id: p.id,
        ruleScore,
        embeddingScore: null,
        aiError: null,
        aiMs: null,
      },
    };
  }
  const start = performance.now();
  try {
    const [a, b] = await withTimeout(Promise.all([embed(p.a), embed(p.b)]));
    return {
      status: 'ok',
      result: {
        id: p.id,
        ruleScore,
        embeddingScore: cosine(a, b),
        aiError: null,
        aiMs: Math.round(performance.now() - start),
      },
    };
  } catch (error) {
    return (
      outcome(error) ?? {
        status: 'ok',
        result: {
          id: p.id,
          ruleScore,
          embeddingScore: null,
          aiError: error instanceof Error ? error.message : String(error),
          aiMs: null,
        },
      }
    );
  }
}
