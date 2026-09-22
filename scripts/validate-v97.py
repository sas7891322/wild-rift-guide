from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib, zipfile

root=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]; self.ids=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        for key in ('href','src'):
            if key in attrs: self.refs.append(attrs[key])
        if 'id' in attrs: self.ids.append(attrs['id'])

for name in ['pages/hwei.html','index.html','summoners-rift.html','pages/heroes.html']:
    p=root/name; parser=Links(); parser.feed(p.read_text())
    assert len(parser.ids)==len(set(parser.ids)), f'duplicate ids: {name}'
    for ref in parser.refs:
        url=urlsplit(ref)
        if url.scheme or url.netloc: continue
        if url.path:
            target=(root / url.path.lstrip('/')) if url.path.startswith('/') else p.parent/url.path
            assert target.exists(), f'missing: {name}: {ref}'
        elif url.fragment: assert unquote(url.fragment) in parser.ids, f'anchor: {ref}'
    print(f'PASS references and IDs: {name}')
assert len(list((root/'assets/images/heroes/hwei').iterdir()))==31
text=(root/'pages/hwei.html').read_text()
for group in range(1,4):
    for choice in range(1,4): assert f'{group} → {choice}' in text
print('PASS: 31 assets; nine child skills. Run validate-v96.mjs separately for protected baseline hashes.')
