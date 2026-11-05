'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardList, FilePlus2 } from 'lucide-react';
import { Button } from '@/ui/common/button';

type Props = { department?: string };

export function SubmittedBanner({ department }: Props) {
  // Drop ?submitted=1 from the address so Back or a refresh shows the normal page.
  useEffect(() => {
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  return (
    <div className='glow'>
      <div
        role='status'
        className='flex flex-col gap-4 rounded-xl border border-green-600/20 bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between'
      >
        <div className='flex items-start gap-3'>
          <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-green-600/15'>
            <CheckCircle2 className='size-5' />
          </span>
          <div className='space-y-0.5'>
            <p className='font-semibold'>Complaint submitted</p>
            <p className='text-sm text-muted-foreground'>
              It has been sent to{' '}
              {department ? (
                <span className='font-medium text-foreground'>
                  {department}
                </span>
              ) : (
                'the responsible department'
              )}
              . You can follow its progress here.
            </p>
          </div>
        </div>
        <div className='flex shrink-0 flex-col gap-2 sm:flex-row'>
          <Button variant='outline' asChild>
            <Link href='/complaints/new'>
              <FilePlus2 />
              Submit another
            </Link>
          </Button>
          <Button asChild>
            <Link href='/complaints'>
              <ClipboardList />
              My complaints
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
