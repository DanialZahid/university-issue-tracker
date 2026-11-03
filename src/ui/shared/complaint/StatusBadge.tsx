import { CheckCircle2, Clock, Loader, type LucideIcon } from 'lucide-react';
import type { ComplaintStatus } from '@/generated/prisma/enums';
import { Badge } from '@/ui/common/badge';
import { statusTone } from '@/ui/shared/complaint/status-tone';
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
      className={cn('border-transparent', statusTone[status].soft, className)}
    >
      <Icon />
      {statusLabels[status]}
    </Badge>
  );
}
