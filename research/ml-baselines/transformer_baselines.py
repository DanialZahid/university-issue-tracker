"""Transformer baselines for the research paper (offline study only).

- DistilBERT (distilbert-base-uncased) fine-tuned for complaint category
  and priority, with the same translation-grouped 5-fold split as
  baselines.py and the "small history" split (train on the first 120, test
  on the other 280). For priority, a variant applies the platform's safety
  rule (an emergency phrase raises priority to Critical).
- Sentence-BERT (all-MiniLM-L6-v2) cosine similarity for duplicate titles,
  with the threshold chosen on the first 50 pairs and tested on the other
  100, the same protocol as for the Gemini embeddings and word overlap.

Run on CPU: python3 transformer_baselines.py  (writes transformer_results.json)
"""

import json
import os
import statistics as st
from pathlib import Path

os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')

import numpy as np
import torch
from sklearn.metrics import f1_score
from sklearn.model_selection import StratifiedGroupKFold
from torch.utils.data import DataLoader, TensorDataset
from transformers import (AutoModelForSequenceClassification, AutoTokenizer,
                          get_linear_schedule_with_warmup)

from groups import translation_groups

HERE = Path(__file__).parent
EVAL = HERE.parent.parent / 'src' / 'eval'
COMPLAINTS = json.loads((EVAL / 'complaints.json').read_text())
PAIRS = json.loads((EVAL / 'pairs.json').read_text())
RUN = json.loads((HERE / 'run3.json').read_text())

SEED = 42
FOLDS = 5
EPOCHS = int(os.environ.get('EPOCHS', '8'))
MODEL = 'distilbert-base-uncased'

torch.manual_seed(SEED)
texts = [f"{c['title']}. {c['description']}" for c in COMPLAINTS]
lang = np.array([c['language'] for c in COMPLAINTS])
LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
RUN_BY_ID = {c['id']: c for c in RUN['complaints']}
emergency = np.array([RUN_BY_ID[c['id']]['rules']['emergency']
                      for c in COMPLAINTS])
groups = translation_groups(COMPLAINTS)
dev = np.array([int(c['id'][1:]) <= 120 for c in COMPLAINTS])

tok = AutoTokenizer.from_pretrained(MODEL)
enc = tok(texts, padding='max_length', truncation=True, max_length=64,
          return_tensors='pt')


def fine_tune(tr, te, y, classes):
    yi = np.array([classes.index(v) for v in y])
    torch.manual_seed(SEED)
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL, num_labels=len(classes))
    data = TensorDataset(enc['input_ids'][tr], enc['attention_mask'][tr],
                         torch.tensor(yi[tr]))
    loader = DataLoader(data, batch_size=16, shuffle=True,
                        generator=torch.Generator().manual_seed(SEED))
    opt = torch.optim.AdamW(model.parameters(), lr=5e-5, weight_decay=0.01)
    steps = EPOCHS * len(loader)
    sched = get_linear_schedule_with_warmup(opt, int(0.1 * steps), steps)
    model.train()
    for _ in range(EPOCHS):
        for ids, mask, labels in loader:
            loss = model(input_ids=ids, attention_mask=mask,
                         labels=labels).loss
            loss.backward()
            opt.step()
            sched.step()
            opt.zero_grad()
    model.eval()
    with torch.no_grad():
        logits = model(input_ids=enc['input_ids'][te],
                       attention_mask=enc['attention_mask'][te]).logits
    return [classes[i] for i in logits.argmax(-1).tolist()]


def score(pred, mask, y, priority):
    p, t, lg = np.asarray(pred)[mask], y[mask], lang[mask]
    d = {'accuracy': float(np.mean(p == t)),
         'macroF1': float(f1_score(t, p, average='macro', zero_division=0)),
         'romanUrdu': float(np.mean(p[lg == 'roman-urdu']
                                    == t[lg == 'roman-urdu']))}
    if priority:
        d['within1'] = float(np.mean([abs(LEVELS.index(a) - LEVELS.index(b))
                                      <= 1 for a, b in zip(p, t)]))
        d['criticalFound'] = int(np.sum(p[t == 'CRITICAL'] == 'CRITICAL'))
        d['falseCritical'] = int(np.sum((p == 'CRITICAL')
                                        & (t != 'CRITICAL')))
    return d


