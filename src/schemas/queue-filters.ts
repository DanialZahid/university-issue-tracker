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

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

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
  size: z.coerce
    .number()
    .refine((n) => (PAGE_SIZES as readonly number[]).includes(n))
    .catch(DEFAULT_PAGE_SIZE),
});

export type QueueFilters = z.infer<typeof queueFiltersSchema>;

// Dashboard filters carried into a complaint page as ?back=..., so "Back" and
// forwarding return to the same filtered view. Only known keys are kept.
const BACK_KEYS = [
  'status',
  'priority',
  'category',
  'location',
  'department',
  'q',
  'from',
  'to',
  'sort',
  'dir',
  'size',
] as const;

export function backQuery(back: unknown): Record<string, string> {
  if (typeof back !== 'string' || back.length > 500) return {};
  const params = new URLSearchParams(back);
  const out: Record<string, string> = {};
  for (const key of BACK_KEYS) {
    const value = params.get(key);
    if (value) out[key] = value.slice(0, 100);
  }
  return out;
}
