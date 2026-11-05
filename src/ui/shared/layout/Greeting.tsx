import type { ReactNode } from 'react';
import { WaveHand } from '@/ui/motion';
import { firstName, greetingFor } from '@/utils/greeting';

type Props = { name: string; summary?: ReactNode };

// A short personal line above a home page's header, with one useful fact.
export function Greeting({ name, summary }: Props) {
  return (
    <div className='mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm'>
      <p className='flex items-center gap-1.5 font-medium text-foreground'>
        <span>
          {greetingFor()}, {firstName(name)}
        </span>
        <WaveHand />
      </p>
      {summary && (
        <>
          <span
            aria-hidden='true'
            className='hidden text-muted-foreground sm:inline'
          >
            ·
          </span>
          <p className='text-muted-foreground'>{summary}</p>
        </>
      )}
    </div>
  );
}
