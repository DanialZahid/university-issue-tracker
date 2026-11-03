import Link from 'next/link';
import type { QueueItem } from '@/db/manage';
import type { SortKey } from '@/schemas/queue-filters';
import { Hint } from '@/ui/common/Hint';
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
import { DepartmentIcon } from '@/ui/shared/department';
import { formatAge, formatDateTime } from '@/utils/date';
import { formatTicketNumber } from '@/utils/ticket';
import { SortableHead } from './SortableHead';

type Props = {
  items: QueueItem[];
  showDepartment: boolean;
  sort?: SortKey;
  dir?: 'asc' | 'desc';
  query: Record<string, string | undefined>;
};

const hrefFor = (ticket: string) => `/manage/complaints/${ticket}`;

export function QueueTable({ items, showDepartment, sort, dir, query }: Props) {
  const now = new Date();
  const sortProps = { sort, dir, query };

  return (
    <>
      {/* Desktop: table for scanning many rows. */}
      <div className='hidden overflow-hidden rounded-xl border bg-card md:block'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50 hover:bg-muted/50'>
              <SortableHead
                label='Ticket'
                column='ticket'
                firstDir='asc'
                className='w-28 pl-4'
                {...sortProps}
              />
              <TableHead>Complaint</TableHead>
              <SortableHead
                label='Priority'
                column='priority'
                firstDir='desc'
                className='w-28'
                {...sortProps}
              />
              <SortableHead
                label='Status'
                column='status'
                firstDir='asc'
                className='w-32'
                {...sortProps}
              />
              {showDepartment && (
                <SortableHead
                  label='Department'
                  column='department'
                  firstDir='asc'
                  className='w-40'
                  {...sortProps}
                />
              )}
              <SortableHead
                label='Age'
                column='age'
                firstDir='desc'
                align='right'
                className='w-24 pr-4 text-right'
                {...sortProps}
              />
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
                      {c.department ? (
                        <span className='inline-flex items-center gap-1.5'>
                          <DepartmentIcon
                            name={c.department.name}
                            className='size-3.5 text-muted-foreground'
                          />
                          {c.department.name}
                        </span>
                      ) : (
                        'Unassigned'
                      )}
                    </TableCell>
                  )}
                  <TableCell className='pr-4 text-right text-sm text-muted-foreground tabular-nums'>
                    <Hint label={formatDateTime(c.createdAt)}>
                      <span>{formatAge(c.createdAt, now)}</span>
                    </Hint>
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
