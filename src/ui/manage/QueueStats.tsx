import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Loader,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { statusTone } from '@/ui/shared/complaint';
import { cn } from '@/utils/cn';
import { withQuery } from '@/utils/query';

type Counts = {
  pending: number;
  inProgress: number;
  resolved: number;
  criticalOpen: number;
};

type Stat = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
  query: Record<string, string>;
};

export function QueueStats({
  counts,
  department,
}: {
  counts: Counts;
  department?: string;
}) {
  const stats: Stat[] = [
    {
      label: 'Pending',
      value: counts.pending,
      icon: Clock,
      tone: statusTone.PENDING.soft,
      query: { status: 'PENDING' },
    },
    {
      label: 'In progress',
      value: counts.inProgress,
      icon: Loader,
      tone: statusTone.IN_PROGRESS.soft,
      query: { status: 'IN_PROGRESS' },
    },
    {
      label: 'Resolved',
      value: counts.resolved,
      icon: CheckCircle2,
      tone: statusTone.RESOLVED.soft,
      query: { status: 'RESOLVED' },
    },
    {
      label: 'Critical and open',
      value: counts.criticalOpen,
      icon: TriangleAlert,
      tone: 'bg-red-100 text-red-800',
      query: { priority: 'CRITICAL' },
    },
  ];

  return (
    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
      {stats.map(({ label, value, icon: Icon, tone, query }) => (
        <Link
          key={label}
          href={withQuery('/manage', { ...query, department })}
          className='flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors outline-none hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50'
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
              {value.toLocaleString('en-US')}
            </p>
            <p className='text-sm text-muted-foreground'>{label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
