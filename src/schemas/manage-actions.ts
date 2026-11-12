import { z } from 'zod';

const ticketNumber = z.coerce.number().int().positive();
const status = z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED']);
const priority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

// `expected` is the value the page showed when the manager made the change.
export const statusUpdateSchema = z.object({
  ticketNumber,
  status,
  expected: status,
});

export const priorityUpdateSchema = z.object({
  ticketNumber,
  priority,
  expected: priority,
});

export const forwardSchema = z.object({
  ticketNumber,
  departmentId: z.string().min(1, 'Choose a department.'),
  expected: z.string().min(1),
  reason: z
    .string()
    .trim()
    .max(500, 'Keep the reason under 500 characters.')
    .transform((v) => v || undefined),
});

export const noteSchema = z.object({
  ticketNumber,
  note: z
    .string()
    .trim()
    .min(1, 'Write a note first.')
    .max(1000, 'Keep notes under 1,000 characters.'),
});

export const archiveSchema = z.object({
  ticketNumber,
  archive: z.enum(['archive', 'restore']),
});
