import 'server-only';
import { prisma } from '@/db/client';
import { UserRole } from '@/generated/prisma/enums';

type SyncUserInput = {
  clerkId: string;
  name: string;
  email: string;
  isAdmin: boolean;
};

export async function syncUser({
  clerkId,
  name,
  email,
  isAdmin,
}: SyncUserInput) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ clerkId }, { email }] },
  });

  if (!existing) {
    return prisma.user.create({
      data: {
        clerkId,
        name,
        email,
        role: isAdmin ? UserRole.ADMIN : UserRole.STUDENT,
      },
    });
  }

  // Admin comes only from ADMIN_EMAILS. Faculty and Student are left as they are.
  let role = existing.role;
  if (isAdmin) role = UserRole.ADMIN;
  else if (existing.role === UserRole.ADMIN) role = UserRole.STUDENT;

  return prisma.user.update({
    where: { id: existing.id },
    data: { clerkId, name, email, role },
  });
}

export function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId } });
}
