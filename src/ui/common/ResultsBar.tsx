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
};

// "Showing 26–50 of 3,509", rows per page and quick previous/next above a list.
export function ResultsBar({
  id,
  page,
  pageSize,
  total,
  basePath,
  query,
  sizes,
  defaultSize,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
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
      <p className='text-sm text-muted-foreground'>
        Showing{' '}
        <span className='font-medium text-foreground tabular-nums'>
          {first.toLocaleString('en-US')}–{last.toLocaleString('en-US')}
        </span>{' '}
        of{' '}
        <span className='font-medium text-foreground tabular-nums'>
          {total.toLocaleString('en-US')}
        </span>
      </p>
      <div className='flex items-center gap-3'>
        {sizes && defaultSize && (
          <label className='flex items-center gap-2 text-sm text-muted-foreground'>
            Rows
            <PageSizeSelect
              value={pageSize}
              sizes={sizes}
              fallback={defaultSize}
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
