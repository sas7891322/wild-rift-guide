import json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1]; D=R/'assets/data'
I={x['id']:x for x in json.loads((D/'items-7.3.json').read_text())['items']}
RU={x['id']:(g,x) for g,ls in json.loads((D/'runes.json').read_text()).items() if isinstance(ls,list) for x in ls}
A=json.loads((D/'aram/heroes.json').read_text())['heroes']
H=json.loads((D/'heroes.json').read_text())['heroes']+[json.loads((D/'hwei-profile.json').read_text())]
EX=[{'致死宣告','多明尼克的問候','席利妲咒怨'},{'不朽盾弓','史特拉克手套','魔提斯深淵'}]
issues=[]
def item_ids(v):return [x.get('id') if isinstance(x,dict) else x for x in v]
def hp(x):
 s=' '.join(I[x].get('stats',[]));m=re.search(r'\+([\d,]+)\s*(?:最大)?生命',s)
 return int(m[1].replace(',','')) if m else 0
for mode,heroes in [('rift',H),('aram',A)]:
 for h in heroes:
  rr=item_ids(h.get('runes',[]));rg=[RU.get(x,('?',{}))[0] for x in rr]
  if len(rr)!=5 or rg[0]!='keystone' or len(set(rg[1:4]))!=1 or rg[4]==rg[1] or [RU.get(x,('',{}))[1].get('row') for x in rr[1:4]]!=[1,2,3]:issues.append((mode,h['id'],'rune layout',rr,rg))
  routes=[('default',h)]
  if mode=='aram':routes += [(x['title'],x) for x in h.get('aaaAram',{}).get('buildPlans',[])]
  for title,route in routes:
   ids=item_ids(route.get('items',[]));ns={I[x]['name'] if x in I else x for x in ids}
   if len(ids)!=5 or len(set(ids))!=5:issues.append((mode,h['id'],title,'count/dupe',ids))
   for x in ids:
    if x not in I:issues.append((mode,h['id'],title,'unknown item',x))
   for ex in EX:
    if len(ns&ex)>1:issues.append((mode,h['id'],title,'exclusive',str(ns&ex)))
   if 'wr73-9311' in ids:
    wpos=ids.index('wr73-9311');hpnow=sum(hp(x) for x in ids[:wpos+1]);hpall=sum(hp(x) for x in ids)
    if hpnow<1250:issues.append((mode,h['id'],title,'Warmog low',hpnow,hpall,[(I[x]['name'],hp(x)) for x in ids]))
print('ISSUES',len(issues))
for i in issues:print(i)

raise SystemExit(1 if issues else 0)
