"""Links each Roman Urdu test complaint to the English complaint it
paraphrases, so cross-validation can keep the two in the same fold.

Matching is automatic (same category, location, and room, then the most
similar text), with manual fixes where the automatic match was wrong or the
paraphrase changed a detail such as the block or room.
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# Roman Urdu id -> English id, checked by hand.
MANUAL = {
    'C113': 'C012', 'C137': 'C130', 'C138': 'C128', 'C136': 'C127',
    'C158': 'C143', 'C161': 'C146', 'C162': 'C145', 'C135': 'C126',
    'C140': 'C124', 'C160': 'C149', 'C163': 'C153', 'C239': 'C217',
    'C240': 'C223', 'C300': 'C284', 'C213': 'C197', 'C366': 'C357',
}
# No English counterpart in the set.
NONE = {'C101', 'C102', 'C105', 'C110', 'C111', 'C115', 'C118', 'C156'}
MIN_SIMILARITY = 0.3


def translation_groups(complaints):
    en = [c for c in complaints if c['language'] == 'en']
    text = lambda c: f"{c['title']} {c['description']}"
    vec = TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 4))
    vec.fit([text(c) for c in complaints])
    link = {}
    for c in complaints:
        if c['language'] == 'en' or c['id'] in NONE:
            continue
        if c['id'] in MANUAL:
            link[c['id']] = MANUAL[c['id']]
            continue
        cands = [e for e in en if e['category'] == c['category']
                 and e['location'] == c['location'] and e['room'] == c['room']]
        if not cands:
            continue
        sims = (vec.transform([text(c)]) @
                vec.transform([text(e) for e in cands]).T).toarray()[0]
        j = int(np.argmax(sims))
        if sims[j] >= MIN_SIMILARITY:
            link[c['id']] = cands[j]['id']
    return [link.get(c['id'], c['id']) for c in complaints]
