import { Copy, ImageIcon, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';

const CHECKS: { icon: LucideIcon; label: string; text: string }[] = [
  {
    icon: ImageIcon,
    label: 'Image checks',
    text: 'Camera data, reused images and file checks appear here once images are attached.',
  },
  {
    icon: Copy,
    label: 'Possible duplicates',
    text: 'Similar open complaints from the same place and category will be flagged here.',
  },
];

// Layout slot for the automated checks (built in later sprints).
export function ComplaintChecks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <ShieldCheck className='size-4' />
          Automated checks
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {CHECKS.map(({ icon: Icon, label, text }) => (
          <div key={label} className='flex items-start gap-3'>
            <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
              <Icon className='size-4' />
            </span>
            <div>
              <p className='text-sm font-medium'>{label}</p>
              <p className='text-[13px] text-muted-foreground'>{text}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
