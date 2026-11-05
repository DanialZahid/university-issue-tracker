'use client';

import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';

// Every animation follows the system "reduce motion" setting.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion='user'>{children}</MotionConfig>;
}
