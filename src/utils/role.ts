import type { UserRole } from '@/generated/prisma/enums';

export const roleLabels: Record<UserRole, string> = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  ADMIN: 'Administrator',
};
