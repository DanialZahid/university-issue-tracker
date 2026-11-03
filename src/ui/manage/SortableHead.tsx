import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { SortKey } from '@/schemas/queue-filters';
import { TableHead } from '@/ui/common/table';
import { cn } from '@/utils/cn';
import { withQuery } from '@/utils/query';

type Dir = 'asc' | 'desc';

type Props = {
  label: string;
  column: SortKey;
  firstDir: Dir;
  sort?: SortKey;
  dir?: Dir;
  query: Record<string, string | undefined>;
  align?: 'left' | 'right';
  className?: string;
};

export function SortableHead({
  label,
  column,
  firstDir,
  sort,
  dir,
  query,
  align = 'left',
  className,
}: Props) {
  const active = sort === column;
  const current: Dir | undefined = active ? (dir ?? 'asc') : undefined;
  const nextDir: Dir = active ? (current === 'asc' ? 'desc' : 'asc') : firstDir;
  const Icon = !active ? ArrowUpDown : current === 'asc' ? ArrowUp : ArrowDown;

  return (
    <TableHead
      className={className}
      aria-sort={
        active ? (current === 'asc' ? 'ascending' : 'descending') : 'none'
      }
    >
      <Link
        href={withQuery('/manage', { ...query, sort: column, dir: nextDir })}
        scroll={false}
        className={cn(
          'inline-flex items-center gap-1 rounded transition-colors hover:text-foreground',
          align === 'right' && 'flex-row-reverse',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
        <Icon className={cn('size-3.5', !active && 'opacity-50')} />
      </Link>
    </TableHead>
  );
}
