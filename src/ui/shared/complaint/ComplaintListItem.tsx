import Link from 'next/link';
import { CalendarClock, ChevronRight, Tag } from 'lucide-react';
import type { ComplaintStatus } from '@/generated/prisma/enums';
import { StatusBadge } from '@/ui/shared/complaint/StatusBadge';
import { statusTone } from '@/ui/shared/complaint/status-tone';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/date';
import { formatTicketNumber } from '@/utils/ticket';

type Props = {
  ticketNumber: number;
  title: string;
  status: ComplaintStatus;
  categoryName: string;
  createdAt: Date;
};

export function ComplaintListItem({
  ticketNumber,
  title,
  status,
  categoryName,
  createdAt,
}: Props) {
  const ticket = formatTicketNumber(ticketNumber);

  return (
    <li>
      <Link
        href={`/complaints/${ticket}`}
        className='group relative block overflow-hidden rounded-xl border bg-card py-4 pr-4 pl-6 transition-colors outline-none hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50'
      >
        <span
          aria-hidden='true'
          className={cn(
            'absolute inset-y-0 left-0 w-1.5',
            statusTone[status].bar,
          )}
        />
        <div className='flex items-center justify-between gap-3'>
          <span className='text-sm font-medium text-muted-foreground'>
            {ticket}
          </span>
          <StatusBadge status={status} />
        </div>
        <div className='mt-1 flex items-center justify-between gap-3'>
          <p className='font-medium'>{title}</p>
          <ChevronRight className='size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5' />
        </div>
        <div className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground'>
          <span className='inline-flex items-center gap-1.5'>
            <Tag className='size-3.5' />
            {categoryName}
          </span>
          <span className='inline-flex items-center gap-1.5'>
            <CalendarClock className='size-3.5' />
            {formatDate(createdAt)}
          </span>
        </div>
      </Link>
    </li>
  );
}
