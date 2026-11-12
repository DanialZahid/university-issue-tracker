'use client';

import { useState } from 'react';
import { Dialog } from 'radix-ui';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Images,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';
import { Hint } from '@/ui/common/Hint';

export type ComplaintImage = {
  id: string;
  url: string;
  fileName: string;
  sizeBytes: number;
  hasCameraExif: boolean | null;
};

function size(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const roundButton =
  'grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none';

export function ComplaintImages({ images }: { images: ComplaintImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;

  const count = images.length;
  const current = open !== null ? images[open] : null;
  const step = (by: number) =>
    setOpen((i) => (i === null ? i : (i + by + count) % count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Images className='size-5' />
          Images
          <span className='text-sm font-normal text-muted-foreground'>
            ({count})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          {images.map((image, i) => (
            <li key={image.id}>
              <button
                type='button'
                onClick={() => setOpen(i)}
                aria-label={`View image ${i + 1} of ${count}`}
                className='group relative block aspect-4/3 w-full cursor-zoom-in overflow-hidden rounded-lg border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt=''
                  loading='lazy'
                  className='size-full object-cover transition duration-300 group-hover:scale-[1.03]'
                />
                <span className='absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/60 to-transparent px-2 pt-6 pb-1.5 text-xs text-white'>
                  {size(image.sizeBytes)}
                  {image.hasCameraExif && (
                    <Hint label='Camera details found in this photo.'>
                      <span className='inline-flex'>
                        <Camera className='size-3.5' />
                      </span>
                    </Hint>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>

      <Dialog.Root
        open={open !== null}
        onOpenChange={(next) => !next && setOpen(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className='fixed inset-0 z-50 bg-black/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0' />
          <Dialog.Content
            className='fixed inset-0 z-50 flex flex-col outline-none'
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') step(-1);
              if (e.key === 'ArrowRight') step(1);
            }}
          >
            <div className='flex items-center justify-between gap-3 p-4 text-white'>
              <Dialog.Title className='text-sm font-medium'>
                Image {(open ?? 0) + 1} of {count}
                {current && (
                  <span className='ml-2 font-normal text-white/60'>
                    {size(current.sizeBytes)}
                  </span>
                )}
              </Dialog.Title>
              <Dialog.Description className='sr-only'>
                Use the arrow keys to move between images.
              </Dialog.Description>
              <div className='flex items-center gap-2'>
                {current && (
                  <a
                    href={current.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={roundButton}
                    aria-label='Open original in a new tab'
                  >
                    <ExternalLink className='size-4' />
                  </a>
                )}
                <Dialog.Close className={roundButton} aria-label='Close'>
                  <X className='size-5' />
                </Dialog.Close>
              </div>
            </div>

            <div
              className='relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16'
              onClick={(e) => e.target === e.currentTarget && setOpen(null)}
            >
              {current && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={current.id}
                  src={current.url}
                  alt={`Image ${(open ?? 0) + 1} attached to this complaint`}
                  className='max-h-full max-w-full rounded-lg object-contain shadow-2xl'
                />
              )}
              {count > 1 && (
                <>
                  <button
                    type='button'
                    onClick={() => step(-1)}
                    aria-label='Previous image'
                    className={`${roundButton} absolute top-1/2 left-3 -translate-y-1/2`}
                  >
                    <ChevronLeft className='size-5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => step(1)}
                    aria-label='Next image'
                    className={`${roundButton} absolute top-1/2 right-3 -translate-y-1/2`}
                  >
                    <ChevronRight className='size-5' />
                  </button>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Card>
  );
}
