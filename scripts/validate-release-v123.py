from pathlib import Path
from urllib.parse import urlsplit,unquote
from bs4 import BeautifulSoup
from collections import Counter,defaultdict
import json,re,subprocess,xml.etree.ElementTree as ET,ast
R=Path(__file__).resolve().parents[1];D=R/'assets/data'
read=lambda f:json.loads((D/f).read_text())
H=read('heroes.json')['heroes']+[read('hwei-profile.json')];A=read('aram/heroes.json')['heroes'];I={x['id']:x for x in read('items-7.3.json')['items']};ru={x['id']:(g,x) for g,ls in read('runes.json').items() if isinstance(ls,list) for x in ls};sp={x['id'] for x in read('spells.json')};errors=[];warnings=[];metrics=Counter();missingassets=defaultdict(set)
def err(s):errors.append(s)
def ids(xs):return [x.get('id') if isinstance(x,dict) else x for x in xs]
def checkroute(name,o):
 xs=ids(o.get('items',[]));metrics['buildRoutes']+=1
 if len(xs)!=5 or len(set(xs))!=5:err([name,'items-count-duplicate',xs])
 for group in ['items','boots','starterItems','coreItems']:
  for x in ids(o.get(group,[])):
   if x not in I:err([name,'missing-item',group,x])
 for x in xs:
  if x in I and I[x]['stage'] not in ['高階裝備','主動裝備','進化裝備']:err([name,'nonfinished',I[x]['name']])
 ns={I[x]['name'] for x in xs if x in I}
 for e in [{'致死宣告','多明尼克的問候','席利妲咒怨'},{'不朽盾弓','史特拉克手套','魔提斯深淵'}]:
  if len(ns&e)>1:err([name,'exclusive',list(ns&e)])
 if o.get('runes'):
  rr=ids(o['runes']);rg=[ru.get(x,('?',{}))[0] for x in rr]
  if len(rr)!=5 or rg[0]!='keystone' or len(set(rg[1:4]))!=1 or rg[4]==rg[1] or [ru.get(x,('',{}))[1].get('row') for x in rr[1:4]]!=[1,2,3]:err([name,'illegal-rune',rr,rg])
 if o.get('spells'):
  ss=ids(o['spells'])
  if len(ss)!=2 or len(set(ss))!=2 or not set(ss)<=(sp | ({'snowball-chariot'} if name.startswith('aram:') or name.startswith('aaa:') else set())):err([name,'spells',ss])
for mode,hs,path in [('rift',H,'share/heroes'),('aram',A,'share/aram')]:
 metrics[mode+'Guides']=len(hs)
 for h in hs:
  if h.get('patch')!='7.3c':err([mode,h['id'],'notcurrent',h.get('patch')])
  if not h.get('summary'):err([mode,h['id'],'summaryempty'])
  if h['tier'] not in ['S+','S','A','B','C','D']:err([mode,h['id'],'bad tier'])
  checkroute(mode+':'+h['id'],h)
  for v in h.get('buildVariants',[]):checkroute(mode+':'+h['id']+':'+v.get('title','variant'),v)
  if mode=='aram':
   for v in h.get('aaaAram',{}).get('buildPlans',[]):checkroute('aaa:'+h['id']+':'+v['title'],v)
  if mode=='rift':
   sq=h.get('skillSequence',[]);ct=Counter(sq)
   if len(sq)!=15:err([h['id'],'skillsequence length',len(sq)])
   if h['id'] not in ['yuumi-support','jayce-baron','jayce-mid'] and sorted(ct.values())!=[3,4,4,4]:warnings.append([h['id'],'nonstandard skill distribution',dict(ct)])
   for level,skill in enumerate(sq,1):
    if skill=='R' and level not in [5,9,13]:warnings.append([h['id'],'R-time',level])
  p=R/path/(h['id']+'.html')
  if not p.is_file():err(['missingguide',str(p)]);continue
  so=BeautifulSoup(p.read_text(),'html.parser');can=so.select('link[rel=canonical]')
  expected='https://wild-rift-guide.vercel.app/'+path+'/'+h['id']+'.html'
  if len(can)!=1 or can[0].get('href')!=expected:err(['canonical',str(p)])
  if '7.3c' not in so.title.get_text():err(['old-title',str(p)])
  actual=[x.get('data-config-id') for x in so.select('[data-config-group="items"]')]
  if actual!=ids(h['items']):err(['static data mismatch',h['id'],actual,ids(h['items'])])
  if len(so.select('h1'))!=1:err(['h1',str(p)])
  if len(so.main.get_text(strip=True))<450:err(['thin main',str(p)])
# Every HTML asset and local destination; don't regard query data as different disk files.
for p in R.rglob('*.html'):
 so=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser');metrics['htmlFiles']+=1
 if '3703014721072968' in str(so):err(['old-publisher',str(p)])
 for tag,attr in [('script','src'),('img','src'),('link','href'),('a','href')]:
  for node in so.find_all(tag):
   val=node.get(attr,'');u=urlsplit(val)
   if not val or val.startswith(('#','data:','mailto:','tel:','javascript:')) or u.netloc or u.scheme:continue
   dst=(R/u.path.lstrip('/')) if u.path.startswith('/') else p.parent/unquote(u.path)
   if dst.is_dir():dst=dst/'index.html'
   if not dst.exists():missingassets[str(p.relative_to(R))].add(val)
for p in (R/'assets/js').glob('*.js'):
 res=subprocess.run(['node','--check',str(p)],capture_output=True,text=True);metrics['javascriptFiles']+=1
 if res.returncode:err(['js',p.name,res.stderr[:300]])
for p in D.rglob('*.json'):
 try:json.loads(p.read_text());metrics['jsonFiles']+=1
 except Exception as ex:err(['json',str(p),str(ex)])
for p in [R/'scripts/generate-rift-readable-v123.py',R/'scripts/generate-aram-readable-v123.py',R/'scripts/sync-sitemaps-v123.py']:
 try:ast.parse(p.read_text());metrics['newPythonSyntax']+=1
 except Exception as ex:err(['python',str(p),str(ex)])
for mode,hs in [('rift',H),('aram',A)]:
 c=Counter(x['summary'] for x in hs);metrics[mode+'ExactDuplicateSummaries']=sum(v-1 for v in c.values() if v>1)
metrics['pendingRiftChecks']=sum(c['status']=='pending' for h in H for c in h['editorialReview']['checks'])
out={'metrics':dict(metrics),'errors':errors,'warnings':warnings,'missingLocalReferences':{k:sorted(v) for k,v in missingassets.items()}}
(R/'reports/validation-static-v123.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
print(json.dumps({'metrics':dict(metrics),'errors':errors[:25],'warnings':warnings[:15],'missingFiles':len(missingassets),'missingExamples':dict(list(out['missingLocalReferences'].items())[:12])},ensure_ascii=False,indent=2))

raise SystemExit(1 if errors or missingassets else 0)
