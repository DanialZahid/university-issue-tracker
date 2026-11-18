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
};

const FIXED: (Sample & {
  status: ComplaintStatus;
  place: string;
  tilt: number;
})[] = [
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

// The middle card tells the whole story on a loop: a new complaint is typed
// in, picked up, resolved (with a small burst), then the next one starts.
const LIVE: Sample[] = [
  {
    ticket: 'CMP-51488',
    title: 'Water leaking in Block B washroom',
    category: 'Maintenance',
    department: 'Administration',
    reported: 'just now',
  },
  {
    ticket: 'CMP-51502',
    title: 'Fan not working in the Library',
    category: 'Classroom Facilities',
    department: 'Administration',
    reported: 'just now',
  },
  {
    ticket: 'CMP-51519',
    title: 'Exam result not showing on portal',
    category: 'Exams and Results',
    department: 'Academics',
    reported: 'just now',
  },
];

const NEXT: Record<ComplaintStatus, ComplaintStatus> = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'PENDING',
};
const HOLD_MS: Record<ComplaintStatus, number> = {
  PENDING: 3200,
  IN_PROGRESS: 2200,
  RESOLVED: 2600,
};
const TYPE_MS = 38;

type Live = { index: number; status: ComplaintStatus; typed: number };

export function SampleComplaints() {
  // Starts with the first title already shown, so the server render and the
  // first browser render match. Typing begins with the next complaint.
  const [live, setLive] = useState<Live>({
    index: 0,
    status: 'PENDING',
    typed: LIVE[0]!.title.length,
  });
  const liveCard = useRef<HTMLDivElement>(null);
  const sample = LIVE[live.index] ?? LIVE[0]!;

  // Status steps.
  useEffect(() => {
    // Reduced motion: nothing cycles or types.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setTimeout(() => {
      setLive((l) => {
        const status = NEXT[l.status];
        return status === 'PENDING'
          ? { index: (l.index + 1) % LIVE.length, status, typed: 0 }
          : { ...l, status };
      });
    }, HOLD_MS[live.status]);
    return () => clearTimeout(timer);
  }, [live.status]);

  // Typing, one letter at a time, while the title is incomplete.
  const typing = live.typed < sample.title.length;
  useEffect(() => {
    if (!typing) return;
    const timer = setTimeout(
      () => setLive((l) => ({ ...l, typed: l.typed + 1 })),
      TYPE_MS,
    );
    return () => clearTimeout(timer);
  }, [typing, live.typed]);

  useEffect(() => {
    if (live.status === 'RESOLVED' && liveCard.current) {
      void celebrateAt(liveCard.current);
    }
  }, [live.status]);

  const cards = [
    { ...FIXED[0]!, key: 'a', isLive: false },
    {
      ...sample,
      status: live.status,
      place: 'right-0 top-[36%]',
      tilt: 2,
      key: 'live',
      isLive: true,
    },
    { ...FIXED[1]!, key: 'b', isLive: false },
  ];

  return (
    <div aria-hidden='true' className='relative h-136 xl:h-152'>
      {cards.map((c, i) => (
        <div
          key={c.key}
          className={cn('rise-in absolute', c.place)}
          style={{ '--rise-delay': `${0.3 + i * 0.15}s` } as CSSProperties}
        >
          <div
            ref={c.isLive ? liveCard : undefined}
            className='float-card relative w-84 overflow-hidden rounded-xl border bg-card py-4 pr-4 pl-6 shadow-[0_18px_40px_-18px_rgb(21_93_252/0.3)] xl:w-92'
            style={
              {
                rotate: `${c.tilt}deg`,
                '--float-delay': `${i * 1.2}s`,
              } as CSSProperties
            }
          >
            <span
              className={cn(
                'absolute inset-y-0 left-0 w-1.5 transition-colors duration-500',
                statusTone[c.status].bar,
              )}
            />
            <div className='flex items-center justify-between gap-3 text-sm text-muted-foreground'>
              <span>{c.ticket}</span>
              {/* New key on each change, so the badge fades in again. The
                  icon inside is animated by status (see globals.css). */}
              <span
                key={c.status}
                data-status={c.status}
                className='status-swap sample-status'
              >
                <StatusBadge status={c.status} />
              </span>
            </div>
            <p className='mt-1.5 truncate font-medium'>
              {c.isLive ? c.title.slice(0, live.typed) : c.title}
              {c.isLive && typing && <span className='type-caret' />}
              {/* Keeps the line height while the title is still empty. */}
              {c.isLive && live.typed === 0 && ' '}
            </p>
            <p
              className={cn(
                'mt-1.5 text-sm text-muted-foreground transition-opacity duration-300',
                c.isLive && typing && 'opacity-0',
              )}
            >
              {c.category} · Sent to {c.department}
            </p>
            <p className='mt-1 text-xs text-muted-foreground'>
              Reported {c.reported}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
