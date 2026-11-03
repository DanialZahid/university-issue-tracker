import { z } from 'zod';

export const STATUS_FILTERS = [
  'OPEN',
  'PENDING',
  'IN_PROGRESS',
  'RESOLVED',
  'ARCHIVED',
  'ALL',
] as const;

const optionalId = z.string().trim().min(1).max(40).optional().catch(undefined);

// Every field falls back to a safe default, so a hand-edited URL never errors.
export const queueFiltersSchema = z.object({
  status: z.enum(STATUS_FILTERS).catch('OPEN'),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .optional()
    .catch(undefined),
  category: optionalId,
  department: optionalId,
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});

export type QueueFilters = z.infer<typeof queueFiltersSchema>;
