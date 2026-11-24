"""Statistics for the revised paper (offline study only).

Uses the per-complaint and per-pair outputs of the evaluation run
(run3.json) and the earlier run (run2.json, if present) to compute:
confidence intervals, macro-F1, quadratic-weighted kappa, exact McNemar
tests with Holm correction, critical/safety precision and recall with exact
intervals, the ablation of the rule + LLM combination with a simulated LLM
outage, and duplicate metrics that account for the base rate (accuracy,
specificity, MCC, one-sided Fisher test, ROC-AUC, PR-AUC).

Run: python3 stats.py  (writes stats_results.json)
"""

import json
from pathlib import Path

import numpy as np
from scipy.stats import beta, binomtest, fisher_exact
from sklearn.metrics import (average_precision_score, cohen_kappa_score,
                             f1_score, matthews_corrcoef, roc_auc_score)

HERE = Path(__file__).parent
EVAL = HERE.parent.parent / 'src' / 'eval'
G = json.loads((EVAL / 'complaints.json').read_text())
PAIRS = json.loads((EVAL / 'pairs.json').read_text())
RUN = json.loads((HERE / 'run3.json').read_text())
RC = {c['id']: c for c in RUN['complaints']}
RP = {p['id']: p for p in RUN['pairs']}
LV = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
NP = 'No specific place'
SEED = 42
rng = np.random.default_rng(SEED)

# Roman Urdu emergency terms for the post-hoc check of the safety floor. They
# were chosen after the test set was written, so the result is optimistic.
RU_EMERGENCY = ['aag', 'dhuan', 'dhuwan', 'chingari', 'chingariyan',
                'behosh', 'khoon', 'zakhmi', 'chot lagi', 'current laga',
                'jhatka']


def place(x):
    return None if x in (None, NP) else x


def rules(c):
    r = c['rules']
    return {**r, 'location': place(r['location'])}


def llm(c):
    a = c['ai']
    return {**a, 'location': place(a['location'])}


def compose(c, override=True, rule_place=True, llm_up=True):
    """The platform's combination, with each part switchable."""
    r, a = rules(c), llm(c)
    if not llm_up:
        return r
    out = {'category': a['category'], 'priority': a['priority'],
           'location': a['location'], 'room': a['room']}
    if rule_place:
        out['location'] = r['location'] or a['location']
        out['room'] = r['room'] or a['room']
    if override and r['emergency']:
        out['category'], out['priority'] = 'Safety', 'CRITICAL'
    return out


SYSTEMS = {'rules': rules, 'llm': llm, 'hybrid': compose}


def wilson(k, n, z=1.959964):
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (float(c - h), float(c + h))


def clopper(k, n, a=0.05):
    lo = 0.0 if k == 0 else beta.ppf(a / 2, k, n - k + 1)
    hi = 1.0 if k == n else beta.ppf(1 - a / 2, k + 1, n - k)
    return (float(lo), float(hi))


def mcnemar(a_ok, b_ok):
    a_ok, b_ok = np.asarray(a_ok), np.asarray(b_ok)
    b = int(np.sum(a_ok & ~b_ok))
    c = int(np.sum(~a_ok & b_ok))
    p = 1.0 if b + c == 0 else binomtest(min(b, c), b + c, 0.5).pvalue
    return {'aOnly': b, 'bOnly': c, 'p': float(p)}


def holm(ps):
    order = sorted(range(len(ps)), key=lambda i: ps[i])
    adj, run = [0.0] * len(ps), 0.0
    for rank, i in enumerate(order):
        run = max(run, min(1.0, (len(ps) - rank) * ps[i]))
        adj[i] = run
    return adj


ids = [g['id'] for g in G]
gold = {g['id']: g for g in G}
heldout = [i for i in ids if int(i[1:]) > 120]
ru = [i for i in ids if gold[i]['language'] == 'roman-urdu']


def correct(f, field, subset):
    return np.array([
        (place(f(RC[i])[field]) if field == 'location' else f(RC[i])[field])
        == gold[i][field] for i in subset])


