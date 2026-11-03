import type { Metadata } from 'next';
import { ComplaintStatus } from '@/generated/prisma/enums';
import { StatusBadge } from '@/ui/shared/complaint';
import { PageHeader } from '@/ui/shared/layout';

export const metadata: Metadata = { title: 'Dashboard' };

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        title='Dashboard'
        description='An overview of all complaints.'
      />
      <div className='flex flex-wrap gap-2'>
        {Object.values(ComplaintStatus).map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </div>
    </>
  );
}
