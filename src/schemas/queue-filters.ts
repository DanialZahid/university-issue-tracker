import { z } from 'zod';

export const STATUS_FILTERS = [
  'OPEN',
  'PENDING',
  'IN_PROGRESS',
  'RESOLVED',
  'ARCHIVED',
  'ALL',
] as const;

export const SORT_KEYS = [
  'ticket',
  'priority',
  'status',
  'department',
  'age',
] as const;

export type SortKey = (typeof SORT_KEYS)[number];

const optionalId = z.string().trim().min(1).max(40).optional().catch(undefined);

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined);

// Every field falls back to a safe default, so a hand-edited URL never errors.
export const queueFiltersSchema = z.object({
  status: z.enum(STATUS_FILTERS).catch('OPEN'),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .optional()
    .catch(undefined),
  category: optionalId,
  location: optionalId,
  department: optionalId,
  q: z.string().trim().max(100).optional().catch(undefined),
  sort: z.enum(SORT_KEYS).optional().catch(undefined),
  dir: z.enum(['asc', 'desc']).optional().catch(undefined),
  from: ymd,
  to: ymd,
  page: z.coerce.number().int().min(1).catch(1),
});

export type QueueFilters = z.infer<typeof queueFiltersSchema>;
