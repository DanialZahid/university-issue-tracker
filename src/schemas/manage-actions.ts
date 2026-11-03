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
