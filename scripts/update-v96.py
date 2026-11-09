import json, re, hashlib
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = root / 'assets/data'
def read(name): return json.loads((data / name).read_text())
def write(name, value): (data / name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')
heroes = read('heroes.json')
assert read('patch.json')['siteVersion'] == 'v95', 'Run only against v95.1 baseline'
before = {x['id']: json.loads(json.dumps(x)) for x in heroes['heroes']}
by_id = {x['id']: x for x in heroes['heroes']}
changes = {'darius-baron': ('S','A'), 'ornn-baron': ('S+','S'), 'chogath-jungle': ('A','C')}
for key, (old, new) in changes.items():
    assert by_id[key]['tier'] == old
    by_id[key]['tier'] = new
    by_id[key]['sourceNote'] += f'｜v96：9/19 版本末期複查，同分路攻略與中國服統計方向一致，Tier {old}→{new}；非官方排名。'
for entry in heroes['heroCatalog']:
    for role in entry['roles']:
        role['tier'] = by_id[role['detailHeroId']]['tier']
j = by_id['jinx']
j['items'][0] = j['coreItems'][0] = 'physical-high-32'
j['playstyle']['中期'] = j['playstyle']['中期'].replace('狂風之力', '蒐集者')
j['sourceNote'] += '｜v96：五件成裝更新為蒐集者、磁性雷射槍、致死宣告、芮蘭颶風箭、無盡之刃。參考頁將狂風之力列在鞋子區，但尚無足夠官方依據變更全站道具分類，因此不照搬為鞋子，維持狂戰士護脛→鋼鐵烈陽脛甲的既有鞋線（實際名稱以本站裝備資料為準）。'
# Do not invent an enchantment conversion from a guide's display grouping.
items = {x['id']: x for x in read('items.json')['items']}
j['sourceNote'] = j['sourceNote'].replace('狂戰士護脛→鋼鐵烈陽脛甲的既有鞋線（實際名稱以本站裝備資料為準）', '→'.join(items[i]['name'] for i in j['boots'])+'的既有鞋線')
for situation in j['matchupAdjustments']['situations']:
    for c in situation['changes']:
        if c['fromId'] == 'physical-high-03': c['fromId'] = 'physical-high-32'
c = by_id['chogath-jungle']
baron = by_id['chogath-baron']
c.setdefault('buildVariants', []).append({'id':'scaling-tank-v96','title':'成長坦裝（情境）','when':'能安全發育、隊伍需要後期前排時採用；原熾灼之冠路線仍保留。','items':baron['items'].copy(),'boots':c['boots'].copy(),'runes':c['runes'].copy(),'spells':c['spells'].copy(),'note':'雄心之鋼、日炎、荊棘、石像鬼磐核、雅瑪蘭為參考攻略的成長路線，並非勝率保證；整套與預設擇一，不追加第六件。'})
heroes['version'] = '7.2e-v96-final-calibration'
heroes['updated'] = '2026-09-19'
write('heroes.json', heroes)
report = {'version':'v96','date':'2026-09-19','base':'v95.1','scope':'落實已確認的三組 Tier 與吉茵珂絲出裝、科加斯情境配置；非重新宣稱全英雄配裝已逐一核驗。','tierChanges':changes,'sources':['https://www.wildriftfire.com/stats','https://www.wildriftfire.com/guide/darius','https://www.wildriftfire.com/guide/ornn','https://www.wildriftfire.com/guide/chogath','https://www.wildriftfire.com/guide/jinx'],'limitations':['統計為9/19中國服資料，不代表台服；無完整樣本量與對局窗口。','狂風之力鞋子分類缺乏足夠官方佐證，本輪不變更道具分類或數值，吉茵珂絲保留原鞋線。','ARAM及AAA本輪未改動。'], 'protectedHashes':read('calibration-7.2e-v95.json')['protectedHashes'], 'changes':[]}
for key in [*changes,'jinx']:
    report['changes'].append({'profileId':key,'changes':{field:{'from':before[key].get(field),'to':by_id[key].get(field)} for field in ['tier','items','coreItems','buildVariants'] if before[key].get(field)!=by_id[key].get(field)}})
write('calibration-7.2e-v96.json',report)
patch = read('patch.json');patch.update(siteVersion='v96',updated='2026-09-19',dataVersion=heroes['version']);patch['notes'].insert(0,'v96｜7.3 前收尾：達瑞斯巴龍 S→A、鄂爾巴龍 S+→S、科加斯打野 A→C；吉茵珂絲蒐集者成裝線；科加斯成長坦情境配置。保留 v95.1 版型。');write('patch.json',patch)
page = root/'summoners-rift.html';s=page.read_text()
start=s.index('<section class="home-update-panel" role="tabpanel" id="homeUpdateSite"');end=s.index('</section>',start)+10
panel=s[start:end]
cards=''
for key,(old,new) in changes.items():
    x=by_id[key];cards+=f'<a class="tier-change-card nerf" href="pages/heroes.html?hero={key}"><span class="tier-change-avatar-wrap"><img src="{x["avatar"].removeprefix("../")}" alt="{x["name"]}" loading="lazy"><i class="tier-change-arrow">↓</i></span><span class="tier-change-name">{x["name"]}<small>{x["role"]}</small></span><span class="tier-change-ranks"><del>{old}</del><em>→</em><strong>{new}</strong></span></a>'
insert='<div class="official-change-section"><div class="official-change-title"><strong>9/19・7.3 前最後校正</strong><span>v96</span></div><div class="tier-change-grid">'+cards+'</div><div class="site-review-grid"><div><strong>吉茵珂絲出裝</strong><span>第一件更新為蒐集者，五件成裝與鞋線分開；不把參考頁的狂風之力分類直接套用。</span></div><div><strong>科加斯打野</strong><span>新增成長坦情境配置，保留原熾灼之冠路線。</span></div></div><p class="site-tier-note">本轮為本站編輯校正，依中國服統計與同分路攻略判斷，不是官方 Tier。原版型、ARAM、找隊友與會員功能保留。</p></div><div class="official-change-title"><strong>前次 v95 校正紀錄（9/12）</strong></div>'
at=panel.index('<div class="site-tier-section">');panel=panel[:at]+insert+panel[at:];panel=panel.replace('ready">v95.1','ready">v96');s=s[:start]+panel+s[end:];page.write_text(s)
f=root/'pages/patch.html';s=f.read_text();s=s.replace('<section class="empty">','<section class="empty"><strong>v96｜7.3 前最終校正｜2026/09/19</strong><p>'+patch['notes'][0]+'</p><p>吉茵珂絲保留既有鞋線；狂風之力分類未有足夠官方佐證，本輪不修改全站裝備分類。ARAM 與 AAA 未變更。</p></section>\n<section class="empty">',1);f.write_text(s)
for f in root.rglob('*'):
    if f.is_file() and f.suffix in ['.js','.html'] and str(f.relative_to(root)) not in report['protectedHashes']:
        s=f.read_text();n=s.replace('95.0.0','96.0.0')
        if n!=s:f.write_text(n)
f=root/'README.md';f.write_text('# v96｜7.3 前最後校正\n\n'+patch['notes'][0]+'\n\n'+ '\n\n'.join(report['limitations'])+'\n\n執行 node scripts/validate-v96.mjs。無需 SQL；尚未實際瀏覽器驗證。\n\n'+f.read_text())
validator=(root/'scripts/validate-v95.mjs').read_text().replace("'v95'","'v96'").replace('calibration-7.2e-v95.json','calibration-7.2e-v96.json')
(root/'scripts/validate-v96.mjs').write_text(validator)
print('v96 changes applied')
