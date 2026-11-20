import type { ReactNode } from 'react';
import {
  AlignLeft,
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  Flag,
  MapPin,
  Sparkles,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import type { ComplaintStatus, Priority } from '@/generated/prisma/enums';
import { departmentIcon } from '@/ui/shared/department';
import { cn } from '@/utils/cn';
import { formatDateTime, isoDate } from '@/utils/date';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { statusTone } from './status-tone';

export function DetailItem({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className='flex items-start gap-3.5'>
      <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground'>
        <Icon className='size-5' />
      </span>
      <div className='min-w-0'>
        <dt className='text-sm text-muted-foreground'>{label}</dt>
        <dd className='mt-0.5 text-base font-medium wrap-break-word'>
          {children}
        </dd>
      </div>
    </div>
  );
}

type Props = {
  complaint: {
    title: string;
    description: string;
    // Only passed on the management page.
    aiSummary?: string | null;
    status: ComplaintStatus;
    priority: Priority;
    locationDetail: string | null;
    createdAt: Date;
    resolvedAt: Date | null;
    category: { name: string };
    location: { name: string };
    department: { name: string } | null;
  };
  children?: ReactNode;
};

export function ComplaintSummary({ complaint: c, children }: Props) {
  return (
    <div className='overflow-hidden rounded-xl border bg-card'>
      <div
        className={cn(
          'h-1.5 transition-colors duration-700',
          statusTone[c.status].bar,
        )}
      />
      <div className='space-y-6 p-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <h2 className='min-w-0 flex-1 text-2xl font-semibold wrap-break-word'>
            {c.title}
          </h2>
          <span className='shrink-0 sm:mt-1.5'>
            <StatusBadge status={c.status} />
          </span>
        </div>

        {c.aiSummary && (
          <p className='flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950'>
            <Sparkles className='mt-0.5 size-4 shrink-0 text-violet-600' />
            <span>
              <span className='font-medium'>AI summary: </span>
              {c.aiSummary}
            </span>
          </p>
        )}

        <div className='rounded-xl bg-muted/40 p-5'>
          <p className='mb-2 flex items-center gap-2 text-sm text-muted-foreground'>
            <AlignLeft className='size-4' />
            Description
          </p>
          <p className='text-base whitespace-pre-wrap'>{c.description}</p>
        </div>

        <dl className='grid gap-6 sm:grid-cols-2'>
          <DetailItem icon={Tag} label='Category'>
            {c.category.name}
          </DetailItem>
          <DetailItem
            icon={departmentIcon(c.department?.name)}
            label='Handled by'
          >
            {c.department?.name ?? 'Not assigned yet'}
          </DetailItem>
          <DetailItem icon={MapPin} label='Location'>
            {c.location.name}
          </DetailItem>
          {c.locationDetail && (
            <DetailItem icon={DoorOpen} label='Room'>
              {c.locationDetail}
            </DetailItem>
          )}
          <DetailItem icon={Flag} label='Priority'>
            <PriorityBadge priority={c.priority} />
          </DetailItem>
          <DetailItem icon={CalendarClock} label='Submitted'>
            <time dateTime={isoDate(c.createdAt)}>
              {formatDateTime(c.createdAt)}
            </time>
          </DetailItem>
          {c.resolvedAt && (
            <DetailItem icon={CheckCircle2} label='Resolved'>
              <time dateTime={isoDate(c.resolvedAt)}>
                {formatDateTime(c.resolvedAt)}
              </time>
            </DetailItem>
          )}
          {children}
        </dl>
      </div>
    </div>
  );
}
