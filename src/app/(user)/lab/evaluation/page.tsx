import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FlaskConical } from 'lucide-react';
import { AI_MODELS, isAiConfigured } from '@/ai/gemini';
import { TEST_COMPLAINTS, TEST_PAIRS } from '@/eval/run';
import { EvaluationRunner } from '@/ui/lab/EvaluationRunner';
import { PageHeader } from '@/ui/shared/layout';
import { getRealSuperuser } from '@/utils/session';

export const metadata: Metadata = { title: 'Evaluation' };

// Each step is one short AI request. If one hangs, fail after a minute
// instead of the platform default, so the runner can retry it.
export const maxDuration = 60;

// Developer tool, not linked anywhere. Only the real superuser account can
// open it; "View as" does not count, and everyone else gets a 404.
export default async function EvaluationPage() {
  if (!(await getRealSuperuser())) notFound();

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Evaluation'
        description='Runs the fixed test set through the rules and the AI layer.'
        icon={FlaskConical}
      />
      <EvaluationRunner
        complaints={TEST_COMPLAINTS}
        pairs={TEST_PAIRS}
        aiReady={isAiConfigured()}
        models={AI_MODELS}
      />
    </div>
  );
}
