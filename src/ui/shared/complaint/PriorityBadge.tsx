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
import { cn } from '@/utils/cn';

const styles: Record<PriorityLevel, { icon: LucideIcon; className: string }> = {
  LOW: { icon: ArrowDown, className: 'bg-slate-100 text-slate-700' },
  MEDIUM: { icon: Minus, className: 'bg-violet-100 text-violet-800' },
  HIGH: { icon: ArrowUp, className: 'bg-orange-100 text-orange-800' },
  CRITICAL: { icon: TriangleAlert, className: 'bg-red-100 text-red-800' },
};

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const { icon: Icon, className } = styles[priority];
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] leading-none font-medium whitespace-nowrap',
        className,
      )}
    >
      <Icon className='size-3.5' />
      {priorityLabels[priority]}
    </span>
  );
}
