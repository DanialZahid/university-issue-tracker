'use server';

import { revalidatePath } from 'next/cache';
import { priorityLabels } from '@/automation/priority-detection';
import {
  changePriority,
  changeStatus,
  addNote,
  forwardComplaint,
  setArchived,
  type UpdateOutcome,
} from '@/db/manage';
import {
  priorityUpdateSchema,
  statusUpdateSchema,
  archiveSchema,
  forwardSchema,
  noteSchema,
} from '@/schemas/manage-actions';
import { statusLabels } from '@/utils/complaint-labels';
import { requireManager } from '@/utils/session';
import { formatTicketNumber } from '@/utils/ticket';
import { redirect } from 'next/navigation';
import { UserRole } from '@/generated/prisma/enums';
import { withQuery } from '@/utils/query';

export type ManageActionState =
  { status: 'idle' } | { status: 'success' | 'error'; message: string };

const MESSAGES: Record<Exclude<UpdateOutcome, 'ok'>, string> = {
  unchanged: 'Nothing changed.',
  'not-found': 'This complaint was not found in your department.',
  archived: 'Restore this complaint from the archive first.',
  conflict: 'Someone else just changed this complaint. Refresh and try again.',
  invalid: 'That option is no longer available. Refresh and try again.',
  'not-resolved': 'Only resolved complaints can be archived.',
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

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Invalid request.';
}

export async function forwardToDepartment(
  _prev: ManageActionState,
  formData: FormData,
): Promise<ManageActionState> {
  const user = await requireManager();
  const parsed = forwardSchema.safeParse({
    ticketNumber: formData.get('ticketNumber'),
    departmentId: formData.get('departmentId'),
    expected: formData.get('expected'),
    reason: String(formData.get('reason') ?? ''),
  });
  if (!parsed.success)
    return { status: 'error', message: firstIssue(parsed.error) };

  const { ticketNumber, departmentId, expected, reason } = parsed.data;
  const outcome = await forwardComplaint(
    user,
    ticketNumber,
    departmentId,
    expected,
    reason,
  );

  // A head loses access once it leaves their department: back to the dashboard.
  if (outcome === 'ok' && user.role !== UserRole.SUPERUSER) {
    revalidatePath('/manage');
    redirect(
      withQuery('/manage', { forwarded: formatTicketNumber(ticketNumber) }),
    );
  }
  return finish(outcome, ticketNumber, 'Complaint forwarded.');
}

export async function addInternalNote(
  _prev: ManageActionState,
  formData: FormData,
): Promise<ManageActionState> {
  const user = await requireManager();
  const parsed = noteSchema.safeParse({
    ticketNumber: formData.get('ticketNumber'),
    note: String(formData.get('note') ?? ''),
  });
  if (!parsed.success)
    return { status: 'error', message: firstIssue(parsed.error) };

  const { ticketNumber, note } = parsed.data;
  const outcome = await addNote(user, ticketNumber, note);
  return finish(outcome, ticketNumber, 'Note added.');
}

export async function toggleArchive(
  _prev: ManageActionState,
  formData: FormData,
): Promise<ManageActionState> {
  const user = await requireManager();
  const parsed = archiveSchema.safeParse({
    ticketNumber: formData.get('ticketNumber'),
    archive: formData.get('archive'),
  });
  if (!parsed.success) return { status: 'error', message: 'Invalid request.' };

  const { ticketNumber, archive } = parsed.data;
  const outcome = await setArchived(user, ticketNumber, archive === 'archive');
  return finish(
    outcome,
    ticketNumber,
    archive === 'archive' ? 'Complaint archived.' : 'Complaint restored.',
  );
}
