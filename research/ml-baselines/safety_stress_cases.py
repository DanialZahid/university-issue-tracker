"""Variants of the critical complaints that the rules catch, for a rule-only
stress test of the emergency override: upper case, a one-letter typo in the
emergency word, and the Roman Urdu word instead of the English one.
Run: python3 safety_stress_cases.py  (writes safety_stress_cases.json)"""
import json, re
from pathlib import Path
HERE = Path(__file__).parent
G = {c['id']: c for c in json.loads((HERE.parent.parent / 'src/eval/complaints.json').read_text())}
R = {c['id']: c for c in json.loads((HERE / 'run3.json').read_text())['complaints']}
WORDS = {'fire': ('fier', 'aag'), 'smoke': ('smok', 'dhuan'), 'sparks': ('sprks', 'chingariyan'),
         'sparking': ('sparkng', 'chingariyan'), 'injured': ('injred', 'zakhmi'),
         'injury': ('injry', 'chot'), 'short circuit': ('short circit', 'short circuit'),
         'electric shock': ('electric shok', 'current laga'), 'gas leak': ('gas laek', 'gas leak'),
         'unconscious': ('unconcious', 'behosh')}
cases = []
for i, c in G.items():
    if c['priority'] != 'CRITICAL' or not R[i]['rules']['emergency']:
        continue
    text = f"{c['title']}. {c['description']}"
    for w, (typo, ru) in WORDS.items():
        if re.search(rf'\b{w}\b', text, re.I):
            cases.append({'id': i, 'kind': 'upper case', 'text': text.upper()})
            cases.append({'id': i, 'kind': 'typo', 'text': re.sub(rf'\b{w}\b', typo, text, flags=re.I)})
            cases.append({'id': i, 'kind': 'Roman Urdu word', 'text': re.sub(rf'\b{w}\b', ru, text, flags=re.I)})
            break
(HERE / 'safety_stress_cases.json').write_text(json.dumps(cases, indent=1))
print(len(cases))
