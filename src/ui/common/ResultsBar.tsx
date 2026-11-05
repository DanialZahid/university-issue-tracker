import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { pageHref } from './PageNav';
import { PageSizeSelect } from './PageSizeSelect';

type Props = {
  id: string;
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  query?: Record<string, string | number | undefined>;
  sizes?: readonly number[];
  defaultSize?: number;
  noun?: [singular: string, plural: string];
  sizeCookie?: string;
};

// "6,051 complaints · Page 2 of 243", rows per page and quick previous/next.
export function ResultsBar({
  id,
  page,
  pageSize,
  total,
  basePath,
  query,
  sizes,
  defaultSize,
  noun = ['complaint', 'complaints'],
  sizeCookie,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const step = (p: number, label: string, Icon: typeof ChevronLeft) => {
    const enabled = p >= 1 && p <= totalPages && p !== page;
    const cls = cn(
      'inline-flex size-8 items-center justify-center rounded-lg border bg-card',
      enabled ? 'hover:bg-muted' : 'pointer-events-none opacity-40',
    );
    return enabled ? (
      <Link
        href={pageHref(basePath, query, p, id)}
        aria-label={label}
        className={cls}
      >
        <Icon className='size-4' />
      </Link>
    ) : (
      <span aria-hidden='true' className={cls}>
        <Icon className='size-4' />
      </span>
    );
  };

  return (
    <div
      id={id}
      className='flex scroll-mt-20 flex-wrap items-center justify-between gap-3'
    >
      <p className='flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground'>
        <span>
          <span className='font-semibold text-foreground tabular-nums'>
            {total.toLocaleString('en-US')}
          </span>{' '}
          {total === 1 ? noun[0] : noun[1]}
        </span>
        {totalPages > 1 && (
          <>
            <span aria-hidden='true'>·</span>
            <span className='tabular-nums'>
              Page {page} of {totalPages.toLocaleString('en-US')}
            </span>
          </>
        )}
      </p>
      <div className='flex items-center gap-3'>
        {sizes && defaultSize && (
          <label className='flex items-center gap-2 text-sm text-muted-foreground'>
            Rows
            <PageSizeSelect
              value={pageSize}
              sizes={sizes}
              fallback={defaultSize}
              cookie={sizeCookie}
            />
          </label>
        )}
        {totalPages > 1 && (
          <div className='flex items-center gap-1'>
            {step(page - 1, 'Previous page', ChevronLeft)}
            {step(page + 1, 'Next page', ChevronRight)}
          </div>
        )}
      </div>
    </div>
  );
}
