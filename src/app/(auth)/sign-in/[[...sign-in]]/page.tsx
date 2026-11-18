import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';
import {
  CircleCheck,
  CopyCheck,
  GraduationCap,
  Route,
  type LucideIcon,
} from 'lucide-react';
import { ClearDrafts } from '@/ui/shared/auth/ClearDrafts';
import { SampleComplaints } from '@/ui/shared/auth/SampleComplaints';

export const metadata: Metadata = { title: 'Sign in' };

const FEATURES: { icon: LucideIcon; label: string; color: string }[] = [
  { icon: Route, label: 'Routed automatically', color: 'text-primary' },
  { icon: CopyCheck, label: 'Similar issues shown', color: 'text-violet-600' },
  { icon: CircleCheck, label: 'Track every step', color: 'text-green-600' },
];

// Clerk shows a "Development mode" strip with test keys; the placeholder
// matches it so the card does not jump when it loads.
const clerkTestKeys =
  process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']?.startsWith('pk_test') ??
  false;

const rise = (delay: number) =>
  ({ '--rise-delay': `${delay}s` }) as CSSProperties;

export default function SignInPage() {
  return (
    <main className='relative isolate min-h-svh overflow-hidden bg-background'>
      <ClearDrafts />

      <div aria-hidden='true' className='absolute inset-0 -z-10'>
        <div className='signin-blob top-28 right-[4%] size-140 animate-[signin-drift-a_14s_ease-in-out_infinite] bg-[oklch(0.72_0.14_260/0.32)]' />
        <div className='signin-blob -bottom-40 left-[4%] size-104 animate-[signin-drift-b_16s_ease-in-out_infinite] bg-[oklch(0.78_0.12_340/0.22)]' />
        <div className='signin-dots' />
      </div>

      <div className='mx-auto flex min-h-svh max-w-7xl flex-col px-6 sm:px-10'>
        <header className='rise-in flex items-center gap-4 py-7'>
          <span className='relative grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_30px_-10px_rgb(21_93_252/0.6)]'>
            <span aria-hidden='true' className='logo-ring' />
            <span
              aria-hidden='true'
              className='logo-ring'
              style={{ animationDelay: '1.4s' }}
            />
            <GraduationCap className='relative size-6' />
          </span>
          <span className='font-semibold'>
            University Complaint and Issue Tracking Platform
          </span>
        </header>

        <div className='grid flex-1 items-center gap-12 pb-16 lg:grid-cols-[1.15fr_1fr] xl:gap-20'>
          <section aria-labelledby='signin-heading'>
            <h1
              id='signin-heading'
              className='rise-in text-[2rem] leading-tight font-bold tracking-tight sm:text-5xl lg:text-4xl xl:text-5xl'
            >
              {/* One line each, except on the narrowest phones. */}
              <span className='block min-[400px]:whitespace-nowrap'>
                Report campus issues.
              </span>{' '}
              <span className='block text-primary min-[400px]:whitespace-nowrap'>
                Track them to done.
              </span>
            </h1>
            <p
              className='rise-in mt-5 max-w-lg text-lg text-muted-foreground xl:text-xl'
              style={rise(0.1)}
            >
              Describe the issue in your own words. Category, department,
              location, and priority are filled in for you.
            </p>

            <div className='rise-in mt-8 w-full max-w-xl' style={rise(0.2)}>
              {/* The placeholder and Clerk's card share one grid cell. The
                  placeholder holds the height from the first paint, and the
                  real card fades in on top of it and covers it, so nothing
                  moves. No CSS here depends on Clerk's inner markup. */}
              <div className='grid'>
                <div
                  aria-hidden='true'
                  className='col-start-1 row-start-1 overflow-hidden rounded-xl border bg-card'
                >
                  <div className='px-10 py-7'>
                    <div className='h-10 animate-pulse rounded-md border bg-muted/50' />
                  </div>
                  {clerkTestKeys && (
                    <div className='h-11 border-t bg-muted/40' />
                  )}
                </div>
                <div className='relative col-start-1 row-start-1'>
                  <SignIn
                    appearance={{
                      elements: {
                        rootBox: { width: '100%' },
                        cardBox: {
                          width: '100%',
                          animation: 'fade-in 0.4s ease-out both',
                          border: '1px solid var(--border)',
                          boxShadow:
                            '0 1px 2px rgb(0 0 0 / 0.04), 0 18px 40px -18px rgb(21 93 252 / 0.3)',
                        },
                        card: {
                          boxShadow: 'none',
                          borderRadius: 0,
                          borderBottom: '1px solid var(--border)',
                        },
                        header: { display: 'none' },
                        footerAction: { display: 'none' },
                      },
                    }}
                  />
                </div>
              </div>
              {/* Outside the card: Clerk does not allow custom text inside it. */}
              <p className='mt-4 text-center text-sm text-muted-foreground'>
                Use your university email. Other accounts are not accepted.
              </p>
            </div>

            {/* Wide screens: one row, every chip as wide as the widest.
                Narrower: they wrap, and a chip alone on a row stretches. */}
            <ul
              className='rise-in mt-8 flex flex-wrap gap-2 xl:inline-grid xl:auto-cols-fr xl:grid-flow-col'
              style={rise(0.3)}
            >
              {FEATURES.map(({ icon: Icon, label, color }, i) => (
                <li
                  key={label}
                  className='inline-flex min-w-fit flex-1 items-center justify-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-sm whitespace-nowrap'
                >
                  <Icon
                    aria-hidden='true'
                    className={`icon-draw size-4 ${color}`}
                    style={{ '--draw-delay': `${i * 0.6}s` } as CSSProperties}
                  />
                  {label}
                </li>
              ))}
            </ul>
          </section>

          <div className='hidden lg:block'>
            <SampleComplaints />
          </div>
        </div>
      </div>
    </main>
  );
}
