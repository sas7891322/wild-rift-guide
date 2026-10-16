#!/usr/bin/env python3
"""Check source-to-readable ARAM parity and working static navigation."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import html
import json

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.ids = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if 'id' in attrs:
            self.ids.append(attrs['id'])


def main():
    data = json.loads((ROOT / 'assets/data/aram/heroes.json').read_text())
    failures = []
    checked = 0

    def check(ok, filename, message):
        nonlocal checked
        checked += 1
        if not ok:
            failures.append({'file': str(filename.relative_to(ROOT)), 'issue': message})

    for hero in data['heroes']:
        path = ROOT / f'share/aram/{hero["id"]}.html'
        text = path.read_text()
        doc = Page()
        doc.feed(text)
        check('pagead2.googlesyndication' not in text, path, 'Unexpected advertising loader')
        check(not any(t == 'meta' and a.get('http-equiv') == 'refresh' for t, a in doc.tags), path, 'Unexpected redirect')
        check(any(t == 'link' and a.get('rel') == 'canonical' and a.get('href') == f'https://wild-rift-guide.vercel.app/share/aram/{hero["id"]}.html' for t, a in doc.tags), path, 'Incorrect canonical')
        check(any(t == 'meta' and a.get('name') == 'robots' and a.get('content', '').startswith('index,') for t, a in doc.tags), path, 'Guide not indexable')
        check('尚未完成 7.3b' in text and '7.2e' in text, path, 'Missing historical boundary')
        for key in ['summary', 'tierReason', 'skillOrder', 'skillNote', 'sourceNote']:
            if hero.get(key):
                check(html.escape(str(hero[key]), quote=True) in text, path, f'Missing {key}')
        for key in ['starterItems', 'items', 'boots', 'runes', 'spells', 'situationalItems']:
            for item in hero.get(key, []):
                for prop in ['name', 'reason']:
                    if item.get(prop):
                        check(html.escape(str(item[prop]), quote=True) in text, path, f'Missing {key}.{prop}')
        for value in (hero.get('playstyle') or {}).values():
            check(html.escape(value, quote=True) in text, path, 'Missing playstyle paragraph')
        for source in hero.get('sources', []):
            check(html.escape(source['url'], quote=True) in text, path, 'Missing source link')
        if hero.get('aaaAram'):
            check('7.2b 分類評級' in text and '7.3a 僅有部分' in text, path, 'AAA version missing')
            check(any(t == 'details' and 'open' not in a for t, a in doc.tags), path, 'AAA list should be collapsed')
        check(len(set(doc.ids)) == len(doc.ids), path, 'Duplicate DOM ids')
        for tag, attrs in doc.tags:
            if tag == 'img':
                check((path.parent / attrs['src']).resolve().is_file(), path, 'Missing image: ' + attrs['src'])
            if tag == 'a':
                url = urlsplit(attrs.get('href', ''))
                if not url.scheme and not url.netloc:
                    target = (path.parent / unquote(url.path)).resolve() if url.path else path
                    check(target.is_file(), path, 'Missing local target: ' + url.path)
                    if not url.path and url.fragment:
                        check(url.fragment in doc.ids, path, 'Missing section: ' + url.fragment)

    index_path = ROOT / 'pages/aram-guides.html'
    index_text = index_path.read_text()
    for hero in data['heroes']:
        check(f'../share/aram/{hero["id"]}.html' in index_text, index_path, 'Missing hero ' + hero['id'])
    check('蓄力嘲諷配閃現' not in (ROOT / 'share/aram/galio.html').read_text(), ROOT / 'share/aram/galio.html', 'Stale divergent Galio advice returned')
    report = {'scope': 'Existing ARAM JSON → readable pages; no game data recalibration', 'heroes': len(data['heroes']), 'checks': checked, 'failures': failures}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(bool(failures))


if __name__ == '__main__':
    main()
