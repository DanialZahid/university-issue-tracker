import type { Metadata } from 'next';
import { PageHeader } from '@/ui/shared/layout';

export const metadata: Metadata = { title: 'My complaints' };

export default function MyComplaintsPage() {
  return (
    <>
      <PageHeader
        title='My complaints'
        description='Track the complaints you have submitted.'
      />
      <p className='text-sm text-muted-foreground'>Coming soon.</p>
    </>
  );
}
