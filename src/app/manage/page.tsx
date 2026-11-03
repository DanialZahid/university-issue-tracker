import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Building2, Inbox, LayoutDashboard } from 'lucide-react';
import {
  QUEUE_PAGE_SIZE,
  getFilterOptions,
  getQueueCounts,
  listQueue,
  managerScope,
} from '@/db/manage';
import { UserRole } from '@/generated/prisma/enums';
import { queueFiltersSchema } from '@/schemas/queue-filters';
import { EmptyState } from '@/ui/common/EmptyState';
import { PageNav } from '@/ui/common/PageNav';
import { PageHeader } from '@/ui/shared/layout';
import { QueueFilters, QueueStats, QueueTable } from '@/ui/manage';
import { withQuery } from '@/utils/query';
import { requireManager } from '@/utils/session';

export const metadata: Metadata = { title: 'Department dashboard' };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DepartmentDashboardPage({ searchParams }: Props) {
  const user = await requireManager();
  const raw = await searchParams;
  const filters = queueFiltersSchema.parse(
    Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
    ),
  );

  const isSuperuser = user.role === UserRole.SUPERUSER;
  const scope = managerScope(user, filters.department);

  const [counts, queue, options] = await Promise.all([
    getQueueCounts(scope),
    listQueue(scope, filters),
    getFilterOptions(user),
  ]);

  // Filters kept in links and pagination (defaults left out).
  const query = {
    status: filters.status === 'OPEN' ? undefined : filters.status,
    priority: filters.priority,
    category: filters.category,
    department: isSuperuser ? filters.department : undefined,
    q: filters.q || undefined,
  };

  const totalPages = Math.max(1, Math.ceil(queue.total / QUEUE_PAGE_SIZE));
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
          <span className='inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary'>
            <Building2 className='size-4' />
            {scopeLabel}
          </span>
        }
      />
      <div className='space-y-6'>
        <QueueStats counts={counts} department={query.department} />
        <QueueFilters
          categories={options.categories.map(toOption)}
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
            <p className='text-sm text-muted-foreground'>
              {queue.total.toLocaleString('en-US')} complaints
            </p>
            <QueueTable items={queue.items} showDepartment={isSuperuser} />
            <PageNav
              page={filters.page}
              totalPages={totalPages}
              basePath='/manage'
              query={query}
            />
          </>
        )}
      </div>
    </>
  );
}
