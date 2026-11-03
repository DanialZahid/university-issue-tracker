import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Archive,
  ArrowLeft,
  History as HistoryIcon,
  Settings2,
  Ticket,
  UserRound,
} from 'lucide-react';
import { getComplaintForManager } from '@/db/manage';
import { Button } from '@/ui/common/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';
import {
  ComplaintSummary,
  ComplaintTimeline,
  DetailItem,
} from '@/ui/shared/complaint';
import { PageHeader } from '@/ui/shared/layout';
import { ComplaintActions } from '@/ui/manage';
import { formatDateTime } from '@/utils/date';
import { requireManager } from '@/utils/session';
import { formatTicketNumber, parseTicketNumber } from '@/utils/ticket';

type Props = { params: Promise<{ ticket: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticket } = await params;
  const number = parseTicketNumber(ticket);
  return { title: number === null ? 'Complaint' : formatTicketNumber(number) };
}

export default async function ManageComplaintPage({ params }: Props) {
  const { ticket } = await params;
  const user = await requireManager();

  const ticketNumber = parseTicketNumber(ticket);
  if (ticketNumber === null) notFound();

  const complaint = await getComplaintForManager(ticketNumber, user);
  if (!complaint) notFound();

  return (
    <>
      <PageHeader
        title={formatTicketNumber(complaint.ticketNumber)}
        description='Review and update this complaint.'
        icon={Ticket}
      />
      <Button asChild variant='ghost' size='sm' className='mb-4 -ml-2'>
        <Link href='/manage'>
          <ArrowLeft />
          Back to dashboard
        </Link>
      </Button>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='space-y-6'>
          <ComplaintSummary complaint={complaint}>
            <DetailItem icon={UserRound} label='Submitted by'>
              {complaint.submittedBy.name}
              <span className='block text-xs font-normal text-muted-foreground'>
                {complaint.submittedBy.email}
              </span>
            </DetailItem>
            {complaint.archivedAt && (
              <DetailItem icon={Archive} label='Archived'>
                {formatDateTime(complaint.archivedAt)}
              </DetailItem>
            )}
          </ComplaintSummary>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <HistoryIcon className='size-4' />
                Audit trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComplaintTimeline events={complaint.auditLogs} showActor />
            </CardContent>
          </Card>
        </div>

        <aside className='space-y-6 lg:sticky lg:top-6 lg:self-start'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings2 className='size-4' />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComplaintActions
                ticketNumber={complaint.ticketNumber}
                status={complaint.status}
                priority={complaint.priority}
                archived={complaint.archivedAt !== null}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
