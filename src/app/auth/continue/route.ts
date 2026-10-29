import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { syncUser } from '@/db/user';
import { isAdminEmail, isUniversityEmail } from '@/utils/auth-policy';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const clerkUser = await currentUser();
  const emailAddress = clerkUser?.primaryEmailAddress;
  const email = emailAddress?.emailAddress;
  const isVerified = emailAddress?.verification?.status === 'verified';

  if (!clerkUser || !email || !isVerified || !isUniversityEmail(email)) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  await syncUser({
    clerkId: userId,
    name: clerkUser.fullName ?? email.split('@')[0],
    email: email.toLowerCase(),
    isAdmin: isAdminEmail(email),
  });

  // Role-based landing pages arrive with the base layout.
  return NextResponse.redirect(new URL('/', request.url));
}
