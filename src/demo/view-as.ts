import 'server-only';
import { cookies } from 'next/headers';
import { UserRole } from '@/generated/prisma/enums';

// TEMPORARY: dev and showcase only. Lets anyone signed in preview the app as
// another role. Turned on by DEMO_ROLE_SWITCH=1. Remove the src/demo folder,
// the hook in src/utils/session.ts and the bar in AppShell before final delivery.

export const VIEW_AS_COOKIE = 'demo-view-as';

export type ViewAs = { role: UserRole; departmentId: string | null };

const ROLES = Object.values(UserRole);

export function isViewAsEnabled() {
  return process.env['DEMO_ROLE_SWITCH'] === '1';
}

// Cookie value is "ROLE" or "DEPARTMENT_HEAD:<departmentId>".
export function parseViewAs(value: string | undefined): ViewAs | null {
  if (!value) return null;
  const [role, departmentId] = value.split(':');
  if (!ROLES.includes(role as UserRole)) return null;
  if (role === UserRole.DEPARTMENT_HEAD) {
    return departmentId
      ? { role: UserRole.DEPARTMENT_HEAD, departmentId }
      : null;
  }
  return { role: role as UserRole, departmentId: null };
}

export async function readViewAs(): Promise<ViewAs | null> {
  if (!isViewAsEnabled()) return null;
  const store = await cookies();
  return parseViewAs(store.get(VIEW_AS_COOKIE)?.value);
}

// Swaps only role and department for this request. The database is never
// changed, and actions stay recorded under the real account.
export async function applyViewAs<T extends ViewAs>(user: T): Promise<T> {
  const viewAs = await readViewAs();
  return viewAs ? { ...user, ...viewAs } : user;
}
