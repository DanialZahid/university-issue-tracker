'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Hint } from '@/ui/common/Hint';
import { cn } from '@/utils/cn';

type Props = { value: string; label?: string; className?: string };

export function CopyButton({ value, label = 'Copy', className }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Hint label={copied ? 'Copied' : label}>
      <button
        type='button'
        aria-label={label}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
          } catch {
            // Clipboard can be blocked (for example on plain http); fail quietly.
          }
        }}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
          copied && 'text-green-600 hover:text-green-600',
          className,
        )}
      >
        {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
      </button>
    </Hint>
  );
}
