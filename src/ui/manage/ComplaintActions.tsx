'use client';

import {
  startTransition,
  useActionState,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
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
}: {
  label: string;
  name: string;
  action: Action;
  ticketNumber: number;
  value: string;
  options: { value: string; content: ReactNode }[];
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, idle);
  const [selected, setSelected] = useState(value);

  return (
    <form
      className='space-y-2'
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
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
