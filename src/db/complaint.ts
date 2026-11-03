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
