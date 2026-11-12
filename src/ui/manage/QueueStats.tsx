import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Clock,
  Loader,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { Hint } from '@/ui/common/Hint';
import { statusTone } from '@/ui/shared/complaint';
import { cn } from '@/utils/cn';
import { withQuery } from '@/utils/query';
import { CountUp } from '@/ui/motion';

type Counts = {
  pending: number;
  inProgress: number;
  resolved: number;
  criticalOpen: number;
};

type Props = {
  counts: Counts;
  query: Record<string, string | undefined>;
  active: { status: string; priority?: string };
};

type Stat = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
  query: Record<string, string>;
  isActive: boolean;
};

export function QueueStats({ counts, query: current, active }: Props) {
  const stats: Stat[] = [
    {
      label: 'Pending',
      value: counts.pending,
      icon: Clock,
      tone: statusTone.PENDING.soft,
      query: { status: 'PENDING' },
      isActive: active.status === 'PENDING',
    },
    {
      label: 'In progress',
      value: counts.inProgress,
      icon: Loader,
      tone: statusTone.IN_PROGRESS.soft,
      query: { status: 'IN_PROGRESS' },
      isActive: active.status === 'IN_PROGRESS',
    },
    {
      label: 'Resolved',
      value: counts.resolved,
      icon: CheckCircle2,
      tone: statusTone.RESOLVED.soft,
      query: { status: 'RESOLVED' },
      isActive: active.status === 'RESOLVED',
    },
    {
      label: 'Critical and open',
      value: counts.criticalOpen,
      icon: TriangleAlert,
      tone: 'bg-red-100 text-red-800',
      query: { priority: 'CRITICAL' },
      isActive: active.priority === 'CRITICAL',
    },
  ];

  return (
    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
      {stats.map(({ label, value, icon: Icon, tone, query, isActive }) => (
        <Hint
          key={label}
          label={
            isActive ? 'Remove this filter' : `Show ${label.toLowerCase()} only`
          }
        >
          <Link
            href={withQuery('/manage', {
              ...current,
              ...(isActive
                ? Object.fromEntries(
                    Object.keys(query).map((k) => [k, undefined]),
                  )
                : query),
            })}
            aria-current={isActive ? 'true' : undefined}
            className={cn(
              'flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              isActive
                ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/25'
                : 'hover:bg-accent/40',
            )}
          >
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                tone,
              )}
            >
              <Icon className='size-5' />
            </span>
            <div>
              <p className='text-2xl font-semibold tabular-nums'>
                <CountUp value={value} />
              </p>
              <p className='text-sm text-muted-foreground'>{label}</p>
            </div>
            {isActive && (
              <Check className='ml-auto size-4 self-start text-primary' />
            )}
          </Link>
        </Hint>
      ))}
    </div>
  );
}
