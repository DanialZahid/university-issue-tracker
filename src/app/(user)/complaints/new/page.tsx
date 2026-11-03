import type { Metadata } from 'next';
import { PageHeader } from '@/ui/shared/layout';
import { ComplaintForm } from '@/ui/shared/complaint/ComplaintForm';
import { getComplaintFormOptions } from '@/db/complaint';
import { FilePlus2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Submit a complaint' };

export default async function SubmitComplaintPage() {
  const { categories, locations } = await getComplaintFormOptions();

  return (
    <>
      <PageHeader
        title='Submit a complaint'
        description='Report an issue on campus.'
        icon={FilePlus2}
      />
      <div className='max-w-2xl'>
        <ComplaintForm categories={categories} locations={locations} />
      </div>
    </>
  );
}
