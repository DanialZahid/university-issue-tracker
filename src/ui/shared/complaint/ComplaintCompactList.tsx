import Link from 'next/link';
import { Hint } from '@/ui/common/Hint';
import { TruncatedText } from '@/ui/common/TruncatedText';
import { cn } from '@/utils/cn';
import { formatAge, formatDateTime } from '@/utils/date';
import { formatTicketNumber } from '@/utils/ticket';
import type { ComplaintRow } from './list-view';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { statusTone } from './status-tone';

// One dense line per complaint: the middle ground between cards and table.
export function ComplaintCompactList({ rows }: { rows: ComplaintRow[] }) {
  const now = new Date();
  return (
    <ul className='divide-y overflow-clip rounded-xl border bg-card'>
      {rows.map((c) => {
        const where = `${c.categoryName} · ${c.locationName}${c.locationDetail ? `, ${c.locationDetail}` : ''}`;
        return (
          <li key={c.ticketNumber}>
            <Link
              href={c.href}
              className='relative flex items-center gap-3 py-2.5 pr-4 pl-5 text-sm transition-colors outline-none hover:bg-accent/40 focus-visible:bg-accent/40'
            >
              <span
                aria-hidden='true'
                className={cn(
                  'absolute inset-y-0 left-0 w-1',
                  statusTone[c.status].bar,
                )}
              />
              <span className='w-20 shrink-0 text-muted-foreground tabular-nums'>
                {formatTicketNumber(c.ticketNumber)}
              </span>
              <span className='min-w-0 flex-1 font-medium'>
                <TruncatedText>{c.title}</TruncatedText>
              </span>
              <span className='hidden w-56 min-w-0 text-xs text-muted-foreground lg:block'>
                <TruncatedText>{where}</TruncatedText>
              </span>
              <span className='hidden w-24 shrink-0 sm:block'>
                <PriorityBadge priority={c.priority} />
              </span>
              <span className='w-28 shrink-0'>
                <StatusBadge status={c.status} />
              </span>
              <Hint label={formatDateTime(c.createdAt)}>
                <span className='hidden w-16 shrink-0 text-right text-muted-foreground tabular-nums sm:block'>
                  {formatAge(c.createdAt, now)}
                </span>
              </Hint>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
