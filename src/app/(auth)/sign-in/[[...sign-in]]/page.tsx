import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className='flex min-h-svh flex-col items-center justify-center gap-6 p-4'>
      <h1 className='max-w-sm text-center text-xl font-semibold'>
        University Complaint and Issue Tracking Platform
      </h1>
      <SignIn />
    </main>
  );
}
