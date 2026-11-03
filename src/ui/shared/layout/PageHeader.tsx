import type { LucideIcon } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: PageHeaderProps) {
  return (
    <div className='mb-6 flex flex-wrap items-start justify-between gap-3'>
      <div className='flex items-center gap-3'>
        {Icon && (
          <span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
            <Icon className='size-5' />
          </span>
        )}
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>
          {description && (
            <p className='mt-0.5 text-sm text-muted-foreground'>
              {description}
            </p>
          )}
        </div>
      </div>
      {actions}
    </div>
  );
}
