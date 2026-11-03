import { CheckCircle2, Clock, Loader, type LucideIcon } from 'lucide-react';
import type { ComplaintStatus } from '@/generated/prisma/enums';
import { Badge } from '@/ui/common/badge';
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
    <Badge
      variant='outline'
      className={cn(
        'gap-1.5 border-transparent px-2.5 py-0.5 text-[13px] [&>svg]:size-3.5',
        statusTone[status].soft,
        className,
      )}
    >
      <Icon />
      {statusLabels[status]}
    </Badge>
  );
}
