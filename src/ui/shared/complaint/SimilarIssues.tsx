'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CopyCheck } from 'lucide-react';
import {
  findSimilarComplaints,
  type SimilarComplaint,
} from '@/actions/similar';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';
import { formatAge } from '@/utils/date';
import { StatusBadge } from './StatusBadge';

type Props = {
  title: string;
  categoryId: string;
  locationId: string;
  room: string;
};

const DELAY_MS = 600;

function reportedLabel(createdAt: Date) {
  const age = formatAge(new Date(createdAt));
  return age === 'Just now' ? 'Reported just now' : `Reported ${age} ago`;
}

// Looks for open complaints like the one being typed, once typing pauses.
export function SimilarIssues({ title, categoryId, locationId, room }: Props) {
  const [results, setResults] = useState<SimilarComplaint[]>([]);
  const latest = useRef(0);
  const ready = title.trim().length >= 5 && !!categoryId && !!locationId;

  useEffect(() => {
    const request = ++latest.current;
    if (!ready) return;
    const id = setTimeout(async () => {
      try {
        const found = await findSimilarComplaints({
          title,
          categoryId,
          locationId,
          room,
        });
        // Ignore answers that arrive after a newer request was sent.
        if (request === latest.current) setResults(found);
      } catch {
        // The form works without this panel, so a failed lookup stays silent.
      }
    }, DELAY_MS);
    return () => clearTimeout(id);
  }, [title, categoryId, locationId, room, ready]);

  if (!ready || results.length === 0) return null;

  return (
    <Card className='border-violet-600/20 bg-violet-50/60'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <CopyCheck className='size-5 text-violet-700' />
          Already reported?
        </CardTitle>
        <p className='text-sm text-muted-foreground'>
          These open complaints look similar. If one is your issue, the
          department already has it. You can still submit yours.
        </p>
      </CardHeader>
      <CardContent>
        <ul className='space-y-3'>
          {results.map((c) => (
            <li
              key={c.ticket}
              className='rounded-lg border bg-card p-3 text-sm shadow-xs'
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='font-medium text-muted-foreground tabular-nums'>
                  {c.ticket}
                </span>
                <StatusBadge status={c.status} />
              </div>
              <p className='mt-1.5 font-medium'>{c.title}</p>
              <p className='mt-1 text-xs text-muted-foreground'>
                {c.room ? `${c.room} · ` : ''}
                {reportedLabel(c.createdAt)}
                {c.mine && (
                  <>
                    {' · '}
                    <Link
                      href={`/complaints/${c.ticket}`}
                      className='font-medium text-primary hover:underline'
                    >
                      Yours, open it
                    </Link>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
