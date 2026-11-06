import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserOpenCounts, listUserComplaints } from '@/db/complaint';
import { Button } from '@/ui/common/button';
import { ClipboardList, FilePlus2 } from 'lucide-react';
import { PageNav } from '@/ui/common/PageNav';
import { ResultsBar } from '@/ui/common/ResultsBar';
import { cookies } from 'next/headers';
import {
  ComplaintCompactList,
  ComplaintListItem,
  ComplaintSimpleTable,
} from '@/ui/shared/complaint';
import { VIEW_COOKIES, parseView } from '@/ui/shared/complaint/list-view';
import { formatTicketNumber } from '@/utils/ticket';
import { PageHeader } from '@/ui/shared/layout/PageHeader';
import { Greeting } from '@/ui/shared/layout';
import { plural } from '@/utils/greeting';
import { requireUser } from '@/utils/session';
import { EmptyState } from '@/ui/common/EmptyState';
import { Metadata } from 'next';

type Props = { searchParams: Promise<{ page?: string }> };

export const metadata: Metadata = { title: 'My complaints' };

export default async function MyComplaintsPage({ searchParams }: Props) {
  const user = await requireUser();
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1);

  const [{ items, total, pageSize }, open] = await Promise.all([
    listUserComplaints(user.id, page),
    getUserOpenCounts(user.id),
  ]);
  const view = parseView(
    (await cookies()).get(VIEW_COOKIES.mine)?.value,
    'cards',
  );
  const rows = items.map((c) => ({
    ticketNumber: c.ticketNumber,
    title: c.title,
    status: c.status,
    priority: c.priority,
    categoryName: c.category.name,
    locationName: c.location.name,
    locationDetail: c.locationDetail,
    createdAt: c.createdAt,
    href: `/complaints/${formatTicketNumber(c.ticketNumber)}`,
  }));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) redirect(`/complaints?page=${totalPages}`);

  return (
    <>
      <Greeting
        name={user.name}
        summary={
          open.inProgress + open.pending === 0
            ? total === 0
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
      <div className='max-w-5xl space-y-4'>
        {items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title='No complaints yet'
            description='Report an issue on campus and you can follow its progress here.'
          >
            <Button asChild>
              <Link href='/complaints/new'>
                <FilePlus2 />
                Submit your first complaint
              </Link>
            </Button>
          </EmptyState>
        ) : (
          <>
            <ResultsBar
              id='results'
              page={page}
              pageSize={pageSize}
              total={total}
              basePath='/complaints'
              view={{ value: view, cookie: VIEW_COOKIES.mine }}
            />
            {view === 'table' ? (
              <ComplaintSimpleTable rows={rows} />
            ) : view === 'compact' ? (
              <ComplaintCompactList rows={rows} />
            ) : (
              <ul className='space-y-3'>
                {items.map((c) => (
                  <ComplaintListItem
                    key={c.ticketNumber}
                    ticketNumber={c.ticketNumber}
                    title={c.title}
                    status={c.status}
                    categoryName={c.category.name}
                    priority={c.priority}
                    createdAt={c.createdAt}
                  />
                ))}
              </ul>
            )}
            <PageNav
              page={page}
              totalPages={totalPages}
              basePath='/complaints'
              anchor='results'
            />
          </>
        )}
      </div>
    </>
  );
}
