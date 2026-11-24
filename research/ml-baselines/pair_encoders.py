"""Similarity scores of the 150 title pairs from methods that run locally:
TF-IDF character n-grams, the English Sentence-BERT model, and two
multilingual encoders. stats.py reads pair_scores.json and scores them with
the same threshold protocol as word overlap and the Gemini embeddings.

Run: python3 pair_encoders.py  (writes pair_scores.json)
"""

import json
import os
from pathlib import Path

os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer

HERE = Path(__file__).parent
PAIRS = json.loads((HERE.parent.parent / 'src' / 'eval' / 'pairs.json').read_text())
a = [p['a'] for p in PAIRS]
b = [p['b'] for p in PAIRS]

vec = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5))
vec.fit([t.lower() for t in a + b])
A, B = vec.transform([t.lower() for t in a]), vec.transform([t.lower() for t in b])
scores = {'TF-IDF': np.asarray(A.multiply(B).sum(axis=1)).ravel().tolist()}

for label, model in [
    ('Sentence-BERT EN', 'sentence-transformers/all-MiniLM-L6-v2'),
    ('Multilingual MiniLM',
     'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'),
    ('LaBSE', 'sentence-transformers/LaBSE'),
]:
    m = SentenceTransformer(model)
    ea = m.encode(a, normalize_embeddings=True)
    eb = m.encode(b, normalize_embeddings=True)
    scores[label] = (ea * eb).sum(axis=1).tolist()
    print(label, 'done', flush=True)

(HERE / 'pair_scores.json').write_text(json.dumps(scores))
