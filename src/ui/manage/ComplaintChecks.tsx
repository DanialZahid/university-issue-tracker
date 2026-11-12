import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Camera,
  Copy,
  CopyX,
  ImageIcon,
  ImageOff,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';
import { cn } from '@/utils/cn';
import { formatTicketNumber } from '@/utils/ticket';

type Props = {
  images: {
    total: number;
    withCamera: number;
    reused: { images: number; tickets: number[]; elsewhere: number };
  };
};

type Check = {
  icon: LucideIcon;
  label: string;
  text: ReactNode;
  tone: 'muted' | 'good' | 'warn';
};

const TONES = {
  muted: 'bg-muted text-muted-foreground',
  good: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function ReusedText({ reused }: { reused: Props['images']['reused'] }) {
  const { images, tickets, elsewhere } = reused;
  return (
    <>
      {images === 1 ? 'This image is' : `${images} images are`} also attached to{' '}
      {tickets.map((t, i) => (
        <span key={t}>
          {i > 0 && ', '}
          <Link
            href={`/manage/complaints/${formatTicketNumber(t)}`}
            className='font-medium text-foreground underline-offset-4 hover:underline'
          >
            {formatTicketNumber(t)}
          </Link>
        </span>
      ))}
      {tickets.length > 0 && elsewhere > 0 && ' and '}
      {elsewhere > 0 &&
        `${plural(elsewhere, 'complaint')} in other departments`}
      .
    </>
  );
}

function imageChecks({ total, withCamera, reused }: Props['images']): Check[] {
  if (total === 0) {
    return [
      {
        icon: ImageOff,
        label: 'Image checks',
        text: 'No images attached.',
        tone: 'muted',
      },
    ];
  }
  const found = reused.images > 0;
  return [
    {
      icon: withCamera > 0 ? Camera : ImageIcon,
      label: 'Camera data',
      text:
        withCamera > 0
          ? `${withCamera} of ${plural(total, 'image')} carry camera details, so they were likely taken on a phone or camera.`
          : `No camera details in ${total === 1 ? 'the image' : 'these images'}. It may be a screenshot, edited, or saved from elsewhere.`,
      tone: withCamera > 0 ? 'good' : 'muted',
    },
    {
      icon: found ? CopyX : Copy,
      label: 'Reused images',
      text: found ? (
        <ReusedText reused={reused} />
      ) : (
        'Not attached to any other complaint.'
      ),
      tone: found ? 'warn' : 'good',
    },
  ];
}

// Automated checks on the evidence. Advisory only: they inform the head,
// they never block or change the complaint.
export function ComplaintChecks({ images }: Props) {
  const checks: Check[] = [
    ...imageChecks(images),
    {
      icon: Copy,
      label: 'Possible duplicates',
      text: 'Similar open complaints from the same place and category will be flagged here.',
      tone: 'muted',
    },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <ShieldCheck className='size-5' />
          Automated checks
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-5'>
        {checks.map(({ icon: Icon, label, text, tone }) => (
          <div key={label} className='flex items-start gap-3.5'>
            <span
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl',
                TONES[tone],
              )}
            >
              <Icon className='size-5' />
            </span>
            <div>
              <p className='font-medium'>{label}</p>
              <p className='mt-0.5 text-sm text-muted-foreground'>{text}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
