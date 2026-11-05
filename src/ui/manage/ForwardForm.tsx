'use client';

import { useActionState, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { forwardToDepartment, type ManageActionState } from '@/actions/manage';
import { Button } from '@/ui/common/button';
import { Label } from '@/ui/common/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/common/select';
import { Textarea } from '@/ui/common/textarea';
import { DepartmentIcon } from '@/ui/shared/department';
import { ActionMessage } from './ComplaintActions';
import { submitWithoutReset } from './form-submit';

const idle: ManageActionState = { status: 'idle' };

type Props = {
  ticketNumber: number;
  currentDepartmentId: string;
  departments: { id: string; name: string }[];
  disabled: boolean;
  // Dashboard filters to return to after forwarding.
  back?: string;
};

export function ForwardForm({
  ticketNumber,
  currentDepartmentId,
  departments,
  disabled,
  back,
}: Props) {
  const [state, formAction, pending] = useActionState(
    forwardToDepartment,
    idle,
  );
  const [target, setTarget] = useState('');
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.status === 'success') setTarget('');
  }

  const options = departments.filter((d) => d.id !== currentDepartmentId);
  const locked = disabled || pending;

  return (
    <form onSubmit={submitWithoutReset(formAction)} className='space-y-2'>
      <input type='hidden' name='ticketNumber' value={ticketNumber} />
      <input type='hidden' name='expected' value={currentDepartmentId} />
      {back && <input type='hidden' name='back' value={back} />}
      <Label htmlFor='departmentId'>Forward to another department</Label>
      <Select
        name='departmentId'
        value={target}
        onValueChange={setTarget}
        disabled={locked}
      >
        <SelectTrigger id='departmentId' className='w-full'>
          <SelectValue placeholder='Choose a department' />
        </SelectTrigger>
        <SelectContent position='popper'>
          {options.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              <span className='inline-flex items-center gap-2'>
                <DepartmentIcon
                  name={d.name}
                  className='size-4 text-muted-foreground'
                />
                {d.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {target && (
        <Textarea
          name='reason'
          rows={2}
          maxLength={500}
          disabled={locked}
          placeholder='Reason (optional, internal only)'
        />
      )}
      <Button
        type='submit'
        variant='outline'
        className='w-full'
        disabled={locked || !target}
      >
        <ArrowRightLeft />
        {pending ? 'Forwarding...' : 'Forward'}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}
