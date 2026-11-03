import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  Flag,
  History as HistoryIcon,
  MapPin,
  Tag,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { getComplaintForSubmitter } from '@/db/complaint';
import { Button } from '@/ui/common/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';
import {
  ComplaintTimeline,
  PriorityBadge,
  StatusBadge,
  statusTone,
} from '@/ui/shared/complaint';
import { PageHeader } from '@/ui/shared/layout/PageHeader';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/date';
import { requireUser } from '@/utils/session';
import { formatTicketNumber, parseTicketNumber } from '@/utils/ticket';
import { departmentIcon } from '@/ui/shared/department';

type Props = { params: Promise<{ ticket: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticket } = await params;
  const number = parseTicketNumber(ticket);
  return { title: number === null ? 'Complaint' : formatTicketNumber(number) };
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex items-start gap-3'>
      <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
        <Icon className='size-4' />
      </span>
      <div>
        <dt className='text-xs text-muted-foreground'>{label}</dt>
        <dd className='mt-0.5 text-sm font-medium'>{children}</dd>
      </div>
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
        icon={Ticket}
      />
      <div className='max-w-3xl space-y-6'>
        <Button asChild variant='ghost' size='sm' className='-ml-2'>
          <Link href='/complaints'>
            <ArrowLeft />
            Back to my complaints
          </Link>
        </Button>

        <div className='overflow-hidden rounded-xl border bg-card'>
          <div className={cn('h-1.5', statusTone[complaint.status].bar)} />
          <div className='space-y-6 p-6'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <h2 className='text-xl font-semibold'>{complaint.title}</h2>
              <StatusBadge status={complaint.status} />
            </div>

            <p className='rounded-lg bg-muted/40 p-4 text-sm whitespace-pre-wrap'>
              {complaint.description}
            </p>

            <dl className='grid gap-5 sm:grid-cols-2'>
              <Detail icon={Tag} label='Category'>
                {complaint.category.name}
              </Detail>
              <Detail
                icon={departmentIcon(complaint.department?.name)}
                label='Handled by'
              >
                {complaint.department?.name ?? 'Not assigned yet'}
              </Detail>
              <Detail icon={MapPin} label='Location'>
                {complaint.location.name}
              </Detail>
              {complaint.locationDetail && (
                <Detail icon={DoorOpen} label='Room'>
                  {complaint.locationDetail}
                </Detail>
              )}
              <Detail icon={Flag} label='Priority'>
                <PriorityBadge priority={complaint.priority} />
              </Detail>
              <Detail icon={CalendarClock} label='Submitted'>
                {formatDateTime(complaint.createdAt)}
              </Detail>
              {complaint.resolvedAt && (
                <Detail icon={CheckCircle2} label='Resolved'>
                  {formatDateTime(complaint.resolvedAt)}
                </Detail>
              )}
            </dl>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <HistoryIcon className='size-4' />
              History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComplaintTimeline events={complaint.auditLogs} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
