'use client';

import {
  useActionState,
  useState,
  type ReactNode,
  useEffect,
  useEffectEvent,
} from 'react';
import { CheckCircle2, CircleAlert, Loader2, Save } from 'lucide-react';
import {
  updatePriority,
  updateStatus,
  type ManageActionState,
} from '@/actions/manage';
import type { ComplaintStatus, Priority } from '@/generated/prisma/enums';
import { Button } from '@/ui/common/button';
import { Label } from '@/ui/common/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/common/select';
import { PriorityBadge, StatusBadge } from '@/ui/shared/complaint';
import { cn } from '@/utils/cn';
import { celebrate } from '@/ui/motion';
import { submitWithoutReset } from './form-submit';

type Action = (
  prev: ManageActionState,
  formData: FormData,
) => Promise<ManageActionState>;

const idle: ManageActionState = { status: 'idle' };

const STATUSES: ComplaintStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];
const PRIORITIES: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function ActionMessage({ state }: { state: ManageActionState }) {
  if (state.status === 'idle') return null;
  const isError = state.status === 'error';
  const Icon = isError ? CircleAlert : CheckCircle2;
  return (
    <p
      role='status'
      className={cn(
        'flex items-center gap-1.5 text-sm',
        isError ? 'text-destructive' : 'text-green-700',
      )}
    >
      <Icon className='size-4 shrink-0' />
      {state.message}
    </p>
  );
}

function UpdateForm({
  label,
  name,
  action,
  ticketNumber,
  value,
  options,
  disabled,
  onSaved,
}: {
  label: string;
  name: string;
  action: Action;
  ticketNumber: number;
  value: string;
  options: { value: string; content: ReactNode }[];
  disabled: boolean;
  onSaved?: (value: string) => void;
}) {
  const [state, formAction, pending] = useActionState(action, idle);
  const [selected, setSelected] = useState(value);
  // Runs after a successful save (for example, confetti when resolved).
  const notifySaved = useEffectEvent(() => onSaved?.(selected));
  useEffect(() => {
    if (state.status === 'success') notifySaved();
  }, [state]);

  return (
    <form className='space-y-2' onSubmit={submitWithoutReset(formAction)}>
      <input type='hidden' name='ticketNumber' value={ticketNumber} />
      <input type='hidden' name='expected' value={value} />
      <Label htmlFor={name}>{label}</Label>
      <div className='flex gap-2'>
        <Select
          name={name}
          value={selected}
          onValueChange={setSelected}
          disabled={disabled || pending}
        >
          <SelectTrigger id={name} className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position='popper'>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.content}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type='submit'
          disabled={disabled || pending || selected === value}
        >
          {pending ? <Loader2 className='animate-spin' /> : <Save />}
          {pending ? 'Saving...' : 'Save'}
        </Button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

type Props = {
  ticketNumber: number;
  status: ComplaintStatus;
  priority: Priority;
  archived: boolean;
};

export function ComplaintActions({
  ticketNumber,
  status,
  priority,
  archived,
}: Props) {
  return (
    <div className='space-y-5'>
      {archived && (
        <p className='rounded-lg bg-muted p-3 text-sm text-muted-foreground'>
          This complaint is archived. Restore it to make changes.
        </p>
      )}
      <UpdateForm
        label='Status'
        name='status'
        action={updateStatus}
        ticketNumber={ticketNumber}
        value={status}
        disabled={archived}
        onSaved={(saved) => {
          if (saved === 'RESOLVED') void celebrate();
        }}
        options={STATUSES.map((s) => ({
          value: s,
          content: <StatusBadge status={s} />,
        }))}
      />
      <UpdateForm
        label='Priority'
        name='priority'
        action={updatePriority}
        ticketNumber={ticketNumber}
        value={priority}
        disabled={archived}
        options={PRIORITIES.map((p) => ({
          value: p,
          content: <PriorityBadge priority={p} />,
        }))}
      />
    </div>
  );
}
