'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/client';
import { UserRole } from '@/generated/prisma/enums';
import { homePathFor } from '@/utils/role';
import { requireUser } from '@/utils/session';
import { REAL_ROLE } from './constants';
import { VIEW_AS_COOKIE, isViewAsEnabled, parseViewAs } from './view-as';

export async function setViewAs(value: string) {
  if (!isViewAsEnabled()) return;
  await requireUser();
  const store = await cookies();

  if (value === REAL_ROLE) {
    store.delete(VIEW_AS_COOKIE);
    redirect('/');
  }

  const viewAs = parseViewAs(value);
  if (!viewAs) return;
  if (viewAs.role === UserRole.DEPARTMENT_HEAD) {
    const department = await prisma.department.findUnique({
      where: { id: viewAs.departmentId ?? '' },
      select: { id: true },
    });
    if (!department) return;
  }

  store.set(VIEW_AS_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  redirect(homePathFor(viewAs.role));
}
