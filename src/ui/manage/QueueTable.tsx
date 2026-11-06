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
  ComplaintCompactList,
  ComplaintListItem,
  PriorityBadge,
  StatusBadge,
} from '@/ui/shared/complaint';
import type { ListView } from '@/ui/shared/complaint/list-view';
import { TruncatedText } from '@/ui/common/TruncatedText';
import { DepartmentIcon } from '@/ui/shared/department';
import { formatAge, formatDateTime } from '@/utils/date';
import { withQuery } from '@/utils/query';
import { cn } from '@/utils/cn';
import { formatTicketNumber } from '@/utils/ticket';
import { SortableHead } from './SortableHead';

type Props = {
  items: QueueItem[];
  showDepartment: boolean;
  sort?: SortKey;
  dir?: 'asc' | 'desc';
  query: Record<string, string | undefined>;
  view: ListView;
};

export function QueueTable({
  items,
  showDepartment,
  sort,
  dir,
  query,
  view,
}: Props) {
  // Carry the current filters so the complaint page can link back to them.
  const back = withQuery('', query).slice(1) || undefined;
  const hrefFor = (ticket: string) =>
    withQuery(`/manage/complaints/${ticket}`, { back });
  const now = new Date();
  const sortProps = { sort, dir, query };

  const cards = (className?: string) => (
    <ul className={cn('space-y-3', className)}>
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
  );

  if (view === 'cards') return cards();
  if (view === 'compact') {
    return (
      <ComplaintCompactList
        rows={items.map((c) => ({
          ticketNumber: c.ticketNumber,
          title: c.title,
          status: c.status,
          priority: c.priority,
          categoryName: c.category.name,
          locationName: c.location.name,
          locationDetail: c.locationDetail,
          createdAt: c.createdAt,
          href: hrefFor(formatTicketNumber(c.ticketNumber)),
        }))}
      />
    );
  }

  return (
    <>
      {/* Desktop: table for scanning many rows. */}
      {/* overflow-clip (not hidden) keeps the rounded corners without breaking the sticky header. */}
      <div className='hidden overflow-clip rounded-xl border bg-card md:block [&_[data-slot=table-container]]:overflow-visible'>
        <Table>
          <TableHeader className='sticky top-14 z-10 bg-card shadow-[0_1px_0_var(--border)]'>
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
                    <TruncatedText className='mt-0.5 text-xs text-muted-foreground'>
                      {c.category.name} · {c.location.name}
                      {c.locationDetail ? `, ${c.locationDetail}` : ''}
                    </TruncatedText>
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

      {/* Phones: the table becomes cards. */}
      {cards('md:hidden')}
    </>
  );
}
