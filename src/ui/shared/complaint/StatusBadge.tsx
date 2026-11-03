import { CheckCircle2, Clock, Loader, type LucideIcon } from 'lucide-react';
import type { ComplaintStatus } from '@/generated/prisma/enums';
import { statusTone } from './status-tone';
import { cn } from '@/utils/cn';
import { statusLabels } from '@/utils/complaint-labels';

const icons: Record<ComplaintStatus, LucideIcon> = {
  PENDING: Clock,
  IN_PROGRESS: Loader,
  RESOLVED: CheckCircle2,
};

type StatusBadgeProps = { status: ComplaintStatus; className?: string };

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const Icon = icons[status];
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] leading-none font-medium whitespace-nowrap',
        statusTone[status].soft,
        className,
      )}
    >
      <Icon className='size-3.5' />
      {statusLabels[status]}
    </span>
  );
}
