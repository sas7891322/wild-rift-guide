from pathlib import Path
import json
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parents[1]
build=json.loads((root/'assets/data/hwei-v98.json').read_text())
soup=BeautifulSoup((root/'pages/hwei.html').read_text(),'html.parser')
abilities=[]
for key,section in [('P','passive'),('Q','q'),('W','w'),('E','e'),('R','r')]:
 s=soup.find(id=section); paragraphs=[p.get_text(' ',strip=True) for p in s.find_all('p')]; examples=[h.get_text(' ',strip=True) for h in s.find_all('h3')]
 abilities.append({'key':key,'label':{'P':'被動','Q':'1 技','W':'2 技','E':'3 技','R':'大絕'}[key],'title':s.h2.get_text().split('・')[-1],'icon':('../assets/images/heroes/hwei/'+key.lower()+'.webp') if key!='P' else '', 'summary':' '.join(paragraphs+examples)})
h={'id':'hwei-mid','baseId':'hwei','name':'赫威','enName':'Hwei','roleId':'mid','role':'中路','tier':'A','provisional':True,'patch':'7.3','position':'遠距法師／三主題施法','tags':['暫定評級','遠距消耗','區域控制','技能切換'],'ratings':{},'runes':build['runes'],'items':build['items'],'coreItems':build['items'][:3],'starterItems':['basic-amp-tome'],'boots':build['boots'],'spells':build['spells'],'skillOrder':'Q > E > W','skillSequence':[],'skillLabels':{'Q':'1 技','W':'2 技','E':'3 技','R':'大絕'},'matchups':{'good':[],'bad':[],'ban':''},'playstyle':{'前期':'用一技清線與消耗，三技保留應付突進；二級可依控制或續航需求先學三技或二技。','中期':'站在前排後方，用控制接遠距傷害；避免為補普攻走進敵方突進範圍。','後期':'先看敵方控制與進場技能，再選傷害、增益或控制主題；不要急著交掉自保。'},'summary':'先選主題再選施法，以遠距清線與控制建立輸出空間；主一技、副三技，保留控制防突進。','sourceNote':'7.3 赫威初步配置。A 為本站暫定、低信心的編輯判斷；參考頁 Tier 仍為 TBD，沒有足夠實戰樣本。配裝參考 <a href="https://www.wildriftfire.com/guide/hwei" target="_blank" rel="noopener">WildRiftFire</a>。逐級加點與對局優劣尚未確認，暫不填入。<a href="hwei-demonstrations.html">查看技能實機示範</a>。','avatar':'../assets/images/heroes/hwei/portrait.webp','abilities':abilities,'detailTemplate':'structured-baron-v40','hideBan':True,'combos':[],'mechanics':[{'title':'清洗毛筆','text':'選取主題後，大絕按鈕改為清洗毛筆，按下即可取消目前主題，回到原本技能選單。'},{'title':'技能加點','text':'主一技、副三技、最後二技；大絕可升時優先。加點提升整個主題，不是逐一提升九種子技能。'}], 'buildVariants':[]}
for title,old,new,note in [('坦克多','magic-high-21','magic-high-16','高生命前排多時，無限寶珠替換黎安卓的折磨；高魔防時虛空之杖提前。'),('護盾多','magic-high-02','magic-high-24','若仍需保命可保留中婭沙漏，改替換無限寶珠。'),('先手控制多','magic-high-02','magic-high-05','女妖面紗擋先手技能，不等同解控。'),('回復多','magic-high-21','magic-high-13','以黑魔禁書提供重創。')]:
 h['mechanics'].append({'title':title,'text':note})
(root/'assets/data/hwei-profile.json').write_text(json.dumps(h,ensure_ascii=False,indent=2)+'\n')
# Preserve uploaded demonstrations as optional reference, not the main guide.
for ident in ['build','leveling']: soup.find(id=ident).decompose()
for a in soup.select('.hwei-nav a[href="#build"], .hwei-nav a[href="#leveling"]'):a.decompose()
soup.title.string='赫威技能實機示範｜Wild Rift Guide'
soup.select_one('h1').string='赫威技能實機示範'
soup.select_one('.hwei-note').string='本頁保留技能示範圖片；完整攻略請由英雄列表查看。'
soup.select_one('link[rel="canonical"]')['href']='https://wild-rift-guide.vercel.app/pages/hwei-demonstrations.html'
back=soup.new_tag('a',href='heroes.html?hero=hwei-mid');back.string='返回赫威完整攻略 →';soup.select_one('main').insert(0,back)
(root/'pages/hwei-demonstrations.html').write_text(str(soup))
(root/'pages/hwei.html').write_text('<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=heroes.html?hero=hwei-mid"><link rel="canonical" href="https://wild-rift-guide.vercel.app/pages/heroes.html?hero=hwei-mid"><title>赫威攻略</title></head><body><a href="heroes.html?hero=hwei-mid">前往赫威完整攻略</a></body></html>')
for filename in ['index.html','summoners-rift.html','pages/heroes.html']:
 p=root/filename;s=p.read_text().replace('href="pages/hwei.html"','href="pages/heroes.html?hero=hwei-mid"').replace('heroes.js?v=98.0.0','heroes.js?v=99.0.0');p.write_text(s)
print('Unified Hwei profile and legacy redirect created.')
