import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  History as HistoryIcon,
  MessageSquareWarning,
} from 'lucide-react';
import { getComplaintForSubmitter } from '@/db/complaint';
import { Button } from '@/ui/common/button';
import { CopyButton } from '@/ui/common/CopyButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';
import {
  ComplaintSummary,
  ComplaintTimeline,
  SubmittedBanner,
} from '@/ui/shared/complaint';
import { PageHeader } from '@/ui/shared/layout';
import { ResolvedCelebration } from '@/ui/motion';
import { requireUser } from '@/utils/session';
import { formatTicketNumber, parseTicketNumber } from '@/utils/ticket';

type Props = {
  params: Promise<{ ticket: string }>;
  searchParams: Promise<{ submitted?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticket } = await params;
  const number = parseTicketNumber(ticket);
  return { title: number === null ? 'Complaint' : formatTicketNumber(number) };
}

export default async function ComplaintDetailPage({
  params,
  searchParams,
}: Props) {
  const { ticket } = await params;
  const { submitted } = await searchParams;
  const user = await requireUser();

  const ticketNumber = parseTicketNumber(ticket);
  if (ticketNumber === null) notFound();

  const complaint = await getComplaintForSubmitter(ticketNumber, user.id);
  if (!complaint) notFound();

  return (
    <>
      <PageHeader
        title={formatTicketNumber(complaint.ticketNumber)}
        titleAction={
          <CopyButton
            value={formatTicketNumber(complaint.ticketNumber)}
            label='Copy ticket number'
          />
        }
        description='Complaint details'
        icon={MessageSquareWarning}
      />
      <div className='space-y-6'>
        {submitted === '1' ? (
          <SubmittedBanner department={complaint.department?.name} />
        ) : (
          <Button asChild variant='ghost' size='sm' className='-ml-2'>
            <Link href='/complaints'>
              <ArrowLeft />
              Back to my complaints
            </Link>
          </Button>
        )}

        <div className='grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]'>
          <ComplaintSummary complaint={complaint} />
          {complaint.status === 'RESOLVED' && (
            <ResolvedCelebration
              ticket={formatTicketNumber(complaint.ticketNumber)}
            />
          )}

          <Card className='xl:sticky xl:top-20'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <HistoryIcon className='size-5' />
                History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComplaintTimeline events={complaint.auditLogs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
