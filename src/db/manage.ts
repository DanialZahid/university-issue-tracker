import 'server-only';
import { prisma } from '@/db/client';
import type { Prisma } from '@/generated/prisma/client';
import {
  UserRole,
  type ComplaintStatus,
  type Priority,
} from '@/generated/prisma/enums';
import type { QueueFilters } from '@/schemas/queue-filters';
import { parseTicketNumber } from '@/utils/ticket';
import { ATTACHMENT_SELECT } from '@/db/complaint';
import { campusDayStart, campusYmd, formatShortDay } from '@/utils/date';

type ScopeUser = { role: UserRole; departmentId: string | null };
type ActingUser = ScopeUser & { id: string };

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
    case 'ANY':
      return {};
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

// Filters every view shares: search, category, location and date.
// Status and priority are left out because the stat cards set those.
function sharedWhere(filters: QueueFilters): Prisma.ComplaintWhereInput[] {
  return [
    searchWhere(filters.q),
    filters.category ? { categoryId: filters.category } : {},
    filters.location ? { locationId: filters.location } : {},
    dateWhere(filters.from, filters.to),
  ];
}

export async function getQueueCounts(
  scope: Prisma.ComplaintWhereInput,
  filters: QueueFilters,
) {
  const shared = sharedWhere(filters);
  const [groups, criticalOpen] = await Promise.all([
    prisma.complaint.groupBy({
      by: ['status'],
      where: {
        AND: [
          scope,
          ...shared,
          { archivedAt: null },
          filters.priority ? { priority: filters.priority } : {},
        ],
      },
      _count: { _all: true },
    }),
    prisma.complaint.count({
      where: {
        AND: [
          scope,
          ...shared,
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
  newestFirst = false,
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
    newestFirst ||
    filters.status === 'RESOLVED' ||
    filters.status === 'ARCHIVED';
  return finished
    ? [{ createdAt: 'desc' }]
    : [{ priority: 'desc' }, { createdAt: 'asc' }];
}

const DAY_MS = 86_400_000;

function dateWhere(from?: string, to?: string): Prisma.ComplaintWhereInput {
  if (!from && !to) return {};
  const [start, end] = from && to && from > to ? [to, from] : [from, to];
  return {
    createdAt: {
      ...(start ? { gte: campusDayStart(start) } : {}),
      ...(end ? { lt: new Date(campusDayStart(end).getTime() + DAY_MS) } : {}),
    },
  };
}

export async function listQueue(
  scope: Prisma.ComplaintWhereInput,
  filters: QueueFilters,
  { newestFirst = false }: { newestFirst?: boolean } = {},
) {
  const where: Prisma.ComplaintWhereInput = {
    AND: [
      scope,
      statusWhere(filters.status),
      filters.priority ? { priority: filters.priority } : {},
      ...sharedWhere(filters),
    ],
  };

  const [total, items] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      orderBy: orderFor(filters, newestFirst),
      skip: (filters.page - 1) * filters.size,
      take: filters.size,
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

  const [categories, departments, locations] = await Promise.all([
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
    prisma.location.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return { categories, departments, locations };
}

export async function getComplaintForManager(
  ticketNumber: number,
  user: ScopeUser,
) {
  return prisma.complaint.findFirst({
    where: { AND: [managerScope(user), { ticketNumber }] },
    select: {
      ticketNumber: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      locationDetail: true,
      createdAt: true,
      resolvedAt: true,
      archivedAt: true,
      attachments: ATTACHMENT_SELECT,
      category: { select: { name: true } },
      location: { select: { name: true } },
      department: { select: { id: true, name: true } },
      submittedBy: { select: { name: true, email: true } },
      auditLogs: {
        orderBy: [{ createdAt: 'asc' }, { action: 'asc' }],
        select: {
          id: true,
          action: true,
          fromValue: true,
          toValue: true,
          note: true,
          createdAt: true,
          performedBy: { select: { name: true } },
        },
      },
    },
  });
}

export type UpdateOutcome =
  | 'ok'
  | 'unchanged'
  | 'not-found'
  | 'archived'
  | 'conflict'
  | 'invalid'
  | 'not-resolved';

async function findEditable(user: ActingUser, ticketNumber: number) {
  return prisma.complaint.findFirst({
    where: { AND: [managerScope(user), { ticketNumber }] },
    select: {
      id: true,
      status: true,
      priority: true,
      archivedAt: true,
      departmentId: true,
      department: { select: { name: true } },
    },
  });
}

export async function changeStatus(
  user: ActingUser,
  ticketNumber: number,
  status: ComplaintStatus,
  expected: ComplaintStatus,
): Promise<UpdateOutcome> {
  const c = await findEditable(user, ticketNumber);
  if (!c) return 'not-found';
  if (c.archivedAt) return 'archived';
  if (c.status !== expected) return 'conflict';
  if (c.status === status) return 'unchanged';

  return prisma.$transaction(async (tx) => {
    // Only applies if nobody changed the status since we read it.
    const { count } = await tx.complaint.updateMany({
      where: { id: c.id, status: expected },
      data: { status, resolvedAt: status === 'RESOLVED' ? new Date() : null },
    });
    if (count === 0) return 'conflict';
    await tx.auditLog.create({
      data: {
        action: 'STATUS_CHANGED',
        fromValue: c.status,
        toValue: status,
        complaintId: c.id,
        performedById: user.id,
      },
    });
    return 'ok';
  });
}

export async function changePriority(
  user: ActingUser,
  ticketNumber: number,
  priority: Priority,
  expected: Priority,
): Promise<UpdateOutcome> {
  const c = await findEditable(user, ticketNumber);
  if (!c) return 'not-found';
  if (c.archivedAt) return 'archived';
  if (c.priority !== expected) return 'conflict';
  if (c.priority === priority) return 'unchanged';

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.complaint.updateMany({
      where: { id: c.id, priority: expected },
      data: { priority },
    });
    if (count === 0) return 'conflict';
    await tx.auditLog.create({
      data: {
        action: 'PRIORITY_CHANGED',
        fromValue: c.priority,
        toValue: priority,
        complaintId: c.id,
        performedById: user.id,
      },
    });
    return 'ok';
  });
}

// Where a complaint went, shown only to the person who forwarded it.
export async function getForwardDestination(
  ticketNumber: number,
  userId: string,
) {
  const entry = await prisma.auditLog.findFirst({
    where: {
      action: 'ASSIGNED',
      performedById: userId,
      complaint: { ticketNumber },
    },
    orderBy: { createdAt: 'desc' },
    select: { toValue: true },
  });
  return entry?.toValue ?? null;
}

export async function listDepartments() {
  return prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export async function forwardComplaint(
  user: ActingUser,
  ticketNumber: number,
  departmentId: string,
  expected: string,
  reason?: string,
): Promise<UpdateOutcome> {
  const c = await findEditable(user, ticketNumber);
  if (!c) return 'not-found';
  if (c.archivedAt) return 'archived';
  if (c.departmentId !== expected) return 'conflict';
  if (c.departmentId === departmentId) return 'unchanged';

  const target = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { name: true },
  });
  if (!target) return 'invalid';

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.complaint.updateMany({
      where: { id: c.id, departmentId: expected },
      // Staff belong to a department, so the old assignment no longer applies.
      data: { departmentId, assignedAt: new Date(), assignedStaffId: null },
    });
    if (count === 0) return 'conflict';
    await tx.auditLog.create({
      data: {
        action: 'ASSIGNED',
        fromValue: c.department?.name ?? null,
        toValue: target.name,
        note: reason ?? null,
        complaintId: c.id,
        performedById: user.id,
      },
    });
    return 'ok';
  });
}

export async function addNote(
  user: ActingUser,
  ticketNumber: number,
  note: string,
): Promise<UpdateOutcome> {
  const c = await findEditable(user, ticketNumber);
  if (!c) return 'not-found';
  await prisma.auditLog.create({
    data: {
      action: 'NOTE_ADDED',
      note,
      complaintId: c.id,
      performedById: user.id,
    },
  });
  return 'ok';
}

export async function setArchived(
  user: ActingUser,
  ticketNumber: number,
  archive: boolean,
): Promise<UpdateOutcome> {
  const c = await findEditable(user, ticketNumber);
  if (!c) return 'not-found';
  if (archive) {
    if (c.archivedAt) return 'unchanged';
    if (c.status !== 'RESOLVED') return 'not-resolved';
  } else if (!c.archivedAt) {
    return 'unchanged';
  }

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.complaint.updateMany({
      where: archive
        ? { id: c.id, archivedAt: null, status: 'RESOLVED' }
        : { id: c.id, archivedAt: { not: null } },
      data: { archivedAt: archive ? new Date() : null },
    });
    if (count === 0) return 'conflict';
    await tx.auditLog.create({
      data: {
        action: archive ? 'ARCHIVED' : 'UNARCHIVED',
        complaintId: c.id,
        performedById: user.id,
      },
    });
    return 'ok';
  });
}

export type TrendPoint = {
  day: string;
  label: string;
  submitted: number;
  resolved: number;
};

// New and resolved complaints per campus day, for the dashboard chart.
// Follows search, category, location and priority (not status or the date
// filter: the chart has its own 30-day window).
export async function getDailyTrend(
  scope: Prisma.ComplaintWhereInput,
  filters: QueueFilters,
  days = 30,
): Promise<TrendPoint[]> {
  const todayStart = campusDayStart(campusYmd(new Date()));
  const start = new Date(todayStart.getTime() - (days - 1) * DAY_MS);
  const base: Prisma.ComplaintWhereInput[] = [
    scope,
    searchWhere(filters.q),
    filters.category ? { categoryId: filters.category } : {},
    filters.location ? { locationId: filters.location } : {},
    filters.priority ? { priority: filters.priority } : {},
  ];

  const [created, resolved] = await Promise.all([
    prisma.complaint.findMany({
      where: { AND: [...base, { createdAt: { gte: start } }] },
      select: { createdAt: true },
    }),
    prisma.complaint.findMany({
      where: { AND: [...base, { resolvedAt: { gte: start } }] },
      select: { resolvedAt: true },
    }),
  ]);

  const points = new Map<string, TrendPoint>();
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * DAY_MS + DAY_MS / 2);
    const day = campusYmd(date);
    points.set(day, {
      day,
      label: formatShortDay(date),
      submitted: 0,
      resolved: 0,
    });
  }
  for (const c of created) {
    const p = points.get(campusYmd(c.createdAt));
    if (p) p.submitted++;
  }
  for (const c of resolved) {
    if (!c.resolvedAt) continue;
    const p = points.get(campusYmd(c.resolvedAt));
    if (p) p.resolved++;
  }
  return [...points.values()];
}

