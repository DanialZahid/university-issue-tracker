'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardList, FilePlus2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/ui/common/button';

type Props = { department?: string };

export function SubmittedBanner({ department }: Props) {
  // Drop ?submitted=1 from the address so Back or a refresh shows the normal page.
  useEffect(() => {
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  return (
    <motion.div
      className='glow'
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div
        role='status'
        className='flex flex-col gap-4 rounded-xl border border-green-600/20 bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between'
      >
        <div className='flex items-start gap-3'>
          <motion.span
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 15,
              delay: 0.15,
            }}
            className='flex size-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-green-600/15'
          >
            <CheckCircle2 className='size-5' />
          </motion.span>
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
    </motion.div>
  );
}
