// Repeated LLM runs on the 400 test complaints without the browser (offline
// study only). Each complaint goes through the same evaluateComplaint step as
// the /lab/evaluation page; pairs are skipped. The file has the page's export
// format, so the statistics scripts read it like run3.json.
//
//   npx tsx --conditions=react-server --env-file=.env.local research/ml-baselines/llm_runs.ts run4
//
// GAP_MS sets the pause between requests (default 6000). Resumable.
// IDS (comma-separated complaint ids) evaluates only those complaints, for
// completing interrupted runs.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AI_MODELS } from '@/ai/gemini';
import { evaluateComplaint, TEST_COMPLAINTS } from '@/eval/run';
import type { ComplaintResult } from '@/eval/types';

const name = process.argv[2];
if (!name) throw new Error('Give the run name, for example run4.');
const file = join('research/ml-baselines', `${name}.json`);
const GAP_MS = Number(process.env['GAP_MS'] ?? 6000);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Event = { at: string; step: string; kind: string; message: string };
const saved = existsSync(file)
  ? (JSON.parse(readFileSync(file, 'utf8')) as {
      complaints: ComplaintResult[];
      events: Event[];
    })
  : { complaints: [], events: [] };
const complaints = saved.complaints;
const events = saved.events;

function save() {
  writeFileSync(
    file,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        models: AI_MODELS,
        complaints,
        pairs: [],
        events,
      },
      null,
      1,
    ),
  );
}

const only = process.env['IDS']?.split(',').filter(Boolean);
const order = only
  ? only.map((id) => TEST_COMPLAINTS.findIndex((t) => t.id === id))
  : TEST_COMPLAINTS.map((_, i) => i);

async function main() {
  const done = new Set(complaints.map((c) => c.id));
  for (const i of order) {
    if (i < 0 || done.has(TEST_COMPLAINTS[i]!.id)) continue;
    const step = `Complaint ${i + 1} of ${TEST_COMPLAINTS.length}`;
    for (let attempt = 1; ; attempt++) {
      await sleep(GAP_MS);
      const out = await evaluateComplaint(i, true);
      if (out.status === 'ok') {
        complaints.push(out.result);
        if (out.result.aiError) {
          events.push({
            at: new Date().toISOString(),
            step,
            kind: 'error',
            message: out.result.aiError,
          });
        }
        break;
      }
      const message =
        out.status === 'retry' ? out.reason : `error: ${out.message}`;
      events.push({
        at: new Date().toISOString(),
        step,
        kind: 'retry',
        message,
      });
      if (attempt >= 30) throw new Error(`${step}: gave up (${message})`);
      await sleep(
        Math.min(
          (out.status === 'retry' ? out.waitMs : 8_000) * attempt,
          120_000,
        ),
      );
    }
    save();
    if (complaints.length % 25 === 0)
      console.log(`${name}: ${complaints.length}/${order.length}`);
  }
  console.log(`${name}: done`);
}

void main();
