import { z } from 'zod';

const ticketNumber = z.coerce.number().int().positive();

export const statusUpdateSchema = z.object({
  ticketNumber,
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED']),
});

export const priorityUpdateSchema = z.object({
  ticketNumber,
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});
