'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { withQuery } from '@/utils/query';

type Crumb = { label: string; href?: string };

function crumbsFor(pathname: string, back: string | null): Crumb[] {
  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] === 'manage') {
    const dashboard: Crumb = {
      label: 'Dashboard',
      href: withQuery(
        '/manage',
        back ? Object.fromEntries(new URLSearchParams(back)) : {},
      ),
    };
    if (parts[1] === 'insights') return [{ label: 'Insights' }];
    if (parts[1] === 'complaints' && parts[2]) {
      return [dashboard, { label: parts[2].toUpperCase() }];
    }
    return [{ label: 'Dashboard' }];
  }

  if (parts[0] === 'complaints') {
    const mine: Crumb = { label: 'My complaints', href: '/complaints' };
    if (parts[1] === 'new') return [mine, { label: 'Submit a complaint' }];
    if (parts[1]) return [mine, { label: parts[1].toUpperCase() }];
    return [{ label: 'My complaints' }];
  }

  return [];
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const back = useSearchParams().get('back');
  const crumbs = crumbsFor(pathname, back);
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label='Breadcrumb' className='hidden min-w-0 sm:block'>
      <ol className='flex items-center gap-1.5 text-sm'>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={crumb.label} className='flex min-w-0 items-center gap-1.5'>
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className='truncate text-muted-foreground transition-colors hover:text-foreground'
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className='truncate font-medium text-foreground'
                >
                  {crumb.label}
                </span>
              )}
              {!last && (
                <ChevronRight className='size-4 shrink-0 text-muted-foreground/60' />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
