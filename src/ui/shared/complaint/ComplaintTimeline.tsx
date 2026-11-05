import {
  Archive,
  ArchiveRestore,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  FilePlus2,
  Flag,
  Loader,
  Send,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import {
  priorityLabels,
  type PriorityLevel,
} from '@/automation/priority-detection';
import type { AuditAction } from '@/generated/prisma/enums';
import { cn } from '@/utils/cn';
import { statusLabel } from '@/utils/complaint-labels';
import { formatDateTime } from '@/utils/date';
import { statusTone } from './status-tone';

export type TimelineEvent = {
  id: string;
  action: AuditAction;
  toValue: string | null;
  createdAt: Date;
  fromValue?: string | null;
  note?: string | null;
  performedBy?: { name: string } | null;
};

const NEUTRAL = 'bg-slate-100 text-slate-700';
const AUTOMATIC_NOTES = new Set([
  'Set automatically',
  'Auto-assigned from category',
]);

function priorityLabel(value: string | null | undefined): string {
  return value ? (priorityLabels[value as PriorityLevel] ?? value) : '';
}

function visual(event: TimelineEvent): { icon: LucideIcon; tone: string } {
  switch (event.action) {
    case 'CREATED':
      return { icon: FilePlus2, tone: NEUTRAL };
    case 'ASSIGNED':
      return { icon: event.fromValue ? ArrowRightLeft : Send, tone: NEUTRAL };
    case 'PRIORITY_CHANGED':
      return { icon: Flag, tone: 'bg-violet-100 text-violet-800' };
    case 'NOTE_ADDED':
      return { icon: StickyNote, tone: NEUTRAL };
    case 'ARCHIVED':
      return { icon: Archive, tone: NEUTRAL };
    case 'UNARCHIVED':
      return { icon: ArchiveRestore, tone: NEUTRAL };
    default:
      if (event.toValue === 'RESOLVED') {
        return { icon: CheckCircle2, tone: statusTone.RESOLVED.soft };
      }
      if (event.toValue === 'IN_PROGRESS') {
        return { icon: Loader, tone: statusTone.IN_PROGRESS.soft };
      }
      return { icon: Clock, tone: statusTone.PENDING.soft };
  }
}

function describe(event: TimelineEvent): string {
  switch (event.action) {
    case 'CREATED':
      return 'Complaint submitted';
    case 'ASSIGNED':
      return event.fromValue
        ? `Forwarded from ${event.fromValue} to ${event.toValue ?? 'another department'}`
        : `Sent to ${event.toValue ?? 'the department'}`;
    case 'STATUS_CHANGED':
      return `Status changed to ${statusLabel(event.toValue)}`;
    case 'PRIORITY_CHANGED':
      return event.fromValue
        ? `Priority changed from ${priorityLabel(event.fromValue)} to ${priorityLabel(event.toValue)}`
        : `Priority set to ${priorityLabel(event.toValue)}`;
    case 'NOTE_ADDED':
      return 'Internal note added';
    case 'ARCHIVED':
      return 'Archived';
    case 'UNARCHIVED':
      return 'Restored from archive';
    default:
      return 'Updated';
  }
}

type Props = { events: TimelineEvent[]; showActor?: boolean };

export function ComplaintTimeline({ events, showActor = false }: Props) {
  return (
    <ol>
      {events.map((event, index) => {
        const { icon: Icon, tone } = visual(event);
        const isLast = index === events.length - 1;
        const automatic = !!event.note && AUTOMATIC_NOTES.has(event.note);
        const actor = automatic ? 'Automatic' : event.performedBy?.name;

        return (
          <li key={event.id} className='relative flex gap-4 pb-7 last:pb-0'>
            {!isLast && (
              <span
                aria-hidden='true'
                className='absolute top-10 bottom-0 left-5 w-px bg-border'
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full',
                tone,
              )}
            >
              <Icon className='size-5' />
            </span>
            <div className='min-w-0 flex-1 pt-0.5'>
              <p className='text-base font-medium'>{describe(event)}</p>
              <p className='text-sm text-muted-foreground'>
                {formatDateTime(event.createdAt)}
                {showActor && actor ? ` · ${actor}` : ''}
              </p>
              {showActor && event.note && !automatic && (
                <p className='mt-2 rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap'>
                  {event.note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
