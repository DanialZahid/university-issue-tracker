import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <main className='flex min-h-svh flex-col items-center justify-center gap-6 p-4'>
      <div className='max-w-sm space-y-2 text-center'>
        <h1 className='text-xl font-semibold'>
          University Complaint and Issue Tracking Platform
        </h1>
        <p className='text-sm text-muted-foreground'>
          Sign in with your university Google account to continue.
        </p>
      </div>
      <SignIn
        appearance={{
          elements: {
            header: { display: 'none' },
            footerAction: { display: 'none' },
          },
        }}
      />
    </main>
  );
}
