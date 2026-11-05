import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { applyViewAs } from '@/demo/view-as';
import { getUserByClerkId } from '@/db/user';
import { UserRole } from '@/generated/prisma/enums';
import { isManager } from '@/utils/role';

const getCurrentUser = cache(async (clerkId: string) =>
  getUserByClerkId(clerkId),
);

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await getCurrentUser(userId);
  // Signed in with Clerk but no record here: run the university check again.
  if (!user) redirect('/auth/continue');
  return applyViewAs(user); // TEMPORARY demo hook: return user;
}

export async function requireManager() {
  const user = await requireUser();
  if (!isManager(user.role)) redirect('/');
  return user;
}

export async function requireSuperuser() {
  const user = await requireUser();
  if (user.role !== UserRole.SUPERUSER) redirect('/');
  return user;
}