export async function getInsights(scope: Prisma.ComplaintWhereInput) {
  const since = new Date(Date.now() - 30 * DAY_MS);
  const open: Prisma.ComplaintWhereInput = {
    AND: [
      scope,
      { archivedAt: null, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    ],
  };

  const [resolved, openCount, byCategory, byLocation, categories, locations] =
    await Promise.all([
      prisma.complaint.count({
        where: { AND: [scope, { resolvedAt: { gte: since } }] },
      }),
      prisma.complaint.count({ where: open }),
      prisma.complaint.groupBy({
        by: ['categoryId'],
        where: open,
        _count: { _all: true },
      }),
      prisma.complaint.groupBy({
        by: ['locationId'],
        where: open,
        _count: { _all: true },
      }),
      prisma.category.findMany({ select: { id: true, name: true } }),
      prisma.location.findMany({ select: { id: true, name: true } }),
    ]);

  const named = (
    rows: { id: string; count: number }[],
    names: { id: string; name: string }[],
  ) =>
    rows
      .map((r) => ({
        name: names.find((n) => n.id === r.id)?.name ?? 'Unknown',
        count: r.count,
      }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);

  return {
    resolvedCount: resolved,
    openCount,
    byCategory: named(
      byCategory.map((g) => ({ id: g.categoryId, count: g._count._all })),
      categories,
    ),
    byLocation: named(
      byLocation.map((g) => ({ id: g.locationId, count: g._count._all })),
      locations,
    ),
  };
}

// Other complaints that carry any of these images (matched by fingerprint).
// A reused picture can mean a copied or recycled report. Tickets the viewer
// can open are listed; the rest are only counted.
export async function findReusedImages(
  ticketNumber: number,
  sha256s: string[],
  user: ScopeUser,
): Promise<{ images: number; tickets: number[]; elsewhere: number }> {
  const none = { images: 0, tickets: [], elsewhere: 0 };
  if (sha256s.length === 0) return none;
  const rows = await prisma.attachment.findMany({
    where: {
      sha256: { in: sha256s },
      complaint: { ticketNumber: { not: ticketNumber } },
    },
    select: {
      sha256: true,
      complaint: { select: { ticketNumber: true, departmentId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  if (rows.length === 0) return none;

  const visible = new Set<number>();
  const hidden = new Set<number>();
  for (const { complaint } of rows) {
    const canOpen =
      user.role === UserRole.SUPERUSER ||
      complaint.departmentId === user.departmentId;
    (canOpen ? visible : hidden).add(complaint.ticketNumber);
  }
  return {
    images: new Set(rows.map((r) => r.sha256)).size,
    tickets: [...visible],
    elsewhere: hidden.size,
  };
}
