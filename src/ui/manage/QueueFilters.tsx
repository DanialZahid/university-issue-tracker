'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useEffectEvent, useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/ui/common/button';
import { Input } from '@/ui/common/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/common/select';
import { cn } from '@/utils/cn';
import { DateRangePicker, formatRange } from '@/ui/common/DateRangePicker';

type Option = { value: string; label: string };
type Props = {
  categories: Option[];
  locations: Option[];
  departments: Option[];
};

const ANY = 'any';
const SEARCH_DELAY_MS = 350;

const STATUS_OPTIONS: Option[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'ALL', label: 'All active' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const PRIORITY_OPTIONS: Option[] = [
  { value: ANY, label: 'Any priority' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const SORT_LABELS: Record<string, string> = {
  ticket: 'Ticket',
  priority: 'Priority',
  status: 'Status',
  department: 'Department',
  age: 'Age',
};

function labelOf(options: Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className='w-full bg-card sm:w-44'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position='popper'>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type Chip = { key: string; label: string; clear: Record<string, null> };

export function QueueFilters({ categories, locations, departments }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function navigate(next: URLSearchParams) {
    const qs = next.toString();
    startTransition(() =>
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  }

  function setParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      const isDefault =
        value === null ||
        value === '' ||
        value === ANY ||
        (key === 'status' && value === 'OPEN');
      if (isDefault) next.delete(key);
      else next.set(key, value);
    }
    next.delete('page');
    next.delete('forwarded');
    navigate(next);
  }

  // Live search: applied once typing pauses.
  const urlQ = params.get('q') ?? '';
  const [text, setText] = useState(urlQ);
  const [syncedQ, setSyncedQ] = useState(urlQ);
  if (urlQ !== syncedQ) {
    // Cleared from outside (chip, Clear all, stat card): empty the box too.
    setSyncedQ(urlQ);
    if (urlQ === '') setText('');
  }

  const applySearch = useEffectEvent((value: string) =>
    setParams({ q: value }),
  );
  useEffect(() => {
    const value = text.trim();
    if (value === urlQ) return;
    const id = setTimeout(() => applySearch(value), SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [text, urlQ]);

  // Everything currently applied, shown as removable chips.
  const chips: Chip[] = [];
  const status = params.get('status');
  if (status) {
    chips.push({
      key: 'status',
      label: `Status: ${labelOf(STATUS_OPTIONS, status)}`,
      clear: { status: null },
    });
  }
  const priority = params.get('priority');
  if (priority) {
    chips.push({
      key: 'priority',
      label: `Priority: ${labelOf(PRIORITY_OPTIONS, priority)}`,
      clear: { priority: null },
    });
  }
  const category = params.get('category');
  if (category) {
    chips.push({
      key: 'category',
      label: `Category: ${labelOf(categories, category)}`,
      clear: { category: null },
    });
  }
  const location = params.get('location');
  if (location) {
    chips.push({
      key: 'location',
      label: `Location: ${labelOf(locations, location)}`,
      clear: { location: null },
    });
  }
  const department = params.get('department');
  if (department && departments.length > 0) {
    chips.push({
      key: 'department',
      label: `Department: ${labelOf(departments, department)}`,
      clear: { department: null },
    });
  }
  const from = params.get('from');
  const to = params.get('to');
  if (from && to) {
    chips.push({
      key: 'date',
      label: `Date: ${formatRange(from, to)}`,
      clear: { from: null, to: null },
    });
  }
  if (urlQ) {
    chips.push({ key: 'q', label: `Search: "${urlQ}"`, clear: { q: null } });
  }
  const sort = params.get('sort');
  if (sort) {
    const dir = params.get('dir') === 'desc' ? 'descending' : 'ascending';
    chips.push({
      key: 'sort',
      label: `Sorted by ${SORT_LABELS[sort] ?? sort}, ${dir}`,
      clear: { sort: null, dir: null },
    });
  }

  return (
    <div
      className={cn('space-y-3 transition-opacity', pending && 'opacity-60')}
    >
      <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
        <form
          role='search'
          className='relative w-full sm:w-72'
          onSubmit={(e) => {
            e.preventDefault();
            setParams({ q: text.trim() });
          }}
        >
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Search title, text or ticket'
            aria-label='Search complaints'
            className='bg-card pr-9 pl-9'
          />
          {text && (
            <button
              type='button'
              aria-label='Clear search'
              onClick={() => {
                setText('');
                setParams({ q: null });
              }}
              className='absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
            >
              <X className='size-3.5' />
            </button>
          )}
        </form>

        <FilterSelect
          label='Status'
          value={status ?? 'OPEN'}
          options={STATUS_OPTIONS}
          onChange={(v) => setParams({ status: v })}
        />
        <FilterSelect
          label='Priority'
          value={priority ?? ANY}
          options={PRIORITY_OPTIONS}
          onChange={(v) => setParams({ priority: v })}
        />
        <FilterSelect
          label='Category'
          value={category ?? ANY}
          options={[{ value: ANY, label: 'Any category' }, ...categories]}
          onChange={(v) => setParams({ category: v })}
        />
        <FilterSelect
          label='Location'
          value={location ?? ANY}
          options={[{ value: ANY, label: 'Any location' }, ...locations]}
          onChange={(v) => setParams({ location: v })}
        />
        {departments.length > 0 && (
          <FilterSelect
            label='Department'
            value={department ?? ANY}
            options={[{ value: ANY, label: 'All departments' }, ...departments]}
            onChange={(v) => setParams({ department: v })}
          />
        )}
        <DateRangePicker
          from={from ?? undefined}
          to={to ?? undefined}
          onChange={(f, t) => setParams({ from: f, to: t })}
        />
      </div>

      {chips.length > 0 && (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground'>Active filters:</span>
          {chips.map((chip) => (
            <span
              key={chip.key}
              className='inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 py-0.5 pr-1 pl-2.5 text-xs font-medium text-primary'
            >
              {chip.label}
              <button
                type='button'
                aria-label={`Remove ${chip.label}`}
                onClick={() => setParams(chip.clear)}
                className='rounded-full p-0.5 hover:bg-primary/15'
              >
                <X className='size-3' />
              </button>
            </span>
          ))}
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setText('');
              // Rows per page is a view setting, not a filter: keep it.
              const keep = new URLSearchParams();
              const size = params.get('size');
              if (size) keep.set('size', size);
              navigate(keep);
            }}
          >
            <X />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
