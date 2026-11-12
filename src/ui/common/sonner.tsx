'use client';

import { CheckCircle2, CircleAlert, Info, Loader2 } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

// App-wide toasts: short confirmations for actions done on the same page.
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position='bottom-right'
      duration={3500}
      closeButton
      icons={{
        success: <CheckCircle2 className='size-4 text-green-700' />,
        error: <CircleAlert className='size-4 text-destructive' />,
        info: <Info className='size-4 text-primary' />,
        loading: <Loader2 className='size-4 animate-spin' />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'rounded-xl! border! border-border! bg-card/95! text-foreground! text-sm! shadow-lg! shadow-primary/10! backdrop-blur!',
          description: 'text-muted-foreground!',
          closeButton: 'bg-card! border-border!',
        },
      }}
      {...props}
    />
  );
}
