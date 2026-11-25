"""Local open-weight LLM baseline (offline study only).

Runs an instruction-tuned open-weight model on the 280 held-out complaints
with the platform's own instruction (read from src/ai/classify.ts), so no
complaint text leaves the machine. Decoding is greedy; the answer must be
JSON, and anything outside the category or priority lists counts as wrong.

Run: python3 local_llm.py [model]  (writes local_llm_results.json and
local_llm_predictions.json; resumes an interrupted run)
"""

import json
import os
import platform
import re
import statistics as st
import sys
import time
from pathlib import Path

os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')

import numpy as np
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
MODEL = sys.argv[1] if len(sys.argv) > 1 else 'Qwen/Qwen2.5-1.5B-Instruct'
G = json.loads((ROOT / 'src' / 'eval' / 'complaints.json').read_text())
test = [c for c in G if int(c['id'][1:]) > 120]

src = (ROOT / 'src' / 'ai' / 'classify.ts').read_text()
SYSTEM = re.search(r'const SYSTEM = `(.*?)`;', src, re.S).group(1)
CATEGORIES = re.findall(r"^  '([^']+)',$", (ROOT / 'src' / 'automation' /
                        'category-detection.ts').read_text(), re.M)[:10]
run_ts = (ROOT / 'src' / 'eval' / 'run.ts').read_text()
LOCATIONS = re.findall(r"'([^']+)'", run_ts.split('LOCATIONS = [')[1].split('];')[0])
PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
SCHEMA_HINT = ('Answer with one JSON object only, with the keys category, '
               'priority, location, room, language, and summary. category is '
               'one of the categories, priority one of LOW, MEDIUM, HIGH, '
               'CRITICAL, location one of the locations or null.')


def prompt(c):
    return '\n'.join([f"Categories: {', '.join(CATEGORIES)}.",
                      f"Locations: {', '.join(LOCATIONS)}.", '',
                      f"Title: {c['title']}", f"Description: {c['description']}",
                      '', SCHEMA_HINT])


def parse(text):
    m = re.search(r'\{.*\}', text, re.S)
    try:
        d = json.loads(m.group(0)) if m else {}
    except json.JSONDecodeError:
        d = {}
    cat = d.get('category') if d.get('category') in CATEGORIES else 'Other'
    pri = str(d.get('priority', '')).upper()
    return {'category': cat, 'priority': pri if pri in PRIORITIES else 'MEDIUM',
            'valid': bool(m) and d.get('category') in CATEGORIES
            and pri in PRIORITIES}


PRED = HERE / 'local_llm_predictions.json'
preds = json.loads(PRED.read_text()) if PRED.exists() else {}
tok = AutoTokenizer.from_pretrained(MODEL)
model = AutoModelForCausalLM.from_pretrained(MODEL, dtype=torch.bfloat16)
model.eval()
torch.set_num_threads(os.cpu_count())

for c in test:
    if c['id'] in preds:
        continue
    msgs = [{'role': 'system', 'content': SYSTEM},
            {'role': 'user', 'content': prompt(c)}]
    text_in = tok.apply_chat_template(msgs, add_generation_prompt=True,
                                      tokenize=False)
    ids = tok(text_in, return_tensors='pt').input_ids
    t0 = time.perf_counter()
    with torch.no_grad():
        out = model.generate(ids, max_new_tokens=120, do_sample=False)
    seconds = time.perf_counter() - t0
    text = tok.decode(out[0][ids.shape[1]:], skip_special_tokens=True)
    preds[c['id']] = {**parse(text), 'seconds': seconds, 'raw': text}
    PRED.write_text(json.dumps(preds, indent=1))
    print(c['id'], preds[c['id']]['category'], preds[c['id']]['priority'],
          f'{seconds:.1f}s', flush=True)

y_cat = np.array([c['category'] for c in test])
y_pri = np.array([c['priority'] for c in test])
p_cat = np.array([preds[c['id']]['category'] for c in test])
p_pri = np.array([preds[c['id']]['priority'] for c in test])
ru = np.array([c['language'] == 'roman-urdu' for c in test])
(HERE / 'local_llm_results.json').write_text(json.dumps({
    'model': MODEL, 'dtype': 'bfloat16', 'decoding': 'greedy',
    'hardware': f'{platform.processor() or platform.machine()}, '
                f'{os.cpu_count()} CPU threads, no GPU',
    'n': len(test),
    'categoryAccuracy': float(np.mean(p_cat == y_cat)),
    'priorityAccuracy': float(np.mean(p_pri == y_pri)),
    'romanUrduCategory': float(np.mean(p_cat[ru] == y_cat[ru])),
    'criticalFound': int(np.sum((p_pri == 'CRITICAL') & (y_pri == 'CRITICAL'))),
    'falseCritical': int(np.sum((p_pri == 'CRITICAL') & (y_pri != 'CRITICAL'))),
    'validJson': int(sum(preds[c['id']]['valid'] for c in test)),
    'medianSeconds': st.median(preds[c['id']]['seconds'] for c in test),
}, indent=1))
