"""Perturbed copies of the critical and safety complaints, for the stress test
of the emergency override and the LLM (offline study only).

Every complaint labeled Critical or Safety is rewritten three ways: one-letter
typos in its emergency words, the words replaced by Roman Urdu equivalents,
and the words in mixed case. Only variants that actually changed are kept.
The Roman Urdu equivalents still need checking by a native speaker.

Run: python3 stress_variants.py  (writes stress_variants.json). Then run
gemini_extra.ts stress for the rules, LLM, and hybrid, and stats.py.
"""

import json
import random
import re
from pathlib import Path

HERE = Path(__file__).parent
G = json.loads((HERE.parent.parent / 'src' / 'eval' / 'complaints.json').read_text())

EMERGENCY = ['fire', 'smoke', 'gas leak', 'electric shock', 'injury', 'injured',
             'sparks', 'short circuit', 'flood', 'collapsed', 'unconscious',
             'bleeding', 'trapped', 'stuck']
ROMAN_URDU = {
    'fire': ['aag', 'aag lag gayi'], 'smoke': ['dhuan', 'dhuwan'],
    'gas leak': ['gas leak', 'gas ki boo'],
    'electric shock': ['current lag gaya', 'karant laga'],
    'injury': ['chot', 'zakhmi'], 'injured': ['zakhmi'],
    'sparks': ['chingariyan'], 'short circuit': ['short circuit', 'shot circuit'],
    'flood': ['pani bhar gaya'], 'collapsed': ['gir gaya', 'gir gayi'],
    'unconscious': ['behosh'], 'bleeding': ['khoon beh raha'],
    'trapped': ['phans gaye', 'phanse hue'], 'stuck': ['phans gaye'],
}
KINDS = {'typo': 'One-letter typos', 'roman_urdu': 'Roman Urdu words',
         'mixed_case': 'Mixed case'}


def typo(word, rng):
    if len(word) < 4:
        return word
    i = rng.randrange(1, len(word) - 1)
    if rng.random() < .5:
        return word[:i] + word[i + 1:]
    return word[:i] + word[i + 1] + word[i] + word[i + 2:]


def perturb(text, kind, rng):
    for w in sorted(EMERGENCY, key=len, reverse=True):
        pat = re.compile(rf'\b{re.escape(w)}\b', re.I)
        if not pat.search(text):
            continue
        if kind == 'typo':
            text = pat.sub(lambda m: ' '.join(typo(x, rng) for x in m.group(0).split()), text)
        elif kind == 'roman_urdu':
            text = pat.sub(lambda m: rng.choice(ROMAN_URDU[w]), text)
        else:
            text = pat.sub(lambda m: ''.join(ch.upper() if rng.random() < .5 else ch
                                             for ch in m.group(0)), text)
    return text


rng = random.Random(0)
base = [c for c in G if c['priority'] == 'CRITICAL' or c['category'] == 'Safety']
out = []
for kind in KINDS:
    for c in base:
        title, desc = perturb(c['title'], kind, rng), perturb(c['description'], kind, rng)
        if (title, desc) != (c['title'], c['description']):
            out.append({**c, 'id': f"{c['id']}_{kind}", 'sourceId': c['id'],
                        'kind': kind, 'title': title, 'description': desc})
(HERE / 'stress_variants.json').write_text(json.dumps(out, indent=1, ensure_ascii=False))
print(len(base), 'source complaints,', len(out), 'changed variants')
