import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { IMAGE_LIMITS, uploadFolder } from '@/schemas/attachment';
import { requireUser } from '@/utils/session';

// Hands the browser a short-lived token so it can upload one image straight
// to Vercel Blob. Only signed-in users, only images, only into their folder.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await requireUser();
        if (!pathname.startsWith(uploadFolder(user.id))) {
          throw new Error('Uploads must go into your own folder.');
        }
        return {
          allowedContentTypes: [...IMAGE_LIMITS.storedTypes],
          maximumSizeInBytes: IMAGE_LIMITS.maxStoredBytes,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed.' },
      { status: 400 },
    );
  }
}
