'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/common/tooltip';
import { cn } from '@/utils/cn';

type Props = { children: ReactNode; label?: ReactNode; className?: string };

export function TruncatedText({ children, label, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        const el = ref.current;
        setOpen(next && !!el && el.scrollWidth > el.clientWidth);
      }}
    >
      <TooltipTrigger asChild>
        <span ref={ref} className={cn('block truncate', className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{label ?? children}</TooltipContent>
    </Tooltip>
  );
}
