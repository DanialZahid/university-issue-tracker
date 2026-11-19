import type {
  ComplaintResult,
  Fields,
  PairResult,
  TestComplaint,
  TestPair,
} from './types';

// "No specific place" and no location mean the same thing.
const NO_PLACE = 'No specific place';
const place = (l: string | null) => (l === NO_PLACE ? null : l);

// Hybrid: the AI reads the meaning (category and priority), the rules keep
// what they are exact at (a named place or room), and an emergency phrase
// always forces Safety and Critical, so the most serious cases never depend
// on the model.
export function hybridFields(r: ComplaintResult): Fields {
  const location = place(r.rules.location) ?? place(r.ai?.location ?? null);
  const room = r.rules.room ?? r.ai?.room ?? null;
  if (!r.ai || r.rules.emergency) return { ...r.rules, location, room };
  return {
    category: r.ai.category,
    priority: r.ai.priority,
    location,
    room,
  };
}

export type Accuracy = {
  n: number;
  category: number;
  priority: number;
  location: number;
  room: number;
};

function accuracy(rows: { gold: TestComplaint; got: Fields }[]): Accuracy {
  const n = rows.length || 1;
  const share = (f: (r: (typeof rows)[number]) => boolean) =>
    rows.filter(f).length / n;
  return {
    n: rows.length,
    category: share((r) => r.got.category === r.gold.category),
    priority: share((r) => r.got.priority === r.gold.priority),
    location: share((r) => place(r.got.location) === place(r.gold.location)),
    room: share((r) => r.got.room === r.gold.room),
  };
}

export function complaintSummary(
  tests: TestComplaint[],
  results: ComplaintResult[],
  language?: TestComplaint['language'],
) {
  const byId = new Map(results.map((r) => [r.id, r]));
  const done = tests.filter(
    (t) => byId.has(t.id) && (!language || t.language === language),
  );
  const rows = (pick: (r: ComplaintResult) => Fields | null) =>
    done.flatMap((gold) => {
      const got = pick(byId.get(gold.id)!);
      return got ? [{ gold, got }] : [];
    });
  return {
    rules: accuracy(rows((r) => r.rules)),
    ai: accuracy(rows((r) => r.ai)),
    hybrid: accuracy(rows(hybridFields)),
  };
}

export function pairSummary(
  tests: TestPair[],
  results: PairResult[],
  ruleThreshold: number,
  embeddingThreshold: number,
) {
  const byId = new Map(results.map((r) => [r.id, r]));
  const score = (pick: (r: PairResult) => number | null, th: number) => {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    for (const t of tests) {
      const r = byId.get(t.id);
      const s = r ? pick(r) : null;
      if (s === null) continue;
      const match = s >= th;
      if (match && t.duplicate) tp++;
      else if (match) fp++;
      else if (t.duplicate) fn++;
    }
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    const f1 =
      precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    return { precision, recall, f1 };
  };
  return {
    rules: score((r) => r.ruleScore, ruleThreshold),
    embedding: score((r) => r.embeddingScore, embeddingThreshold),
  };
}
