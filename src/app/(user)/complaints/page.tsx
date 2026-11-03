import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listUserComplaints } from '@/db/complaint';
import { Button } from '@/ui/common/button';
import { Card, CardContent } from '@/ui/common/card';
import { PageNav } from '@/ui/common/PageNav';
import { ComplaintListItem } from '@/ui/shared/complaint/ComplaintListItem';
import { PageHeader } from '@/ui/shared/layout/PageHeader';
import { requireUser } from '@/utils/session';
import { Metadata } from 'next';

type Props = { searchParams: Promise<{ page?: string }> };

export const metadata: Metadata = { title: 'My complaints' };

export default async function MyComplaintsPage({ searchParams }: Props) {
  const user = await requireUser();
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1);

  const { items, total, pageSize } = await listUserComplaints(user.id, page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) redirect(`/complaints?page=${totalPages}`);

  return (
    <>
      <PageHeader
        title='My complaints'
        description='Track the issues you have reported.'
      />
      <div className='max-w-3xl space-y-4'>
        {items.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-start gap-3'>
              <p className='font-medium'>No complaints yet</p>
              <p className='text-sm text-muted-foreground'>
                Report an issue on campus and you can follow its progress here.
              </p>
              <Button asChild>
                <Link href='/complaints/new'>Submit your first complaint</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <ul className='space-y-3'>
              {items.map((c) => (
                <ComplaintListItem
                  key={c.ticketNumber}
                  ticketNumber={c.ticketNumber}
                  title={c.title}
                  status={c.status}
                  categoryName={c.category.name}
                  createdAt={c.createdAt}
                />
              ))}
            </ul>
            <PageNav
              page={page}
              totalPages={totalPages}
              basePath='/complaints'
            />
          </>
        )}
      </div>
    </>
  );
}
