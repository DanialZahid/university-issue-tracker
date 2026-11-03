import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { priorityLabels } from '@/automation/priority-detection';
import { getComplaintForSubmitter } from '@/db/complaint';
import { Badge } from '@/ui/common/badge';
import { Button } from '@/ui/common/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';
import { ComplaintTimeline } from '@/ui/shared/complaint/ComplaintTimeline';
import { StatusBadge } from '@/ui/shared/complaint/StatusBadge';
import { PageHeader } from '@/ui/shared/layout/PageHeader';
import { formatDateTime } from '@/utils/date';
import { formatTicketNumber, parseTicketNumber } from '@/utils/ticket';
import { requireUser } from '@/utils/session';

type Props = { params: Promise<{ ticket: string }> };

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='mt-0.5 font-medium'>{children}</dd>
    </div>
  );
}

export default async function ComplaintDetailPage({ params }: Props) {
  const { ticket } = await params;
  const user = await requireUser();

  const ticketNumber = parseTicketNumber(ticket);
  if (ticketNumber === null) notFound();

  const complaint = await getComplaintForSubmitter(ticketNumber, user.id);
  if (!complaint) notFound();

  return (
    <>
      <PageHeader
        title={formatTicketNumber(complaint.ticketNumber)}
        description='Complaint details'
      />
      <div className='max-w-3xl space-y-6'>
        <Button asChild variant='ghost' size='sm' className='-ml-2'>
          <Link href='/complaints'>
            <ArrowLeft />
            Back to my complaints
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <CardTitle className='text-xl'>{complaint.title}</CardTitle>
              <StatusBadge status={complaint.status} />
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            <p className='text-sm whitespace-pre-wrap'>
              {complaint.description}
            </p>
            <dl className='grid gap-4 text-sm sm:grid-cols-2'>
              <Detail label='Category'>{complaint.category.name}</Detail>
              <Detail label='Handled by'>
                {complaint.department?.name ?? 'Not assigned yet'}
              </Detail>
              <Detail label='Location'>{complaint.location.name}</Detail>
              {complaint.locationDetail && (
                <Detail label='Room or details'>
                  {complaint.locationDetail}
                </Detail>
              )}
              <Detail label='Priority'>
                <Badge variant='outline'>
                  {priorityLabels[complaint.priority]}
                </Badge>
              </Detail>
              <Detail label='Submitted'>
                {formatDateTime(complaint.createdAt)}
              </Detail>
              {complaint.resolvedAt && (
                <Detail label='Resolved'>
                  {formatDateTime(complaint.resolvedAt)}
                </Detail>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <ComplaintTimeline events={complaint.auditLogs} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
