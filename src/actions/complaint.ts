'use server';

import { createComplaint } from '@/db/complaint';
import { complaintSchema, collectFieldErrors } from '@/schemas/complaint';
import { formatTicketNumber } from '@/utils/ticket';
import { requireUser } from '@/utils/session';

export type SubmitComplaintState =
  | { status: 'idle' }
  | { status: 'error'; message?: string; fieldErrors?: Record<string, string> }
  | { status: 'success'; ticket: string };

const FIELDS = [
  'title',
  'description',
  'categoryId',
  'locationId',
  'locationDetail',
  'priority',
] as const;

export async function submitComplaint(
  _prev: SubmitComplaintState,
  formData: FormData,
): Promise<SubmitComplaintState> {
  const user = await requireUser();

  const raw = Object.fromEntries(
    FIELDS.map((name) => [name, String(formData.get(name) ?? '')]),
  );
  const parsed = complaintSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: 'error', fieldErrors: collectFieldErrors(parsed.error) };
  }

  const ticketNumber = await createComplaint(parsed.data, user.id);
  if (ticketNumber === null) {
    return { status: 'error', message: 'Invalid category or location.' };
  }

  return { status: 'success', ticket: formatTicketNumber(ticketNumber) };
}
