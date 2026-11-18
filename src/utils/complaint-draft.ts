import { z } from 'zod';
import { attachmentsSchema } from '@/schemas/attachment';

// Unsent complaint form, kept in this browser so a refresh, a closed tab, or
// leaving the page does not lose it. One draft per signed-in user.

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const draftSchema = z.object({
  savedAt: z.number(),
  title: z.string().max(500),
  description: z.string().max(5000),
  // null means "use the suggestion", like the form state.
  categoryId: z.string().nullable(),
  locationId: z.string().nullable(),
  room: z.string().max(200).nullable(),
  attachments: attachmentsSchema,
});

export type ComplaintDraft = z.infer<typeof draftSchema>;

const keyFor = (userId: string) => `complaint-draft:${userId}`;

export function isDraftEmpty(draft: Omit<ComplaintDraft, 'savedAt'>): boolean {
  return (
    !draft.title.trim() &&
    !draft.description.trim() &&
    draft.categoryId === null &&
    draft.locationId === null &&
    !draft.room &&
    draft.attachments.length === 0
  );
}

// Storage can be missing or blocked (private windows, strict settings), so
// every access is wrapped and a failure simply means no draft.
export function readDraft(userId: string): ComplaintDraft | null {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || Date.now() - parsed.data.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(keyFor(userId));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function saveDraft(
  userId: string,
  draft: Omit<ComplaintDraft, 'savedAt'>,
): void {
  try {
    if (isDraftEmpty(draft)) {
      localStorage.removeItem(keyFor(userId));
      return;
    }
    localStorage.setItem(
      keyFor(userId),
      JSON.stringify({ ...draft, savedAt: Date.now() }),
    );
  } catch {
    // Full or blocked storage: the form still works without a draft.
  }
}

export function clearDraft(userId: string): void {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {
    // Nothing to clear.
  }
}

// Removes every user's draft from this browser. Runs on the sign-in page, so
// signing out (or an expired session) leaves nothing behind on a shared computer.
export function clearAllDrafts(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('complaint-draft:')) localStorage.removeItem(key);
    }
  } catch {
    // Storage blocked: nothing was saved either.
  }
}
