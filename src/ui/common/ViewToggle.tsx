'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LayoutList, List, Table2, type LucideIcon } from 'lucide-react';
import { Hint } from '@/ui/common/Hint';
import type { ListView } from '@/ui/shared/complaint/list-view';
import { cn } from '@/utils/cn';

const OPTIONS: { value: ListView; label: string; icon: LucideIcon }[] = [
  { value: 'cards', label: 'Cards', icon: LayoutList },
  { value: 'table', label: 'Table', icon: Table2 },
  { value: 'compact', label: 'Compact list', icon: List },
];

type Props = { value: ListView; cookie: string };

// Cards, table or compact list. Remembered for a year in a cookie.
export function ViewToggle({ value, cookie }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role='radiogroup'
      aria-label='Choose a view'
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border bg-card p-0.5',
        pending && 'opacity-60',
      )}
    >
      {OPTIONS.map(({ value: option, label, icon: Icon }) => {
        const active = option === value;
        return (
          <Hint key={option} label={label}>
            <button
              type='button'
              role='radio'
              aria-checked={active}
              aria-label={label}
              disabled={pending}
              onClick={() => {
                if (active) return;
                document.cookie = `${cookie}=${option}; path=/; max-age=31536000; samesite=lax`;
                startTransition(() => router.refresh());
              }}
              className={cn(
                'inline-flex size-7 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className='size-4' />
            </button>
          </Hint>
        );
      })}
    </div>
  );
}
