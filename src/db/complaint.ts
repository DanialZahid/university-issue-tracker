import 'server-only';
import { prisma } from '@/db/client';
import type { ComplaintInput } from '@/schemas/complaint';
import { detectPriority } from '@/automation/priority-detection';

export async function getComplaintFormOptions() {
  const [categories, locations] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, department: { select: { name: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.location.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      departmentName: c.department.name,
    })),
    locations,
  };
}

// Returns the new ticket number, or null if the category or location is invalid.
export async function createComplaint(
  input: ComplaintInput,
  submittedById: string,
): Promise<number | null> {
  const [category, location] = await Promise.all([
    prisma.category.findUnique({
      where: { id: input.categoryId },
      select: {
        baseEffortMinutes: true,
        name: true,
        departmentId: true,
        department: { select: { name: true } },
      },
    }),
    prisma.location.findUnique({
      where: { id: input.locationId },
      select: { id: true },
    }),
  ]);
  if (!category || !location) return null;

  const priority = detectPriority(
    input.title,
    input.description,
    category.name,
  );

  const complaint = await prisma.complaint.create({
    data: {
      title: input.title,
      description: input.description,
      priority: priority,
      locationDetail: input.locationDetail,
      estimatedEffortMinutes: category.baseEffortMinutes,
      categoryId: input.categoryId,
      locationId: input.locationId,
      submittedById,
      departmentId: category.departmentId,
      assignedAt: new Date(),
      auditLogs: {
        create: [
          {
            action: 'CREATED',
            toValue: 'PENDING',
            performedById: submittedById,
          },
          {
            action: 'ASSIGNED',
            toValue: category.department.name,
            note: 'Auto-assigned from category',
            performedById: submittedById,
          },
          {
            action: 'PRIORITY_CHANGED',
            toValue: priority,
            note: 'Set automatically',
            performedById: submittedById,
          },
        ],
      },
    },
    select: { ticketNumber: true },
  });

  return complaint.ticketNumber;
}

const PAGE_SIZE = 20;

export async function listUserComplaints(userId: string, page: number) {
  const where = { submittedById: userId };
  const [total, items] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    }),
  ]);
  return { total, items, pageSize: PAGE_SIZE };
}

// Matches on ticket AND submitter, so another user's ticket simply returns null.
// Only submitter-safe history is selected: no notes, no priority changes.
export async function getComplaintForSubmitter(
  ticketNumber: number,
  userId: string,
) {
  return prisma.complaint.findFirst({
    where: { ticketNumber, submittedById: userId },
    select: {
      ticketNumber: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      locationDetail: true,
      createdAt: true,
      resolvedAt: true,
      category: { select: { name: true } },
      location: { select: { name: true } },
      department: { select: { name: true } },
      auditLogs: {
        where: { action: { in: ['CREATED', 'ASSIGNED', 'STATUS_CHANGED'] } },
        orderBy: [{ createdAt: 'asc' }, { action: 'asc' }],
        select: {
          id: true,
          action: true,
          fromValue: true,
          toValue: true,
          createdAt: true,
        },
      },
    },
  });
}

// Open complaints by status, for the greeting on My complaints.
export async function getUserOpenCounts(userId: string) {
  const groups = await prisma.complaint.groupBy({
    by: ['status'],
    where: {
      submittedById: userId,
      archivedAt: null,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    _count: { _all: true },
  });
  const count = (status: string) =>
    groups.find((g) => g.status === status)?._count._all ?? 0;
  return { pending: count('PENDING'), inProgress: count('IN_PROGRESS') };
}
