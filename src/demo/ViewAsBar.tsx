import 'server-only';
import { prisma } from '@/db/client';
import { ViewAsSwitcher } from './ViewAsSwitcher';
import { isViewAsEnabled, readViewAs } from './view-as';

export async function ViewAsBar() {
  if (!isViewAsEnabled()) return null;

  const [viewAs, departments] = await Promise.all([
    readViewAs(),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const current = viewAs
    ? viewAs.departmentId
      ? `${viewAs.role}:${viewAs.departmentId}`
      : viewAs.role
    : null;

  return <ViewAsSwitcher current={current} departments={departments} />;
}
