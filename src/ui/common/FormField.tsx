import type { ReactNode } from 'react';
import { Label } from '@/ui/common/label';

type Props = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: Props) {
  return (
    <div className='space-y-2'>
      <Label htmlFor={htmlFor}>
        {label}
        {optional && (
          <span className='font-normal text-muted-foreground'> (optional)</span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className='text-sm text-destructive'>
          {error}
        </p>
      ) : hint ? (
        <p className='text-sm text-muted-foreground'>{hint}</p>
      ) : null}
    </div>
  );
}
