"""Statistics for the revision experiments added after the first review
(offline study only). Each part runs only when its input exists.

- five LLM runs on the 120 development complaints: dev_runs.json from
  compose_runs.py (mean, SD, min-max, Fleiss' kappa across runs)
- stress test: stress_variants.json with gemini_stress.json (rules, rules
  with Roman Urdu terms, LLM, hybrid)
- few-shot LLM: gemini_fewshot.json; local open-weight LLM:
  local_llm_results.json

Run: python3 extra_stats.py  (writes extra_results.json)
"""

import json
import statistics as st
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.metrics import f1_score

# The same definitions as stats.py (not imported: stats.py runs on import).
NP = 'No specific place'
RU_EMERGENCY = ['aag', 'dhuan', 'dhuwan', 'chingari', 'chingariyan',
                'behosh', 'khoon', 'zakhmi', 'chot lagi', 'current laga',
                'jhatka']


def place(x):
    return None if x in (None, NP) else x


def llm(c):
    return {**c['ai'], 'location': place(c['ai']['location'])}


def compose(c):
    """The platform's combination: LLM category and priority, the rules'
    place and room when they found one, and the emergency override."""
    r, a = {**c['rules'], 'location': place(c['rules']['location'])}, llm(c)
    out = {'category': a['category'], 'priority': a['priority'],
           'location': r['location'] or a['location'], 'room': r['room'] or a['room']}
    if r['emergency']:
        out['category'], out['priority'] = 'Safety', 'CRITICAL'
    return out

HERE = Path(__file__).parent
G = {c['id']: c for c in json.loads((HERE.parent.parent / 'src' / 'eval' /
                                     'complaints.json').read_text())}
ids = list(G)
test = [i for i in ids if int(i[1:]) > 120]
out = {}


def acc(pred, field, keys):
    gold = (lambda i: place(G[i]['location'])) if field == 'location' else \
        (lambda i: G[i][field])
    return float(np.mean([pred[i][field] == gold(i) for i in keys]))


def crit(pred, keys):
    found = sum(pred[i]['priority'] == 'CRITICAL' and G[i]['priority'] == 'CRITICAL' for i in keys)
    false = sum(pred[i]['priority'] == 'CRITICAL' and G[i]['priority'] != 'CRITICAL' for i in keys)
    return found, false


def fleiss(labels):
    """labels: one list per item with the label of each run."""
    cats = sorted({x for row in labels for x in row})
    n = len(labels[0])
    counts = np.array([[row.count(c) for c in cats] for row in labels])
    p_item = ((counts ** 2).sum(1) - n) / (n * (n - 1))
    p_cat = counts.sum(0) / counts.sum()
    pe = (p_cat ** 2).sum()
    return float((p_item.mean() - pe) / (1 - pe))


def summary(values):
    return {'mean': st.mean(values), 'sd': st.pstdev(values),
            'min': min(values), 'max': max(values)}


# ---------------------------------------------------------------- five runs
# Five runs on the 120 development complaints (dev_runs.json, compose_runs.py).
D = HERE / 'dev_runs.json'
if D.exists():
    dr = json.loads(D.read_text())
    dev = [f'C{i:03d}' for i in range(1, 121)]
    byrun = [{c['id']: c for c in r['complaints']} for r in dr['runs']]
    L = [{i: llm(by[i]) for i in dev} for by in byrun]
    H = [{i: compose(by[i]) for i in dev} for by in byrun]
    res = {'runs': len(byrun), 'n': len(dev), 'dates': dr['dates'],
           'critical': sum(G[i]['priority'] == 'CRITICAL' for i in dev)}
    for name, preds in [('llm', L), ('hybrid', H)]:
        res[name] = {f: summary([acc(p, f, dev) for p in preds])
                     for f in ['category', 'priority', 'location']}
        res[name]['criticalFound'] = summary([crit(p, dev)[0] for p in preds])
        res[name]['falseCritical'] = summary([crit(p, dev)[1] for p in preds])
    res['fleiss'] = {f: fleiss([[p[i][f] for p in L] for i in dev])
                     for f in ['category', 'priority']}
    res['hybridMinusLlm'] = {f: summary([acc(h, f, dev) - acc(l, f, dev)
                                         for h, l in zip(H, L)])
                             for f in ['category', 'priority']}
    out['fiveRuns'] = res

