import { Camera, Images } from 'lucide-react';
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

// Images attached to a complaint. Each opens full size in a new tab.
export function ComplaintImages({ images }: { images: ComplaintImage[] }) {
  if (images.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Images className='size-5' />
          Images
          <span className='text-sm font-normal text-muted-foreground'>
            ({images.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          {images.map((image, i) => (
            <li key={image.id}>
              <a
                href={image.url}
                target='_blank'
                rel='noopener noreferrer'
                className='group relative block aspect-4/3 overflow-hidden rounded-lg border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={`Image ${i + 1} attached to this complaint`}
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
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
