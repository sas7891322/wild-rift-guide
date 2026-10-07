"""Sync public ARAM URLs without submitting noindex Rift share redirects."""
from pathlib import Path
from urllib.parse import urlencode
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://wild-rift-guide.vercel.app'

def sync():
    heroes = json.loads((ROOT/'assets/data/aram/heroes.json').read_text())['heroes']
    ids = [hero['id'] for hero in heroes]
    if len(set(ids)) != len(ids):
        raise ValueError('Duplicate ARAM hero IDs')
    path = ROOT/'sitemap.xml'
    text = path.read_text()
    namespace = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

    def keep_entry(match):
        entry = ET.fromstring(match[0])
        loc = entry.findtext('loc', '')
        if loc.startswith(ORIGIN+'/share/heroes/'):
            return ''
        if loc.startswith(ORIGIN+'/aram-hero.html'):
            return ''
        return match[0]

    text = re.sub(r'[ \t]*<url>.*?</url>[ \t]*(?:\n)?', keep_entry, text, flags=re.S)
    entries = '\n'.join(
        '  <url>\n'
        f'    <loc>{ORIGIN}/aram-hero.html?{urlencode({"id": hero_id})}</loc>\n'
        '    <changefreq>weekly</changefreq>\n'
        '    <priority>0.7</priority>\n'
        '  </url>' for hero_id in ids
    )
    text = text.replace('</urlset>', entries+'\n</urlset>')
    parsed = ET.fromstring(text)
    urls = [node.text for node in parsed.findall('s:url/s:loc', namespace)]
    if len(set(urls)) != len(urls):
        raise ValueError('Duplicate sitemap URLs')
    if any('/share/heroes/' in url for url in urls):
        raise ValueError('noindex Rift share redirect in sitemap')
    if any('/pages/member.html' in url for url in urls):
        raise ValueError('Private member page in sitemap')
    path.write_text(text)
    print(f'Sitemap synced: {len(ids)} ARAM hero URLs; {len(urls)} total URLs.')

if __name__ == '__main__':
    sync()
