import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';
import { GraduationCap } from 'lucide-react';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <main className='flex min-h-svh flex-col items-center justify-center gap-6 bg-linear-to-b from-primary/10 via-background to-background p-4'>
      <div className='flex max-w-sm flex-col items-center gap-3 text-center'>
        <span className='flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm'>
          <GraduationCap className='size-6' />
        </span>
        <h1 className='text-xl font-semibold tracking-tight'>
          University Complaint and Issue Tracking Platform
        </h1>
        <p className='text-sm text-muted-foreground'>
          Sign in with your university Google account to continue.
        </p>
      </div>
      <div className='glow'>
        <SignIn
          appearance={{
            elements: {
              header: { display: 'none' },
              footerAction: { display: 'none' },
            },
          }}
        />
      </div>
    </main>
  );
}
