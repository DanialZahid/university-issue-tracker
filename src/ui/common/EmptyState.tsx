import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: Props) {
  return (
    <div className='flex flex-col items-center rounded-xl border border-dashed bg-muted/30 px-6 py-14 text-center'>
      <div className='mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary'>
        <Icon className='size-7' />
      </div>
      <p className='text-lg font-semibold'>{title}</p>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
        {description}
      </p>
      {children && <div className='mt-5'>{children}</div>}
    </div>
  );
}
