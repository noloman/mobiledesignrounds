#!/usr/bin/env python3
"""Build a combined HTML, ePub and PDF of the public cases from the site files.
Usage: scripts/build-pack.py OUT_DIR   (needs pandoc and Chromium via Playwright)
Output is a sample of the pack: free cases only. Paid bonus cases come from /mnt/project-files/pack-drafts/."""
import re, sys, glob, os, subprocess, html
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cases = sorted(d for d in glob.glob(root + '/mobile-system-design/*/index.html'))
parts = []
for f in cases:
    s = open(f).read()
    m = re.search(r'<main[^>]*>(.*?)</main>', s, re.S)
    if not m: continue
    body = re.sub(r'<script.*?</script>|<form.*?</form>|<nav[^>]*class="[^"]*crumb[^"]*".*?</nav>', '', m.group(1), flags=re.S)
    body = re.sub(r'href="/', 'href="https://mobiledesignrounds.com/', body)
    parts.append('<section class="case">' + body + '</section>')
css = 'body{font:11pt/1.5 Georgia,serif;max-width:42em;margin:auto}h1{page-break-before:always}pre,code{font-size:9pt}table{border-collapse:collapse}td,th{border:1px solid #999;padding:3px}img,svg{max-width:100%}'
doc = '<!doctype html><meta charset="utf-8"><title>Mobile Design Rounds: study pack sample</title><style>' + css + '</style>' + '\n'.join(parts)
open(out + '/pack.html', 'w').write(doc)
subprocess.run(['pandoc', out + '/pack.html', '-o', out + '/pack.epub', '--metadata', 'title=Mobile Design Rounds: study pack sample', '--metadata', 'author=Manuel Lorenzo', '--toc'], check=True)
js = "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();await p.goto('file://'+process.argv[1]);await p.pdf({path:process.argv[2],format:'A4',margin:{top:'18mm',bottom:'18mm',left:'16mm',right:'16mm'},printBackground:true});await b.close()})()"
subprocess.run(['node', '-e', js, os.path.abspath(out + '/pack.html'), os.path.abspath(out + '/pack.pdf')], check=True, env={**os.environ, 'NODE_PATH': '/opt/node-tools/node_modules'})
print('built', os.listdir(out))
