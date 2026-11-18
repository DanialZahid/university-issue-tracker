'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ComplaintStatus } from '@/generated/prisma/enums';
import { celebrateAt } from '@/ui/motion';
import { StatusBadge } from '@/ui/shared/complaint/StatusBadge';
import { statusTone } from '@/ui/shared/complaint/status-tone';
import { cn } from '@/utils/cn';

// Made-up examples that show what the platform does. Not real complaints.
type Sample = {
  ticket: string;
  title: string;
  category: string;
  department: string;
  reported: string;
  status: ComplaintStatus;
  place: string;
  tilt: number;
};

const SAMPLES: Sample[] = [
  {
    ticket: 'CMP-51237',
    title: 'Projector not working in AC-103',
    category: 'IT / Equipment',
    department: 'IT',
    reported: '2 hours ago',
    status: 'IN_PROGRESS',
    place: 'left-[6%] top-[2%]',
    tilt: -3,
  },
  {
    ticket: 'CMP-51488',
    title: 'Water leaking in Block B washroom',
    category: 'Maintenance',
    department: 'Administration',
    reported: '35 minutes ago',
    status: 'PENDING',
    place: 'right-0 top-[36%]',
    tilt: 2,
  },
  {
    ticket: 'CMP-51844',
    title: 'Wi-Fi down in C-Lab 04',
    category: 'Software and Network',
    department: 'IT',
    reported: '1 day ago',
    status: 'RESOLVED',
    place: 'left-0 top-[70%]',
    tilt: -1.5,
  },
];

const CYCLE: ComplaintStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];
const STEP_MS = 2200;

export function SampleComplaints() {
  // The middle card moves through the statuses and celebrates when resolved.
  const [live, setLive] = useState<ComplaintStatus>('PENDING');
  const liveCard = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      setLive((s) => CYCLE[(CYCLE.indexOf(s) + 1) % CYCLE.length] ?? 'PENDING');
    }, STEP_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (live === 'RESOLVED' && liveCard.current) {
      void celebrateAt(liveCard.current);
    }
  }, [live]);

  return (
    <div aria-hidden='true' className='relative h-[34rem]'>
      {SAMPLES.map((s, i) => {
        const status = i === 1 ? live : s.status;
        return (
          <div
            key={s.ticket}
            ref={i === 1 ? liveCard : undefined}
            className={cn(
              'float-card absolute w-[21rem] overflow-hidden rounded-xl border bg-card py-4 pr-4 pl-6 shadow-[0_18px_40px_-18px_rgb(21_93_252/0.3)]',
              s.place,
            )}
            style={
              {
                rotate: `${s.tilt}deg`,
                '--float-delay': `${i * 1.2}s`,
              } as CSSProperties
            }
          >
            <span
              className={cn(
                'absolute inset-y-0 left-0 w-1.5 transition-colors duration-500',
                statusTone[status].bar,
              )}
            />
            <div className='flex items-center justify-between gap-3 text-sm text-muted-foreground'>
              <span>{s.ticket}</span>
              <StatusBadge status={status} />
            </div>
            <p className='mt-1.5 font-medium'>{s.title}</p>
            <p className='mt-1.5 text-sm text-muted-foreground'>
              {s.category} · Sent to {s.department}
            </p>
            <p className='mt-1 text-xs text-muted-foreground'>
              Reported {s.reported}
            </p>
          </div>
        );
      })}
    </div>
  );
}
