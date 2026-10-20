#!/usr/bin/env python3
"""Build /search-index.json from the site pages. Run from anywhere; rerun after content changes."""
import re, glob, os, json, html
from collections import Counter
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECTIONS = [('mobile-system-design/', 'Case study'), ('follow-up/', 'Follow-up round'), ('guides/', 'Guide'), ('concepts/', 'Concept'),
            ('patterns/', 'Concept'), ('failure-modes/', 'Concept'), ('glossary/', 'Glossary'), ('simulators/', 'Tool'),
            ('practice/', 'Practice'), ('compare/', 'Compare'), ('start/', 'Start'), ('about/', 'Project'), ('alternatives/', 'Project')]
SKIP = ('subscribed/', 'search/', 'cheat-sheet/', '404')
def text(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
out = []
for f in sorted(glob.glob(root + '/**/index.html', recursive=True)):
    rel = os.path.relpath(f, root).replace('index.html', '')
    if rel == '' : rel = ''
    if rel.startswith(SKIP) or '/node_modules/' in f: continue
    s = open(f).read()
    t = re.search(r'<title>(.*?)</title>', s, re.S); d = re.search(r'name="description" content="([^"]*)"', s)
    if not t: continue
    kind = 'Page'
    if rel.endswith('/build/'): kind = 'Build guide'
    else:
        for p, k in SECTIONS:
            if rel.startswith(p): kind = k; break
    m = re.search(r'<main[^>]*>(.*?)</main>', s, re.S)
    heads = [text(h) for h in re.findall(r'<h[23][^>]*>(.*?)</h[23]>', m.group(1) if m else '', re.S)]
    body = text(re.sub(r'<(script|style|svg)\b.*?</\1>', ' ', m.group(1) if m else '', flags=re.S)).lower()
    words = [w for w, _ in Counter(re.findall(r'[a-z][a-z0-9]{3,}', body)).most_common(350)]
    out.append({'u': '/' + rel, 't': text(t.group(1)).replace(' | Mobile Design Rounds', ''), 'd': html.unescape(d.group(1)) if d else '', 'k': kind,
                'h': ' | '.join(h for h in heads if h)[:600], 'w': ' '.join(words)})
json.dump(out, open(root + '/search-index.json', 'w'), separators=(',', ':'), ensure_ascii=False)
print(len(out), 'pages,', os.path.getsize(root + '/search-index.json') // 1024, 'KB')
