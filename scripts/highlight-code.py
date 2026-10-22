#!/usr/bin/env python3
"""Add syntax highlighting spans to code blocks in every page. Safe to re-run.

Wraps tokens in <span class="tk-...">. Blocks that already have spans are skipped.
Run after adding or editing a code block: python3 scripts/highlight-code.py
"""
import glob, html, re

KW = set("""abstract actual annotation as break by catch class companion const constructor continue crossinline
data do else enum expect external false final finally for fun get if import in infix init inline inner interface
internal is it lateinit noinline null object open operator out override package private protected public reified
return sealed set super suspend this throw true try typealias val value var vararg when where while
actor async await case defer extension fileprivate func guard let nil protocol self static struct subscript
switch throws weak lazy mutating nonisolated rethrows some any""".split())

KOTLIN = re.compile(r'''
 (?P<com>//[^\n]*|/\*.*?\*/)
|(?P<str>"""[\s\S]*?"""|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])')
|(?P<ann>@[A-Za-z_][\w.]*)
|(?P<num>\b0[xX][0-9a-fA-F_]+[Ll]?\b|\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[LlfF]?\b)
|(?P<id>[A-Za-z_][A-Za-z_0-9]*)
''', re.X | re.S)

JSON = re.compile(r'''
 (?P<key>"(?:\\.|[^"\\])*"(?=\s*:))
|(?P<str>"(?:\\.|[^"\\])*")
|(?P<num>-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)
|(?P<kw>\b(?:true|false|null)\b)
''', re.X)

XML = re.compile(r'''
 (?P<com><!--.*?-->)
|(?P<tag></?[\w:.-]+|/?>)
|(?P<attr>[\w:.-]+(?==))
|(?P<str>"[^"]*")
''', re.X | re.S)


def esc(s):
    return html.escape(s, quote=False)


def span(cls, s):
    return '<span class="tk-%s">%s</span>' % (cls, esc(s))


def kotlin(t):
    out, pos = [], 0
    for m in KOTLIN.finditer(t):
        out.append(esc(t[pos:m.start()]))
        pos = m.end()
        k, s = m.lastgroup, m.group()
        if k == 'id':
            nxt = t[m.end():m.end() + 1]
            if s in KW:
                out.append(span('kw', s))
            elif s[0].isupper():
                out.append(span('ty', s))
            elif nxt == '(':
                out.append(span('fn', s))
            else:
                out.append(esc(s))
        else:
            out.append(span(k, s))
    out.append(esc(t[pos:]))
    return ''.join(out)


def simple(t, rx, cls):
    out, pos = [], 0
    for m in rx.finditer(t):
        out.append(esc(t[pos:m.start()]))
        pos = m.end()
        out.append(span(cls.get(m.lastgroup, m.lastgroup), m.group()))
    out.append(esc(t[pos:]))
    return ''.join(out)


def highlight(text):
    first = text.lstrip()[:1]
    if first in '{[':
        return simple(text, JSON, {'key': 'ann', 'kw': 'kw'})
    if first == '<':
        return simple(text, XML, {'tag': 'kw', 'attr': 'ty'})
    return kotlin(text)


PRE = re.compile(r'(<pre[^>]*><code[^>]*>)(.*?)(</code></pre>)', re.S)


def fix(m):
    body = m.group(2)
    if '<span' in body or '<a ' in body:
        return m.group(0)
    return m.group(1) + highlight(html.unescape(body)) + m.group(3)


n = 0
for f in glob.glob('**/index.html', recursive=True):
    s = open(f, encoding='utf-8').read()
    r = PRE.sub(fix, s)
    if r != s:
        open(f, 'w', encoding='utf-8').write(r)
        n += 1
print('highlighted', n, 'pages')
