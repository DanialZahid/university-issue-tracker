'use server';

import { z } from 'zod';
import {
  SIMILAR_THRESHOLD,
  similarityScore,
  titleWords,
} from '@/automation/similarity';
import { listSimilarCandidates } from '@/db/complaint';
import type { ComplaintStatus } from '@/generated/prisma/enums';
import { requireUser } from '@/utils/session';
import { formatTicketNumber } from '@/utils/ticket';

const inputSchema = z.object({
  title: z.string().trim().min(5).max(120),
  categoryId: z.string().min(1).max(40),
  locationId: z.string().min(1).max(40),
  room: z.string().trim().max(30),
});

export type SimilarComplaint = {
  ticket: string;
  title: string;
  status: ComplaintStatus;
  room: string | null;
  createdAt: Date;
  mine: boolean;
};

// Safety complaints can be personal, so they are never shown to other people.
const PRIVATE_CATEGORY = 'Safety';

export async function findSimilarComplaints(
  input: z.input<typeof inputSchema>,
): Promise<SimilarComplaint[]> {
  const user = await requireUser();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return [];

  const { title, categoryId, locationId, room } = parsed.data;
  const words = titleWords(title);
  if (words.length === 0) return [];

  const candidates = await listSimilarCandidates(categoryId, locationId);
  return candidates
    .filter(
      (c) =>
        c.category.name !== PRIVATE_CATEGORY || c.submittedById === user.id,
    )
    .map((c) => ({
      complaint: c,
      score: similarityScore(
        { words, room },
        { title: c.title, room: c.locationDetail },
      ),
    }))
    .filter((c) => c.score >= SIMILAR_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ complaint: c }) => ({
      ticket: formatTicketNumber(c.ticketNumber),
      title: c.title,
      status: c.status,
      room: c.locationDetail,
      createdAt: c.createdAt,
      mine: c.submittedById === user.id,
    }));
}
