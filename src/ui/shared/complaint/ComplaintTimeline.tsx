import {
  CheckCircle2,
  Clock,
  FilePlus2,
  Loader,
  Send,
  type LucideIcon,
} from 'lucide-react';
import type { AuditAction } from '@/generated/prisma/enums';
import { statusTone } from '@/ui/shared/complaint/status-tone';
import { statusLabel } from '@/utils/complaint-labels';
import { formatDateTime } from '@/utils/date';
import { cn } from '@/utils/cn';

export type TimelineEvent = {
  id: string;
  action: AuditAction;
  toValue: string | null;
  createdAt: Date;
};

const NEUTRAL = 'bg-slate-100 text-slate-700';

function visual(event: TimelineEvent): { icon: LucideIcon; tone: string } {
  if (event.action === 'CREATED') return { icon: FilePlus2, tone: NEUTRAL };
  if (event.action === 'ASSIGNED') return { icon: Send, tone: NEUTRAL };
  if (event.toValue === 'RESOLVED') {
    return { icon: CheckCircle2, tone: statusTone.RESOLVED.soft };
  }
  if (event.toValue === 'IN_PROGRESS') {
    return { icon: Loader, tone: statusTone.IN_PROGRESS.soft };
  }
  return { icon: Clock, tone: statusTone.PENDING.soft };
}

function describe(event: TimelineEvent): string {
  switch (event.action) {
    case 'CREATED':
      return 'Complaint submitted';
    case 'ASSIGNED':
      return `Sent to ${event.toValue ?? 'the department'}`;
    case 'STATUS_CHANGED':
      return `Status changed to ${statusLabel(event.toValue)}`;
    default:
      return 'Updated';
  }
}

export function ComplaintTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol>
      {events.map((event, index) => {
        const { icon: Icon, tone } = visual(event);
        const isLast = index === events.length - 1;
        return (
          <li key={event.id} className='relative flex gap-4 pb-6 last:pb-0'>
            {!isLast && (
              <span
                aria-hidden='true'
                className='absolute top-9 bottom-1 left-4 w-px bg-border'
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full',
                tone,
              )}
            >
              <Icon className='size-4' />
            </span>
            <div className='pt-1'>
              <p className='text-sm font-medium'>{describe(event)}</p>
              <p className='text-xs text-muted-foreground'>
                {formatDateTime(event.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
