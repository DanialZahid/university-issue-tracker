import { Button } from '@/ui/common/button';
import { Badge } from '@/ui/common/badge';

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4 p-6'>
      <h1 className='text-center text-2xl font-semibold'>
        University Complaint and Issue Tracking Platform
      </h1>
      <div className='flex items-center gap-3'>
        <Button>Test Button</Button>
        <Badge variant='secondary'>Pending</Badge>
      </div>
    </main>
  );
}
