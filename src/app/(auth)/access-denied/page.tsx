import { SignOutButton } from '@clerk/nextjs';
import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/ui/common/alert';
import { Button } from '@/ui/common/button';

export default function AccessDeniedPage() {
  const domain = process.env['UNIVERSITY_EMAIL_DOMAIN'];

  return (
    <main className='flex min-h-svh items-center justify-center p-4'>
      <div className='w-full max-w-md space-y-4'>
        <Alert variant='destructive'>
          <CircleAlert />
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>
            Only university accounts can sign in. Please use your @{domain}{' '}
            Google account.
          </AlertDescription>
        </Alert>
        <SignOutButton redirectUrl='/sign-in'>
          <Button className='w-full'>Try another account</Button>
        </SignOutButton>
      </div>
    </main>
  );
}
