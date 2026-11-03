import { z } from 'zod';

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const complaintSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be 120 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be 2000 characters or fewer'),
  categoryId: z.string().min(1, 'Choose a category'),
  locationId: z.string().min(1, 'Choose a location'),
  locationDetail: z
    .string()
    .trim()
    .max(100, 'Keep this under 100 characters')
    .transform((value) => value || undefined),
  priority: z.enum(PRIORITIES),
});

export function collectFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export type ComplaintInput = z.infer<typeof complaintSchema>;
