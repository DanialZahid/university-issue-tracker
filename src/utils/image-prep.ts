import { IMAGE_LIMITS } from '@/schemas/attachment';

// True when a JPEG carries a camera make or model in its EXIF data.
// Read from the original file, because compression removes EXIF.
// Advisory only: EXIF is easy to edit or strip.
export async function hasCameraExif(file: File): Promise<boolean | null> {
  if (file.type !== 'image/jpeg') return null;
  const view = new DataView(await file.slice(0, 128 * 1024).arrayBuffer());
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return false;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    const length = view.getUint16(offset + 2);
    // APP1 segment that starts with "Exif\0\0".
    if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966) {
      return readMakeOrModel(view, offset + 10);
    }
    if ((marker & 0xff00) !== 0xff00) return false;
    offset += 2 + length;
  }
  return false;
}

function readMakeOrModel(view: DataView, tiff: number): boolean {
  if (tiff + 8 > view.byteLength) return false;
  const little = view.getUint16(tiff) === 0x4949;
  const ifd = tiff + view.getUint32(tiff + 4, little);
  if (ifd + 2 > view.byteLength) return false;
  const count = view.getUint16(ifd, little);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = view.getUint16(entry, little);
    // 0x010f Make, 0x0110 Model
    if (tag === 0x010f || tag === 0x0110) return true;
  }
  return false;
}

export async function compressImage(
  file: File,
): Promise<{ blob: Blob; type: 'image/webp' | 'image/jpeg' }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    IMAGE_LIMITS.maxSide / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, quality),
    );
  const webp = await toBlob('image/webp', 0.82);
  if (webp && webp.type === 'image/webp')
    return { blob: webp, type: 'image/webp' };
  const jpeg = await toBlob('image/jpeg', 0.85);
  if (!jpeg) throw new Error('Could not compress the image.');
  return { blob: jpeg, type: 'image/jpeg' };
}

export async function sha256Hex(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    await blob.arrayBuffer(),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
