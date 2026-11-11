import type { Metadata } from 'next';
import { PageHeader } from '@/ui/shared/layout';
import { ComplaintForm, SubmitGuide } from '@/ui/shared/complaint';
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
      <ComplaintForm categories={categories} locations={locations}>
        <SubmitGuide />
      </ComplaintForm>
    </>
  );
}
