'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

// Counts from the previous number to the new one.
export function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(from.current, value, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return <>{(reduce ? value : display).toLocaleString('en-US')}</>;
}
