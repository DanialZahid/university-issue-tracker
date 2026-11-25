// Extra Gemini runs for the revised paper (offline study only). Uses the
// platform's own code and the GEMINI_API_KEY in .env; nothing else is sent.
//
//   stress    the LLM on the perturbed critical and safety complaints
//             (stress_variants.json), with the rules for comparison
//   pool      title embeddings of the 400 complaints, saved as a cosine
//             similarity matrix for the retrieval test
//   fewshot   the LLM with three labeled development complaints per category
//             added to the instruction, on the 280 held-out complaints, three
//             runs
//
// Run from the repository root (all jobs, in this order, resumable):
//   npx tsx --conditions=react-server --env-file=.env research/ml-baselines/gemini_extra.ts
// or one job: ... gemini_extra.ts stress
// GAP_MS sets the pause between requests (default 4500, for free-tier limits).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { classifyComplaint } from '@/ai/classify';
import { AiRetryableError, generateJson, embed } from '@/ai/gemini';
import {
  CATEGORY_NAMES,
  detectCategory,
} from '@/automation/category-detection';
import { hasEmergency } from '@/automation/emergency';
import { detectLocation } from '@/automation/location-detection';
import { detectPriority } from '@/automation/priority-detection';
import { detectRoom } from '@/automation/room-detection';
import { LOCATIONS } from '@/eval/run';

const DIR = 'research/ml-baselines';
const GAP_MS = Number(process.env['GAP_MS'] ?? 4500);
const RUNS = Number(process.env['FEWSHOT_RUNS'] ?? 3);
const SHOTS = 3;

type Complaint = {
  id: string;
  language: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  location: string | null;
  room: string | null;
};

const read = <T>(file: string, fallback: T): T =>
  existsSync(join(DIR, file))
    ? (JSON.parse(readFileSync(join(DIR, file), 'utf8')) as T)
    : fallback;
const save = (file: string, data: unknown) =>
  writeFileSync(join(DIR, file), JSON.stringify(data, null, 1));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const complaints = JSON.parse(
  readFileSync('src/eval/complaints.json', 'utf8'),
) as Complaint[];
const num = (c: { id: string }) => Number(c.id.slice(1));

// Waits between requests and retries rate limits and busy errors.
async function polite<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    await sleep(GAP_MS);
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof AiRetryableError) || attempt >= 30) throw err;
      const wait = Math.min(
        Math.max(err.retryAfterMs, 10_000) * attempt,
        120_000,
      );
      console.log(`  waiting ${Math.round(wait / 1000)} s (${err.message})`);
      await sleep(wait);
    }
  }
}

function rules(c: { title: string; description: string }) {
  const category = detectCategory(c.title, c.description).category;
  return {
    category,
    priority: detectPriority(c.title, c.description, category),
    location: detectLocation(c.title, c.description, LOCATIONS),
    room: detectRoom(c.title, c.description),
    emergency: hasEmergency(`${c.title} ${c.description}`),
  };
}

async function stress() {
  const variants = read<(Complaint & { sourceId: string; kind: string })[]>(
    'stress_variants.json',
    [],
  );
  const out = read<Record<string, unknown>>('gemini_stress.json', {});
  for (const v of variants) {
    if (out[v.id]) continue;
    try {
      const ai = await polite(() =>
        classifyComplaint({ ...v, locations: LOCATIONS, timeoutMs: 45_000 }),
      );
      out[v.id] = { rules: rules(v), ai };
    } catch (err) {
      console.log(`  ${v.id} failed: ${(err as Error).message}`);
      continue;
    }
    save('gemini_stress.json', out);
    console.log(`stress ${Object.keys(out).length}/${variants.length}`);
  }
}

async function pool() {
  const vectors = read<Record<string, number[]>>(
    'gemini_pool_vectors.tmp.json',
    {},
  );
  for (const c of complaints) {
    if (vectors[c.id]) continue;
    vectors[c.id] = await polite(() => embed(c.title));
    save('gemini_pool_vectors.tmp.json', vectors);
    console.log(`pool ${Object.keys(vectors).length}/${complaints.length}`);
  }
  // Only the similarities are kept: the raw vectors are large.
  const ids = complaints.map((c) => c.id);
  const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  const sims = ids.map((a) =>
    ids.map((b) => {
      const va = vectors[a]!;
      const vb = vectors[b]!;
      const dot = va.reduce((s, x, i) => s + x * vb[i]!, 0);
      return Math.round((dot / (norm(va) * norm(vb))) * 1e4) / 1e4;
    }),
  );
  save('gemini_pool_sims.json', { ids, sims });
  console.log('pool done: gemini_pool_sims.json');
}

async function fewshot() {
  const system = /const SYSTEM = `([\s\S]*?)`;/.exec(
    readFileSync('src/ai/classify.ts', 'utf8'),
  )![1]!;
  const dev = complaints.filter((c) => num(c) <= 120);
  const examples = CATEGORY_NAMES.flatMap((cat) =>
    dev.filter((c) => c.category === cat).slice(0, SHOTS),
  );
  const shown = examples
    .map(
      (c) =>
        `Title: ${c.title}\nDescription: ${c.description}\n` +
        `Answer: category ${c.category}, priority ${c.priority}, ` +
        `location ${c.location ?? 'null'}, room ${c.room ?? 'null'}`,
    )
    .join('\n\n');
  const instruction = `${system}\n\nLabeled examples:\n\n${shown}`;
  const schema = {
    type: 'object',
    properties: {
      category: { type: 'string', enum: [...CATEGORY_NAMES] },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      location: { type: ['string', 'null'], enum: [...LOCATIONS, null] },
      room: { type: ['string', 'null'] },
    },
    required: ['category', 'priority', 'location', 'room'],
  };
  const test = complaints.filter((c) => num(c) > 120);
  const out = read<Record<string, Record<string, unknown>>>(
    'gemini_fewshot.json',
    {},
  );
  for (let run = 1; run <= RUNS; run++) {
    const key = `run${run}`;
    out[key] ??= {};
    for (const c of test) {
      if (out[key]![c.id]) continue;
      const started = Date.now();
      try {
        const raw = await polite(() =>
          generateJson({
            system: instruction,
            prompt: [
              `Categories: ${CATEGORY_NAMES.join(', ')}.`,
              `Locations: ${LOCATIONS.join(', ')}.`,
              '',
              `Title: ${c.title}`,
              `Description: ${c.description}`,
            ].join('\n'),
            schema,
            timeoutMs: 45_000,
          }),
        );
        out[key]![c.id] = {
          ...(raw as object),
          ms: Date.now() - started - GAP_MS,
        };
      } catch (err) {
        console.log(`  ${key} ${c.id} failed: ${(err as Error).message}`);
        continue;
      }
      save('gemini_fewshot.json', {
        ...out,
        meta: { shots: SHOTS, examples: examples.map((e) => e.id) },
      });
      console.log(
        `fewshot ${key} ${Object.keys(out[key]!).length}/${test.length}`,
      );
    }
  }
}

const jobs = { stress, pool, fewshot } as const;
const wanted = (process.argv[2] as keyof typeof jobs | undefined) ?? null;
async function main() {
  for (const [name, job] of Object.entries(jobs)) {
    if (wanted && name !== wanted) continue;
    console.log(`== ${name}`);
    await job();
  }
  console.log('Done. Send the gemini_*.json files from research/ml-baselines.');
}
void main();
