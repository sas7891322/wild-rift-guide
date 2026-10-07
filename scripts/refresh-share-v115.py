"""Refresh Rift sharing metadata while retaining the current redirect-based design."""
from pathlib import Path
import json, re, html
ROOT=Path(__file__).resolve().parents[1]
read=lambda p:json.loads((ROOT/p).read_text())
heroes=read('assets/data/heroes.json')['heroes']+[read('assets/data/hwei-profile.json')]
e=lambda x:html.escape(str(x),quote=True)
for h in heroes:
    target=ROOT/f'share/heroes/{h["id"]}.html'
    desc=f'{h["name"]}（{h["enName"]}）7.3a {h["role"]}攻略：{h["summary"]}'
    if target.exists():
        page=target.read_text()
        # The repository intentionally redirects share pages to the interactive guide.
        page=re.sub(r'(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(")',lambda m:m[1]+e(desc)+m[2],page)
        page=re.sub(r'(<body><main><h1>[^<]*</h1><p>).*?(</p>)',lambda m:m[1]+e(desc)+m[2],page)
    else:
        page=(ROOT/'share/heroes/caitlyn.html').read_text()
        page=page.replace('caitlyn',h['id']).replace('凱特琳飛龍路',e(h['name']+h['role']))
        portrait=h['avatar'].replace('../','')
        page=re.sub(r'https://wild-rift-guide\.vercel\.app/assets/images/heroes/portraits/[^" ]+', 'https://wild-rift-guide.vercel.app/'+portrait,page)
        page=re.sub(r'(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(")',lambda m:m[1]+e(desc)+m[2],page)
        page=re.sub(r'(<body><main><h1>[^<]*</h1><p>).*?(</p>)',lambda m:m[1]+e(desc)+m[2],page)
    target.write_text(page)
index=ROOT/'pages/hero-guides.html'
page=index.read_text()
groups=[]
for role,name in [('baron','巴龍路'),('jungle','打野'),('mid','中路'),('duo','飛龍路'),('support','輔助')]:
    hs=[h for h in heroes if h['roleId']==role]
    cards=''.join(f'<a href="../share/heroes/{e(h["id"])}.html"><strong>{e(h["name"])}</strong><span>{e(h["tier"])} · {e(h["enName"])}</span><p>{e(h["summary"])}</p></a>' for h in hs)
    groups.append(f'<section class="sgi-group"><h2>{name} <small>{len(hs)} 份</small></h2><div class="sgi-grid">{cards}</div></section>')
page=re.sub(r'<section class="sgi-group">.*?</main>',lambda m:''.join(groups)+'</main>',page,flags=re.S)
page=page.replace('7.2d','7.3a').replace('7.2D','7.3A').replace('202 份','203 份')
index.write_text(page)
# Update existing Rift links only. ARAM entries and their dates are untouched.
sitemap=ROOT/'sitemap.xml'
page=sitemap.read_text()
page=re.sub(r'(<url>\s*<loc>https://wild-rift-guide\.vercel\.app/(?:share/heroes/[^<]+|pages/heroes\.html[^<]*|summoners-rift\.html|pages/(?:hero-guides|items|runes|spells|patch)\.html)</loc>\s*<lastmod>)[^<]+',lambda m:m[1]+'2026-10-01',page)
sitemap.write_text(page)
import runpy
runpy.run_path(str(ROOT/'scripts/sync-aram-seo.py'),run_name='__main__')
print(f'Updated {len(heroes)} share redirects and the Rift index; no ARAM regeneration.')
