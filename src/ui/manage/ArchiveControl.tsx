'use client';

import { useActionState } from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { toggleArchive, type ManageActionState } from '@/actions/manage';
import { Button } from '@/ui/common/button';
import { ActionMessage } from './ComplaintActions';
import { submitWithoutReset } from './form-submit';

const idle: ManageActionState = { status: 'idle' };

type Props = { ticketNumber: number; archived: boolean; resolved: boolean };

export function ArchiveControl({ ticketNumber, archived, resolved }: Props) {
  const [state, formAction, pending] = useActionState(toggleArchive, idle);

  if (!archived && !resolved) {
    return (
      <p className='text-sm text-muted-foreground'>
        Resolve this complaint to archive it.
      </p>
    );
  }

  return (
    <form onSubmit={submitWithoutReset(formAction)} className='space-y-2'>
      <input type='hidden' name='ticketNumber' value={ticketNumber} />
      <input
        type='hidden'
        name='archive'
        value={archived ? 'restore' : 'archive'}
      />
      <Button
        type='submit'
        variant={archived ? 'default' : 'outline'}
        className='w-full'
        disabled={pending}
      >
        {archived ? <ArchiveRestore /> : <Archive />}
        {archived ? 'Restore from archive' : 'Archive'}
      </Button>
      <p className='text-xs text-muted-foreground'>
        {archived
          ? 'Restoring makes it editable again.'
          : 'Archived complaints leave the active queue but stay viewable.'}
      </p>
      <ActionMessage state={state} />
    </form>
  );
}
