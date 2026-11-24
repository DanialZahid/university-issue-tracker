"""Supervised classifiers with hyperparameters tuned by nested, grouped
cross-validation (offline study only).

The outer loop is the same grouped, stratified 5-fold split as baselines.py
(three repeats). Inside each outer training fold, a grouped 3-fold search
picks the hyperparameters by accuracy, and the chosen model is then scored on
the outer test fold, which it never saw during the search.

Run: python3 supervised_tuned.py  (writes tuned_results.json)
"""

import itertools
import json
import statistics as st
from pathlib import Path

import numpy as np
from sklearn.model_selection import StratifiedGroupKFold

import baselines as B  # reuses the data, features, and scoring

REPEATS = 3
# XGBoost is slow on a CPU, so its nested search runs once.
REPEATS_BY_MODEL = {'XGBoost': 1}
GRIDS = {
    'LR': [{'C': c} for c in [0.1, 1, 10, 100]],
    'SVM': [{'C': c} for c in [0.01, 0.1, 1, 10]],
    # Kept small: each XGBoost fit takes long on a CPU.
    'XGBoost': [{'max_depth': d, 'n_estimators': n}
                for d, n in itertools.product([3], [100, 300])],
}


def model(name, n_classes, params):
    m = B.make(name, n_classes)
    m.set_params(**params)
    return m


def fit_predict(y, name, params, tr, te, with_rules):
    classes = sorted(set(y))
    yi = np.array([classes.index(v) for v in y])
    vec = B.features()
    Xtr = vec.fit_transform([B.texts[i] for i in tr])
    Xte = vec.transform([B.texts[i] for i in te])
    if with_rules:
        Xtr = B.hstack([Xtr, B.rule_features(tr)]).tocsr()
        Xte = B.hstack([Xte, B.rule_features(te)]).tocsr()
    m = model(name, len(classes), params)
    m.fit(Xtr, yi[tr])
    return [classes[int(p)] for p in m.predict(Xte)]


def choose(y, name, tr, with_rules, seed):
    inner = StratifiedGroupKFold(n_splits=3, shuffle=True, random_state=seed)
    groups = np.asarray(B.groups)[tr]
    best, best_acc = None, -1.0
    for params in GRIDS[name]:
        accs = []
        for itr, ite in inner.split(tr, y[tr], groups):
            p = fit_predict(y, name, params, tr[itr], tr[ite], with_rules)
            accs.append(np.mean(np.asarray(p) == y[tr[ite]]))
        if np.mean(accs) > best_acc:
            best, best_acc = params, float(np.mean(accs))
    return best


OUT = Path(__file__).parent / 'tuned_results.json'
results = (json.loads(OUT.read_text()) if OUT.exists() else
           {'repeats': REPEATS, 'grids': GRIDS, 'category': {}, 'priority': {}})
results['repeatsByModel'] = {m: REPEATS_BY_MODEL.get(m, REPEATS) for m in GRIDS}
TASKS = {'category': (B.y_cat, False), 'priority': (B.y_pri, True)}
# The fast linear models first, the slow XGBoost search last.
ORDER = [(t, m) for m in ['LR', 'SVM'] for t in TASKS] + \
        [(t, 'XGBoost') for t in TASKS]
for task, name in ORDER:
    y, with_rules = TASKS[task]
    if name in results[task]:
        continue  # already computed in an earlier, interrupted run
    runs, chosen = [], []
    for r in range(REPEATS_BY_MODEL.get(name, REPEATS)):
        outer = StratifiedGroupKFold(n_splits=B.FOLDS, shuffle=True,
                                     random_state=B.SEED + r)
        pred = np.empty(len(y), dtype=object)
        for tr, te in outer.split(B.texts, y, B.groups):
            params = choose(y, name, tr, with_rules, B.SEED + r)
            chosen.append(params)
            pred[te] = fit_predict(y, name, params, tr, te, with_rules)
        runs.append(B.score(y, pred, priority=task == 'priority'))
        print(task, name, 'repeat', r + 1, f"{runs[-1]['accuracy']:.3f}",
              flush=True)
    results[task][name] = {
        **{k: {'mean': st.mean(x[k] for x in runs),
               'sd': st.pstdev(x[k] for x in runs)} for k in runs[0]},
        'chosen': chosen,
    }
    OUT.write_text(json.dumps(results, indent=1))
