'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/ui/common/button';
import { Calendar } from '@/ui/common/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/common/popover';
import { cn } from '@/utils/cn';
import { formatDate, fromYmd, toYmd } from '@/utils/date';

type Props = {
  from?: string;
  to?: string;
  onChange: (from: string | null, to: string | null) => void;
};

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export function formatRange(from: string, to: string): string {
  return `${formatDate(fromYmd(from))} to ${formatDate(fromYmd(to))}`;
}

export function DateRangePicker({ from, to, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const selected =
    from && to ? { from: fromYmd(from), to: fromYmd(to) } : undefined;

  function apply(start: Date, end: Date) {
    onChange(toYmd(start), toYmd(end));
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(selected);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          aria-label='Date range'
          className={cn(
            'w-full justify-start bg-card font-normal sm:w-auto',
            !selected && 'text-muted-foreground',
          )}
        >
          <CalendarDays />
          {from && to ? formatRange(from, to) : 'Any date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto p-0'>
        <div className='flex flex-col sm:flex-row'>
          <div className='flex gap-1 border-b p-2 sm:flex-col sm:border-r sm:border-b-0'>
            {PRESETS.map((p) => (
              <Button
                key={p.days}
                variant='ghost'
                size='sm'
                className='justify-start'
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(end.getDate() - (p.days - 1));
                  apply(start, end);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div>
            <Calendar
              mode='range'
              selected={draft}
              onSelect={setDraft}
              defaultMonth={draft?.from}
              disabled={{ after: new Date() }}
            />
            <div className='flex justify-end gap-2 border-t p-2'>
              {selected && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    onChange(null, null);
                    setOpen(false);
                  }}
                >
                  Clear
                </Button>
              )}
              <Button
                size='sm'
                disabled={!draft?.from}
                onClick={() =>
                  draft?.from && apply(draft.from, draft.to ?? draft.from)
                }
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
