import Link from 'next/link';
import type { QueueItem } from '@/db/manage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/common/table';
import {
  ComplaintListItem,
  PriorityBadge,
  StatusBadge,
} from '@/ui/shared/complaint';
import { formatAge, formatDateTime } from '@/utils/date';
import { formatTicketNumber } from '@/utils/ticket';

type Props = { items: QueueItem[]; showDepartment: boolean };

const hrefFor = (ticket: string) => `/manage/complaints/${ticket}`;

export function QueueTable({ items, showDepartment }: Props) {
  const now = new Date();

  return (
    <>
      {/* Desktop: table for scanning many rows. */}
      <div className='hidden overflow-hidden rounded-xl border bg-card md:block'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50 hover:bg-muted/50'>
              <TableHead className='w-28 pl-4'>Ticket</TableHead>
              <TableHead>Complaint</TableHead>
              <TableHead className='w-28'>Priority</TableHead>
              <TableHead className='w-32'>Status</TableHead>
              {showDepartment && (
                <TableHead className='w-36'>Department</TableHead>
              )}
              <TableHead className='w-24 pr-4 text-right'>Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c) => {
              const ticket = formatTicketNumber(c.ticketNumber);
              return (
                <TableRow key={c.ticketNumber}>
                  <TableCell className='pl-4 font-medium text-muted-foreground'>
                    <Link
                      href={hrefFor(ticket)}
                      className='hover:text-primary hover:underline'
                    >
                      {ticket}
                    </Link>
                  </TableCell>
                  <TableCell className='max-w-0 whitespace-normal'>
                    <Link
                      href={hrefFor(ticket)}
                      className='font-medium hover:text-primary hover:underline'
                    >
                      {c.title}
                    </Link>
                    <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                      {c.category.name} · {c.location.name}
                      {c.locationDetail ? `, ${c.locationDetail}` : ''}
                    </p>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={c.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  {showDepartment && (
                    <TableCell className='text-sm'>
                      {c.department?.name ?? 'Unassigned'}
                    </TableCell>
                  )}
                  <TableCell
                    className='pr-4 text-right text-sm text-muted-foreground tabular-nums'
                    title={formatDateTime(c.createdAt)}
                  >
                    {formatAge(c.createdAt, now)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: the same cards as My complaints. */}
      <ul className='space-y-3 md:hidden'>
        {items.map((c) => (
          <ComplaintListItem
            key={c.ticketNumber}
            href={hrefFor(formatTicketNumber(c.ticketNumber))}
            ticketNumber={c.ticketNumber}
            title={c.title}
            status={c.status}
            priority={c.priority}
            categoryName={c.category.name}
            createdAt={c.createdAt}
          />
        ))}
      </ul>
    </>
  );
}
