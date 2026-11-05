import type { Metadata } from 'next';
import { SignOutButton } from '@clerk/nextjs';
import { LogOut, ShieldAlert } from 'lucide-react';
import { Button } from '@/ui/common/button';

export const metadata: Metadata = { title: 'Access restricted' };

export default function AccessDeniedPage() {
  const domain = process.env['UNIVERSITY_EMAIL_DOMAIN'];

  return (
    <main className='flex min-h-svh items-center justify-center bg-linear-to-b from-primary/10 via-background to-background p-4'>
      <div className='glow w-full max-w-md'>
        <div className='rounded-2xl border bg-card p-8 text-center shadow-sm'>
          <span className='mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-100 text-red-700'>
            <ShieldAlert className='size-7' />
          </span>
          <h1 className='text-xl font-semibold tracking-tight'>
            Access restricted
          </h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            Only university accounts can sign in. Please use your{' '}
            <span className='font-medium text-foreground'>@{domain}</span>{' '}
            Google account.
          </p>
          <SignOutButton redirectUrl='/sign-in'>
            <Button className='mt-6 w-full'>
              <LogOut />
              Try another account
            </Button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}
