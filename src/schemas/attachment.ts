import { z } from 'zod';

// Shared by the browser (before upload) and the server (when saving).
export const IMAGE_LIMITS = {
  maxFiles: 3,
  // Size of the file the user picks, before it is compressed.
  maxInputBytes: 15 * 1024 * 1024,
  // Size after compression; what is actually stored.
  maxStoredBytes: 3 * 1024 * 1024,
  maxSide: 2048,
  inputTypes: ['image/jpeg', 'image/png', 'image/webp'],
  storedTypes: ['image/webp', 'image/jpeg'],
} as const;

// Every upload goes under the uploader's own folder.
export function uploadFolder(userId: string) {
  return `uploads/${userId}/`;
}

export const attachmentSchema = z.object({
  url: z.url().max(500),
  pathname: z.string().min(1).max(300),
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.enum(IMAGE_LIMITS.storedTypes),
  sizeBytes: z.number().int().positive().max(IMAGE_LIMITS.maxStoredBytes),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  hasCameraExif: z.boolean().nullable(),
});

export const attachmentsSchema = z
  .array(attachmentSchema)
  .max(IMAGE_LIMITS.maxFiles);

export type AttachmentInput = z.infer<typeof attachmentSchema>;
