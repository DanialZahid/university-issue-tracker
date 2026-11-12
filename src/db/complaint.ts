import 'server-only';
import { prisma } from '@/db/client';
import { NO_PLACE, type ComplaintInput } from '@/schemas/complaint';
import type { AttachmentInput } from '@/schemas/attachment';
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

export const ATTACHMENT_SELECT = {
  orderBy: { createdAt: 'asc' },
  select: {
    id: true,
    url: true,
    fileName: true,
    sizeBytes: true,
    sha256: true,
    hasCameraExif: true,
  },
} as const;

// Returns the new ticket number, or null if the category or location is invalid.
export async function createComplaint(
  input: ComplaintInput,
  submittedById: string,
  attachments: AttachmentInput[] = [],
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
      where: input.locationId ? { id: input.locationId } : { name: NO_PLACE },
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
      locationId: location.id,
      submittedById,
      departmentId: category.departmentId,
      assignedAt: new Date(),
      attachments: {
        create: attachments.map((a) => ({
          url: a.url,
          fileName: a.fileName,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          sha256: a.sha256,
          hasCameraExif: a.hasCameraExif,
        })),
      },
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
      attachments: ATTACHMENT_SELECT,
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

// Open complaints in the same category and location from the last 30 days:
// the candidates for "similar issues" while a new complaint is typed.
export async function listSimilarCandidates(
  categoryId: string,
  locationId: string,
) {
  const since = new Date(Date.now() - 30 * 86_400_000);
  return prisma.complaint.findMany({
    where: {
      categoryId,
      locationId,
      archivedAt: null,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      ticketNumber: true,
      title: true,
      status: true,
      locationDetail: true,
      createdAt: true,
      submittedById: true,
      category: { select: { name: true } },
    },
  });
}
