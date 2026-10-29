import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/db/user';
import { UserRole } from '@/generated/prisma/enums';

const getCurrentUser = cache(async (clerkId: string) =>
  getUserByClerkId(clerkId),
);

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await getCurrentUser(userId);
  // Signed in with Clerk but no record here: run the university check again.
  if (!user) redirect('/auth/continue');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) redirect('/');
  return user;
}
