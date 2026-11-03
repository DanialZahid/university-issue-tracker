import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/ui/common/button';

type Props = { page: number; totalPages: number; basePath: string };

export function PageNav({ page, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;
  const href = (p: number) => `${basePath}?page=${p}`;

  return (
    <nav
      aria-label='Pagination'
      className='flex items-center justify-between gap-2'
    >
      {page > 1 ? (
        <Button asChild variant='outline' size='sm'>
          <Link href={href(page - 1)}>
            <ChevronLeft />
            Previous
          </Link>
        </Button>
      ) : (
        <Button variant='outline' size='sm' disabled>
          <ChevronLeft />
          Previous
        </Button>
      )}
      <span className='text-sm text-muted-foreground'>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Button asChild variant='outline' size='sm'>
          <Link href={href(page + 1)}>
            Next
            <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button variant='outline' size='sm' disabled>
          Next
          <ChevronRight />
        </Button>
      )}
    </nav>
  );
}
