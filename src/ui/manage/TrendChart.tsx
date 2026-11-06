'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';

type Point = {
  day: string;
  label: string;
  submitted: number;
  resolved: number;
};
type Props = { points: Point[] };

// Categorical slots 1 and 3 of the data-viz palette (validated as a pair).
// The aqua is below 3:1 on white, so every value is also in the legend
// totals, the tooltip and the table view.
const SERIES = [
  { key: 'submitted', label: 'Submitted', color: '#2a78d6' },
  { key: 'resolved', label: 'Resolved', color: '#1baf7a' },
] as const;

const HEIGHT = 190;
const PAD = { top: 12, right: 84, bottom: 26, left: 36 };

function niceMax(value: number) {
  if (value <= 4) return 4;
  const step = 10 ** Math.floor(Math.log10(value));
  // Smallest round number that fits, so the gridlines get whole labels.
  const nice = [1, 2, 3, 4, 5, 6, 8, 10].find((m) => m * step >= value) ?? 10;
  return nice * step;
}

export function TrendChart({ points }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(320, entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const totals = {
    submitted: points.reduce((sum, p) => sum + p.submitted, 0),
    resolved: points.reduce((sum, p) => sum + p.resolved, 0),
  };
  const max = niceMax(
    Math.max(1, ...points.map((p) => Math.max(p.submitted, p.resolved))),
  );
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (points.length > 1 ? (i / (points.length - 1)) * plotW : 0);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const path = (key: 'submitted' | 'resolved') =>
    points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p[key])}`).join('');

  // Direct labels at the line ends, nudged apart if they would overlap.
  const last = points.length - 1;
  const endY = SERIES.map((s) => y(points[last]?.[s.key] ?? 0));
  if (Math.abs(endY[0] - endY[1]) < 14) {
    const mid = (endY[0] + endY[1]) / 2;
    const up = endY[0] <= endY[1] ? 0 : 1;
    endY[up] = mid - 7;
    endY[1 - up] = mid + 7;
  }

  const pick = (clientX: number) => {
    const rect = wrap.current?.getBoundingClientRect();
    if (!rect || points.length === 0) return;
    const ratio = (clientX - rect.left - PAD.left) / plotW;
    setActive(Math.min(last, Math.max(0, Math.round(ratio * last))));
  };

  const point = active !== null ? points[active] : null;
  const tipLeft = active !== null ? Math.min(x(active) + 12, width - 170) : 0;

  return (
    <Card>
      <CardHeader className='flex flex-wrap items-center justify-between gap-3'>
        <CardTitle className='flex items-center gap-2'>
          <TrendingUp className='size-5' />
          Last 30 days
        </CardTitle>
        <ul className='flex flex-wrap items-center gap-4 text-sm'>
          {SERIES.map((s) => (
            <li key={s.key} className='flex items-center gap-2'>
              <span
                aria-hidden='true'
                className='h-0.5 w-4 rounded-full'
                style={{ backgroundColor: s.color }}
              />
              <span className='text-muted-foreground'>{s.label}</span>
              <span className='font-semibold tabular-nums'>
                {totals[s.key].toLocaleString('en-US')}
              </span>
            </li>
          ))}
        </ul>
      </CardHeader>
      <CardContent>
        <div ref={wrap} className='relative'>
          <svg
            width={width}
            height={HEIGHT}
            role='img'
            aria-label={`Complaints per day over the last 30 days: ${totals.submitted} submitted, ${totals.resolved} resolved. A table view follows.`}
            className='block overflow-visible'
          >
            {(max % 2 === 0 ? [0, 0.5, 1] : [0, 1]).map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + plotW}
                  y1={y(max * t)}
                  y2={y(max * t)}
                  stroke='var(--border)'
                  strokeDasharray={t === 0 ? undefined : '3 4'}
                />
                <text
                  x={PAD.left - 8}
                  y={y(max * t) + 4}
                  textAnchor='end'
                  className='fill-muted-foreground text-[11px] tabular-nums'
                >
                  {Math.round(max * t)}
                </text>
              </g>
            ))}
            {points.map((p, i) =>
              (i % 7 === 0 && last - i > 3) || i === last ? (
                <text
                  key={p.day}
                  x={x(i)}
                  y={HEIGHT - 6}
                  textAnchor={i === last ? 'end' : i === 0 ? 'start' : 'middle'}
                  className='fill-muted-foreground text-[11px]'
                >
                  {p.label}
                </text>
              ) : null,
            )}
            {SERIES.map((s, i) => (
              <g key={s.key}>
                <path
                  d={path(s.key)}
                  fill='none'
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin='round'
                  strokeLinecap='round'
                />
                <text
                  x={x(last) + 8}
                  y={endY[i] + 4}
                  className='fill-foreground text-xs font-medium'
                >
                  {s.label}
                </text>
              </g>
            ))}
            {point && active !== null && (
              <g>
                <line
                  x1={x(active)}
                  x2={x(active)}
                  y1={PAD.top}
                  y2={PAD.top + plotH}
                  stroke='var(--muted-foreground)'
                  strokeOpacity={0.4}
                />
                {SERIES.map((s) => (
                  <circle
                    key={s.key}
                    cx={x(active)}
                    cy={y(point[s.key])}
                    r={4}
                    fill={s.color}
                    stroke='var(--card)'
                    strokeWidth={2}
                  />
                ))}
              </g>
            )}
            {/* Hit area: the whole plot, so the pointer never has to land on a line. */}
            <rect
              x={PAD.left}
              y={PAD.top}
              width={plotW}
              height={plotH}
              fill='transparent'
              tabIndex={0}
              aria-label='Move with arrow keys to read each day'
              className='outline-none'
              onPointerMove={(e) => pick(e.clientX)}
              onPointerLeave={() => setActive(null)}
              onBlur={() => setActive(null)}
              onFocus={() => setActive(last)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft')
                  setActive((a) => Math.max(0, (a ?? last) - 1));
                if (e.key === 'ArrowRight')
                  setActive((a) => Math.min(last, (a ?? 0) + 1));
              }}
            />
          </svg>
          {point && (
            <div
              role='status'
              className='pointer-events-none absolute top-2 z-10 w-40 rounded-lg border bg-card/95 px-3 py-2 text-sm shadow-md backdrop-blur'
              style={{ left: tipLeft }}
            >
              <p className='mb-1 text-xs text-muted-foreground'>
                {point.label}
              </p>
              {SERIES.map((s) => (
                <p key={s.key} className='flex items-center gap-2'>
                  <span
                    aria-hidden='true'
                    className='h-0.5 w-3 rounded-full'
                    style={{ backgroundColor: s.color }}
                  />
                  <span className='font-semibold tabular-nums'>
                    {point[s.key]}
                  </span>
                  <span className='text-muted-foreground'>{s.label}</span>
                </p>
              ))}
            </div>
          )}
        </div>
        <details className='mt-2 text-sm'>
          <summary className='cursor-pointer text-muted-foreground hover:text-foreground'>
            View as table
          </summary>
          <div className='mt-2 max-h-64 overflow-auto rounded-lg border'>
            <table className='w-full text-left tabular-nums'>
              <thead className='sticky top-0 bg-muted'>
                <tr>
                  <th className='px-3 py-1.5 font-medium'>Day</th>
                  <th className='px-3 py-1.5 font-medium'>Submitted</th>
                  <th className='px-3 py-1.5 font-medium'>Resolved</th>
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((p) => (
                  <tr key={p.day} className='border-t'>
                    <td className='px-3 py-1.5'>{p.label}</td>
                    <td className='px-3 py-1.5'>{p.submitted}</td>
                    <td className='px-3 py-1.5'>{p.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
