'use client';

import { useTransition } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { Hint } from '@/ui/common/Hint';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/ui/common/select';
import { cn } from '@/utils/cn';
import { setViewAs } from './actions';
import { REAL_ROLE } from './constants';

type Props = {
  current: string | null;
  departments: { id: string; name: string }[];
};

export function ViewAsSwitcher({ current, departments }: Props) {
  const [pending, startTransition] = useTransition();
  const active = current !== null;

  return (
    <div className='ml-auto flex items-center gap-2'>
      <Hint label='Demo only: preview the platform as another role. Your real account is unchanged.'>
        <span
          className={cn(
            'hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex',
            active
              ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-600/20'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {pending ? (
            <Loader2 className='size-3.5 animate-spin' />
          ) : (
            <Eye className='size-3.5' />
          )}
          {active ? 'Viewing as' : 'View as'}
        </span>
      </Hint>
      <Select
        value={current ?? REAL_ROLE}
        disabled={pending}
        onValueChange={(value) => startTransition(() => setViewAs(value))}
      >
        <SelectTrigger
          aria-label='View the platform as'
          className={cn('w-56 bg-card', active && 'border-amber-500/50')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position='popper' align='end'>
          <SelectItem value={REAL_ROLE}>My real role</SelectItem>
          <SelectSeparator />
          <SelectItem value='STUDENT'>Student</SelectItem>
          <SelectItem value='FACULTY'>Faculty</SelectItem>
          <SelectItem value='SUPERUSER'>Superuser</SelectItem>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Department head</SelectLabel>
            {departments.map((d) => (
              <SelectItem key={d.id} value={`DEPARTMENT_HEAD:${d.id}`}>
                Head of {d.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
