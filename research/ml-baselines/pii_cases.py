"""Builds planted-identifier test sentences for the redaction check.
Run: python3 pii_cases.py  (writes pii_cases.json)"""
import json, random
from pathlib import Path
random.seed(42)
first = ['Ali', 'Ayesha', 'Hamza', 'Fatima', 'Usman', 'Zainab', 'Bilal', 'Sana', 'Omar', 'Hira']
last = ['Khan', 'Ahmed', 'Siddiqui', 'Qureshi', 'Malik', 'Shaikh', 'Raza', 'Iqbal']
def d(n): return ''.join(random.choice('0123456789') for _ in range(n))
def phone():
    a, b = '3' + d(2), d(7)
    return random.choice([f'0{a}-{b}', f'0{a}{b}', f'+92 {a} {b}', f'+92{a}{b}', f'0092 {a} {b}', f'0{a} {b}'])
def cnic():
    x, y, z = d(5), d(7), d(1)
    return random.choice([f'{x}-{y}-{z}', f'{x}{y}{z}'])
def sid():
    s = f'IU{d(2)}-{d(4)}-{d(4)}'
    return random.choice([s, s.lower()])
def email():
    n = random.choice(first).lower() + '.' + d(5)
    return random.choice([f'{n}.ac@iqra.edu.pk', f'{n}@gmail.com', f'{n}@outlook.com'])
def name(): return f'{random.choice(first)} {random.choice(last)}'
T = {
 'email': ['Please reply to {} about the projector.', 'Mera email {} hai, update kar dein.'],
 'phone': ['Call me on {} if the lab is open.', 'Mera number {} hai.'],
 'cnic': ['My CNIC is {} for the hostel form.', 'CNIC {} ke sath form diya tha.'],
 'student id': ['Student ID {} cannot log in to the portal.', 'Meri ID {} se portal nahi khul raha.'],
 'name': ['{} from BSCS 5 also saw the leak.', '{} ne bhi complaint ki thi.'],
}
gen = {'email': email, 'phone': phone, 'cnic': cnic, 'student id': sid, 'name': name}
cases = []
for kind, temps in T.items():
    for i in range(40):
        v = gen[kind]()
        cases.append({'kind': kind, 'value': v, 'text': temps[i % 2].format(v)})
Path(__file__).with_name('pii_cases.json').write_text(json.dumps(cases, indent=1))
print(len(cases))
