#!/usr/bin/env python3
"""Read-only v124.2 audit: current UI, Riot Taiwan 7.3d delta, modes, ads and URLs."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import json, re, xml.etree.ElementTree as ET, subprocess

R=Path(__file__).resolve().parents[1]
D=R/'assets/data'
OFF='https://wildrift.leagueoflegends.com/zh-tw/news/game-updates/wild-rift-patch-notes-7-3d/'
PUB='6785196021794818'
errors=[];warning=[]
read=lambda path:json.loads((D/path).read_text(encoding='utf-8'))
patch=read('patch.json')
heroes=read('heroes.json')['heroes']+[read('hwei-profile.json')]
aram=read('aram/heroes.json')['heroes']
items=read('items-7.3.json')['items']
aug=read('aram/augments.json')
off=read('official-7.3d.json')

if patch.get('version')!='7.3d' or patch.get('siteVersion')!='v124.2':errors.append('Patch identity/version not v124.2/7.3d')
if (len(heroes),len(aram),len(aug['augments']))!=(203,142,151):errors.append('Rift/ARAM/augment roster count changed')
if any(h.get('patch')!='7.3d' for h in heroes+aram):errors.append('Hero current patch mismatch')
if off.get('source')!=OFF or off.get('sourceLanguage')!='zh-tw':errors.append('Official Taiwan source mismatch')
if (len(off['heroes']),len(off['items']),len(off['aaa']['augments']))!=(11,6,6):errors.append('Official 7.3d change list incomplete')
if off['reviewedAt']!='2026-11-04':errors.append('Official cross-check date missing')
matched=[x for x in aug['augments'] if x['name']=='有福同享']
if len(matched)!=1 or matched[0]['effect']!='施放治療或護盾技能時，友方英雄也會獲得40%治療或護盾效果。':errors.append('有福同享 effect must be 40% in current card database')
if aug['officialPatchReview'].get('matched73dCards')!=1 or aug['officialPatchReview'].get('unmatched73dAnnouncements')!=5:errors.append('Unverified augment mappings must remain separate')
expectedNames={'紫色劇毒','炫彩衝撞系列','節奏獵手','紅藍混音','有福同享','緋紅爆發'}
if {x['name'] for x in off['aaa']['augments']}!=expectedNames:errors.append('Official TW augment name set mismatch')
for name in ('獵魔弩箭','聖裂之杖','奪魄之鐮','低語之環','歌謠之冠','狂暴利刃'):
 obj=next((x for x in items if x['name']==name),None)
 if not obj or obj.get('dataVersion')!='7.3d' or obj.get('patch73d',{}).get('source')!=OFF:errors.append(f'Unreviewed 7.3d directly changed item: {name}')

current_pages=['pages/guides.html','pages/heroes.html','pages/aram-guides.html','pages/runes.html','pages/spells.html','pages/about.html','pages/editorial.html','pages/build-check.html','aram-hero.html']
for p in current_pages:
 s=(R/p).read_text(encoding='utf-8')
 if '7.3c' in s:errors.append(f'Current 7.3c UI label remains in {p}')
 if '7.3d' not in s:errors.append(f'Missing current 7.3d label in {p}')
 if 'ca-pub-3703014721072968' in s:errors.append(f'old publisher ID in {p}')
for p in ('assets/js/heroes.js','assets/js/build-check.js','assets/js/aram-augments.js'):
 s=(R/p).read_text(encoding='utf-8')
 if '7.3c' in s:errors.append(f'Outdated dynamic UI label in {p}')
for p in ('summoners-rift.html','aram.html','aram-augments.html'):
 s=(R/p).read_text(encoding='utf-8')
 if OFF not in s:errors.append(f'Official TW 7.3d link missing in {p}')
 if 'Violet Toxin' in s:errors.append(f'English augment patch name in {p}')
 if '有福同享' not in s:errors.append(f'Confirmed 7.3d augment name missing from {p}')
 if '6組AAA增幅因英文名尚未可靠對應' in s:errors.append(f'Old unresolved English report in {p}')
 if '7.3d' not in s:errors.append(f'7.3d current patch missing {p}')
for p in ('pages/review-7-3d.html',):
 s=(R/p).read_text(encoding='utf-8')
 if 'Riot英文官方' in s or 'AAA增幅保留英文原名' in s:errors.append('Historic English-source uncertainty still stated in current 7.3d report')

ads=(R/'ads.txt').read_text(encoding='utf-8').strip()
if ads!=f'google.com, pub-{PUB}, DIRECT, f08c47fec0942fa0':errors.append('ads.txt publisher mismatch')
for p in R.rglob('*.html'):
 s=p.read_text(encoding='utf-8')
 if '3703014721072968' in s:errors.append(f'Old ads ID {p.relative_to(R)}')
 if 'adsbygoogle.js' in s and f'ca-pub-{PUB}' not in s:errors.append(f'Wrong ads loader on {p.relative_to(R)}')

# Static sitemap only; duplicate mentions across the two files are expected.
for name in ('sitemap.xml','sitemap-editorial.xml'):
 try:
  tree=ET.parse(R/name)
  urls=[n.text for n in tree.iter() if n.tag.endswith('loc')]
 except Exception as exc:errors.append(f'{name} invalid: {exc}');continue
 if len(set(urls))!=len(urls):errors.append(f'{name} contains repeated <loc>')
 for url in urls:
  if not url.startswith('https://wild-rift-guide.vercel.app/') or '?' in url:errors.append(f'Invalid URL in sitemap: {url}')

# Content scope preserved, and old review pages must not masquerade as the new version.
if not (R/'pages/review-7-3c.html').is_file():errors.append('Historical 7.3c review unexpectedly removed')
if '7.3c' not in (R/'pages/review-7-3c.html').read_text(encoding='utf-8'):errors.append('Historical 7.3c review was overwritten')

report={'release':'v124.2','patch':'7.3d','reviewedAt':'2026-11-04','counts':{'rift':len(heroes),'aram':len(aram),'existingAugments':len(aug['augments']),'officialHeroes':len(off['heroes']),'officialItems':len(off['items']),'officialAugments':len(off['aaa']['augments'])},'errors':errors,'warnings':warning}
(R/'reports'/'validation-v1242.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(1 if errors else 0)
