'use client';

import { motion } from 'motion/react';

export function WaveHand() {
  return (
    <motion.span
      aria-hidden='true'
      className='inline-block origin-[70%_80%]'
      initial={{ rotate: 0 }}
      animate={{ rotate: [0, 16, -8, 16, -4, 10, 0] }}
      transition={{ duration: 1.6, delay: 0.3, ease: 'easeInOut' }}
    >
      👋
    </motion.span>
  );
}
