import {
  CheckCircle2,
  Lightbulb,
  Route,
  Send,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';

const steps: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Send, title: 'Submit', text: 'Describe the issue and where it is.' },
  {
    icon: Route,
    title: 'Routed',
    text: 'It goes straight to the department that handles it.',
  },
  {
    icon: Wrench,
    title: 'In progress',
    text: 'The department works on it and updates the status.',
  },
  {
    icon: CheckCircle2,
    title: 'Resolved',
    text: 'You can follow every step on the complaint page.',
  },
];

const tips = [
  'Mention the room, for example AC-103 or C-Lab 04.',
  'Report one issue per complaint.',
  'Say since when it happens and how it affects classes.',
  'For danger such as fire or injury, also contact campus security.',
];

export function SubmitGuide() {
  return (
    <aside className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className='space-y-4'>
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className='flex gap-3'>
                <span className='relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
                  <Icon className='size-4' />
                  {i < steps.length - 1 && (
                    <span className='absolute top-9 left-1/2 h-3 w-px -translate-x-1/2 bg-border' />
                  )}
                </span>
                <div>
                  <p className='text-sm font-medium'>{title}</p>
                  <p className='text-sm text-muted-foreground'>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className='bg-amber-50/50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Lightbulb className='size-4 text-amber-600' />
            Tips for a quick fix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='list-disc space-y-1.5 pl-5 text-sm text-muted-foreground'>
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </aside>
  );
}
