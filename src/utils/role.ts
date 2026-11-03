import { UserRole } from '@/generated/prisma/enums';

export const roleLabels: Record<UserRole, string> = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  DEPARTMENT_HEAD: 'Department head',
  SUPERUSER: 'Superuser',
};

export function isManager(role: UserRole) {
  return role === UserRole.DEPARTMENT_HEAD || role === UserRole.SUPERUSER;
}

export function homePathFor(role: UserRole) {
  return isManager(role) ? '/manage' : '/complaints';
}
