import 'server-only';
import { prisma } from '@/db/client';
import { UserRole } from '@/generated/prisma/enums';

type SyncUserInput = {
  clerkId: string;
  name: string;
  email: string;
  isSuperuser: boolean;
};

export async function syncUser({
  clerkId,
  name,
  email,
  isSuperuser,
}: SyncUserInput) {
  const [existing, headOf] = await Promise.all([
    prisma.user.findFirst({ where: { OR: [{ clerkId }, { email }] } }),
    prisma.department.findUnique({ where: { headEmail: email } }),
  ]);

  // Superuser and head status come only from configuration, never from the user.
  let role: UserRole = UserRole.STUDENT;
  let departmentId: string | null = null;
  if (isSuperuser) {
    role = UserRole.SUPERUSER;
  } else if (headOf) {
    role = UserRole.DEPARTMENT_HEAD;
    departmentId = headOf.id;
  } else if (existing?.role === UserRole.FACULTY) {
    role = UserRole.FACULTY;
  }

  const data = { clerkId, name, email, role, departmentId };
  return existing
    ? prisma.user.update({ where: { id: existing.id }, data })
    : prisma.user.create({ data });
}

export function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId } });
}

export async function getDepartmentName(id: string | null) {
  if (!id) return null;
  const department = await prisma.department.findUnique({
    where: { id },
    select: { name: true },
  });
  return department?.name ?? null;
}