# ---------------------------------------------------------------- stress test
V = HERE / 'stress_variants.json'
S = HERE / 'gemini_stress.json'
R3 = {c['id']: c for c in json.loads((HERE / 'run3.json').read_text())['complaints']}
if V.exists() and S.exists():
    variants = json.loads(V.read_text())
    got = json.loads(S.read_text())
    base = [i for i in ids if G[i]['priority'] == 'CRITICAL' or G[i]['category'] == 'Safety']
    critical = [i for i in base if G[i]['priority'] == 'CRITICAL']

    def text(c):
        return f"{c['title']} {c['description']}".lower()

    def systems(entry, source):
        r = {**entry['rules'], 'location': place(entry['rules']['location'])}
        both = {'rules': r, 'ai': entry['ai']}
        ru = {**r, 'priority': 'CRITICAL' if r['priority'] == 'CRITICAL' or any(
            t in text(source) for t in RU_EMERGENCY) else r['priority']}
        return {'Rules': r, 'Rules + RU terms': ru, 'LLM': llm(both),
                'Hybrid': compose(both)}

    table = {}
    original = {i: systems(R3[i], G[i]) for i in base}
    table['Original'] = {m: {'found': sum(original[i][m]['priority'] == 'CRITICAL' for i in critical),
                             'false': sum(original[i][m]['priority'] == 'CRITICAL'
                                          for i in base if i not in critical)}
                         for m in original[base[0]]}
    for kind in ['typo', 'roman_urdu', 'mixed_case']:
        pred = dict(original)  # unchanged complaints keep their prediction
        for v in variants:
            if v['kind'] == kind and v['id'] in got:
                pred[v['sourceId']] = systems(got[v['id']], v)
        table[kind] = {m: {'found': sum(pred[i][m]['priority'] == 'CRITICAL' for i in critical),
                           'false': sum(pred[i][m]['priority'] == 'CRITICAL'
                                        for i in base if i not in critical)}
                       for m in table['Original']}
    out['stress'] = {
        'sourceComplaints': len(base), 'critical': len(critical),
        'changed': dict(Counter(v['kind'] for v in variants)),
        'changedCritical': dict(Counter(v['kind'] for v in variants
                                        if v['priority'] == 'CRITICAL')),
        'missing': [v['id'] for v in variants if v['id'] not in got],
        'table': table,
        'falseAllVariants': {m: sum(table[k][m]['false'] for k in
                                    ['typo', 'roman_urdu', 'mixed_case'])
                             for m in table['Original']},
    }

# ---------------------------------------------------------------- few-shot
F = HERE / 'gemini_fewshot.json'
if F.exists():
    fs = json.loads(F.read_text())
    per = []
    for key in sorted(k for k in fs if k.startswith('run')):
        p = fs[key]
        if not all(i in p for i in test):
            continue
        pred = {i: {'category': p[i].get('category'), 'priority': p[i].get('priority'),
                    'location': place(p[i].get('location'))} for i in test}
        ru = [i for i in test if G[i]['language'] == 'roman-urdu']
        found, false = crit(pred, test)
        per.append({'category': acc(pred, 'category', test),
                    'priority': acc(pred, 'priority', test),
                    'romanUrdu': acc(pred, 'category', ru),
                    'categoryF1': float(f1_score([G[i]['category'] for i in test],
                                                 [pred[i]['category'] for i in test],
                                                 average='macro')),
                    'criticalFound': found, 'falseCritical': false,
                    'medianMs': st.median(p[i]['ms'] for i in test)})
    if per:
        out['fewShot'] = {'runs': len(per), **{k: summary([r[k] for r in per]) for k in per[0]},
                          'shots': fs.get('meta', {}).get('shots')}

# ---------------------------------------------------------------- local LLM
LL = HERE / 'local_llm_results.json'
if LL.exists():
    out['localLlm'] = json.loads(LL.read_text())

(HERE / 'extra_results.json').write_text(json.dumps(out, indent=1))
print(json.dumps(out, indent=1)[:3000])
