import Link from 'next/link';
import type { ComplaintStatus } from '@/generated/prisma/enums';
import { StatusBadge } from '@/ui/shared/complaint/StatusBadge';
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
        className='block rounded-xl border p-4 transition-colors outline-none hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50'
      >
        <div className='flex items-center justify-between gap-3'>
          <span className='text-sm font-medium text-muted-foreground'>
            {ticket}
          </span>
          <StatusBadge status={status} />
        </div>
        <p className='mt-1 font-medium'>{title}</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          {categoryName} · {formatDate(createdAt)}
        </p>
      </Link>
    </li>
  );
}
