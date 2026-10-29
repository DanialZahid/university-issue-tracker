import type { Metadata } from 'next';
import { PageHeader } from '@/ui/shared/layout';

export const metadata: Metadata = { title: 'Submit a complaint' };

export default function SubmitComplaintPage() {
  return (
    <>
      <PageHeader
        title='Submit a complaint'
        description='Report an issue on campus.'
      />
      <p className='text-sm text-muted-foreground'>Coming soon.</p>
    </>
  );
}