def with_safety_rule(pred):
    return np.where(emergency, 'CRITICAL', pred)


results = {'model': MODEL, 'epochs': EPOCHS}
everyone = np.ones(len(COMPLAINTS), bool)
tr_small, te_small = np.where(dev)[0], np.where(~dev)[0]
for task in ['category', 'priority']:
    y = np.array([c[task] for c in COMPLAINTS])
    classes = LEVELS if task == 'priority' else sorted(set(y))
    is_pri = task == 'priority'
    # Grouped 5-fold cross-validation (one repeat; fine-tuning is slow on CPU).
    pred = np.empty(len(y), dtype=object)
    cv = StratifiedGroupKFold(n_splits=FOLDS, shuffle=True, random_state=SEED)
    fold_acc = []
    for k, (tr, te) in enumerate(cv.split(texts, y, groups)):
        pred[te] = fine_tune(tr, te, y, classes)
        fold_acc.append(float(np.mean(pred[te] == y[te])))
        print(f'{task} fold {k + 1}: {fold_acc[-1]:.3f}', flush=True)
    r = {'groupedCV': score(pred, everyone, y, is_pri)}
    r['groupedCV']['foldSD'] = st.pstdev(fold_acc)
    # Small labeled history.
    small = np.empty(len(y), dtype=object)
    small[te_small] = fine_tune(tr_small, te_small, y, classes)
    r['smallHistory'] = score(small, ~dev, y, is_pri)
    if is_pri:
        r['groupedCVSafetyRule'] = score(with_safety_rule(pred), everyone,
                                         y, True)
        r['smallHistorySafetyRule'] = score(with_safety_rule(small), ~dev,
                                            y, True)
    results[task] = r
    print('DistilBERT', task, json.dumps(r), flush=True)
    (HERE / 'transformer_results.json').write_text(
        json.dumps(results, indent=1))

# ------------------------------------------------- Sentence-BERT duplicates
from sentence_transformers import SentenceTransformer  # noqa: E402

sbert = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
a = sbert.encode([p['a'] for p in PAIRS], normalize_embeddings=True)
b = sbert.encode([p['b'] for p in PAIRS], normalize_embeddings=True)
cos = (a * b).sum(axis=1)
rule = {r['id']: r['ruleScore'] for r in RUN['pairs']}
word = np.array([rule[p['id']] for p in PAIRS])
gold = np.array([p['duplicate'] for p in PAIRS])
pdev = np.array([int(p['id'][1:]) <= 50 for p in PAIRS])
meaning = np.array([p['set'] == 'meaning' for p in PAIRS])


def prf(flags, mask):
    f, g = flags[mask], gold[mask]
    tp, fp, fn = int(np.sum(f & g)), int(np.sum(f & ~g)), int(np.sum(~f & g))
    p = tp / (tp + fp) if tp + fp else 0.0
    r = tp / (tp + fn) if tp + fn else 0.0
    return [round(p, 3), round(r, 3), round(2 * p * r / (p + r), 3) if p + r else 0.0]


grid = [x / 100 for x in range(30, 96)]
th = max(grid, key=lambda t: prf(cos >= t, pdev)[2])
wgrid = [0.3, 0.4, 0.5, 0.6, 0.7]
both = max(((w, t) for w in wgrid for t in grid),
           key=lambda wt: (prf((word >= wt[0]) | (cos >= wt[1]), pdev)[2], wt))
results['sbert'] = {
    'threshold': th,
    'either': both,
    'dev': prf(cos >= th, pdev),
    'test': prf(cos >= th, ~pdev),
    'testMeaning': prf(cos >= th, ~pdev & meaning),
    'eitherTest': prf((word >= both[0]) | (cos >= both[1]), ~pdev),
    'eitherTestMeaning': prf((word >= both[0]) | (cos >= both[1]),
                             ~pdev & meaning),
}
print('SBERT', json.dumps(results['sbert']), flush=True)
(HERE / 'transformer_results.json').write_text(json.dumps(results, indent=1))
