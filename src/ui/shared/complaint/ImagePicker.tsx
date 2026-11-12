'use client';

import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { CircleAlert, ImagePlus, Loader2, Camera, X } from 'lucide-react';
import { Button } from '@/ui/common/button';
import { Hint } from '@/ui/common/Hint';
import {
  IMAGE_LIMITS,
  uploadFolder,
  type AttachmentInput,
} from '@/schemas/attachment';
import { compressImage, hasCameraExif, sha256Hex } from '@/utils/image-prep';

type Item = {
  key: string;
  preview: string;
  fileName: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
  attachment?: AttachmentInput;
};

type Props = {
  uploaderId: string;
  disabled?: boolean;
  // Lets the form hold the submit button while an upload is running.
  onBusyChange: (busy: boolean) => void;
};

const MB = 1024 * 1024;

function baseName(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, '')
      .replace(/[^\w-]+/g, '-')
      .slice(0, 60) || 'image'
  );
}

export function ImagePicker({ uploaderId, disabled, onBusyChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const busy = items.some((i) => i.status === 'uploading');
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  // Free the preview URLs when the picker goes away.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(
    () => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)),
    [],
  );

  const patch = (key: string, change: Partial<Item>) =>
    setItems((list) =>
      list.map((i) => (i.key === key ? { ...i, ...change } : i)),
    );

  async function process(file: File, key: string) {
    try {
      const camera = await hasCameraExif(file);
      const { blob, type } = await compressImage(file);
      if (blob.size > IMAGE_LIMITS.maxStoredBytes) {
        throw new Error('Still too large after compression.');
      }
      const sha256 = await sha256Hex(blob);
      const ext = type === 'image/webp' ? 'webp' : 'jpg';
      const fileName = `${baseName(file.name)}.${ext}`;
      const result = await upload(
        `${uploadFolder(uploaderId)}${fileName}`,
        blob,
        {
          access: 'public',
          handleUploadUrl: '/api/uploads',
          contentType: type,
        },
      );
      patch(key, {
        status: 'done',
        attachment: {
          url: result.url,
          pathname: result.pathname,
          fileName,
          mimeType: type,
          sizeBytes: blob.size,
          sha256,
          hasCameraExif: camera,
        },
      });
    } catch (error) {
      patch(key, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed.',
      });
    }
  }

  function onPick(files: FileList | null) {
    setNotice(null);
    if (!files) return;
    const room = IMAGE_LIMITS.maxFiles - items.length;
    const picked = [...files];
    if (picked.length > room) {
      setNotice(`Up to ${IMAGE_LIMITS.maxFiles} images per complaint.`);
    }
    const accepted: { file: File; item: Item }[] = [];
    for (const file of picked.slice(0, Math.max(0, room))) {
      if (!(IMAGE_LIMITS.inputTypes as readonly string[]).includes(file.type)) {
        setNotice('Only JPG, PNG and WebP images can be attached.');
        continue;
      }
      if (file.size > IMAGE_LIMITS.maxInputBytes) {
        setNotice(
          `${file.name} is larger than ${IMAGE_LIMITS.maxInputBytes / MB} MB.`,
        );
        continue;
      }
      const key = crypto.randomUUID();
      accepted.push({
        file,
        item: {
          key,
          preview: URL.createObjectURL(file),
          fileName: file.name,
          status: 'uploading',
        },
      });
    }
    setItems((list) => [...list, ...accepted.map((a) => a.item)]);
    accepted.forEach((a) => process(a.file, a.item.key));
    if (input.current) input.current.value = '';
  }

  function remove(key: string) {
    setItems((list) => {
      const gone = list.find((i) => i.key === key);
      if (gone) URL.revokeObjectURL(gone.preview);
      return list.filter((i) => i.key !== key);
    });
  }

  const ready = items.flatMap((i) => (i.attachment ? [i.attachment] : []));
  const full = items.length >= IMAGE_LIMITS.maxFiles;

  return (
    <div className='space-y-3'>
      <input type='hidden' name='attachments' value={JSON.stringify(ready)} />
      <input
        ref={input}
        id='images'
        type='file'
        accept={IMAGE_LIMITS.inputTypes.join(',')}
        multiple
        className='sr-only'
        disabled={disabled || full}
        onChange={(e) => onPick(e.target.files)}
      />
      <div className='flex flex-wrap gap-3'>
        {items.map((item) => (
          <div
            key={item.key}
            className='group relative size-24 overflow-hidden rounded-lg border bg-muted'
          >
            {/* Local preview of the picked file, before upload finishes. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.preview}
              alt={item.fileName}
              className='size-full object-cover'
            />
            {item.status === 'uploading' && (
              <span className='absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm'>
                <Loader2 className='size-5 animate-spin text-primary' />
              </span>
            )}
            {item.status === 'error' && (
              <Hint label={item.error ?? 'Upload failed.'}>
                <span className='absolute inset-0 grid place-items-center bg-destructive/15 backdrop-blur-sm'>
                  <CircleAlert className='size-5 text-destructive' />
                </span>
              </Hint>
            )}
            {item.attachment?.hasCameraExif && (
              <Hint label='Camera details found in this photo.'>
                <span className='absolute bottom-1 left-1 grid size-6 place-items-center rounded-full bg-background/85 shadow-sm'>
                  <Camera className='size-3.5 text-emerald-700' />
                </span>
              </Hint>
            )}
            <button
              type='button'
              onClick={() => remove(item.key)}
              disabled={disabled}
              aria-label={`Remove ${item.fileName}`}
              className='absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-background/85 shadow-sm transition hover:bg-background'
            >
              <X className='size-3.5' />
            </button>
          </div>
        ))}
        {!full && (
          <Button
            type='button'
            variant='outline'
            className='size-24 flex-col gap-1 border-dashed text-muted-foreground'
            disabled={disabled}
            onClick={() => input.current?.click()}
          >
            <ImagePlus className='size-5' />
            <span className='text-xs'>Add image</span>
          </Button>
        )}
      </div>
      {notice && (
        <p
          role='alert'
          className='flex items-center gap-1.5 text-sm text-destructive'
        >
          <CircleAlert className='size-4 shrink-0' />
          {notice}
        </p>
      )}
    </div>
  );
}
