'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';

// Soft fade-up when moving to another page (not on filter changes).
export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
