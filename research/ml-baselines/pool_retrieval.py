"""Duplicate retrieval in a simulated pool of complaints over time (offline
study only).

The pool is the 400 labeled complaints spread over 60 simulated days. Each
Roman Urdu complaint that paraphrases an English one (groups.py) is treated as
a later report of the same problem, submitted 1 to 14 days after it. Each such
complaint is a query that ranks the earlier complaints of the last 30 days,
as the platform does. Other complaints that happen to describe the same
problem are not marked as duplicates, so the scores are a lower bound.

Methods: the platform's word overlap (titleWords and wordOverlap in
src/automation/similarity.ts, plus 0.3 for the same room), character TF-IDF,
the multilingual MiniLM encoder, Gemini embeddings (gemini_pool_sims.json,
from gemini_extra.ts pool), and either of word overlap or Gemini (the better
rank of the two).

Run: python3 pool_retrieval.py  (writes pool.json and retrieval_results.json)
"""

import json
import os
import re
from pathlib import Path

os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

from groups import translation_groups

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
G = json.loads((ROOT / 'src' / 'eval' / 'complaints.json').read_text())
R = {c['id']: c for c in json.loads((HERE / 'run3.json').read_text())['complaints']}
DAYS, WINDOW, SEED = 60, 30, 7
NP = 'No specific place'

# ------------------------------------------------------------------ pool
rng = np.random.default_rng(SEED)
group = dict(zip([c['id'] for c in G], translation_groups(G)))
day = {}
for c in G:
    if group[c['id']] == c['id']:
        day[c['id']] = int(rng.integers(1, DAYS - 14))
for c in G:
    if group[c['id']] != c['id']:
        day[c['id']] = day[group[c['id']]] + int(rng.integers(1, 15))
order = sorted(G, key=lambda c: (day[c['id']], c['id']))
ids = [c['id'] for c in order]
queries = [i for i, c in enumerate(order) if group[c['id']] != c['id']]
(HERE / 'pool.json').write_text(json.dumps(
    [{'id': c['id'], 'day': day[c['id']], 'cluster': group[c['id']]}
     for c in order], indent=1))


# ------------------------------------------------------------- detected labels
def place(x):
    return None if x in (None, NP) else x


def hybrid(i):
    r, a = R[i]['rules'], R[i]['ai']
    cat = 'Safety' if r['emergency'] else a['category']
    return cat, place(r['location']) or place(a['location'])


gold = {c['id']: (c['category'], place(c['location'])) for c in G}
detected = {i: hybrid(i) for i in ids}

# ------------------------------------------------------------------ scores
STOP = set(re.findall(r"'([a-z]+)'", (ROOT / 'src' / 'automation' /
                      'similarity.ts').read_text().split('STOP_WORDS')[1].split(']);')[0]))


def title_words(t):
    ws = [w for w in re.split(r'[\s-]+', re.sub(r'[^a-z0-9\s-]', ' ', t.lower()))
          if len(w) >= 2 and not w.isdigit() and w not in STOP]
    return list(dict.fromkeys(w[:-1] if len(w) > 3 and w.endswith('s') else w for w in ws))


def word_score(a, b):
    wa, wb = title_words(a['title']), title_words(b['title'])
    overlap = (sum(w in set(wb) for w in wa) / min(len(wa), len(wb))) if wa and wb else 0
    same_room = bool(a['room']) and bool(b['room']) and a['room'].lower() == b['room'].lower()
    return overlap + (0.3 if same_room else 0)


titles = [c['title'] for c in order]
S = {'Word overlap': np.array([[word_score(a, b) for b in order] for a in order])}
tf = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5)).fit_transform(titles)
S['TF-IDF'] = (tf @ tf.T).toarray()
from sentence_transformers import SentenceTransformer  # noqa: E402
emb = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
                          ).encode(titles, normalize_embeddings=True)
S['Multilingual MiniLM'] = emb @ emb.T
gem = HERE / 'gemini_pool_sims.json'
if gem.exists():
    g = json.loads(gem.read_text())
    pos = {i: k for k, i in enumerate(g['ids'])}
    S['Gemini embeddings'] = np.array([[g['sims'][pos[a]][pos[b]] for b in ids] for a in ids])


def rank(sim, qi, labels):
    """Rank of the query's earlier duplicate among the filtered candidates,
    or None when the filter removed it."""
    q = ids[qi]
    cands = [j for j in range(qi) if day[ids[j]] >= day[q] - WINDOW
             and labels[ids[j]] == labels[q]]
    target = [j for j in cands if group[ids[j]] == group[q]]
    if not target:
        return None
    order_ = sorted(cands, key=lambda j: -sim[qi, j])
    return min(order_.index(j) for j in target) + 1


def metrics(ranks):
    n = len(ranks)
    r = [x for x in ranks]
    return {'R@1': sum(1 for x in r if x and x <= 1) / n,
            'R@5': sum(1 for x in r if x and x <= 5) / n,
            'MRR': sum(1 / x for x in r if x) / n}


results = {'poolSize': len(ids), 'days': DAYS, 'window': WINDOW,
           'queries': len(queries), 'clusters': len({group[ids[q]] for q in queries}),
           'methods': {}}
ranks = {}
for name, sim in S.items():
    ranks[name] = {'gold': [rank(sim, q, gold) for q in queries],
                   'detected': [rank(sim, q, detected) for q in queries]}
if 'Gemini embeddings' in ranks:
    both = lambda a, b: [min(x, y) if x and y else (x or y) for x, y in zip(a, b)]
    ranks['Either'] = {k: both(ranks['Word overlap'][k], ranks['Gemini embeddings'][k])
                       for k in ['gold', 'detected']}
for name, r in ranks.items():
    m = metrics(r['gold'])
    results['methods'][name] = {**m, 'R@5 detected': metrics(r['detected'])['R@5'],
                                'lostByFilter': sum(x is None for x in r['detected'])}
results['lostByGoldFilter'] = sum(x is None for x in ranks['TF-IDF']['gold'])
(HERE / 'retrieval_results.json').write_text(json.dumps(results, indent=1))
print(json.dumps(results, indent=1))
