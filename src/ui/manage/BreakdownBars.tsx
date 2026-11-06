import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';

type Row = { name: string; count: number };
type Props = { title: string; icon: LucideIcon; rows: Row[]; limit?: number };

// Horizontal bars, one hue, values always written next to the bar.
export function BreakdownBars({ title, icon: Icon, rows, limit = 8 }: Props) {
  const shown = rows.slice(0, limit);
  const rest = rows.slice(limit).reduce((sum, r) => sum + r.count, 0);
  // "All others", not "Other": a real category is already called Other.
  const all =
    rest > 0 ? [...shown, { name: 'All others', count: rest }] : shown;
  const max = Math.max(1, ...all.map((r) => r.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icon className='size-5' />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {all.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No open complaints.</p>
        ) : (
          <ul className='space-y-3'>
            {all.map((r, i) => (
              <li
                key={`${i}-${r.name}`}
                className='grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-sm'
              >
                <span className='truncate text-muted-foreground' title={r.name}>
                  {r.name}
                </span>
                <span className='h-2.5 overflow-hidden rounded-full bg-muted'>
                  <span
                    className='block h-full rounded-full'
                    style={{
                      width: `${(r.count / max) * 100}%`,
                      backgroundColor: '#2a78d6',
                    }}
                  />
                </span>
                <span className='text-right font-semibold tabular-nums'>
                  {r.count.toLocaleString('en-US')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
