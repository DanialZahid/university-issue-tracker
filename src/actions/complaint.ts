'use server';

import { redirect } from 'next/navigation';
import { createComplaint } from '@/db/complaint';
import { complaintSchema, collectFieldErrors } from '@/schemas/complaint';
import { formatTicketNumber } from '@/utils/ticket';
import { requireUser } from '@/utils/session';
import { attachmentsSchema, uploadFolder } from '@/schemas/attachment';

const BLOB_HOST = '.public.blob.vercel-storage.com';

export type SubmitComplaintState =
  | { status: 'idle' }
  | { status: 'error'; message?: string; fieldErrors?: Record<string, string> };

const FIELDS = [
  'title',
  'description',
  'categoryId',
  'locationId',
  'locationDetail',
] as const;

export async function submitComplaint(
  _prev: SubmitComplaintState,
  formData: FormData,
): Promise<SubmitComplaintState> {
  const user = await requireUser();

  const raw = Object.fromEntries(
    FIELDS.map((name) => [name, String(formData.get(name) ?? '')]),
  );
  const parsed = complaintSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: 'error', fieldErrors: collectFieldErrors(parsed.error) };
  }

  // Images were uploaded by the browser already; only their details arrive here.
  // Each one must sit in this user's own folder on our Blob store.
  let rawImages: unknown = [];
  try {
    rawImages = JSON.parse(String(formData.get('attachments') ?? '[]'));
  } catch {
    rawImages = null;
  }
  const images = attachmentsSchema.safeParse(rawImages);
  const owned =
    images.success &&
    images.data.every((a) => {
      const url = new URL(a.url);
      return (
        url.protocol === 'https:' &&
        url.hostname.endsWith(BLOB_HOST) &&
        a.pathname.startsWith(uploadFolder(user.id)) &&
        url.pathname === `/${a.pathname}`
      );
    });
  if (!images.success || !owned) {
    return {
      status: 'error',
      message:
        'One of the images could not be attached. Remove it and try again.',
    };
  }

  const ticketNumber = await createComplaint(parsed.data, user.id, images.data);
  if (ticketNumber === null) {
    return { status: 'error', message: 'Invalid category or location.' };
  }

  redirect(`/complaints/${formatTicketNumber(ticketNumber)}?submitted=1`);
}
