#!/usr/bin/env python3
"""Check published HTML against the current canonical game-data inputs."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import importlib.util
import json
import re

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('generator',ROOT/'scripts/generate-rift-readable-v120.py')
g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
checks=0
failures=[]
def check(condition,label):
    global checks
    checks+=1
    if not condition:failures.append(label)

class Parser(HTMLParser):
    def __init__(self):
        super().__init__();self.tags=[];self.text=[]
    def handle_starttag(self,tag,attrs):self.tags.append((tag,dict(attrs)))
    def handle_data(self,data):self.text.append(data)

lengths=[]
for hero in g.HEROES:
    path=ROOT/'share/heroes'/f'{hero["id"]}.html';s=path.read_text();parser=Parser();parser.feed(s)
    visible=' '.join(parser.text);lengths.append(len(visible))
    tags=parser.tags
    ident=hero['id']
    check(sum(t=='link' and a.get('rel')=='canonical' and a.get('href')==g.ORIGIN+'/share/heroes/'+ident+'.html' for t,a in tags)==1,ident+' self canonical')
    check('noindex' not in s and 'location.replace' not in s and 'http-equiv="refresh"' not in s,ident+' readable/indexable')
    check('pagead2.googlesyndication.com' not in s,ident+' no ads loader')
    for field in ['starterItems','coreItems','items','boots','runes','spells']:
        actual=[a.get('data-config-id') for t,a in tags if a.get('data-config-group')==field]
        check(actual==hero.get(field,[]),ident+' '+field+' exact order')
    actual=[a.get('data-skill-key') for t,a in tags if a.get('data-skill-level')]
    check(actual==hero.get('skillSequence',[]),ident+' skill sequence')
    for field in ['skillSequenceNote','summary']:
        if hero.get(field):check(hero[field] in visible,ident+' '+field)
    for ability in hero['abilities']:
        check(ability['summary'] in visible,ident+' ability '+ability['key'])
        for item in ability.get('details',[]):check(item in visible,ident+' ability detail')
    for field in ['tier','build','runes','spells','skills','mechanics','matchups']:
        reason=hero['editorialReview'].get(field,{}).get('reason')
        if reason:check(reason in visible,ident+' current '+field+' reasoning')
    for record in hero['editorialReview']['checks']:
        check(record['detail'] in visible,ident+' review detail')
        if record['status']=='pending':
            check(any(a.get('data-review-field')==record['field'] and a.get('data-review-status')=='pending' for t,a in tags),ident+' pending warning')
    expected=[(c['fromId'],c['toId']) for situation in hero.get('matchupAdjustments',{}).get('situations',[]) for c in situation['changes']]
    actual=[(a['data-change-from'],a['data-change-to']) for t,a in tags if 'data-change-from' in a]
    check(actual==expected,ident+' exact situation replacements')
    for variant in hero.get('buildVariants',[]):
        for field in ['items','boots','runes','spells']:
            expect=variant.get(field,hero.get(field,[]))
            actual=[a['data-config-id'] for t,a in tags if a.get('data-config-group')=='variant-'+field]
            check(all(id in actual for id in expect),ident+' variant '+field)
        check(variant['note'] in visible,ident+' variant note')
    if hero.get('hideBan'):check('優先 Ban 參考' not in visible,ident+' hideBan')
    ids=[a['id'] for t,a in tags if a.get('id')]
    check(len(set(ids))==len(ids),ident+' unique section IDs')
    for t,a in tags:
        reference=a.get('src') if t=='img' else a.get('href') if t=='link' and a.get('rel') in ('stylesheet','icon') else None
        if reference and not re.match(r'^(https?:|data:)',reference):
            target=(path.parent/unquote(urlparse(reference).path)).resolve()
            check(target.is_file(),ident+' asset '+reference)
index=Parser();index.feed((ROOT/'pages/hero-guides.html').read_text())
links=[a.get('href') for t,a in index.tags if t=='a' and a.get('href','').startswith('../share/heroes/')]
check(len(links)==203 and len(set(links))==203,'index 203 unique links')
check(all('../share/heroes/'+h['id']+'.html' in links for h in g.HEROES),'index all profiles')
check(all(any(a.get('id')==role for t,a in index.tags) for role in g.ROLES),'index five role anchors')
check(len([1 for h in g.HEROES for c in h['editorialReview']['checks'] if c['status']=='pending'])==9,'nine pending checks preserved')
report={'checks':checks,'failures':failures,'guides':len(g.HEROES),'htmlTextLengthMin':min(lengths),'htmlTextLengthMedian':sorted(lengths)[len(lengths)//2],'htmlTextLengthMax':max(lengths),'scope':'data-to-static integrity, not a prediction of Google approval'}
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(bool(failures))
