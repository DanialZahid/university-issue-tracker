"""Low-label baselines that run locally (offline study only), all tested on
the 280 held-out complaints:

- SetFit with the multilingual paraphrase-multilingual-MiniLM-L12-v2
  encoder, trained on k = 8 complaints per class drawn from the 120
  development complaints (three draws);
- zero-shot classification with the multilingual NLI model
  MoritzLaurer/mDeBERTa-v3-base-mnli-xnli, which needs no labeled examples.

Run: python3 local_lowlabel.py  (writes lowlabel_results.json)
"""

import json
import os
import statistics as st
import tempfile
from pathlib import Path

os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')

import numpy as np
from datasets import Dataset
from setfit import SetFitModel, Trainer, TrainingArguments
from sklearn.metrics import f1_score
from transformers import pipeline

HERE = Path(__file__).parent
G = json.loads((HERE.parent.parent / 'src' / 'eval' / 'complaints.json').read_text())
SEED, K = 42, 8
LV = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
dev = [c for c in G if int(c['id'][1:]) <= 120]
test = [c for c in G if int(c['id'][1:]) > 120]
text = lambda c: f"{c['title']}. {c['description']}"
ru = np.array([c['language'] == 'roman-urdu' for c in test])


def score(task, pred):
    y = np.array([c[task] for c in test])
    p = np.asarray(pred)
    return {'accuracy': float(np.mean(p == y)),
            'macroF1': float(f1_score(y, p, average='macro', zero_division=0)),
            'romanUrdu': float(np.mean(p[ru] == y[ru])),
            'criticalFound': int(np.sum((p == 'CRITICAL') & (y == 'CRITICAL')))
            if task == 'priority' else None}


OUT = HERE / 'lowlabel_results.json'
results = {'k': K, 'iterations': 5, 'setfit': {}, 'nli': {}}

# ---------------------------------------------------------------- SetFit
for task in ['category', 'priority']:
    runs = []
    for draw in range(3):
        rng = np.random.default_rng(SEED + draw)
        train = []
        for label in sorted({c[task] for c in dev}):
            pool = [c for c in dev if c[task] == label]
            pick = rng.choice(len(pool), size=min(K, len(pool)), replace=False)
            train += [pool[i] for i in pick]
        model = SetFitModel.from_pretrained(
            'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        # Five pair-generation iterations instead of SetFit's default 20,
        # to keep CPU training time reasonable.
        # Checkpoints go to a temporary folder, not next to this script.
        args = TrainingArguments(output_dir=tempfile.mkdtemp(),
                                 batch_size=16, num_epochs=1,
                                 num_iterations=5, seed=SEED + draw)
        trainer = Trainer(model=model, args=args, train_dataset=Dataset.from_dict(
            {'text': [text(c) for c in train], 'label': [c[task] for c in train]}))
        trainer.train()
        runs.append(score(task, list(model.predict([text(c) for c in test]))))
        print('setfit', task, draw, runs[-1], flush=True)
        OUT.with_suffix('.partial.json').write_text(json.dumps(
            {'task': task, 'runs': runs}, indent=1))
    results['setfit'][task] = {
        k: {'mean': st.mean(r[k] for r in runs), 'sd': st.pstdev(r[k] for r in runs)}
        for k in runs[0] if runs[0][k] is not None}

# ---------------------------------------------------------------- zero-shot NLI
nli = pipeline('zero-shot-classification',
               model='MoritzLaurer/mDeBERTa-v3-base-mnli-xnli')
CAT = {
    'IT / Equipment': 'computers, projectors, or other equipment',
    'Software and Network': 'software, Wi-Fi, internet, or online accounts',
    'Maintenance': 'building maintenance, water, plumbing, or cleaning',
    'Classroom Facilities': 'classroom furniture, lights, fans, or air conditioning',
    'Safety': 'safety, security, or a dangerous situation',
    'Classes and Timetable': 'classes, teachers, or the timetable',
    'Exams and Results': 'exams, grades, or results',
    'Website and Social Media': 'the university website or social media',
    'Events and Printing': 'events or printing',
    'Other': 'something else',
}
PRI = {'LOW': 'a minor request that can wait',
       'MEDIUM': 'a normal problem',
       'HIGH': 'an urgent problem affecting many people or a deadline',
       'CRITICAL': 'an emergency with immediate danger'}
for task, labels, template in [
    ('category', CAT, 'This complaint is about {}.'),
    ('priority', PRI, 'This complaint is {}.'),
]:
    back = {v: k for k, v in labels.items()}
    answers = nli([text(c) for c in test], list(labels.values()),
                  hypothesis_template=template, batch_size=8)
    pred = [back[r['labels'][0]] for r in answers]
    results['nli'][task] = score(task, pred)
    print('nli', task, results['nli'][task], flush=True)

OUT.write_text(json.dumps(results, indent=1))
