'use client';

import { useActionState, useState } from 'react';
import { StickyNote } from 'lucide-react';
import { addInternalNote, type ManageActionState } from '@/actions/manage';
import { Button } from '@/ui/common/button';
import { Label } from '@/ui/common/label';
import { Textarea } from '@/ui/common/textarea';
import { ActionMessage } from './ComplaintActions';
import { submitWithoutReset } from './form-submit';

const idle: ManageActionState = { status: 'idle' };
const MAX = 1000;

export function NoteForm({ ticketNumber }: { ticketNumber: number }) {
  const [state, formAction, pending] = useActionState(addInternalNote, idle);
  const [text, setText] = useState('');
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.status === 'success') setText('');
  }

  return (
    <form onSubmit={submitWithoutReset(formAction)} className='space-y-2'>
      <input type='hidden' name='ticketNumber' value={ticketNumber} />
      <div className='flex items-baseline justify-between gap-2'>
        <Label htmlFor='note'>Internal note</Label>
        <span className='text-xs text-muted-foreground tabular-nums'>
          {text.length}/{MAX}
        </span>
      </div>
      <Textarea
        id='note'
        name='note'
        rows={3}
        maxLength={MAX}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={pending}
        placeholder='Only managers can see this.'
      />
      <Button
        type='submit'
        variant='outline'
        className='w-full'
        disabled={pending || !text.trim()}
      >
        <StickyNote />
        {pending ? 'Adding...' : 'Add note'}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}
