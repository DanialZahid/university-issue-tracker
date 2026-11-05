import type { ReactNode } from 'react';
import {
  AlignLeft,
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  Flag,
  MapPin,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import type { ComplaintStatus, Priority } from '@/generated/prisma/enums';
import { departmentIcon } from '@/ui/shared/department';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/date';
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
    status: ComplaintStatus;
    priority: Priority;
    locationDetail: string | null;
    createdAt: Date;
    resolvedAt: Date | null;
    category: { name: string };
    location: { name: string };
    department: { name: string } | null;
  };
  // Extra detail items (for example the submitter, on the manager view).
  children?: ReactNode;
};

export function ComplaintSummary({ complaint: c, children }: Props) {
  return (
    <div className='overflow-hidden rounded-xl border bg-card'>
      <div className={cn('h-1.5', statusTone[c.status].bar)} />
      <div className='space-y-6 p-6'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <h2 className='text-2xl font-semibold'>{c.title}</h2>
          <StatusBadge status={c.status} />
        </div>

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
            {formatDateTime(c.createdAt)}
          </DetailItem>
          {c.resolvedAt && (
            <DetailItem icon={CheckCircle2} label='Resolved'>
              {formatDateTime(c.resolvedAt)}
            </DetailItem>
          )}
          {children}
        </dl>
      </div>
    </div>
  );
}
