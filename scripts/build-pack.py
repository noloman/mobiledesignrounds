#!/usr/bin/env python3
"""Build a combined HTML, ePub and PDF of the public cases from the site files.
Usage: scripts/build-pack.py OUT_DIR   (needs pandoc and Chromium via Playwright)
Output is a sample of the pack: public cases only. Paid extras are written separately."""
import re, sys, glob, os, subprocess, html, datetime
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def clean(h):
    h = re.sub(r'<(script|style|svg|aside|form|button)\b.*?</\1>', '', h, flags=re.S)
    h = re.sub(r'<div class="cta-mini">.*?</div>', '', h, flags=re.S)
    h = re.sub(r'<span class="sx">(.*?)</span>', r'\1', h)
    h = re.sub(r'\s(class|id|role|aria-[a-z]+|data-[a-z-]+|tabindex)="[^"]*"', '', h)
    return re.sub(r'href="/', 'href="https://mobiledesignrounds.com/', h)
cases, toc = [], []
for f in sorted(glob.glob(root + '/mobile-system-design/*/index.html')):
    s = open(f).read()
    h1 = re.search(r'<h1>(.*?)</h1>', s, re.S); art = re.search(r'<article class="prose">(.*?)</article>', s, re.S)
    if not (h1 and art): continue
    slug = f.split('/')[-2]
    toc.append('<li><a href="#c-%s">%s</a></li>' % (slug, h1.group(1)))
    cases.append('<section class="case"><h1 id="c-%s">%s</h1><p class="src">Online: https://mobiledesignrounds.com/mobile-system-design/%s/</p>%s</section>' % (slug, h1.group(1), slug, clean(art.group(1))))
css = ('@page{size:A4;margin:18mm 16mm}body{font:10.5pt/1.55 Georgia,serif;color:#111}h1{font:700 20pt/1.2 Helvetica,Arial,sans-serif;page-break-before:always;margin:0 0 6pt}'
       'h2{font:700 14pt/1.25 Helvetica,Arial,sans-serif;margin:18pt 0 6pt;page-break-after:avoid}h3{font:700 11.5pt Helvetica,Arial,sans-serif;margin:12pt 0 4pt;page-break-after:avoid}'
       '.src{color:#555;font-size:9pt;margin:0 0 12pt}pre,code{font:8.5pt/1.4 Menlo,Consolas,monospace}pre{background:#f3f4f7;padding:6pt;white-space:pre-wrap;word-break:break-word}'
       'table{border-collapse:collapse;width:100%;font-size:9pt;page-break-inside:auto}tr{page-break-inside:avoid}td,th{border:1px solid #999;padding:3pt 5pt;vertical-align:top}'
       'blockquote{border-left:3pt solid #2549E8;margin:8pt 0;padding:2pt 10pt;background:#f6f8ff}.cover{page-break-after:always;padding-top:60mm}.cover h1{font-size:30pt;page-break-before:avoid}'
       'a{color:#1a3fc0;text-decoration:none}.toc li{margin:3pt 0}')
cover = ('<div class="cover"><h1>Mobile System Design Rounds</h1><p style="font-size:14pt">Study pack sample: all public case studies for Android and iOS</p>'
         '<p>By Manuel Lorenzo, an Android developer. Drafted with AI assistance, then edited and reviewed by him. No iOS engineer has reviewed the iOS parts yet.</p>'
         '<p>Built %s from https://mobiledesignrounds.com. Text: CC BY-NC 4.0.</p></div><h2>Contents</h2><ol class="toc">%s</ol>' % (datetime.date.today().isoformat(), ''.join(toc)))
doc = '<!doctype html><html lang="en"><meta charset="utf-8"><title>Mobile System Design Rounds: study pack sample</title><style>' + css + '</style><body>' + cover + '\n'.join(cases)
open(out + '/pack.html', 'w').write(doc)
subprocess.run(['pandoc', out + '/pack.html', '-o', out + '/pack.epub', '--metadata', 'title=Mobile System Design Rounds: study pack sample', '--metadata', 'author=Manuel Lorenzo', '--toc', '--toc-depth=2'], check=True, stderr=subprocess.DEVNULL)
js = "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();await p.goto('file://'+process.argv[1]);await p.pdf({path:process.argv[2],format:'A4',printBackground:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style=\"font:8px Helvetica;width:100%;text-align:center;color:#666\">Mobile System Design Rounds &middot; <span class=pageNumber></span></div>',margin:{top:'18mm',bottom:'18mm',left:'16mm',right:'16mm'}});await b.close()})()"
subprocess.run(['node', '-e', js, os.path.abspath(out + '/pack.html'), os.path.abspath(out + '/pack.pdf')], check=True, env={**os.environ, 'NODE_PATH': '/opt/node-tools/node_modules'})
print('built', sorted(os.listdir(out)))
