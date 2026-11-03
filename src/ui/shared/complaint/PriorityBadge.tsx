import {
  ArrowDown,
  ArrowUp,
  Minus,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import {
  priorityLabels,
  type PriorityLevel,
} from '@/automation/priority-detection';
import { Badge } from '@/ui/common/badge';
import { cn } from '@/utils/cn';

// Icon plus label, so priority never depends on color alone.
// Medium is violet, not blue, so it doesn't read as "In Progress".
const styles: Record<PriorityLevel, { icon: LucideIcon; className: string }> = {
  LOW: { icon: ArrowDown, className: 'bg-slate-100 text-slate-700' },
  MEDIUM: { icon: Minus, className: 'bg-violet-100 text-violet-800' },
  HIGH: { icon: ArrowUp, className: 'bg-orange-100 text-orange-800' },
  CRITICAL: { icon: TriangleAlert, className: 'bg-red-100 text-red-800' },
};

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const { icon: Icon, className } = styles[priority];
  return (
    <Badge
      variant='outline'
      className={cn(
        'gap-1.5 border-transparent px-2.5 py-0.5 text-[13px] [&>svg]:size-3.5',
        className,
      )}
    >
      <Icon />
      {priorityLabels[priority]}
    </Badge>
  );
}