def field_stats(f, subset):
    d = {'n': len(subset)}
    for field in ['category', 'priority', 'location', 'room']:
        ok = correct(f, field, subset)
        d[field] = {'acc': float(ok.mean()),
                    'ci': wilson(int(ok.sum()), len(ok))}
    for field, labels in [('category', None), ('priority', LV)]:
        y = [gold[i][field] for i in subset]
        p = [f(RC[i])[field] for i in subset]
        d[field]['macroF1'] = float(f1_score(y, p, labels=labels,
                                             average='macro', zero_division=0))
    y = [LV.index(gold[i]['priority']) for i in subset]
    p = [LV.index(f(RC[i])['priority']) for i in subset]
    d['priority']['qwk'] = float(cohen_kappa_score(y, p, weights='quadratic'))
    d['priority']['within1'] = float(np.mean(np.abs(np.array(y) - p) <= 1))
    return d


out = {'labels': {}, 'systems': {}, 'mcnemar': {}, 'safety': {},
       'ablation': {}, 'pairs': {}}

# ---------------------------------------------------------------- labels
for name, sub in [('all', ids), ('heldout', heldout)]:
    out['labels'][name] = {lv: sum(gold[i]['priority'] == lv for i in sub)
                           for lv in LV}
maj = 'MEDIUM'
out['labels']['majorityWithin1'] = float(np.mean(
    [abs(LV.index(gold[i]['priority']) - LV.index(maj)) <= 1 for i in ids]))
out['labels']['majorityExact'] = float(np.mean(
    [gold[i]['priority'] == maj for i in ids]))

# ---------------------------------------------------------------- systems
for sname, f in SYSTEMS.items():
    out['systems'][sname] = {sub: field_stats(f, s) for sub, s in
                             [('all', ids), ('heldout', heldout), ('ru', ru)]}

# ---------------------------------------------------------------- McNemar
tests = []
for label, a, b, field, subset in [
    ('hybrid vs rules, category', 'hybrid', 'rules', 'category', ids),
    ('hybrid vs rules, priority', 'hybrid', 'rules', 'priority', ids),
    ('hybrid vs LLM, category', 'hybrid', 'llm', 'category', ids),
    ('hybrid vs LLM, priority', 'hybrid', 'llm', 'priority', ids),
    ('rules vs hybrid, location', 'rules', 'hybrid', 'location', ids),
    ('hybrid vs rules, RU category', 'hybrid', 'rules', 'category', ru),
    ('hybrid vs rules, RU priority', 'hybrid', 'rules', 'priority', ru),
]:
    t = mcnemar(correct(SYSTEMS[a], field, subset),
                correct(SYSTEMS[b], field, subset))
    tests.append((label, t))
for (label, t), adj in zip(tests, holm([t['p'] for _, t in tests])):
    out['mcnemar'][label] = {**t, 'pHolm': adj}

# ---------------------------------------------------------------- safety
for sname, f in SYSTEMS.items():
    crit = [i for i in ids if gold[i]['priority'] == 'CRITICAL']
    safe = [i for i in ids if gold[i]['category'] == 'Safety']
    tp = sum(f(RC[i])['priority'] == 'CRITICAL' for i in crit)
    fp = sum(f(RC[i])['priority'] == 'CRITICAL' for i in ids
             if gold[i]['priority'] != 'CRITICAL')
    stp = sum(f(RC[i])['category'] == 'Safety' for i in safe)
    sfp = sum(f(RC[i])['category'] == 'Safety' for i in ids
              if gold[i]['category'] != 'Safety')
    ru_crit = [i for i in crit if gold[i]['language'] == 'roman-urdu']
    rtp = sum(f(RC[i])['priority'] == 'CRITICAL' for i in ru_crit)
    prec = tp / (tp + fp) if tp + fp else 0.0
    rec = tp / len(crit)
    out['safety'][sname] = {
        'critical': {'tp': tp, 'n': len(crit), 'fp': fp,
                     'recall': rec, 'recallCI': clopper(tp, len(crit)),
                     'precision': prec,
                     'precisionCI': clopper(tp, tp + fp) if tp + fp else None,
                     'f1': 2 * prec * rec / (prec + rec) if prec + rec else 0.0},
        'criticalRU': {'tp': rtp, 'n': len(ru_crit),
                       'ci': clopper(rtp, len(ru_crit))},
        'safety': {'tp': stp, 'n': len(safe), 'fp': sfp,
                   'recall': stp / len(safe), 'recallCI': clopper(stp, len(safe)),
                   'precision': stp / (stp + sfp) if stp + sfp else 0.0},
        'safetyMissedAs': {},
    }
    for i in safe:
        got = f(RC[i])['category']
        if got != 'Safety':
            m = out['safety'][sname]['safetyMissedAs']
            m[got] = m.get(got, 0) + 1

