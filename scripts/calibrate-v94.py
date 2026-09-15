"""Apply the verified 7.2e delta to the v93 source (run once on v93)."""
import json, re, hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def read(p): return json.loads((R/p).read_text())
def write(p,d): (R/p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
DATE='2026-09-09'
VERSION='7.2e-v94-official-delta-calibration'
SOURCE='https://wildrift.leagueoflegends.com/zh-tw/news/game-updates/wild-rift-patch-notes-72e/'
h=read('assets/data/heroes.json'); it=read('assets/data/items.json'); a=read('assets/data/aram/heroes.json'); p=read('assets/data/patch.json')
assert p['siteVersion']=='v93', 'Use a clean v93 baseline'
protected={str(f.relative_to(R)):hashlib.sha256(f.read_bytes()).hexdigest() for f in [R/'pages/players.html',R/'assets/js/players.js',*list((R/'supabase').glob('*'))] if f.is_file()}
items={x['id']:x for x in it['items']}
changes={
 'vi':{'name':'菲艾','direction':'nerf','numbers':{'Q':'額外物攻係數：最低 80%→60%；最高 160%→120%。','R':'冷卻：60/55/50→80/70/60 秒。'},'advice':'7.2e 一技物攻收益下降、大絕空窗拉長；維持鬥士核心，先確認大絕與隊友距離再抓人，不靠純輸出硬換一套。'},
 'janna':{'name':'珍娜','direction':'buff','numbers':{'E':'護盾：65/90/115/140 +45%魔攻→80/120/160/200 +50%魔攻。'},'advice':'7.2e 三技護盾提高，保護裝與技能加速方向維持；在隊友吃到爆發前套盾，保留龍捲風處理後續突進。'},
 'swain':{'name':'斯溫','direction':'nerf','numbers':{'R':'每秒傷害：10/25/40 +15%魔攻→15/25/35 +6%魔攻；每秒治療：20/30/40 +20%魔攻→15/30/45 +10%魔攻。'},'advice':'7.2e 大絕持續傷害與治療的魔攻收益下降；預設偏生命、控場與抗性，等首輪控制交換後進場，死亡之帽改為安全輸出時的選項。'},
 'nautilus':{'name':'納帝魯斯','direction':'buff','numbers':{'W':'護盾：65/75/85/95 +9/10/11/12%最大生命→70/80/90/100 +11/12/13/14%最大生命。'},'advice':'7.2e 二技護盾基值與最大生命收益提高；維持生命與雙防核心，進場前確認隊友能跟上，護盾無法取代撤退路線。'},
 'malphite':{'name':'墨菲特','direction':'buff','numbers':{'base':'每級物防成長：4.3→5。','Q':'緩速：15/20/25/30%→20/25/30/35%。','W':'連續普攻基礎傷害：10/20/30/40→20/30/40/50。'},'advice':'7.2e 物防成長、一技緩速與二技連續普攻提高；坦裝對物理陣容仍合適，這次沒有提升大絕魔攻係數，不因此改成純魔攻預設。'}
}
item_notes={
 'intermediate-seekers-armguard':'7.2e：凝滯冷卻 120→150 秒；此改動僅列中階護腕，不套用到中婭沙漏。',
 'intermediate-19':'7.2e：法術護盾被動冷卻 50→65 秒；此改動不套用到女妖面紗。',
 'physical-high-36':'7.2e：價格 3000→2900；近戰护盾 140 +35%額外物攻→150 +40%額外物攻，遠程不套用此增強。'.replace('护','護'),
 'defense-high-03':'7.2e：生命 200→300、雙防各 45→40、新增技能加速 10；總價 3000，合成改為鎖子甲＋負極斗篷＋燃燒寶石＋200。'
}
items['intermediate-seekers-armguard']['passives'][0]+=' 冷卻時間：150 秒（7.2e）。'
items['intermediate-19']['passives'][0]+=' 被動冷卻時間：65 秒（7.2e）。'
items['physical-high-36']['price']=2900
items['physical-high-36']['passives'][0]+=' 近戰護盾：150 + 40% 額外物攻（7.2e；非遠程數值）。'
items['defense-high-03']['stats']=['+300 最大生命','+40 物理防禦','+40 魔法防禦','+10 技能加速']
items['defense-high-03']['buildFrom']=['intermediate-37','intermediate-40','intermediate-17']
items['defense-high-03']['combineCost']=200
for x in it['items']:
 if 'defense-high-03' in x.get('upgrades',[]): x['upgrades'].remove('defense-high-03')
for id in items['defense-high-03']['buildFrom']:items[id]['upgrades'].append('defense-high-03')
for id,note in item_notes.items():items[id]['patchCalibration']={'patch':'7.2e','reviewedAt':DATE,'note':note,'source':SOURCE}
it['version']=VERSION;it['notes']+='｜v94：依 7.2e 官方校正 4 件道具；雄心之鋼無已公布數值異動。'
updated=[];direct=[];tier_changes=[]
for x in h['heroes']:
 base=x.get('baseId',x['id']); note=[]
 if base in changes:
  c=changes[base];direct.append(x['id']);note.append(c['advice'])
  for ability in x.get('abilities',[]):
   if ability['key'] in c['numbers']:ability['summary']+=' 7.2e：'+c['numbers'][ability['key']]
  if base=='malphite':x['summary']+=' 7.2e 每級物防成長為 5。'
  x['playstyle']['中期']+=' '+c['advice']
 if base=='swain' and x['roleId'] in ['baron','mid']:
  old=x['items'][:]
  x['items']=['magic-high-10','magic-high-15','magic-high-23','defense-high-16','magic-high-08']
  x['coreItems']=x['items'][:3]
  x['summary']='以黑焰火炬、瑞萊與峽谷製造者持續作戰，後續補抗性；7.2e 大絕魔攻收益下降，先確保站場時間再堆傷害。'
  # Keep all existing situational source slots valid after changing the default.
  for sit in x['matchupAdjustments']['situations']:
   for ch in sit.get('changes',[]):
    if ch.get('fromId') in old and ch['fromId'] not in x['items']:ch['fromId']='defense-high-16'
  x['matchupAdjustments']['situations'][-1]['warning']+=' 若能安全持續輸出，可將雅瑪蘭守護像換成死亡之帽；這是進攻情境選項。'
 if x['id'] in ['vi-jungle','swain-mid']:
  old=x['tier'];x['tier']={'vi-jungle':'S','swain-mid':'A'}[x['id']]
  tier_changes.append({'profileId':x['id'],'from':old,'to':x['tier'],'status':'provisional-official-change-inference'})
  note.append(f"Tier {old}→{x['tier']} 為本站改版初期暫定判斷，非新版勝率排名。")
 serial=json.dumps({k:x.get(k) for k in ['items','boots','starterItems','matchupAdjustments']})
 impact=[id for id in item_notes if id in serial]
 for id in impact:note.append(item_notes[id])
 if note:
  x['sourceNote']+='｜v94：'+' '.join(note);x['reviewedAt']=DATE;updated.append(x['id'])
 x['patch72eReview']={'patch':'7.2e','reviewedAt':DATE,'scope':'official-change-and-item-reference-delta','directChampionChange':base in changes,'affectedItems':impact,'outcome':'updated' if note else 'retained-no-listed-direct-change','runesAndSpells':'retained; no official rune or spell changes listed'}
for cat in h['heroCatalog']:
 for role in cat.get('roles',[]):role['tier']=next(x['tier'] for x in h['heroes'] if x['id']==role['detailHeroId'])
h['version']=VERSION;h['updated']=DATE
h['notes'].insert(0,'v94：7.2e 官方差異校正，5 位英雄對應 10 份位置攻略；菲艾打野與斯溫中路暫定降級，其他 Tier 沿用前版待觀察，未採用改版前勝率冒充新版統計。')
h['calibration72e']={'patch':'7.2e','version':'v94','reviewedAt':DATE,'profilesScanned':len(h['heroes']),'directProfiles':direct,'updatedProfiles':updated,'tierChanges':tier_changes,'source':SOURCE}
def aram_item(id,reason):
 d=items[id];return {'id':id,'name':d['name'],'icon':d['icon'].removeprefix('../'),'reason':reason}
aram_updated=[]
for x in a['heroes']:
 note=[]
 if x['id'] in changes:note.append(changes[x['id']]['advice'])
 for id in item_notes:
  if any(o.get('id')==id for k in ['items','starterItems','situationalItems'] for o in x.get(k,[])):note.append(item_notes[id])
 if x['id']=='swain':
  x['items']=[aram_item(id,reason) for id,reason in [
   ('magic-high-17','生命與魔力支持持續作戰，盡早完成疊層。'),('magic-high-15','用緩速延長敵人在大絕範圍內的時間。'),('magic-high-23','持續作戰核心；進場前先等關鍵控制交掉。'),('defense-high-03','7.2e 新增生命與技能加速，適合近身團戰；雙防略降，仍需搭配抗性。'),('defense-high-16','補雙防延長站場，避免過度依賴削弱後的大絕治療。')]]
  x['situationalItems']=[aram_item(id,reason)|{'when':when} for id,reason,when in [('magic-high-02','替換無盡絕望，躲開集中爆發。','敵方爆發高'),('magic-high-13','替換無盡絕望，以魔法傷害施加重創。','敵方治療多'),('magic-high-14','替換雅瑪蘭守護像；僅在能安全站場時選擇。','隊伍已有足夠前排')]]
  x['tier']='S';x['tierLabel']='強勢';x['tierReason']='7.2e 大絕魔攻係數削弱，本站暫定 S+→S；改為生命、控場與雙防型預設，待新版實戰資料複核。'
  x['playstyle']['中期']='時光與瑞萊成形後，等對手第一輪控制交掉再開大進場；避免被拉開或單獨吃滿集火。'
  x['playstyle']['後期']='無盡絕望與雅瑪蘭提供站場能力，但大絕回復已削弱，優先黏住可持續接觸的目標。'
 if note:
  x['sourceNote']+='｜v94 7.2e：'+' '.join(note);x['summary']+=' '+(changes[x['id']]['advice'] if x['id'] in changes else ' '.join(note))
  x['reviewedAt']=DATE;aram_updated.append(x['id'])
  # Shared champion/item rules affect both modes; retain AAA-only modifiers and augment rankings.
  if x.get('aaaAram'):
   x['aaaAram']['sourceNote']+='｜7.2e 通用改動提醒：'+' '.join(note)
   if x['id']=='swain':
    x['aaaAram']['summary']=x['summary'];x['aaaAram']['playstyle']=x['playstyle'].copy()
    for plan in x['aaaAram'].get('buildPlans',[]):
     plan['items']=json.loads(json.dumps(x['items']));plan['description']='7.2e 改為生命、控場與雙防站場；再依實際增幅調整，舊增幅分類評級尚未全量重審。'
   if x['id']=='pyke':pass
 x['patch72eReview']={'reviewedAt':DATE,'scope':'shared-champion-and-item-delta','updated':bool(note),'modeSpecificBalance':'unchanged; no standard ARAM modifier changes listed'}
pyke=next(x for x in a['heroes'] if x['id']=='pyke')
pyke['aaaAram']['summary']+=' 7.2e 官方限制：派克無法選擇「血償」。'
pyke['aaaAram']['unavailableAugments']=['血償']
a.update(gameVersion='7.2e',standardGameVersion='7.2e',dataVersion=VERSION,updated=DATE)
a['tierCounts']={tier:sum(x['tier']==tier for x in a['heroes']) for tier in a['tierOrder']}
a['notes'].insert(0,'v94：7.2e 通用英雄與裝備差異已套用；斯溫改半坦預設並暫列 S。標準 ARAM 未公告額外模式倍率改動；AAA 分類評級保留原基準，另同步派克禁止選血償。')
a['calibration72e']={'reviewedAt':DATE,'updatedHeroes':aram_updated,'source':SOURCE,'aaaScope':'shared changes and Pyke restriction only; old category rankings retained'}
note=f'v94 7.2e 更新：5 位英雄／10 份位置攻略、4 件道具數值與合成、斯溫峽谷與 ARAM 站場配置、模式公告及本站紀錄；Tier 異動為改版初期暫定。'
p.update(version='7.2e',siteVersion='v94',updated=DATE,dataVersion=VERSION,aramDataVersion=VERSION);p['notes'].insert(0,note)
report={'patch':'7.2e','siteVersion':'v94','reviewedAt':DATE,'source':SOURCE,'championChanges':changes,'itemChanges':item_notes,'profilesScanned':202,'directProfiles':direct,'updatedProfiles':updated,'aramProfilesScanned':141,'aramUpdated':aram_updated,'tierChanges':tier_changes+[{'profileId':'aram:swain','from':'S+','to':'S','status':'provisional-official-change-inference'}],'methodology':'Official delta audit, not a fresh empirical win-rate ranking. Rune/spell defaults retained. AAA historical rankings remain labelled 7.2b.','protectedHashes':protected,'limitations':['血償效果與分類未於此次公告完整公布，不憑空加入效果或排名。','完整公告未列雄心之鋼數值異動，保留原值。']}
for file,d in [('heroes.json',h),('items.json',it),('aram/heroes.json',a),('patch.json',p),('calibration-7.2e-v94.json',report)]:write('assets/data/'+file,d)
# Preserve the old announcement as an expandable history section.
home=(R/'summoners-rift.html').read_text()
start=home.index('    <section class="home-update-panel active"');end=home.index('    <section class="home-update-panel" role="tabpanel" id="homeUpdateSite"',start)
old=home[start:end];old_body=old[old.index('>')+1:old.rfind('</section>')]
cards=''.join('<article class="official-change-card '+c['direction']+'"><span class="official-change-avatar"><img src="assets/images/heroes/portraits/'+id+'.webp" alt="'+c['name']+'" loading="lazy"></span><div><b>'+c['name']+'</b><small>'+('增強' if c['direction']=='buff' else '削弱')+'</small><p>'+' '.join(c['numbers'].values())+'</p></div></article>' for id,c in changes.items())
mode='符文大亂鬥：英文公告新增血償；派克不能選擇血償，鐵砧專家升級給予數量的錯誤已修正。血償完整效果與分類待官方／遊戲內確認。一般 ARAM 本次未另列專屬倍率調整。'
official='<section class="home-update-panel active" role="tabpanel" id="homeUpdateOfficial" aria-labelledby="homeUpdateOfficialTab" data-home-update-panel="official"><div class="home-update-heading"><div><span class="kicker">RIOT GAMES · 2026/09/09</span><h3>官方 7.2e 公告</h3></div><span class="home-update-badge">7.2e</span></div><p class="home-update-lead">5 位英雄與 4 件裝備調整；以下為官方數值摘要，Tier 為本站另外判斷。</p><div class="official-change-grid official-change-grid-rich">'+cards+'</div><div class="official-change-section"><h4>裝備調整</h4>'+''.join('<p><b>'+items[id]['name']+'</b>｜'+n+'</p>' for id,n in item_notes.items())+'</div><p>'+mode+'</p><a class="home-update-more" href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">閱讀 Riot 完整公告 →</a><details class="official-history-item"><summary class="official-history-summary">7.2d 與更早公告（歷史紀錄）</summary><div class="official-history-content">'+old_body+'</div></details></section>\n'
home=home[:start]+official+home[end:]
start=home.index('    <section class="home-update-panel" role="tabpanel" id="homeUpdateSite"');end=home.index('    <section class="home-update-panel" role="tabpanel" id="homeUpdateChampions"',start)
site='<section class="home-update-panel" role="tabpanel" id="homeUpdateSite" aria-labelledby="homeUpdateSiteTab" data-home-update-panel="site" hidden><div class="home-update-heading"><div><span class="kicker">2026/09/09</span><h3>本站 7.2e 校正</h3></div><span class="home-update-badge ready">v94</span></div><p class="home-update-lead">完成官方差異校正，掃描 202 份峽谷與 141 份一般 ARAM 配置中的英雄、裝備引用。</p><p>菲艾打野 S+→S、斯溫中路 S→A；ARAM 斯溫 S+→S。這些是改版初期暫定評級，尚非新版穩定勝率結論；其餘 Tier 保留前版基準待觀察。</p><p>斯溫巴龍／中路改生命、緩速與雙防站場；ARAM 同步半坦預設。4 件道具與無盡絕望合成已更新；符文與召喚師技能此次無官方異動，維持既有配置。</p><p>找隊友與會員功能保留，這次不需要新增 SQL。</p><a class="home-update-more" href="pages/patch.html">查看版本紀錄 →</a></section>\n'
home=home[:start]+site+home[end:]
(R/'summoners-rift.html').write_text(home)
pp=R/'pages/patch.html';s=pp.read_text();pos=s.index('<section class="empty">')
entry='<section class="empty"><strong>Patch 7.2e｜v94 官方差異校正｜2026/09/09</strong><p>'+note+'</p><p>菲艾打野 S+→S、斯溫中路 S→A、ARAM 斯溫 S+→S 為暫定判斷；未使用舊版本勝率宣稱新版排名。</p><p>斯溫巴龍／中路以黑焰火炬、瑞萊、峽谷製造者為核心並補雙防；ARAM 以時光、瑞萊、峽谷製造者、無盡絕望與雅瑪蘭站場。</p><p>'+mode+'</p><a href="'+SOURCE+'" target="_blank" rel="noopener noreferrer">官方 7.2e 公告</a></section>\n'
pp.write_text(s[:pos]+entry+s[pos:])
# Refresh current UI metadata only; never rewrite historical patch records.
for f in [*R.glob('*.html'),* (R/'pages').glob('*.html'),*(R/'assets/js').glob('*.js')]:
 if str(f.relative_to(R)) in protected:continue
 s=f.read_text();s=re.sub(r'((?:heroes|items|patch)\.json\?v=)[\d.]+',r'\g<1>94.0.0',s)
 s=re.sub(r'((?:app|heroes|aram|aram-hero|member|items-final)\.js\?v=)[\d.]+',r'\g<1>94.0.0',s)
 if f.name in ['heroes.js','aram.js','aram-hero.js','heroes.html','items.html','index.html','aram.html','aram-hero.html']:
  s=s.replace('7.2d','7.2e').replace('7.2D','7.2E')
 elif f.name=='summoners-rift.html':
  prefix,rest=s.split('<body',1);s=prefix.replace('7.2d','7.2e')+'<body'+rest
 f.write_text(s)
for name in ['aram.html','aram-augments.html']:
 f=R/name;s=f.read_text();pos=s.index('</main>');s=s[:pos]+'<section class="shell"><p>7.2e 模式更新：'+mode+'</p><p>本次同步通用裝備與英雄差異；既有符文大亂鬥分類評級仍以 7.2b 為基準。</p></section>'+s[pos:];f.write_text(s)
f=R/'README.md';f.write_text('# Wild Rift Guide v94｜7.2e 官方差異校正\n\n'+note+'\n\n使用方式：將本資料夾內容覆蓋至既有 GitHub 專案根目錄後提交，等待 Vercel 部署；本包不會自動部署，不需 SQL。\n\n校正限制：Tier 為改版初期推論；血償完整效果／分類未公布，AAA 舊分類排名保留原版標示。\n\n'+f.read_text())
f=R/'sitemap.xml';f.write_text(re.sub(r'<lastmod>[^<]+</lastmod>','<lastmod>'+DATE+'</lastmod>',f.read_text()))
print(json.dumps({'directProfiles':len(direct),'updatedProfiles':len(updated),'aramUpdated':len(aram_updated),'tierChanges':report['tierChanges']},ensure_ascii=False))
