import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/common/tooltip';

type Props = {
  label: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
};

// children must be a single element (span, link, button).
export function Hint({ label, children, side = 'top' }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
