'use server';

import { revalidatePath } from 'next/cache';
import { priorityLabels } from '@/automation/priority-detection';
import { changePriority, changeStatus, type UpdateOutcome } from '@/db/manage';
import {
  priorityUpdateSchema,
  statusUpdateSchema,
} from '@/schemas/manage-actions';
import { statusLabels } from '@/utils/complaint-labels';
import { requireManager } from '@/utils/session';
import { formatTicketNumber } from '@/utils/ticket';

export type ManageActionState =
  { status: 'idle' } | { status: 'success' | 'error'; message: string };

const MESSAGES: Record<Exclude<UpdateOutcome, 'ok'>, string> = {
  unchanged: 'Nothing changed.',
  'not-found': 'This complaint was not found in your department.',
  archived: 'Restore this complaint from the archive first.',
  conflict: 'Someone else just changed this complaint. Refresh and try again.',
};

function finish(
  outcome: UpdateOutcome,
  ticketNumber: number,
  success: string,
): ManageActionState {
  if (outcome !== 'ok') {
    return {
      status: outcome === 'unchanged' ? 'success' : 'error',
      message: MESSAGES[outcome],
    };
  }
  revalidatePath(`/manage/complaints/${formatTicketNumber(ticketNumber)}`);
  revalidatePath('/manage');
  return { status: 'success', message: success };
}

export async function updateStatus(
  _prev: ManageActionState,
  formData: FormData,
): Promise<ManageActionState> {
  const user = await requireManager();
  const parsed = statusUpdateSchema.safeParse({
    ticketNumber: formData.get('ticketNumber'),
    status: formData.get('status'),
    expected: formData.get('expected'),
  });
  if (!parsed.success) return { status: 'error', message: 'Invalid request.' };

  const { ticketNumber, status, expected } = parsed.data;
  const outcome = await changeStatus(user, ticketNumber, status, expected);
  return finish(
    outcome,
    ticketNumber,
    `Status set to ${statusLabels[status]}.`,
  );
}

export async function updatePriority(
  _prev: ManageActionState,
  formData: FormData,
): Promise<ManageActionState> {
  const user = await requireManager();
  const parsed = priorityUpdateSchema.safeParse({
    ticketNumber: formData.get('ticketNumber'),
    priority: formData.get('priority'),
    expected: formData.get('expected'),
  });
  if (!parsed.success) return { status: 'error', message: 'Invalid request.' };

  const { ticketNumber, priority, expected } = parsed.data;
  const outcome = await changePriority(user, ticketNumber, priority, expected);
  return finish(
    outcome,
    ticketNumber,
    `Priority set to ${priorityLabels[priority]}.`,
  );
}
