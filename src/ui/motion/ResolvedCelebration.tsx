'use client';

import { useEffect } from 'react';
import { celebrate } from './celebrate';

// Plays once per complaint, the first time the submitter sees it resolved.
export function ResolvedCelebration({ ticket }: { ticket: string }) {
  useEffect(() => {
    const key = `seen-resolved-${ticket}`;
    try {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, '1');
    } catch {
      return;
    }
    void celebrate();
  }, [ticket]);

  return null;
}
