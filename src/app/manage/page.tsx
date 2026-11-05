import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Inbox, LayoutDashboard, ArrowRightLeft, X } from 'lucide-react';
import Link from 'next/link';
import {
  getFilterOptions,
  getForwardDestination,
  getQueueCounts,
  listQueue,
  managerScope,
} from '@/db/manage';
import { UserRole } from '@/generated/prisma/enums';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  queueFiltersSchema,
} from '@/schemas/queue-filters';
import { ResultsBar } from '@/ui/common/ResultsBar';
import { CopyButton } from '@/ui/common/CopyButton';
import { EmptyState } from '@/ui/common/EmptyState';
import { PageNav } from '@/ui/common/PageNav';
import { PageHeader } from '@/ui/shared/layout';
import { QueueFilters, QueueStats, QueueTable } from '@/ui/manage';
import { withQuery } from '@/utils/query';
import { requireManager } from '@/utils/session';
import { Hint } from '@/ui/common/Hint';
import { DepartmentIcon } from '@/ui/shared/department';
import { Alert, AlertDescription, AlertTitle } from '@/ui/common/alert';
import { formatTicketNumber, parseTicketNumber } from '@/utils/ticket';

export const metadata: Metadata = { title: 'Department dashboard' };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DepartmentDashboardPage({ searchParams }: Props) {
  const user = await requireManager();
  const raw = await searchParams;
  const forwardedParam = raw['forwarded'];
  const forwarded =
    typeof forwardedParam === 'string'
      ? parseTicketNumber(forwardedParam)
      : null;
  const filters = queueFiltersSchema.parse(
    Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
    ),
  );

  const isSuperuser = user.role === UserRole.SUPERUSER;
  const scope = managerScope(user, filters.department);

  const [counts, queue, options, forwardedTo] = await Promise.all([
    getQueueCounts(scope, filters),
    listQueue(scope, filters),
    getFilterOptions(user),
    forwarded !== null ? getForwardDestination(forwarded, user.id) : null,
  ]);

  // Filters kept in links and pagination (defaults left out).
  const query = {
    status: filters.status === 'OPEN' ? undefined : filters.status,
    priority: filters.priority,
    category: filters.category,
    location: filters.location,
    department: isSuperuser ? filters.department : undefined,
    q: filters.q || undefined,
    from: filters.from,
    to: filters.to,
    sort: filters.sort,
    dir: filters.sort ? filters.dir : undefined,
    size: filters.size === DEFAULT_PAGE_SIZE ? undefined : String(filters.size),
  };

  const totalPages = Math.max(1, Math.ceil(queue.total / filters.size));
  // An invalid or default ?size= falls back to 25: tidy the address to match.
  const rawSize = raw['size'];
  if (typeof rawSize === 'string' && rawSize !== query.size) {
    redirect(
      withQuery('/manage', {
        ...query,
        page: filters.page > 1 ? filters.page : undefined,
      }),
    );
  }

  if (filters.page > totalPages) {
    redirect(
      withQuery('/manage', {
        ...query,
        page: totalPages > 1 ? totalPages : undefined,
      }),
    );
  }

  const scopeLabel = isSuperuser
    ? (options.departments.find((d) => d.id === filters.department)?.name ??
      'All departments')
    : (options.departments[0]?.name ?? 'No department assigned');

  const toOption = (o: { id: string; name: string }) => ({
    value: o.id,
    label: o.name,
  });

  return (
    <>
      <PageHeader
        icon={LayoutDashboard}
        title='Department dashboard'
        description='Track and act on incoming complaints.'
        actions={
          <Hint label='Complaints shown on this dashboard'>
            <span className='inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary'>
              <DepartmentIcon name={scopeLabel} className='size-4' />
              {scopeLabel}
            </span>
          </Hint>
        }
      />
      <div className='space-y-6'>
        {forwarded !== null && (
          <Alert className='relative border-sky-600/20 bg-sky-50/60 pr-12'>
            <ArrowRightLeft className='text-sky-700' />
            <AlertTitle>Complaint forwarded</AlertTitle>
            <AlertDescription>
              <p className='flex flex-wrap items-center gap-x-1'>
                <span className='inline-flex items-center font-medium text-foreground'>
                  {formatTicketNumber(forwarded)}
                  <CopyButton
                    value={formatTicketNumber(forwarded)}
                    label='Copy ticket number'
                    className='size-7'
                  />
                </span>
                is now with{' '}
                <span className='font-medium text-foreground'>
                  {forwardedTo ?? 'another department'}
                </span>{' '}
                and no longer appears here.
              </p>
            </AlertDescription>
            <Link
              href={withQuery('/manage', query)}
              aria-label='Dismiss'
              className='absolute top-3 right-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
            >
              <X className='size-4' />
            </Link>
          </Alert>
        )}

        <QueueStats
          counts={counts}
          query={query}
          active={{ status: filters.status, priority: filters.priority }}
        />
        <QueueFilters
          categories={options.categories.map(toOption)}
          locations={options.locations.map(toOption)}
          departments={isSuperuser ? options.departments.map(toOption) : []}
        />
        {queue.items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title='No complaints here'
            description='Nothing matches these filters. Try a different status or clear the filters.'
          />
        ) : (
          <>
            <ResultsBar
              id='results'
              page={filters.page}
              pageSize={filters.size}
              total={queue.total}
              basePath='/manage'
              query={query}
              sizes={PAGE_SIZES}
              defaultSize={DEFAULT_PAGE_SIZE}
            />
            <QueueTable
              items={queue.items}
              showDepartment={isSuperuser}
              sort={filters.sort}
              dir={filters.dir}
              query={query}
            />
            <PageNav
              page={filters.page}
              totalPages={totalPages}
              basePath='/manage'
              query={query}
              anchor='results'
            />
          </>
        )}
      </div>
    </>
  );
}
