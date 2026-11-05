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
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol>
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className='relative flex gap-4 pb-7 last:pb-0'>
                {index < steps.length - 1 && (
                  <span
                    aria-hidden='true'
                    className='absolute top-10 bottom-0 left-5 w-px bg-primary/20'
                  />
                )}
                <span className='relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
                  <Icon className='size-5' />
                </span>
                <div className='pt-0.5'>
                  <p className='font-medium'>{title}</p>
                  <p className='mt-0.5 text-sm text-muted-foreground'>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className='bg-amber-50/50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Lightbulb className='size-5 text-amber-600' />
            Tips for a quick fix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='space-y-3'>
            {tips.map((tip) => (
              <li
                key={tip}
                className='flex gap-2 text-sm text-muted-foreground'
              >
                <span className='flex h-5 w-5 shrink-0 items-center justify-center'>
                  <span className='size-1.5 rounded-full bg-amber-500' />
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </aside>
  );
}
