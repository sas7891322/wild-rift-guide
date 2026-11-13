#!/usr/bin/env python3
"""Check crawl/index boundaries without requiring a Vercel deployment."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, parse_qs
import importlib.util
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


class Head(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.robots = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('name', '').lower() == 'robots':
            self.robots.append(attrs.get('content', '').lower())


def matches(source, path):
    if source.endswith('/:path*'):
        prefix = source[:-len('/:path*')]
        return path == prefix or path.startswith(prefix + '/')
    return path == source


def has_noindex_header(config, url):
    parts = urlsplit(url)
    query = parse_qs(parts.query, keep_blank_values=True)
    for rule in config['headers']:
        if not matches(rule['source'], parts.path):
            continue
        if not all(item['type'] == 'query' and item['key'] in query
                   for item in rule.get('has', [])):
            continue
        if any(h['key'].lower() == 'x-robots-tag' and 'noindex' in h['value']
               for h in rule['headers']):
            return True
    return False


def can_fetch(text, agent, url):
    """Test this package's simple robots rules, including Google's * wildcard."""
    groups = {}
    current = None
    for raw in text.splitlines():
        raw = raw.split('#', 1)[0].strip()
        if ':' not in raw:
            continue
        key, value = (part.strip() for part in raw.split(':', 1))
        if key.lower() == 'user-agent':
            current = value.lower()
            groups.setdefault(current, [])
        elif key.lower() in ('allow', 'disallow') and current:
            groups[current].append((key.lower(), value))
    rules = groups.get(agent.lower(), groups.get('*', []))
    hits = []
    for kind, pattern in rules:
        if re.match('^' + re.escape(pattern).replace(r'\*', '.*'), url):
            hits.append((len(pattern.replace('*', '')), kind == 'allow'))
    return max(hits)[1] if hits else True


def main():
    config = json.loads((ROOT / 'vercel.json').read_text())
    assert not config.get('rewrites'), 'Static site must not rewrite unknown URLs to home'
    assert config['cleanUrls'] is False
    for route in config['redirects']:
        assert (ROOT / route['destination'].lstrip('/')).is_file(), route
        assert route['source'] != route['destination'] and route['permanent'] is True
    redirects = {r['source']: r['destination'] for r in config['redirects']}
    assert redirects['/privacy'] == '/pages/privacy.html'

    rift = sorted((ROOT / 'share/heroes').glob('*.html'))
    aram = sorted((ROOT / 'share/aram').glob('*.html'))
    assert len(rift) == 204 and len(aram) == 143
    extras = ['aram-hero.html', 'pages/hwei.html', 'pages/hwei-demonstrations.html']
    guides = rift + aram + [ROOT / p for p in extras]
    for path in guides:
        assert Head(path.read_text()).robots == ['noindex,follow'], path
        assert has_noindex_header(config, '/' + str(path.relative_to(ROOT))), path

    excluded = [
        '/pages/heroes.html?hero=sylas-mid',
        '/pages/heroes.html?role=mid&hero=hwei-mid',
        '/pages/heroes.html?hero=',
        '/aram-hero.html?id=sylas&mode=aaa',
        '/aram-hero.html?mode=standard&id=sylas',
    ]
    kept = ['/', '/privacy', '/pages/privacy.html', '/pages/heroes.html',
            '/pages/heroes.html?role=mid', '/pages/hero-guides.html',
            '/pages/aram-guides.html', '/aram.html', '/assets/js/heroes.js']
    kept += ['/' + str(p.relative_to(ROOT)) for p in (ROOT / 'articles').glob('*.html')]
    for url in excluded:
        assert has_noindex_header(config, url), url
    for url in kept:
        assert not has_noindex_header(config, url), url
        path = ROOT / (urlsplit(url).path.lstrip('/') or 'index.html')
        if path.is_file() and path.suffix == '.html':
            assert not any('noindex' in x for x in Head(path.read_text()).robots), path

    recommended = (ROOT / 'robots.txt').read_text()
    blocking = (ROOT / 'examples/adsense-routing/robots.block-guides.txt').read_text()
    guide_urls = ['/' + str(p.relative_to(ROOT)) for p in guides] + excluded
    for url in guide_urls + kept:
        assert can_fetch(recommended, 'Googlebot', url), url
        assert can_fetch(recommended, 'Mediapartners-Google', url), url
        assert can_fetch(blocking, 'Mediapartners-Google', url), url
    for url in guide_urls:
        assert not can_fetch(blocking, 'Googlebot', url), url
    for url in kept:
        assert can_fetch(blocking, 'Googlebot', url), url

    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    for name in ['sitemap.xml', 'sitemap-editorial.xml']:
        urls = [n.text for n in ET.parse(ROOT / name).findall('.//s:loc', ns)]
        assert len(urls) == len(set(urls)), name
        for url in urls:
            assert not has_noindex_header(config, url), url
            path = ROOT / (urlsplit(url).path.lstrip('/') or 'index.html')
            if path.is_dir():
                path /= 'index.html'
            assert not any('noindex' in x for x in Head(path.read_text()).robots), path
        if name == 'sitemap.xml':
            assert len(urls) == 35
            assert 'https://wild-rift-guide.vercel.app/pages/privacy.html' in urls

    spec = importlib.util.spec_from_file_location('readable', ROOT / 'scripts/generate-rift-readable-v127.py')
    generator = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(generator)
    for path in ['/share/heroes/sylas-mid.html', '/share/aram/sylas.html']:
        assert Head(generator.head('test', 'test', generator.ORIGIN + path)).robots == ['noindex,follow']
    assert 'noindex' not in Head(generator.head('test', 'test', generator.ORIGIN + '/pages/hero-guides.html')).robots[0]
    print(json.dumps({'status': 'PASS', 'staticNoindexPages': len(guides),
                      'sitemapUrls': 35, 'checks': 'headers, query order, crawl rules, canonical targets, generator'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
