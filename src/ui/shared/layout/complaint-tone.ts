import type { ComplaintStatus, Priority } from '@/generated/prisma/enums';

export type Tone = 'pending' | 'in-progress' | 'resolved' | 'critical';

// Resolved wins, then Critical, then the status itself.
export function complaintTone(
  status: ComplaintStatus,
  priority: Priority,
): Tone {
  if (status === 'RESOLVED') return 'resolved';
  if (priority === 'CRITICAL') return 'critical';
  return status === 'IN_PROGRESS' ? 'in-progress' : 'pending';
}
