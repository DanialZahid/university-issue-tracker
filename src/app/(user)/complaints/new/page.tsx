import type { Metadata } from 'next';
import { PageHeader } from '@/ui/shared/layout';
import { ComplaintForm, SubmitGuide } from '@/ui/shared/complaint';
import { getComplaintFormOptions } from '@/db/complaint';
import { FilePlus2 } from 'lucide-react';
import { requireUser } from '@/utils/session';

export const metadata: Metadata = { title: 'Submit a complaint' };

export default async function SubmitComplaintPage() {
  const [user, { categories, locations }] = await Promise.all([
    requireUser(),
    getComplaintFormOptions(),
  ]);

  return (
    <>
      <PageHeader
        title='Submit a complaint'
        description='Report an issue on campus.'
        icon={FilePlus2}
      />
      <ComplaintForm
        categories={categories}
        locations={locations}
        uploaderId={user.id}
      >
        <SubmitGuide />
      </ComplaintForm>
    </>
  );
}