# Rules with Roman Urdu emergency terms added (post hoc).
def ru_emergency(i):
    text = f"{gold[i]['title']} {gold[i]['description']}".lower()
    return any(t in text for t in RU_EMERGENCY)


crit = [i for i in ids if gold[i]['priority'] == 'CRITICAL']
ru_rules = {i: RC[i]['rules']['emergency'] or ru_emergency(i) for i in ids}
out['safety']['rulesWithRomanUrdu'] = {
    'criticalFound': sum(ru_rules[i] or RC[i]['rules']['priority'] == 'CRITICAL'
                         for i in crit),
    'nonCriticalRaised': sum((ru_rules[i] or RC[i]['rules']['priority'] == 'CRITICAL')
                             for i in ids if gold[i]['priority'] != 'CRITICAL'),
    'terms': RU_EMERGENCY,
}

# ---------------------------------------------------------------- ablation
def variant_stats(fn, subset):
    d = {}
    for field in ['category', 'priority', 'location']:
        d[field] = float(np.mean([
            (place(fn(RC[i])[field]) if field == 'location' else fn(RC[i])[field])
            == gold[i][field] for i in subset]))
    crit_s = [i for i in subset if gold[i]['priority'] == 'CRITICAL']
    tp = sum(fn(RC[i])['priority'] == 'CRITICAL' for i in crit_s)
    fp = sum(fn(RC[i])['priority'] == 'CRITICAL' for i in subset
             if gold[i]['priority'] != 'CRITICAL')
    d['criticalRecall'] = tp / len(crit_s)
    d['criticalPrecision'] = tp / (tp + fp) if tp + fp else 0.0
    d['criticalN'] = len(crit_s)
    return d


for subname, subset in [('heldout', heldout), ('all', ids)]:
    ab = {
        'LLM only': variant_stats(lambda c: compose(c, False, False), subset),
        '+ emergency override': variant_stats(
            lambda c: compose(c, True, False), subset),
        '+ rule place and room': variant_stats(
            lambda c: compose(c, False, True), subset),
        'Full hybrid': variant_stats(compose, subset),
        'Rules only (LLM down)': variant_stats(
            lambda c: compose(c, llm_up=False), subset),
    }
    for frac in [0.1, 0.25, 0.5]:
        runs = []
        for _ in range(200):
            down = set(rng.choice(subset, size=int(round(frac * len(subset))),
                                  replace=False))
            runs.append(variant_stats(
                lambda c: compose(c, llm_up=c['id'] not in down), subset))
        ab[f'Hybrid, LLM down {int(frac * 100)}%'] = {
            k: {'mean': float(np.mean([r[k] for r in runs])),
                'sd': float(np.std([r[k] for r in runs]))}
            for k in runs[0]}
    out['ablation'][subname] = ab

# ---------------------------------------------------------------- repeatability
old_path = HERE / 'run2.json'
if old_path.exists():
    old = {c['id']: c for c in json.loads(old_path.read_text())['complaints']}
    same = [i for i in ids if i in old and old[i].get('ai')]
    out['repeatability'] = {
        'n': len(same),
        'category': float(np.mean([RC[i]['ai']['category'] == old[i]['ai']['category'] for i in same])),
        'priority': float(np.mean([RC[i]['ai']['priority'] == old[i]['ai']['priority'] for i in same])),
    }

