import type { ComplaintStatus } from '@/generated/prisma/enums';

// Same palette as the status badges. soft = icon circles, bar = accent stripes.
export const statusTone: Record<
  ComplaintStatus,
  { soft: string; bar: string }
> = {
  PENDING: { soft: 'bg-amber-100 text-amber-800', bar: 'bg-amber-400' },
  IN_PROGRESS: { soft: 'bg-sky-100 text-sky-800', bar: 'bg-sky-500' },
  RESOLVED: { soft: 'bg-green-100 text-green-800', bar: 'bg-green-500' },
};
