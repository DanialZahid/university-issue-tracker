import Link from 'next/link';
import { Hint } from '@/ui/common/Hint';
import { TruncatedText } from '@/ui/common/TruncatedText';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/common/table';
import { formatDate, formatDateTime } from '@/utils/date';
import { formatTicketNumber } from '@/utils/ticket';
import type { ComplaintRow } from './list-view';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

// The table view for My complaints (no sorting: the list is newest first).
export function ComplaintSimpleTable({ rows }: { rows: ComplaintRow[] }) {
  return (
    <div className='overflow-clip rounded-xl border bg-card [&_[data-slot=table-container]]:overflow-visible'>
      <Table>
        <TableHeader className='sticky top-14 z-10 bg-card shadow-[0_1px_0_var(--border)]'>
          <TableRow className='bg-muted/50 hover:bg-muted/50'>
            <TableHead className='w-28 pl-4'>Ticket</TableHead>
            <TableHead>Complaint</TableHead>
            <TableHead className='hidden w-28 sm:table-cell'>
              Priority
            </TableHead>
            <TableHead className='w-32'>Status</TableHead>
            <TableHead className='hidden w-32 pr-4 text-right md:table-cell'>
              Submitted
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => {
            const ticket = formatTicketNumber(c.ticketNumber);
            return (
              <TableRow key={c.ticketNumber}>
                <TableCell className='pl-4 font-medium text-muted-foreground'>
                  <Link
                    href={c.href}
                    className='hover:text-primary hover:underline'
                  >
                    {ticket}
                  </Link>
                </TableCell>
                <TableCell className='max-w-0'>
                  <Link
                    href={c.href}
                    className='font-medium hover:text-primary hover:underline'
                  >
                    <TruncatedText>{c.title}</TruncatedText>
                  </Link>
                  <TruncatedText className='mt-0.5 text-xs text-muted-foreground'>
                    {c.categoryName} · {c.locationName}
                    {c.locationDetail ? `, ${c.locationDetail}` : ''}
                  </TruncatedText>
                </TableCell>
                <TableCell className='hidden sm:table-cell'>
                  <PriorityBadge priority={c.priority} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell className='hidden pr-4 text-right text-sm text-muted-foreground md:table-cell'>
                  <Hint label={formatDateTime(c.createdAt)}>
                    <span>{formatDate(c.createdAt)}</span>
                  </Hint>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
