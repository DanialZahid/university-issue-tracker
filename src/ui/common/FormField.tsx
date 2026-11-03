import type { ReactNode } from 'react';
import { Label } from '@/ui/common/label';

type Props = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  required?: boolean;
  count?: { current: number; max: number };
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  optional,
  required,
  count,
  children,
}: Props) {
  return (
    <div className='space-y-2'>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className='text-destructive' aria-hidden='true'>
            {' '}
            *
          </span>
        )}
        {optional && (
          <span className='font-normal text-muted-foreground'> (optional)</span>
        )}
      </Label>
      {children}
      {(error || hint || count) && (
        <div className='flex items-start justify-between gap-4 text-sm'>
          {error ? (
            <p id={`${htmlFor}-error`} className='text-destructive'>
              {error}
            </p>
          ) : hint ? (
            <p className='text-muted-foreground'>{hint}</p>
          ) : (
            <span />
          )}
          {count && (
            <p className='shrink-0 text-muted-foreground tabular-nums'>
              {count.current}/{count.max}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
