'use client';

import { useRef, useState } from 'react';
import { Download, Loader2, Play, Square } from 'lucide-react';
import { runComplaintStep, runPairStep } from '@/actions/evaluation';
import { complaintSummary, pairSummary } from '@/eval/metrics';
import type {
  ComplaintResult,
  PairResult,
  StepOutcome,
  TestComplaint,
  TestPair,
} from '@/eval/types';
import { Button } from '@/ui/common/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';

type Props = {
  complaints: TestComplaint[];
  pairs: TestPair[];
  aiReady: boolean;
  models: { text: string; embedding: string };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pct = (v: number) => `${Math.round(v * 100)}%`;

export function EvaluationRunner({
  complaints,
  pairs,
  aiReady,
  models,
}: Props) {
  const [withAi, setWithAi] = useState(aiReady);
  const [delayMs, setDelayMs] = useState(4000);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Ready.');
  const [cResults, setCResults] = useState<ComplaintResult[]>([]);
  const [pResults, setPResults] = useState<PairResult[]>([]);
  const stop = useRef(false);

  // Runs one step, waiting and retrying when the provider rate-limits.
  async function step<T>(
    label: string,
    run: () => Promise<StepOutcome<T>>,
  ): Promise<T | null> {
    for (let attempt = 0; attempt < 8 && !stop.current; attempt++) {
      setStatus(label);
      const out = await run();
      if (out.status === 'ok') return out.result;
      if (out.status === 'error') {
        setStatus(`Stopped: ${out.message}`);
        stop.current = true;
        return null;
      }
      setStatus(`${label}: ${out.reason}, waiting ${out.waitMs / 1000}s.`);
      await sleep(out.waitMs);
    }
    return null;
  }

  async function run() {
    stop.current = false;
    setRunning(true);
    setCResults([]);
    setPResults([]);
    const wait = withAi ? delayMs : 0;

    for (let i = 0; i < complaints.length && !stop.current; i++) {
      const r = await step(`Complaint ${i + 1} of ${complaints.length}`, () =>
        runComplaintStep({ index: i, withAi }),
      );
      if (r) setCResults((prev) => [...prev, r]);
      if (wait) await sleep(wait);
    }
    for (let i = 0; i < pairs.length && !stop.current; i++) {
      const r = await step(`Pair ${i + 1} of ${pairs.length}`, () =>
        runPairStep({ index: i, withAi }),
      );
      if (r) setPResults((prev) => [...prev, r]);
      if (wait) await sleep(wait);
    }
    setRunning(false);
    setStatus((s) => (s.startsWith('Stopped') ? s : 'Done.'));
  }

  function download() {
    const data = {
      ranAt: new Date().toISOString(),
      models: withAi ? models : null,
      complaints: cResults,
      pairs: pResults,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-${data.ranAt.slice(0, 16).replace(':', '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const all = complaintSummary(complaints, cResults);
  const urdu = complaintSummary(complaints, cResults, 'roman-urdu');
  const sim = pairSummary(pairs, pResults, 0.5, 0.8);
  const aiErrors =
    cResults.filter((r) => r.aiError).length +
    pResults.filter((r) => r.aiError).length;
  const firstError =
    cResults.find((r) => r.aiError)?.aiError ??
    pResults.find((r) => r.aiError)?.aiError;

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Run</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 text-sm'>
          <p className='text-muted-foreground'>
            {complaints.length} complaints and {pairs.length} title pairs, all
            written for testing. No real complaints are sent.{' '}
            {aiReady
              ? `AI models: ${models.text} and ${models.embedding}.`
              : 'GEMINI_API_KEY is not set, so only the rules can run.'}
          </p>
          <div className='flex flex-wrap items-center gap-4'>
            <label className='inline-flex items-center gap-2'>
              <input
                type='checkbox'
                checked={withAi}
                disabled={!aiReady || running}
                onChange={(e) => setWithAi(e.target.checked)}
              />
              Include AI
            </label>
            <label className='inline-flex items-center gap-2'>
              Pause between AI requests (seconds)
              <input
                type='number'
                min={0}
                max={30}
                value={delayMs / 1000}
                disabled={running}
                onChange={(e) => setDelayMs(Number(e.target.value) * 1000)}
                className='w-16 rounded-md border px-2 py-1'
              />
            </label>
          </div>
          <div className='flex flex-wrap gap-2'>
            {running ? (
              <Button variant='outline' onClick={() => (stop.current = true)}>
                <Square />
                Stop
              </Button>
            ) : (
              <Button onClick={run}>
                <Play />
                Run
              </Button>
            )}
            <Button
              variant='outline'
              disabled={!cResults.length}
              onClick={download}
            >
              <Download />
              Download results
            </Button>
          </div>
          <p className='inline-flex items-center gap-2' role='status'>
            {running && <Loader2 className='size-4 animate-spin' />}
            {status} {cResults.length}/{complaints.length} complaints,{' '}
            {pResults.length}/{pairs.length} pairs.
          </p>
          {aiErrors > 0 && (
            <p className='text-destructive'>
              {aiErrors} AI errors. First: {firstError}
            </p>
          )}
        </CardContent>
      </Card>

      {cResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick summary</CardTitle>
          </CardHeader>
          <CardContent className='overflow-x-auto text-sm'>
            <table className='w-full min-w-[32rem] text-left tabular-nums'>
              <thead className='text-muted-foreground'>
                <tr>
                  <th className='py-1'>Exact match</th>
                  <th>Rules</th>
                  <th>AI</th>
                  <th>Hybrid</th>
                  <th>Rules, Roman Urdu</th>
                  <th>Hybrid, Roman Urdu</th>
                </tr>
              </thead>
              <tbody>
                {(['category', 'priority', 'location', 'room'] as const).map(
                  (k) => (
                    <tr key={k} className='border-t'>
                      <td className='py-1 capitalize'>{k}</td>
                      <td>{pct(all.rules[k])}</td>
                      <td>{all.ai.n ? pct(all.ai[k]) : 'n/a'}</td>
                      <td>{pct(all.hybrid[k])}</td>
                      <td>{urdu.rules.n ? pct(urdu.rules[k]) : 'n/a'}</td>
                      <td>{urdu.hybrid.n ? pct(urdu.hybrid[k]) : 'n/a'}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
            {pResults.length > 0 && (
              <p className='mt-4 text-muted-foreground'>
                Duplicates: word overlap at 0.5, precision{' '}
                {pct(sim.rules.precision)}, recall {pct(sim.rules.recall)}.
                {pResults.some((r) => r.embeddingScore !== null) &&
                  ` Embeddings at 0.8, precision ${pct(sim.embedding.precision)}, recall ${pct(sim.embedding.recall)}.`}
              </p>
            )}
            <p className='mt-2 text-muted-foreground'>
              Final numbers are worked out from the downloaded file.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
