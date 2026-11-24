"""Supervised baselines for the research paper.

Offline study only. Nothing here is used by the platform. It trains logistic
regression, a linear SVM, and XGBoost on the labeled test complaints in
src/eval and compares them with the rules, the LLM, and the hybrid from the
evaluation run exported from /lab/evaluation (run3.json).

Three protocols:
- grouped CV: stratified 5-fold cross-validation repeated five times, where a
  Roman Urdu complaint and the English complaint it paraphrases always fall
  in the same fold, so a model is never tested on a translation of a
  training item;
- plain CV: the same without grouping, for comparison;
- small history: train on the first 120 complaints, test on the other 280,
  like a platform that has only a small labeled history.

Run: python3 baselines.py  (writes results.json)
"""

import json
import statistics as st
from pathlib import Path

import numpy as np
from scipy.sparse import csr_matrix, hstack
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.model_selection import RepeatedStratifiedKFold, StratifiedGroupKFold
from sklearn.pipeline import FeatureUnion
from sklearn.svm import LinearSVC
from xgboost import XGBClassifier

from groups import translation_groups

HERE = Path(__file__).parent
EVAL = HERE.parent.parent / 'src' / 'eval'
COMPLAINTS = json.loads((EVAL / 'complaints.json').read_text())
RUN = json.loads((HERE / 'run3.json').read_text())
RUN_BY_ID = {c['id']: c for c in RUN['complaints']}

LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
SEED = 42
FOLDS, REPEATS = 5, 5

texts = [f"{c['title']}. {c['description']}".lower() for c in COMPLAINTS]
lang = np.array([c['language'] for c in COMPLAINTS])
y_cat = np.array([c['category'] for c in COMPLAINTS])
y_pri = np.array([c['priority'] for c in COMPLAINTS])
groups = translation_groups(COMPLAINTS)
dev = np.array([int(c['id'][1:]) <= 120 for c in COMPLAINTS])


def features():
    # Word n-grams for meaning, character n-grams for Roman Urdu spelling
    # variants (for example "nahi", "nai", "nhi").
    return FeatureUnion([
        ('word', TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)),
        ('char', TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5),
                                 sublinear_tf=True)),
    ])


def rule_features(idx):
    # Structured inputs for priority: the rules' emergency flag and their
    # priority level, one-hot, from the same rules the platform uses.
    rows = []
    for i in idx:
        r = RUN_BY_ID[COMPLAINTS[i]['id']]['rules']
        rows.append([1.0 if r['emergency'] else 0.0] +
                    [1.0 if r['priority'] == lv else 0.0 for lv in LEVELS])
    return csr_matrix(np.array(rows))


def make(name, n_classes):
    if name == 'LR':
        return LogisticRegression(max_iter=3000, C=10, random_state=SEED)
    if name == 'SVM':
        return LinearSVC(C=1.0, random_state=SEED)
    if name == 'XGBoost':
        return XGBClassifier(
            n_estimators=300, max_depth=3, learning_rate=0.1,
            subsample=0.9, colsample_bytree=0.5, n_jobs=2,
            objective='multi:softmax', num_class=n_classes,
            random_state=SEED, verbosity=0)
    raise ValueError(name)


def fit_predict(y, name, tr, te, with_rules, safety_rule):
    classes = sorted(set(y))
    to_id = {c: i for i, c in enumerate(classes)}
    yi = np.array([to_id[v] for v in y])
    vec = features()
    Xtr = vec.fit_transform([texts[i] for i in tr])
    Xte = vec.transform([texts[i] for i in te])
    if with_rules:
        Xtr = hstack([Xtr, rule_features(tr)]).tocsr()
        Xte = hstack([Xte, rule_features(te)]).tocsr()
    m = make(name, len(classes))
    m.fit(Xtr, yi[tr])
    out = [classes[int(p)] for p in m.predict(Xte)]
    if safety_rule:
        # Same guard as the platform: an emergency phrase can only raise
        # priority to Critical, never lower it.
        for j, i in enumerate(te):
            if RUN_BY_ID[COMPLAINTS[i]['id']]['rules']['emergency']:
                out[j] = 'CRITICAL'
    return out


def splits(y, grouped):
    for r in range(REPEATS):
        if grouped:
            cv = StratifiedGroupKFold(n_splits=FOLDS, shuffle=True,
                                      random_state=SEED + r)
            yield from ((r, tr, te) for tr, te in cv.split(texts, y, groups))
    if not grouped:
        cv = RepeatedStratifiedKFold(n_splits=FOLDS, n_repeats=REPEATS,
                                     random_state=SEED)
        for k, (tr, te) in enumerate(cv.split(texts, y)):
            yield k // FOLDS, tr, te


def cross_validate(y, name, grouped, with_rules=False, safety_rule=False):
    preds = [np.empty(len(y), dtype=object) for _ in range(REPEATS)]
    for r, tr, te in splits(y, grouped):
        preds[r][te] = fit_predict(y, name, tr, te, with_rules, safety_rule)
    return preds


