'use client';

import { useEffect } from 'react';
import type { Tone } from './complaint-tone';

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
