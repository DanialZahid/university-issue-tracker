import type { ComplaintResult, PairResult } from '@/eval/types';

// Run log and saved progress for the evaluation page. A long run can be cut
// off by a time-out, a lost connection, or a sleeping computer; the progress
// is kept in this browser so the run can resume where it stopped.

export type EvalEvent = {
  at: string;
  step: string;
  kind: 'info' | 'retry' | 'error';
  message: string;
};

export type SavedProgress = {
  savedAt: string;
  withAi: boolean;
  complaints: ComplaintResult[];
  pairs: PairResult[];
  events: EvalEvent[];
};

// Tied to the test set size, so progress from an older set is never mixed in.
const keyFor = (complaints: number, pairs: number) =>
  `evaluation-progress:${complaints}-${pairs}`;

export function readProgress(
  complaints: number,
  pairs: number,
): SavedProgress | null {
  try {
    const raw = localStorage.getItem(keyFor(complaints, pairs));
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedProgress;
    if (!Array.isArray(data.complaints) || !Array.isArray(data.pairs)) {
      return null;
    }
    return { ...data, events: Array.isArray(data.events) ? data.events : [] };
  } catch {
    return null;
  }
}

export function saveProgress(
  complaints: number,
  pairs: number,
  progress: SavedProgress,
): void {
  try {
    localStorage.setItem(keyFor(complaints, pairs), JSON.stringify(progress));
  } catch {
    // Storage full or blocked: the run continues, it just cannot resume.
  }
}

export function clearProgress(complaints: number, pairs: number): void {
  try {
    localStorage.removeItem(keyFor(complaints, pairs));
  } catch {
    // Nothing saved.
  }
}

// Turns a failed server call into something that says what happened. The
// framework only reports "an unexpected response" when the hosting platform
// answers instead of the app, which is almost always a time-out (504).
export function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('unexpected response')) {
    return 'The server did not answer in time or failed (usually a 504 time-out). Details are in the hosting logs.';
  }
  if (message.includes('Failed to find Server Action')) {
    return 'The app was redeployed during the run. Reload the page and resume.';
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'The network connection was lost.';
  }
  return message;
}
