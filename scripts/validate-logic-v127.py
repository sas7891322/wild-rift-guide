"""Validate the independent review's coverage, synchronized edits and provenance."""
from pathlib import Path
from collections import Counter
from bs4 import BeautifulSoup
import json,sys
R=Path(__file__).resolve().parents[1];D=R/'assets/data';load=lambda f:json.loads((D/f).read_text());H=load('heroes.json');hs=H['heroes']+[load('hwei-profile.json')];A=load('aram/heroes.json');ar=A['heroes'];rep=load('logic-review-7.3f-v127.json');err=[]
def check(ok,msg):
 if not ok:err.append(msg)
check(len(hs)==204 and len(ar)==143,'roster counts');check(len(rep['records'])==347,'audit count')
by={(mode,h['id']):h for mode,ls in [('rift',hs),('aram',ar)] for h in ls}
check(len(by)==347,'unique role/mode keys');check(len({h.get('baseId',h['id']) for h in hs})==143,'unique champions')
for rec in rep['records']:
 h=by[(rec['mode'],rec['id'])];rv=h.get('logicReview127',{});check(rv.get('externalRankingsUsed') is False,rec['id']+' independent basis');check(rv.get('tierAfter')==h['tier']==rec['tierAfter'],rec['id']+' tier sync')
 for field in ['tierReason','mechanics','roleTask','build','runes','skills','spells','scope']:check(bool(rv.get(field)),rec['id']+':'+field)
 p=R/'share'/('heroes' if rec['mode']=='rift' else 'aram')/(rec['id']+'.html');so=BeautifulSoup(p.read_text(),'html.parser');check(h['tier']==so.select_one('.sg-tier').get_text(),rec['id']+' static tier')
 check(rv['tierReason'] in so.get_text(),rec['id']+' static reason')
check(Counter(h['tier'] for h in ar)==A['tierCounts'],'ARAM counts')
for c in H['heroCatalog']:
 for role in c['roles']:check(role['tier']==by[('rift',role['detailHeroId'])]['tier'],c['id']+' catalog tier')
for h in ar:
 aaa=h['aaaAram'];check(aaa['logicReview127']['globalTier'] is None,h['id']+' no invented AAA global tier')
 if isinstance(aaa.get('runeReuse'),dict):check(aaa['runeReuse']['runes']==h['runes'],h['id']+' shared runes')
 for row in aaa['sharedWithStandard']:
  if row['title']=='技能加點':check(row['value']==h['skillOrder'],h['id']+' shared skills')
for change in rep['configurationChanges']:
 h=by[(change['mode'],change['id'])];actual=h['skillOrder'] if change['field']=='skills' else h['runes'][0]['name'];check(actual==change['after'],change['id']+' concrete change')
check(len(rep['tierChanges'])==37 and len(rep['configurationChanges'])==9,'record counts')
check(len(rep['pendingMechanics'])==6,'unresolved mechanics preserved')
so=BeautifulSoup((R/'summoners-rift.html').read_text(),'html.parser');panel=so.select_one('#homeUpdateChampions');check('赫威' not in panel.get_text(),'new hero only Sylas');check(len(panel.select('.sylas-release-skill'))==4,'four active skills');check('中路 A' in panel.get_text() and 'ARAM B' in panel.get_text(),'panel tier')
for f in ['summoners-rift.html','aram.html']:
 t=BeautifulSoup((R/f).read_text(),'html.parser').select_one('#site-73f').get_text();check('v127' in t and '37筆' in t and '待評' not in t,f+' latest update')
out={'records':len(by),'tierChanges':37,'configurationChanges':9,'pendingMechanics':6,'errors':err};(R/'reports/validation-logic-v127.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False,indent=2));sys.exit(bool(err))
