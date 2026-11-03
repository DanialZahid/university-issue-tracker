import type { Metadata } from 'next';
import { PageHeader } from '@/ui/shared/layout';

export const metadata: Metadata = { title: 'All complaints' };

export default function AllComplaintsPage() {
  return (
    <>
      <PageHeader
        title='All complaints'
        description='Review and manage every complaint.'
      />
      <p className='text-sm text-muted-foreground'>Coming soon.</p>
    </>
  );
}
