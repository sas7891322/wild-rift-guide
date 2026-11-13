from pathlib import Path
import json
R=Path(__file__).resolve().parents[1];D=R/'assets/data'
load=lambda p:json.loads((D/p).read_text())
def save(p,x):(D/p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
H=load('heroes.json');W=load('hwei-profile.json');A=load('aram/heroes.json');rep=load('logic-review-7.3f-v127.json');ru={x['id']:x for ls in load('runes.json').values() if isinstance(ls,list) for x in ls}
for h in H['heroes']+[W]:
 h['patch73fReview']['impact']=h['patch73fReview']['impact'].replace('本輪先檢查可用配置、裝備間接影響與資料引用','本輪按技能與位置需求複核評級、配置及裝備間接影響')
 if h['id']=='camille-baron':h['playstyle']['前期']='一級可用二技外圈換血，三級取得完整技能後主一技、副三技。利用被動盾與二段一技完成短換血，三相後以技能接普攻建立邊線壓力；沒有側翼視野時保留三技撤退。'
 if h['id']=='sylas-mid':h['patch73fReview']['impact']='依使用者提供的手機版技能截圖與現行配置作獨立推演，中路A為保守暫定；不補猜未確認的技能成長或偷取互動。'
for h in A['heroes']:
 for r in h['runes'][1:]:r['reason']=ru[r['id']]['description'].split('\n')[0]
 if h['id']=='miss-fortune':
  h['playstyle']['開局']='以一技找兵線彈射角度，二技支援持續普攻；三技主要緩速留人，不反覆空耗魔力。缺少保排時先打能安全碰到的目標。'
  h['playstyle']['配置使用']='暴擊與物攻支援普攻、一技和大絕；征服者靠獨立技能與普攻累積，不把單次大絕當成必然疊滿。'
 if h['id']=='varus':
  h['skillNote']=h['skillNote'].replace('枯萎','荒蕪');h['logicReview127']['skills']=h['logicReview127']['skills'].replace('枯萎','荒蕪');h['review73f']['logicNotes']=[s.replace('枯萎','荒蕪') for s in h['review73f']['logicNotes']]
 aaa=h['aaaAram']
 if isinstance(aaa.get('runeReuse'),dict) and 'runes' in aaa['runeReuse']:
  aaa['runeReuse']['runes']=h['runes'];aaa['runeReuse']['note']='本輪一般符文說明對齊既有遊戲資料；增幅另依實際卡面條件選擇。'
 for x in aaa.get('sharedWithStandard',[]):
  if '一般符文' in x.get('title',''):x['note']='與本頁標準ARAM共用一般符文；7.3f已複核觸發與路線，增幅另行選擇。'
  if '技能加點' in x.get('title',''):x.update(value=h['skillOrder'],note=h['skillNote'])
rep['additionalTextCorrections']=['卡蜜兒對線說明同步主Q副E，不再殘留主W描述。','ARAM一般符文文字對齊遊戲資料：即刻衝擊為額外真傷、鎖鏈突擊為標記後兩次命中、兇蠻限普攻；共享到符文大亂鬥。','好運姐暴擊打法、征服者累積與加點說明同步。']
byid={('rift',x['id']):x for x in H['heroes']+[W]}|{('aram',x['id']):x for x in A['heroes']}
for rec in rep['records']:rec.update(byid[(rec['mode'],rec['id'])]['logicReview127'])
for rec in rep['configurationChanges']:
 if rec['id']=='varus':rec['reason']=rec['reason'].replace('枯萎','荒蕪')
save('heroes.json',H);save('hwei-profile.json',W);save('aram/heroes.json',A);save('logic-review-7.3f-v127.json',rep)
# Keep generation reproducible from final data; reflect the text corrections in the audit page.
p=R/'pages/review-7-3f.html';s=p.read_text().replace('強化普攻與枯萎','強化普攻與荒蕪');s=s.replace('<h2>已知資料界線</h2>','<h2>其他文字校正</h2><ul>'+''.join('<li>'+x+'</li>' for x in rep['additionalTextCorrections'])+'</ul><h2>已知資料界線</h2>');p.write_text(s)
