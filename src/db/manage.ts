import 'server-only';
import { prisma } from '@/db/client';
import type { Prisma } from '@/generated/prisma/client';
import { UserRole, type ComplaintStatus } from '@/generated/prisma/enums';
import type { QueueFilters } from '@/schemas/queue-filters';
import { parseTicketNumber } from '@/utils/ticket';

export const QUEUE_PAGE_SIZE = 25;

type ScopeUser = { role: UserRole; departmentId: string | null };

export function managerScope(
  user: ScopeUser,
  requestedDepartment?: string,
): Prisma.ComplaintWhereInput {
  if (user.role === UserRole.SUPERUSER) {
    return requestedDepartment ? { departmentId: requestedDepartment } : {};
  }
  // Heads only ever see their own department, whatever the URL says.
  return { departmentId: user.departmentId ?? '' };
}

function statusWhere(
  status: QueueFilters['status'],
): Prisma.ComplaintWhereInput {
  switch (status) {
    case 'OPEN':
      return { archivedAt: null, status: { in: ['PENDING', 'IN_PROGRESS'] } };
    case 'ARCHIVED':
      return { archivedAt: { not: null } };
    case 'ALL':
      return { archivedAt: null };
    default:
      return { archivedAt: null, status };
  }
}

function searchWhere(q?: string): Prisma.ComplaintWhereInput {
  if (!q) return {};
  const ticket =
    parseTicketNumber(q) ?? (/^\d{1,9}$/.test(q) ? Number(q) : null);
  return {
    OR: [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      ...(ticket !== null ? [{ ticketNumber: ticket }] : []),
    ],
  };
}

export async function getQueueCounts(scope: Prisma.ComplaintWhereInput) {
  const [groups, criticalOpen] = await Promise.all([
    prisma.complaint.groupBy({
      by: ['status'],
      where: { AND: [scope, { archivedAt: null }] },
      _count: { _all: true },
    }),
    prisma.complaint.count({
      where: {
        AND: [
          scope,
          {
            archivedAt: null,
            priority: 'CRITICAL',
            status: { not: 'RESOLVED' },
          },
        ],
      },
    }),
  ]);

  const by: Partial<Record<ComplaintStatus, number>> = {};
  for (const g of groups) by[g.status] = g._count._all;

  return {
    pending: by.PENDING ?? 0,
    inProgress: by.IN_PROGRESS ?? 0,
    resolved: by.RESOLVED ?? 0,
    criticalOpen,
  };
}

function orderFor(
  filters: QueueFilters,
): Prisma.ComplaintOrderByWithRelationInput[] {
  const dir = filters.dir ?? 'asc';
  switch (filters.sort) {
    case 'ticket':
      return [{ ticketNumber: dir }];
    case 'priority':
      return [{ priority: dir }, { createdAt: 'asc' }];
    case 'status':
      return [{ status: dir }, { createdAt: 'asc' }];
    case 'department':
      return [{ department: { name: dir } }, { createdAt: 'asc' }];
    case 'age':
      // Larger age = older, so "age descending" means oldest first.
      return [{ createdAt: dir === 'asc' ? 'desc' : 'asc' }];
  }
  // Default: open work by urgency then oldest; finished work newest first.
  const finished =
    filters.status === 'RESOLVED' || filters.status === 'ARCHIVED';
  return finished
    ? [{ createdAt: 'desc' }]
    : [{ priority: 'desc' }, { createdAt: 'asc' }];
}

export async function listQueue(
  scope: Prisma.ComplaintWhereInput,
  filters: QueueFilters,
) {
  const where: Prisma.ComplaintWhereInput = {
    AND: [
      scope,
      statusWhere(filters.status),
      searchWhere(filters.q),
      filters.priority ? { priority: filters.priority } : {},
      filters.category ? { categoryId: filters.category } : {},
    ],
  };

  const [total, items] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      orderBy: orderFor(filters),
      skip: (filters.page - 1) * QUEUE_PAGE_SIZE,
      take: QUEUE_PAGE_SIZE,
      select: {
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        locationDetail: true,
        createdAt: true,
        category: { select: { name: true } },
        location: { select: { name: true } },
        department: { select: { name: true } },
      },
    }),
  ]);

  return { total, items };
}

export type QueueItem = Awaited<ReturnType<typeof listQueue>>['items'][number];

export async function getFilterOptions(user: ScopeUser) {
  const isSuperuser = user.role === UserRole.SUPERUSER;
  const ownDepartment = { departmentId: user.departmentId ?? '' };

  const [categories, departments] = await Promise.all([
    prisma.category.findMany({
      where: isSuperuser ? {} : ownDepartment,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.department.findMany({
      where: isSuperuser ? {} : { id: user.departmentId ?? '' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return { categories, departments };
}
