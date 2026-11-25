"""Five LLM runs on the 120 development complaints, assembled from every
evaluation run made so far (offline study only).

Several runs were interrupted by provider errors or the free-tier daily limit.
Every complete answer they produced is a genuine, independent call, so the
five runs are built per complaint: run 1 is run3.json (Nov. 20), and runs 2
to 5 take the complaint's answers from the other runs in the order below,
then from the completion calls in runs/fill*.json (llm_runs.ts with IDS).

Run: python3 compose_runs.py  (writes dev_runs.json, or prints the complaints
that still need answers, as IDS lists for llm_runs.ts)
"""

import json
import os
from pathlib import Path

HERE = Path(__file__).parent
SOURCES = ['run2.json', 'runs/nov19-1030.json', 'runs/nov24-1532.json',
           'runs/nov20-0705.json', 'runs/nov24-script.json']
SOURCES += sorted(str(p.relative_to(HERE)) for p in (HERE / 'runs').glob('fill*.json'))
EXTRA = int(os.environ.get('EXTRA_RUNS', 4))  # runs besides run3.json
ids = [f'C{i:03d}' for i in range(1, 121)]

base = {c['id']: c for c in json.loads((HERE / 'run3.json').read_text())['complaints']}
answers = {i: [] for i in ids}
for name in SOURCES:
    run = json.loads((HERE / name).read_text())
    for c in run['complaints']:
        if c['id'] in answers and c.get('ai') and len(answers[c['id']]) < EXTRA:
            answers[c['id']].append({**c, 'source': name, 'ranAt': run.get('ranAt')})

missing = {i: EXTRA - len(a) for i, a in answers.items() if len(a) < EXTRA}
if missing:
    for k in range(1, EXTRA + 1):
        need = [i for i, n in missing.items() if n >= k]
        if need:
            print(f'fill{k}:', ','.join(need))
    raise SystemExit(f'{sum(missing.values())} answers still needed')

runs = [{'name': 'run3.json', 'complaints': [base[i] for i in ids]}]
for k in range(EXTRA):
    runs.append({'name': f'assembled {k + 2}',
                 'complaints': [answers[i][k] for i in ids]})
dates = sorted({(a['ranAt'] or '')[:10] for i in ids for a in answers[i]} |
               {json.loads((HERE / 'run3.json').read_text())['ranAt'][:10]})
(HERE / 'dev_runs.json').write_text(json.dumps({'dates': dates, 'runs': runs}, indent=1))
print('dev_runs.json:', len(runs), 'runs, dates', dates)
