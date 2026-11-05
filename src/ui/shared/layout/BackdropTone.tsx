'use client';

import { useEffect } from 'react';
import type { ComplaintStatus, Priority } from '@/generated/prisma/enums';

export type Tone = 'pending' | 'in-progress' | 'resolved' | 'critical';

// Resolved wins, then Critical, then the status itself.
export function complaintTone(
  status: ComplaintStatus,
  priority: Priority,
): Tone {
  if (status === 'RESOLVED') return 'resolved';
  if (priority === 'CRITICAL') return 'critical';
  return status === 'IN_PROGRESS' ? 'in-progress' : 'pending';
}

// Tints the page background while this page is open, then puts it back.
export function BackdropTone({ tone }: { tone: Tone }) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset['backdrop'] = tone;
    return () => {
      delete root.dataset['backdrop'];
    };
  }, [tone]);
  return null;
}
