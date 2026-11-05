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
          <ShieldCheck className='size-5' />
          Automated checks
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-5'>
        {CHECKS.map(({ icon: Icon, label, text }) => (
          <div key={label} className='flex items-start gap-3.5'>
            <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground'>
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
