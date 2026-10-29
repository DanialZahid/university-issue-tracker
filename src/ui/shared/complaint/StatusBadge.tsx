import { ComplaintStatus } from '@/generated/prisma/enums';
import { Badge } from '@/ui/common/badge';
import { cn } from '@/utils/cn';

const statusStyles: Record<
  ComplaintStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Pending',
    className: 'border-transparent bg-amber-100 text-amber-900',
  },
  IN_PROGRESS: {
    label: 'In progress',
    className: 'border-transparent bg-blue-100 text-blue-900',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'border-transparent bg-green-100 text-green-900',
  },
};

type StatusBadgeProps = { status: ComplaintStatus; className?: string };

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status];
  return (
    <Badge variant='outline' className={cn(style.className, className)}>
      {style.label}
    </Badge>
  );
}
