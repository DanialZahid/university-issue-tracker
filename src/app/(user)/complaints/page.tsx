import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ClipboardList, FilePlus2, SearchX } from 'lucide-react';
import { getUserOpenCounts } from '@/db/complaint';
import { getFilterOptions, listQueue } from '@/db/manage';
import {
  DEFAULT_PAGE_SIZE,
  MINE_SIZE_COOKIE,
  PAGE_SIZES,
  queueFiltersSchema,
} from '@/schemas/queue-filters';
import { Button } from '@/ui/common/button';
import { EmptyState } from '@/ui/common/EmptyState';
import { PageNav } from '@/ui/common/PageNav';
import { ResultsBar } from '@/ui/common/ResultsBar';
import { MINE_STATUS_OPTIONS, QueueFilters, QueueTable } from '@/ui/manage';
import { VIEW_COOKIES, parseView } from '@/ui/shared/complaint/list-view';
import { Greeting, PageHeader } from '@/ui/shared/layout';
import { plural } from '@/utils/greeting';
import { withQuery } from '@/utils/query';
import { requireUser } from '@/utils/session';

export const metadata: Metadata = { title: 'My complaints' };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const toOption = (o: { id: string; name: string }) => ({
  value: o.id,
  label: o.name,
});

export default async function MyComplaintsPage({ searchParams }: Props) {
  const user = await requireUser();
  const raw = await searchParams;
  const store = await cookies();
  const flat = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const filters = queueFiltersSchema.parse({
    size: store.get(MINE_SIZE_COOKIE)?.value,
    ...flat,
    status: flat['status'] ?? 'ANY',
  });
  const view = parseView(store.get(VIEW_COOKIES.mine)?.value, 'cards');

  const [queue, open, options] = await Promise.all([
    listQueue({ submittedById: user.id }, filters, { newestFirst: true }),
    getUserOpenCounts(user.id),
    getFilterOptions(user),
  ]);

  const query = {
    status: filters.status === 'ANY' ? undefined : filters.status,
    priority: filters.priority,
    category: filters.category,
    location: filters.location,
    q: filters.q,
    from: filters.from,
    to: filters.to,
    sort: filters.sort,
    dir: filters.sort ? filters.dir : undefined,
    size: filters.size === DEFAULT_PAGE_SIZE ? undefined : String(filters.size),
  };
  const totalPages = Math.max(1, Math.ceil(queue.total / filters.size));
  if (filters.page > totalPages) {
    redirect(withQuery('/complaints', { ...query, page: totalPages }));
  }
  const filtered = Object.keys(flat).some((k) => !['page', 'size'].includes(k));
  const nothingYet = queue.total === 0 && !filtered;

  return (
    <>
      <Greeting
        name={user.name}
        summary={
          open.inProgress + open.pending === 0
            ? nothingYet
              ? 'Report an issue on campus and follow it here.'
              : 'You have no open complaints right now.'
            : [
                open.inProgress > 0 &&
                  `${plural(open.inProgress, 'complaint is', 'complaints are')} being worked on`,
                open.pending > 0 &&
                  `${
                    open.inProgress > 0
                      ? plural(open.pending, 'is', 'are')
                      : plural(open.pending, 'complaint is', 'complaints are')
                  } waiting to be picked up`,
              ]
                .filter(Boolean)
                .join(', ') + '.'
        }
      />
      <PageHeader
        title='My complaints'
        description='Track the issues you have reported.'
        icon={ClipboardList}
      />
      {nothingYet ? (
        <EmptyState
          icon={ClipboardList}
          title='No complaints yet'
          description='Report an issue on campus and follow its progress here.'
        >
          <Button asChild>
            <Link href='/complaints/new'>
              <FilePlus2 />
              Submit your first complaint
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className='space-y-4'>
          <QueueFilters
            categories={options.categories.map(toOption)}
            locations={options.locations.map(toOption)}
            departments={[]}
            statusOptions={MINE_STATUS_OPTIONS}
            defaultStatus='ANY'
          />
          <ResultsBar
            id='results'
            page={filters.page}
            pageSize={filters.size}
            total={queue.total}
            basePath='/complaints'
            query={query}
            sizes={PAGE_SIZES}
            defaultSize={DEFAULT_PAGE_SIZE}
            sizeCookie={MINE_SIZE_COOKIE}
            view={{ value: view, cookie: VIEW_COOKIES.mine }}
          />
          {queue.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title='No complaints match'
              description='Try a different status or clear the filters.'
            />
          ) : (
            <QueueTable
              view={view}
              basePath='/complaints'
              items={queue.items}
              showDepartment={false}
              sort={filters.sort}
              dir={filters.dir}
              query={query}
            />
          )}
          <PageNav
            page={filters.page}
            totalPages={totalPages}
            basePath='/complaints'
            query={query}
            anchor='results'
          />
        </div>
      )}
    </>
  );
}
