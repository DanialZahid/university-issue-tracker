'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
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

type Option = { value: string; label: string };
type Props = { categories: Option[]; departments: Option[] };

const ANY = 'any';
const FILTER_KEYS = ['status', 'priority', 'category', 'department', 'q'];

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
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function QueueFilters({ categories, departments }: Props) {
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

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    const isDefault =
      value === ANY || value === '' || (key === 'status' && value === 'OPEN');
    if (isDefault) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    navigate(next);
  }

  const hasFilters = FILTER_KEYS.some((k) => params.has(k));
  const q = params.get('q') ?? '';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 transition-opacity sm:flex-row sm:flex-wrap sm:items-center',
        pending && 'opacity-60',
      )}
    >
      <form
        role='search'
        className='relative w-full sm:w-72'
        onSubmit={(e) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get('q');
          update('q', String(value ?? '').trim());
        }}
      >
        <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          key={q}
          name='q'
          defaultValue={q}
          placeholder='Search title, text or ticket'
          aria-label='Search complaints'
          className='bg-card pl-9'
        />
      </form>

      <FilterSelect
        label='Status'
        value={params.get('status') ?? 'OPEN'}
        options={STATUS_OPTIONS}
        onChange={(v) => update('status', v)}
      />
      <FilterSelect
        label='Priority'
        value={params.get('priority') ?? ANY}
        options={PRIORITY_OPTIONS}
        onChange={(v) => update('priority', v)}
      />
      <FilterSelect
        label='Category'
        value={params.get('category') ?? ANY}
        options={[{ value: ANY, label: 'Any category' }, ...categories]}
        onChange={(v) => update('category', v)}
      />
      {departments.length > 0 && (
        <FilterSelect
          label='Department'
          value={params.get('department') ?? ANY}
          options={[{ value: ANY, label: 'All departments' }, ...departments]}
          onChange={(v) => update('department', v)}
        />
      )}

      {hasFilters && (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate(new URLSearchParams())}
        >
          <X />
          Clear filters
        </Button>
      )}
    </div>
  );
}
