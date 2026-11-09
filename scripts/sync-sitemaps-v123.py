#!/usr/bin/env python3
"""Build sitemap from canonical, indexable HTML; never list query/functional URLs."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET
import json, hashlib
ROOT=Path(__file__).resolve().parents[1];ORIGIN='https://wild-rift-guide.vercel.app';NS='http://www.sitemaps.org/schemas/sitemap/0.9';DATE='2026-10-25';ET.register_namespace('',NS)
class Head(HTMLParser):
 def __init__(self):super().__init__();self.canon=[];self.noindex=False;self.refresh=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='link' and a.get('rel')=='canonical':self.canon.append(a.get('href'))
  if tag=='meta' and a.get('name')=='robots':self.noindex='noindex' in a.get('content','')
  if tag=='meta' and a.get('http-equiv','').lower()=='refresh':self.refresh=True

def main():
 old={}
 for name in ['sitemap.xml','sitemap-editorial.xml']:
  path=ROOT/name
  if path.exists():
   for node in ET.parse(path).getroot():old[node.findtext('{'+NS+'}loc')]=node.findtext('{'+NS+'}lastmod')
 revisions_path=ROOT/'assets/data/content-revisions-v123.json'
 revisions=json.loads(revisions_path.read_text(encoding='utf-8')).get('files',{}) if revisions_path.exists() else {}
 entries={}
 for p in ROOT.rglob('*.html'):
  if any(x.startswith('.') for x in p.relative_to(ROOT).parts):continue
  doc=Head();doc.feed(p.read_text(encoding='utf-8'))
  if doc.noindex or doc.refresh or len(doc.canon)!=1:continue
  u=doc.canon[0];parts=urlsplit(u)
  if not u.startswith(ORIGIN+'/') or parts.query or parts.fragment:continue
  target=ROOT/(parts.path.lstrip('/') or 'index.html')
  if target.is_dir():target=target/'index.html'
  if target.resolve()!=p.resolve():continue
  record=revisions.get(str(p.relative_to(ROOT)),{})
  # Do not stamp every URL with today's date. Unknown/new edits may omit lastmod.
  verified=record.get('contentSha256')==hashlib.sha256(p.read_bytes()).hexdigest()
  entries[u]=record.get('lastmod') if verified else old.get(u)
 for name,selected in [('sitemap.xml',entries),('sitemap-editorial.xml',{u:d for u,d in entries.items() if '/articles/' in u or u.endswith(('/pages/about.html','/pages/editorial.html','/pages/contact.html','/pages/review-7-3c.html'))})]:
  root=ET.Element('{'+NS+'}urlset')
  for url,date in sorted(selected.items()):
   n=ET.SubElement(root,'{'+NS+'}url');ET.SubElement(n,'{'+NS+'}loc').text=url
   if date:ET.SubElement(n,'{'+NS+'}lastmod').text=date
  ET.indent(root,space='  ');ET.ElementTree(root).write(ROOT/name,encoding='utf-8',xml_declaration=True)
 print(json.dumps({'canonicalUrls':len(entries),'rift':sum('/share/heroes/' in x for x in entries),'aram':sum('/share/aram/' in x for x in entries)},ensure_ascii=False))
if __name__=='__main__':main()
