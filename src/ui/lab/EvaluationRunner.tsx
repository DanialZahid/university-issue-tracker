'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { Download, Loader2, Play, RotateCcw, Square } from 'lucide-react';
import { runComplaintStep, runPairStep } from '@/actions/evaluation';
import { complaintSummary, pairSummary } from '@/eval/metrics';
import {
  clearProgress,
  describeError,
  readProgress,
  saveProgress,
  type EvalEvent,
  type SavedProgress,
} from '@/eval/progress';
import type {
  ComplaintResult,
  PairResult,
  StepOutcome,
  TestComplaint,
  TestPair,
} from '@/eval/types';
import { Button } from '@/ui/common/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/common/card';
import { cn } from '@/utils/cn';

type Props = {
  complaints: TestComplaint[];
  pairs: TestPair[];
  aiReady: boolean;
  models: { text: string; embedding: string };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pct = (v: number) => `${Math.round(v * 100)}%`;
const noSubscribe = () => () => {};

// Each step is tried this many times before the run stops. Stopping, rather
// than skipping, keeps the results complete; the run can then resume.
const MAX_ATTEMPTS = 8;

// Saved progress lives in browser storage, which the server cannot read, so
// the runner remounts once after hydration with it.
export function EvaluationRunner(props: Props) {
  const inBrowser = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  return (
    <Runner
      key={inBrowser ? 'browser' : 'server'}
      {...props}
      saved={
        inBrowser
          ? readProgress(props.complaints.length, props.pairs.length)
          : null
      }
    />
  );
}

function Runner({
  complaints,
  pairs,
  aiReady,
  models,
  saved,
}: Props & { saved: SavedProgress | null }) {
  const [withAi, setWithAi] = useState(saved?.withAi ?? aiReady);
  const [delayMs, setDelayMs] = useState(4000);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(
    saved
      ? `Saved progress from ${new Date(saved.savedAt).toLocaleString()}.`
      : 'Ready.',
  );
  const [cResults, setCResults] = useState<ComplaintResult[]>(
    saved?.complaints ?? [],
  );
  const [pResults, setPResults] = useState<PairResult[]>(saved?.pairs ?? []);
  const [events, setEvents] = useState<EvalEvent[]>(saved?.events ?? []);
  const stop = useRef(false);
  // The loop reads and saves from these; state copies drive the page.
  const data = useRef({
    complaints: saved?.complaints ?? [],
    pairs: saved?.pairs ?? [],
    events: saved?.events ?? [],
  });

  const finished =
    cResults.length === complaints.length && pResults.length === pairs.length;
  const canResume = !running && cResults.length > 0 && !finished;

  function persist(ai: boolean) {
    const d = data.current;
    setCResults(d.complaints);
    setPResults(d.pairs);
    setEvents(d.events);
    saveProgress(complaints.length, pairs.length, {
      savedAt: new Date().toISOString(),
      withAi: ai,
      ...d,
    });
  }

  function log(kind: EvalEvent['kind'], step: string, message: string) {
    const event = { at: new Date().toISOString(), step, kind, message };
    data.current.events = [...data.current.events, event];
    setEvents(data.current.events);
    const line = `[evaluation] ${step}: ${message}`;
    if (kind === 'info') console.info(line);
    else console.warn(line);
  }

  // Runs one step. Provider limits come back as a retry with a wait; a
  // failed server call (time-out, lost connection) is retried with a growing
  // wait. Every retry and error goes to the run log.
  async function step<T>(
    label: string,
    run: () => Promise<StepOutcome<T>>,
  ): Promise<T | null> {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !stop.current; attempt++) {
      setStatus(label);
      const tag = `attempt ${attempt} of ${MAX_ATTEMPTS}`;
      let out: StepOutcome<T>;
      try {
        out = await run();
      } catch (error) {
        const waitMs = Math.min(15_000 * attempt, 60_000);
        log(
          'retry',
          label,
          `${describeError(error)} Retrying in ${waitMs / 1000}s (${tag}).`,
        );
        setStatus(`${label}: server error, retrying in ${waitMs / 1000}s.`);
        await sleep(waitMs);
        continue;
      }
      if (out.status === 'ok') return out.result;
      if (out.status === 'error') {
        log('error', label, out.message);
        setStatus(`Stopped: ${out.message}`);
        stop.current = true;
        return null;
      }
      log(
        'retry',
        label,
        `AI: ${out.reason}. Waiting ${out.waitMs / 1000}s (${tag}).`,
      );
      setStatus(`${label}: ${out.reason}, waiting ${out.waitMs / 1000}s.`);
      await sleep(out.waitMs);
    }
    if (!stop.current) {
      log(
        'error',
        label,
        `Gave up after ${MAX_ATTEMPTS} attempts. Progress is saved; resume when ready.`,
      );
      setStatus(
        `Stopped at ${label.toLowerCase()} after ${MAX_ATTEMPTS} attempts.`,
      );
      stop.current = true;
    }
    return null;
  }

  async function run(resume: boolean) {
    stop.current = false;
    setRunning(true);
    if (!resume) {
      data.current = { complaints: [], pairs: [], events: [] };
      persist(withAi);
    }
    const ai = withAi;
    const wait = ai ? delayMs : 0;
    const fromC = data.current.complaints.length;
    const fromP = data.current.pairs.length;
    log(
      'info',
      'Run',
      resume
        ? `Resumed at complaint ${fromC + 1}, pair ${fromP + 1}.`
        : `Started${ai ? ' with AI' : ', rules only'}.`,
    );

    // Background tabs get their timers slowed down, and a sleeping screen
    // can stop the run, so both are noted and the screen is kept awake.
    const onVisibility = () =>
      log(
        'info',
        'Run',
        document.hidden
          ? 'Tab hidden; the browser may slow the run down.'
          : 'Tab visible again.',
      );
    document.addEventListener('visibilitychange', onVisibility);
    let lock: WakeLockSentinel | null = null;
    try {
      if ('wakeLock' in navigator) {
        lock = await navigator.wakeLock.request('screen');
      }
    } catch {
      // Not allowed here (battery saver, unsupported): run anyway.
    }

    for (let i = fromC; i < complaints.length && !stop.current; i++) {
      const label = `Complaint ${i + 1} of ${complaints.length}`;
      const r = await step(label, () =>
        runComplaintStep({ index: i, withAi: ai }),
      );
      if (!r) break;
      data.current.complaints = [...data.current.complaints, r];
      persist(ai);
      if (wait) await sleep(wait);
    }
    for (let i = fromP; i < pairs.length && !stop.current; i++) {
      const label = `Pair ${i + 1} of ${pairs.length}`;
      const r = await step(label, () => runPairStep({ index: i, withAi: ai }));
      if (!r) break;
      data.current.pairs = [...data.current.pairs, r];
      persist(ai);
      if (wait) await sleep(wait);
    }

    document.removeEventListener('visibilitychange', onVisibility);
    void lock?.release().catch(() => {});
    const done =
      data.current.complaints.length === complaints.length &&
      data.current.pairs.length === pairs.length;
    log('info', 'Run', done ? 'Done.' : 'Stopped.');
    persist(ai);
    setRunning(false);
    setStatus((s) =>
      done
        ? 'Done.'
        : s.startsWith('Stopped')
          ? s
          : 'Stopped. Progress is saved.',
    );
  }

  function startOver() {
    clearProgress(complaints.length, pairs.length);
    data.current = { complaints: [], pairs: [], events: [] };
    setCResults([]);
    setPResults([]);
    setEvents([]);
    setStatus('Ready.');
  }

  function download() {
    const file = {
      ranAt: new Date().toISOString(),
      models: withAi ? models : null,
      complaints: cResults,
      pairs: pResults,
      events,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-${file.ranAt.slice(0, 16).replace(':', '')}.json`;
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
  const recent = events.slice(-50).reverse();

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
                disabled={!aiReady || running || canResume}
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
            ) : canResume ? (
              <>
                <Button onClick={() => run(true)}>
                  <Play />
                  Resume from complaint{' '}
                  {Math.min(cResults.length + 1, complaints.length)}
                  {cResults.length === complaints.length &&
                    `, pair ${pResults.length + 1}`}
                </Button>
                <Button variant='outline' onClick={startOver}>
                  <RotateCcw />
                  Start over
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  startOver();
                  void run(false);
                }}
              >
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

      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Run log</CardTitle>
          </CardHeader>
          <CardContent className='text-sm'>
            <p className='mb-3 text-muted-foreground'>
              Retries, errors, and pauses, newest first. Also in the browser
              console and the downloaded file.
            </p>
            <ol className='max-h-72 space-y-1 overflow-y-auto tabular-nums'>
              {recent.map((e) => (
                <li
                  key={`${e.at}-${e.step}-${e.message}`}
                  className={cn(
                    e.kind === 'error' && 'text-destructive',
                    e.kind === 'retry' && 'text-amber-700 dark:text-amber-400',
                  )}
                >
                  <time dateTime={e.at} className='text-muted-foreground'>
                    {new Date(e.at).toLocaleTimeString()}
                  </time>{' '}
                  {e.step}: {e.message}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {cResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick summary</CardTitle>
          </CardHeader>
          <CardContent className='overflow-x-auto text-sm'>
            <table className='w-full min-w-lg text-left tabular-nums'>
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
