import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Archive,
  ArrowLeft,
  History as HistoryIcon,
  Settings2,
  MessageSquareWarning,
  UserRound,
} from 'lucide-react';
import { getComplaintForManager, listDepartments } from '@/db/manage';
import { Button } from '@/ui/common/button';
import { CopyButton } from '@/ui/common/CopyButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';
import { Separator } from '@/ui/common/separator';
import {
  ComplaintSummary,
  ComplaintTimeline,
  DetailItem,
} from '@/ui/shared/complaint';
import { PageHeader } from '@/ui/shared/layout';
import {
  ArchiveControl,
  ComplaintActions,
  ComplaintChecks,
  ForwardForm,
  NoteForm,
} from '@/ui/manage';
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

  const [complaint, departments] = await Promise.all([
    getComplaintForManager(ticketNumber, user),
    listDepartments(),
  ]);

  if (!complaint) notFound();

  const archived = complaint.archivedAt !== null;

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
        description='Review and update this complaint.'
        icon={MessageSquareWarning}
      />
      <Button asChild variant='ghost' size='sm' className='mb-4 -ml-2'>
        <Link href='/manage'>
          <ArrowLeft />
          Back to dashboard
        </Link>
      </Button>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='space-y-6'>
          <ComplaintSummary complaint={complaint}>
            <DetailItem icon={UserRound} label='Submitted by'>
              {complaint.submittedBy.name}
              <span className='block text-sm font-normal text-muted-foreground'>
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
                <HistoryIcon className='size-5' />
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
                <Settings2 className='size-5' />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <ComplaintActions
                ticketNumber={complaint.ticketNumber}
                status={complaint.status}
                priority={complaint.priority}
                archived={archived}
              />
              <Separator />
              <ForwardForm
                ticketNumber={complaint.ticketNumber}
                currentDepartmentId={complaint.department?.id ?? ''}
                departments={departments}
                disabled={archived}
              />
              <Separator />
              <NoteForm ticketNumber={complaint.ticketNumber} />
              <Separator />
              <ArchiveControl
                ticketNumber={complaint.ticketNumber}
                archived={archived}
                resolved={complaint.status === 'RESOLVED'}
              />
            </CardContent>
          </Card>

          <ComplaintChecks />
        </aside>
      </div>
    </>
  );
}
