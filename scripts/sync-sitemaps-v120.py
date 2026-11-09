#!/usr/bin/env python3
"""List public canonical reading URLs; keep real historical dates elsewhere."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://wild-rift-guide.vercel.app'
DATE = '2026-10-16'
NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
ET.register_namespace('', NS)
class Head(HTMLParser):
    def __init__(self): super().__init__(); self.canonical = None; self.noindex = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical = a.get('href')
        if tag == 'meta' and a.get('name') == 'robots': self.noindex = 'noindex' in a.get('content','')

def generate():
    old = ET.parse(ROOT/'sitemap.xml').getroot()
    entries = {}
    for node in old:
        url = node.findtext('{'+NS+'}loc'); bits=urlsplit(url)
        if bits.query: continue
        file=ROOT/(bits.path.lstrip('/') or 'index.html')
        if file.is_dir(): file=file/'index.html'
        if not file.is_file(): continue
        doc=Head();doc.feed(file.read_text())
        if doc.noindex: continue
        entries[doc.canonical or url] = node.findtext('{'+NS+'}lastmod')
    paths = [ROOT/'index.html', ROOT/'summoners-rift.html',ROOT/'aram.html',ROOT/'pages/hero-guides.html',ROOT/'pages/aram-guides.html']
    paths += list((ROOT/'articles').glob('*.html'))
    paths += [ROOT/'pages'/x for x in ['editorial.html','about.html','changelog.html','contact.html']]
    paths += list((ROOT/'share/heroes').glob('*.html')) + list((ROOT/'share/aram').glob('*.html'))
    changed = set(subprocess.check_output(['git','diff','--name-only'],cwd=ROOT,text=True).splitlines())
    for path in paths:
        doc=Head();doc.feed(path.read_text())
        assert doc.canonical and not doc.noindex,path
        rel=path.relative_to(ROOT).as_posix()
        if rel in changed or rel.startswith('share/'): date=DATE
        else: date=entries.get(doc.canonical)
        entries[doc.canonical]=date
    for url in list(entries):
        rel=urlsplit(url).path.lstrip('/') or 'index.html'
        if rel in changed: entries[url]=DATE
    out=ET.Element('{'+NS+'}urlset')
    for url,date in sorted(entries.items()):
        n=ET.SubElement(out,'{'+NS+'}url');ET.SubElement(n,'{'+NS+'}loc').text=url
        if date: ET.SubElement(n,'{'+NS+'}lastmod').text=date
    ET.indent(out, space='  ')
    ET.ElementTree(out).write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
    editorial=ET.parse(ROOT/'sitemap-editorial.xml')
    for node in editorial.getroot():
        url=node.findtext('{'+NS+'}loc')
        if url in entries and entries[url]:
            lm=node.find('{'+NS+'}lastmod')
            if lm is None:lm=ET.SubElement(node,'{'+NS+'}lastmod')
            lm.text=entries[url]
    ET.indent(editorial,space='  ');editorial.write(ROOT/'sitemap-editorial.xml',encoding='utf-8',xml_declaration=True)
    print(f'Canonical sitemap: {len(entries)} URLs; 203 Rift and141 ARAM reading pages.')
if __name__=='__main__': generate()
