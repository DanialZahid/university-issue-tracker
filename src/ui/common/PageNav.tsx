import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
} from 'lucide-react';
import { Hint } from '@/ui/common/Hint';
import { cn } from '@/utils/cn';
import { withQuery } from '@/utils/query';

type Query = Record<string, string | number | undefined>;

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Query;
  // Element id to scroll to after changing page (the top of the results).
  anchor?: string;
};

export function pageHref(
  basePath: string,
  query: Query | undefined,
  page: number,
  anchor?: string,
) {
  const href = withQuery(basePath, {
    ...query,
    page: page > 1 ? page : undefined,
  });
  return anchor ? `${href}#${anchor}` : href;
}

// 1 … 4 5 [6] 7 8 … 141: first, last and the pages around the current one.
function pageItems(page: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, page - 1, page, page + 1]);
  if (page <= 4) [2, 3, 4, 5].forEach((p) => pages.add(p));
  if (page >= total - 3) [1, 2, 3, 4].forEach((n) => pages.add(total - n));
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const items: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push('gap');
    items.push(p);
  });
  return items;
}

const circle =
  'inline-flex size-9 items-center justify-center rounded-full text-sm font-medium tabular-nums transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

function StepLink({
  icon: Icon,
  label,
  href,
}: {
  icon: LucideIcon;
  label: string;
  href: string | null;
}) {
  if (!href) {
    return (
      <span
        aria-hidden='true'
        className={cn(circle, 'text-muted-foreground/40')}
      >
        <Icon className='size-4' />
      </span>
    );
  }
  return (
    <Hint label={label}>
      <Link
        href={href}
        aria-label={label}
        className={cn(
          circle,
          'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Icon className='size-4' />
      </Link>
    </Hint>
  );
}

export function PageNav({ page, totalPages, basePath, query, anchor }: Props) {
  if (totalPages <= 1) return null;
  const href = (p: number) => pageHref(basePath, query, p, anchor);
  const prev = page > 1 ? href(page - 1) : null;
  const next = page < totalPages ? href(page + 1) : null;

  return (
    <nav
      aria-label='Pagination'
      className='flex items-center justify-center gap-1'
    >
      <StepLink
        icon={ChevronsLeft}
        label='First page'
        href={page > 1 ? href(1) : null}
      />
      <StepLink icon={ChevronLeft} label='Previous page' href={prev} />

      {/* Wider screens: numbered pages. */}
      <ol className='hidden items-center gap-1 sm:flex'>
        {pageItems(page, totalPages).map((item, i) =>
          item === 'gap' ? (
            <li
              key={`gap-${i}`}
              aria-hidden='true'
              className='w-6 text-center text-muted-foreground'
            >
              …
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span
                  aria-current='page'
                  className={cn(
                    circle,
                    'bg-primary text-primary-foreground shadow-sm',
                  )}
                >
                  {item}
                </span>
              ) : (
                <Link
                  href={href(item)}
                  aria-label={`Page ${item}`}
                  className={cn(circle, 'text-foreground hover:bg-muted')}
                >
                  {item}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>

      {/* Phones: compact counter. */}
      <span className='px-2 text-sm text-muted-foreground sm:hidden'>
        Page {page} of {totalPages}
      </span>

      <StepLink icon={ChevronRight} label='Next page' href={next} />
      <StepLink
        icon={ChevronsRight}
        label='Last page'
        href={page < totalPages ? href(totalPages) : null}
      />
    </nav>
  );
}
