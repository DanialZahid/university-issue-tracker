import type { AuditAction } from '@/generated/prisma/enums';
import { statusLabel } from '@/utils/complaint-labels';
import { formatDateTime } from '@/utils/date';

export type TimelineEvent = {
  id: string;
  action: AuditAction;
  toValue: string | null;
  createdAt: Date;
};

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
    <ol className='relative ml-2 space-y-5 border-l border-border pl-6'>
      {events.map((event) => (
        <li key={event.id} className='relative'>
          <span className='absolute top-1.5 left-[-1.8rem] size-2.5 rounded-full bg-primary' />
          <p className='text-sm font-medium'>{describe(event)}</p>
          <p className='text-xs text-muted-foreground'>
            {formatDateTime(event.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}