def score(y, pred, mask=None, priority=False):
    pred = np.asarray(pred)
    if mask is not None:
        y, pred, lg = y[mask], pred[mask], lang[mask]
    else:
        lg = lang
    d = {
        'accuracy': float(np.mean(pred == y)),
        'macroF1': float(f1_score(y, pred, average='macro', zero_division=0)),
        'romanUrdu': float(np.mean(pred[lg == 'roman-urdu']
                                   == y[lg == 'roman-urdu'])),
    }
    if priority:
        d['within1'] = float(np.mean([
            abs(LEVELS.index(p) - LEVELS.index(t)) <= 1
            for p, t in zip(pred, y)]))
        d['criticalFound'] = int(np.sum(pred[y == 'CRITICAL'] == 'CRITICAL'))
        d['falseCritical'] = int(np.sum((pred == 'CRITICAL')
                                        & (y != 'CRITICAL')))
    return d


def summarize(runs):
    return {k: {'mean': st.mean(r[k] for r in runs),
                'sd': st.pstdev(r[k] for r in runs)} for k in runs[0]}


def main():
    # ------------------------------------------------- zero-training systems
    NO_PLACE = 'No specific place'


    def hybrid_out(c):
        r, a = c['rules'], c['ai']
        return r if r['emergency'] else a


    systems = {
        'Rules': lambda c: c['rules'],
        'LLM': lambda c: c['ai'],
        'Hybrid': hybrid_out,
    }

    results = {'n': len(COMPLAINTS), 'folds': FOLDS, 'repeats': REPEATS,
               'groups': int(len(set(groups))), 'category': {}, 'priority': {},
               'smallHistory': {'category': {}, 'priority': {}},
               'learningCurve': {}}

    for name, f in systems.items():
        out = [RUN_BY_ID[c['id']] for c in COMPLAINTS]
        pc = [f(o)['category'] for o in out]
        pp = [f(o)['priority'] for o in out]
        results['category'][name] = score(y_cat, pc)
        results['priority'][name] = score(y_pri, pp, priority=True)
        results['smallHistory']['category'][name] = score(y_cat, pc, ~dev)
        results['smallHistory']['priority'][name] = score(y_pri, pp, ~dev, True)

    # ------------------------------------------------- supervised baselines
    for grouped, tag in [(True, ''), (False, ' (plain CV)')]:
        for name in ['LR', 'SVM', 'XGBoost']:
            runs = [score(y_cat, p) for p in cross_validate(y_cat, name, grouped)]
            results['category'][name + tag] = summarize(runs)
            runs = [score(y_pri, p, priority=True)
                    for p in cross_validate(y_pri, name, grouped, True)]
            results['priority'][name + tag] = summarize(runs)
        runs = [score(y_pri, p, priority=True)
                for p in cross_validate(y_pri, 'XGBoost', grouped, True, True)]
        results['priority']['XGBoost + safety rule' + tag] = summarize(runs)

    # ------------------------------------------------- small labeled history
    tr, te = np.where(dev)[0], np.where(~dev)[0]
    for name in ['LR', 'SVM', 'XGBoost']:
        for y, task, wr in [(y_cat, 'category', False), (y_pri, 'priority', True)]:
            full = np.empty(len(y), dtype=object)
            full[te] = fit_predict(y, name, tr, te, wr, False)
            results['smallHistory'][task][name] = score(
                y, full, ~dev, priority=task == 'priority')

    # ------------------------------------------------- learning curve
    # Grouped CV, with each training fold cut down to a fixed size.
    rng = np.random.default_rng(SEED)
    for size in [40, 80, 160, 240, 320]:
        accs = []
        for r, tr_i, te_i in splits(y_cat, True):
            keep = rng.choice(tr_i, size=min(size, len(tr_i)), replace=False)
            vec = features()
            m = LinearSVC(C=1.0, random_state=SEED)
            m.fit(vec.fit_transform([texts[i] for i in keep]), y_cat[keep])
            p = m.predict(vec.transform([texts[i] for i in te_i]))
            accs.append(float(np.mean(p == y_cat[te_i])))
        results['learningCurve'][str(size)] = {'mean': st.mean(accs),
                                               'sd': st.pstdev(accs)}

    (HERE / 'results.json').write_text(json.dumps(results, indent=1))


    def fmt(v):
        if isinstance(v, dict):
            return f"{v['mean']:.3f}±{v['sd']:.3f}"
        return f'{v:.3f}' if isinstance(v, float) else str(v)


    for task in ['category', 'priority']:
        print(task.upper())
        for name, d in results[task].items():
            print(f'  {name:34}', '  '.join(f'{k}={fmt(v)}' for k, v in d.items()))
    for task in ['category', 'priority']:
        print('SMALL HISTORY', task.upper(), '(train 120, test 280)')
        for name, d in results['smallHistory'][task].items():
            print(f'  {name:12}', '  '.join(f'{k}={fmt(v)}' for k, v in d.items()))
    print('LEARNING CURVE (SVM category accuracy, grouped CV)')
    for n, v in results['learningCurve'].items():
        print(f'  {n:>4}', fmt(v))


if __name__ == '__main__':
    main()
