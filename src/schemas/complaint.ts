import { z } from 'zod';

export const LIMITS = {
  title: { min: 5, max: 120 },
  description: { min: 20, max: 2000 },
  locationDetail: { max: 30 },
} as const;

export const complaintSchema = z.object({
  title: z
    .string()
    .trim()
    .min(
      LIMITS.title.min,
      `Title must be at least ${LIMITS.title.min} characters`,
    )
    .max(
      LIMITS.title.max,
      `Title must be ${LIMITS.title.max} characters or fewer`,
    ),
  description: z
    .string()
    .trim()
    .min(
      LIMITS.description.min,
      `Description must be at least ${LIMITS.description.min} characters`,
    )
    .max(
      LIMITS.description.max,
      `Description must be ${LIMITS.description.max} characters or fewer`,
    ),
  categoryId: z.string().min(1, 'Choose a category'),
  locationId: z.string().min(1, 'Choose a location'),
  locationDetail: z
    .string()
    .trim()
    .max(
      LIMITS.locationDetail.max,
      `Keep this under ${LIMITS.locationDetail.max} characters`,
    )
    .transform((value) => value || undefined),
});

export type ComplaintInput = z.infer<typeof complaintSchema>;

export function collectFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