# ---------------------------------------------------------------- pairs
gold_dup = np.array([p['duplicate'] for p in PAIRS])
dev = np.array([int(p['id'][1:]) <= 50 for p in PAIRS])
meaning = np.array([p['set'] == 'meaning' for p in PAIRS])
scores = {'Word overlap': np.array([RP[p['id']]['ruleScore'] for p in PAIRS]),
          'Gemini embeddings': np.array([RP[p['id']]['embeddingScore'] for p in PAIRS])}
extra = HERE / 'pair_scores.json'
if extra.exists():
    for k, v in json.loads(extra.read_text()).items():
        scores[k] = np.array(v)


def pair_metrics(flags, mask, s=None):
    f, g = flags[mask], gold_dup[mask]
    tp, fp = int(np.sum(f & g)), int(np.sum(f & ~g))
    fn, tn = int(np.sum(~f & g)), int(np.sum(~f & ~g))
    p = tp / (tp + fp) if tp + fp else 0.0
    r = tp / (tp + fn) if tp + fn else 0.0
    d = {'tp': tp, 'fp': fp, 'fn': fn, 'tn': tn, 'precision': p, 'recall': r,
         'f1': 2 * p * r / (p + r) if p + r else 0.0,
         'accuracy': (tp + tn) / len(g),
         'specificity': tn / (tn + fp) if tn + fp else 0.0,
         'mcc': float(matthews_corrcoef(g, f)) if f.any() and (~f).any() else 0.0,
         'fisherP': float(fisher_exact([[tp, fp], [fn, tn]],
                                       alternative='greater')[1])}
    if s is not None:
        d['rocAuc'] = float(roc_auc_score(g, s[mask]))
        d['prAuc'] = float(average_precision_score(g, s[mask]))
    return d


# Threshold grids, the same as in the first evaluation: word overlap uses
# its five rule levels, Gemini embeddings 0.70 to 0.92, and the local
# methods 0.10 to 0.95, all in steps of 0.01.
GRIDS = {'Word overlap': [0.3, 0.4, 0.5, 0.6, 0.7],
         'Gemini embeddings': [x / 100 for x in range(70, 93)]}
DEFAULT_GRID = [x / 100 for x in range(10, 96)]


def best(name, s, mask, key):
    grid = GRIDS.get(name, DEFAULT_GRID)
    return max(grid, key=lambda t: (pair_metrics(s >= t, mask)[key], -t))


test = ~dev
out['pairs']['counts'] = {'test': int(test.sum()), 'testDup': int(gold_dup[test].sum()),
                          'testMeaning': int((test & meaning).sum())}
out['pairs']['always'] = pair_metrics(np.ones(len(PAIRS), bool), test)
for name, s in scores.items():
    tf = float(best(name, s, dev, 'f1'))
    tm = float(best(name, s, dev, 'mcc'))
    out['pairs'][name] = {
        'thresholdF1': tf, 'testAtF1': pair_metrics(s >= tf, test, s),
        'thresholdMCC': tm, 'testAtMCC': pair_metrics(s >= tm, test, s),
        'meaningAtF1': pair_metrics(s >= tf, test & meaning),
    }
w, e = scores['Word overlap'], scores['Gemini embeddings']
grid_w = [0.3, 0.4, 0.5, 0.6, 0.7]
grid_e = [x / 100 for x in range(70, 93)]
bw, be = max(((a, b) for a in grid_w for b in grid_e),
             key=lambda t: (pair_metrics((w >= t[0]) | (e >= t[1]), dev)['f1'], t))
out['pairs']['Either'] = {'thresholds': [bw, be],
                          'test': pair_metrics((w >= bw) | (e >= be), test),
                          'meaning': pair_metrics((w >= bw) | (e >= be), test & meaning)}

(HERE / 'stats_results.json').write_text(json.dumps(out, indent=1))
print(json.dumps({k: out[k] for k in ['labels', 'mcnemar', 'repeatability']
                  if k in out}, indent=1))
