import type { ComplaintStatus } from '@/generated/prisma/enums';

export const statusLabels: Record<ComplaintStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
};

export function statusLabel(value: string | null): string {
  if (!value) return '';
  return statusLabels[value as ComplaintStatus] ?? value;
}
