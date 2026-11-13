"""One-time v126.1 -> v127 editorial review; no external rankings or build imports.
Run once against the v126.1 JSON, then regenerate readable pages.
"""
from pathlib import Path
from collections import Counter
import copy,json,re
R=Path(__file__).resolve().parents[1];D=R/'assets/data';DATE='2026-11-13'
load=lambda f:json.loads((D/f).read_text())
def save(f,v):(D/f).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
H=load('heroes.json');W=load('hwei-profile.json');A=load('aram/heroes.json');hs=H['heroes']+[W];ars=A['heroes'];I={x['id']:x for x in load('items-7.3.json')['items']};RU={x['id']:x for ls in load('runes.json').values() if isinstance(ls,list) for x in ls};SP={x['id']:x['name'] for x in load('spells.json')}
assert not H.get('logicReview127'), 'Already reviewed: do not destroy the before/after record.'
notes=dict(line.split('|',1) for line in (R/'scripts/champion-logic-v127.tsv').read_text().splitlines() if line)
assert set(notes)=={h['id'] for h in ars}
ids=lambda a:[x['id'] if isinstance(x,dict) else x for x in a]
roles={'baron':'巴龍路','jungle':'打野','mid':'中路','duo':'飛龍路','support':'輔助'}
rolelogic={'baron':'以對線存活、邊線壓力與到團後能否承擔前排或切入評估；不能只按單挑上限。','jungle':'以清野後的血量與節奏、抓人條件、物件控制和逆風功能評估；7.3f重擊與野區收益變動不等於每個打野一律降級。','mid':'以清線後的支援、技能射程、自保與團戰功能評估；需要先取得兵線空間才能遊走。','duo':'以對線取資源、成裝後持續輸出與自保評估；對局同時取決於雙方輔助，不能單看射手對位。','support':'以低經濟下的控制、保護與視野協作評估；任務裝仍占一格，不預設有單人線的成裝速度。'}
scale={'S+':'多種常見陣容都能穩定提供主導功能，仍有應對窗口。','S':'核心功能強且能穩定影響戰局，但需要管理明確的站位或時機條件。','A':'完整可用；優勢與限制相抵，需要合理陣容及正常發育。','B':'條件型選擇；對線、陣容或執行成本較高，不宜當通用首選。','C':'一般環境的容錯偏低；需要明確熟練度或特殊搭配才推薦。','D':'高度限定用途。'}
# Explicit decisions made after inspecting every current role configuration.
changes={
 'lucian':('A','被動與一技增強提升短換血回報；短射程與滑步後的控制風險仍阻止上調到S。'),
 'sivir':('A','清線、彈射和團隊加速提供穩定任務；舊C低估了不靠擊殺也能發揮的功能。'),
 'tristana':('A','推塔、射程成長與自保工具足以支持正常射手定位；跳躍重置仍不能預設必定觸發。'),
 'draven':('B','飛斧對線壓力有明確用途；考量接斧與逆風成本，保守列B而非通用高階。'),
 'senna':('A','補刀射手的經濟與靈魂取得有取捨，團隊仍需持續傷害來源；不直接沿用輔助定位的價值。'),
 'shen-baron':('S','大絕冷卻延長且中後期護盾降低，跨線保護仍有價值，但支援空窗更長。'),
 'shen-jungle':('B','缺少穩定遠距抓人和快速清野的容錯，大絕削弱又放大支援代價；保留為團隊保護型特殊選擇。'),
 'graves-jungle':('B','基礎與成長物防提高有助於物理交戰；清野與近距輸出有用途，射程和抓人限制使其暫不上A。'),
 'viktor-mid':('A','一技及射線的魔攻收益提高，清線與短換血更完整；大絕持續傷害下修，不能把整套傷害都當增強。'),
 'rumble-baron':('A','被動魔攻係數與大絕提高，對線及封路有實際回報；熱能管理和缺乏靈活撤退仍有代價。'),
 'kassadin-mid':('A','基礎魔防與三技魔攻係數降低，使前期及切入後的交換更冒險；時光之杖增強不足以抹去這些限制。'),
 'yasuo-baron':('B','成長物防與三技傷害提高，可改善近戰交換；兵線、擊飛配合與操作要求使他仍屬條件型選擇。'),
 'malphite-baron':('S','強開與物防路線可靠，但對多法術或真傷陣容並非同樣強勢；不將對物理陣容的優勢當通用S+。'),
 'nocturne-jungle':('S','抓落單和施加視野壓力有效；敵方抱團保排時入口減少，不能用順風單抓推成通用S+。'),
 'rammus-jungle':('A','反普攻與嘲諷的用途明確；對多法傷與遠距消耗陣容適用性下降，評級需反映陣容依賴。'),
 'nidalee-jungle':('A','清野轉進攻需標槍命中及視野支援，後續缺少可靠硬控；一般執行情境保守列A。'),
 'riven-baron':('A','位移與護盾提供上限，但換血連段與技能節奏的失誤成本較高；保守評級計入執行難度。'),
 'hwei-mid':('S','多種範圍控制與清線提供穩定團戰價值；選招負擔、無位移及缺少完整數值表讓S+缺乏足夠把握。'),
 'master-yi-jungle':('B','刷野成長與殘局收割是完整用途；控制多時風險高，但不應只因怕控就否定正常發育後的貢獻。'),
 'lux-support':('B','遠距控制、護盾和消耗仍能服務團隊；高價魔攻路線受輔助收入限制，列條件型而非通用首選。'),
 'sylas-mid':('A','保守暫定：回血、被動普攻與偷大絕能完成中路換血和跟進；清線手長、重創、硬控及敵方大絕品質限制穩定性。')}
aChanges={k:('S','範圍技能在單線有優勢，但進場角度、技能命中或隊友保護仍是必要條件；保守區分強勢與通用最高級。') for k in ['fiddlesticks','jayce','kennen','mel','miss-fortune','nami','morgana','aurelion-sol','heimerdinger','velkoz','jinx']}
aChanges.update({'irelia':('A','兵線刷新與熟練連段能發揮，但對手五人集火及重創讓進場不穩定；被動與一技調整也非全面增強。'),'nasus':('A','前排與枯萎有用，但疊層要分配尾刀、貼近後排又受限；不預設隊友每波都讓兵。'),'akshan':('A','收尾能帶來團隊收益，但狹窄路線與抱團站位限制鉤索進出，不保證每戰都能安全取得擊殺。'),'alistar':('S','即使缺乏傷害，開戰、頂退保排與減傷仍可在單線反覆承擔明確任務；須避免頂走集火目標。'),'sylas':('B','保守暫定：近戰先被消耗，回血必須摸到英雄；雪球命中和可偷大絕能製造機會，但不能保證安全進出。標準模式倍率尚未核實，不假設額外補償。')})
config=[];tierlog=[]
# Concrete corrections, keeping alternatives conditional rather than deleting their uses.
cam=next(h for h in hs if h['id']=='camille-baron');old=cam['skillOrder'];cam['skillOrder']='Q > E > W';cam['skillSequence']=['W','Q','E','Q','R','Q','Q','E','R','E','E','W','R','W','W'];cam['skillSequenceNote']='一級保留W外圈換血，三級取得完整技能後主Q副E；主升順序不等於第一級一定點Q。無法接近時可以增加W過渡，但不是三相／邊線配置的預設主升。';config.append({'mode':'rift','id':cam['id'],'field':'skills','before':old,'after':cam['skillOrder'],'reason':cam['skillSequenceNote']})
rfix={'fiddlesticks':('dark-harvest','大絕與範圍傷害接觸低血量目標時觸發收割；不要求連續普攻三次，也不保證每次進場都有刷新。'),'jayce':('arcane-comet','加速炮命中可觸發彗星，服務遠距消耗；對手仍能走位避開彗星，不能把觸發等同必中。'),'velkoz':('arcane-comet','一技消耗與控制配合彗星；以技能射程換取反覆壓血，不要求冒險貼近完成三次普攻。'),'miss-fortune':('conqueror','暴擊路線以普攻和一技累積持續換血收益；大絕作跟進工具，不把單次引導當成必然疊滿。')}
sfix={'velkoz':('1 技 > 2 技 > 3 技','主一技取得安全消耗，副二技補清線；三技保留自保，不為主升它犧牲整體輸出。'),'morgana':('2 技 > 1 技 > 3 技','本頁為魔攻消耗配置，主二技清線鋪地、副一技控制；若整隊需要反控制保護，再改主三技並採保護路線。'),'miss-fortune':('1 技 > 2 技 > 3 技','本頁為物攻暴擊配置，主一技彈射、副二技支援普攻；三技先一點留人，不能用主三技的消耗路線取代射手持續輸出。'),'varus':('2 技 > 1 技 > 3 技','本頁為命中特效配置，主二技強化普攻與枯萎，副一技引爆及消耗；穿甲主一技是另一條路線，不混成同一套。')}
for h in ars:
 if h['id'] in rfix:
  rid,reason=rfix[h['id']];before=h['runes'][0]['name'];r=RU[rid];h['runes'][0]={'id':rid,'name':r['name'],'icon':r['icon'].removeprefix('../'),'reason':reason};config.append({'mode':'aram','id':h['id'],'field':'runes','before':before,'after':r['name'],'reason':reason})
 if h['id'] in sfix:
  order,note=sfix[h['id']];before=h['skillOrder'];nums=re.findall('[123]',before);imap=dict(zip(nums,h['skillIcons']));h['skillOrder']=order;h['skillIcons']=[imap[n] for n in re.findall('[123]',order)];h['skillNote']='開局基本技能各一點，大絕可升時優先。'+note;config.append({'mode':'aram','id':h['id'],'field':'skills','before':before,'after':order,'reason':note})
 # AAA explicitly shared skills/runes must track the standard configuration.
 aaa=h['aaaAram']
 for x in aaa.get('sharedWithStandard',[]):
  if '技能加點' in x.get('title',''):x.update(value=h['skillOrder'],note=h.get('skillNote',''))
 if isinstance(aaa.get('runeReuse'),dict) and 'runes' in aaa['runeReuse']:aaa['runeReuse']['runes']=copy.deepcopy(h['runes'])
# Item logic is derived from the stored game descriptions, with gameplay constraints.
itemlogic={
 '時光之杖':'生命與魔力成長；需要先承擔等待疊層的時間','巫妖之禍':'施法後的普攻收益；能安全補普攻才有價值','三相之力':'技能接普攻的持續交換','暮夜與黎明':'施法與普攻交替的輸出','納什之牙':'持續普攻的魔法輸出','鬼索的狂暴之刃':'連續普攻與命中特效','殞落王者之劍':'普攻處理前排與續戰','魔劍正宗':'魔力與技能穿插普攻；需完成疊層才進化','大天使之杖':'魔力成長與循環；未進化前不能預支後續效果','星蝕':'短換血後的續戰與傷害','突破天際':'貼身普攻換血','步履破壞者':'接近後留人，不能解決所有遠距拉扯','黑色切割者':'多次物理傷害配合團隊處理物防','雄心之鋼':'能接近敵人觸發才有生命成長，不能只靠時間空等','日炎聖盾':'近身持續傷害與清兵','無盡絕望':'身邊有敵人時的持續交戰','寒冰霸拳':'施法後普攻留人及物防','虛偽光彩':'前排交戰與續戰','黎安卓的折磨':'技能持續灼燒處理前排','黑焰火炬':'技能消耗與魔力循環','盧登回音':'第一輪技能清線和消耗','雷霆風暴':'魔攻爆發；沒有命中仍無收益','無限寶珠':'壓低血線後的收尾','惡意':'配合大絕的作戰窗口；大絕空窗需降低進攻','海克斯科技火箭腰帶':'主動調整接近距離；它是一件成裝而非鞋子附魔','峽谷製造者':'能持續交戰才兌現收益','瑞萊的冰晶節杖':'用技能緩速維持接觸或封路','妖夢鬼刀':'移動找角度與物理爆發','蒐集者':'物理爆發與收尾；處決不能取代打前排','狂暴利刃':'普攻暴擊路線的第一輪換血','雲陶狂箭':'普攻與暴擊路線','奪魄之鐮':'技能穿插普攻的射手路線','嗜血者':'普攻續航，仍需能持續攻擊','無盡之刃':'暴擊成形後的傷害','多明尼克的問候':'暴擊路線對物防的穿透','海妖殺手':'持續普攻輸出','史提克彈簧刀':'普攻帶動清兵','衝擊火炮':'調整普攻距離，不能永久把所有技能增程','星河馳騁':'施法後維持走位與拉扯','日輪的加冕':'低經濟團隊防護','聖光美德':'配合團戰保護隊友','錫柯的聚合之力':'開戰後與隊友集中輸出','騎士誓願':'保護綁定隊友，自己也要能承受轉移傷害','約德爾陷阱':'以緩速或硬控場帶動附近隊友','和諧回音':'持續治療／護盾循環','希利亞的迴響':'先傷害敵人，再用友軍治療／護盾消耗碎片','熾灼魔器':'治療／護盾配合普攻隊友；沒有合適核心就要換功能','低語之環':'保護路線的續航','帝王命令':'控制後讓隊友接續輸出','冰霜之心':'限制近身普攻壓力；不能代替魔防','荊棘之甲':'物理防禦與反治療情境','黎明法衣':'前排保護功能','巨蛇鋒牙':'針對反覆護盾；護盾少時應使用情境替換','夜色緣界':'保住接近時的第一輪技能','死者肩甲':'移動接近與物防'}
keylogic={'electrocute':'短時間三次獨立命中換取爆發，不把單發消耗當完整觸發。','dark-harvest':'壓低敵方血線後才有收割收益，不能為疊層越過前排。','first-strike':'需要連續普攻同一英雄三次；它是遇強則強，不是先發制人的金幣效果。','empowerment':'先對敵人造成傷害才有先發收益；被消耗先手後要等冷卻，不能只按滿收益估算。','lethal-tempo':'需要持續對英雄普攻；命中空間比紙上攻速重要，現有數值疑義仍保留。','fleet-footwork':'蓄能後以普攻換回復與走位；不是無條件每次施法都回血。','conqueror':'以獨立技能與普攻累積長戰收益；短打一輪就撤退時通常無法吃滿。','grasp':'能反覆短換血才有累積收益；遠程和不敢近身的對局要降低期待。','guardian':'在隊友附近提供保護，站位與承傷時機影響觸發。','aery':'消耗與對友保護共享艾莉往返時間，不能同時預支兩邊收益。','arcane-comet':'技能先命中才能召喚彗星，緩速／控制能提高後續命中機會。','phase-rush':'三次命中後用移速調整站位，沒有完成觸發前仍要留撤退工具。','glacial-augment':'需先硬控到英雄，防護與緩速服務跟進或反開，空招不會提供同樣容錯。'}
def buildtext(h,mode):
 names=[I[x]['name'] for x in ids(h['items'])];first,second=names[:2]
 a=itemlogic.get(first,'本頁主要輸出／防護需求');b=itemlogic.get(second,'接續主要作戰需求')
 text=f'{first} → {second}：前者提供{a}，後者補{b}。'
 if mode=='rift' and h['roleId']=='support':text+='四件購買裝加進化任務裝為五成裝；收入降低時先完成能立即保排或控制的功能，不提前假設全套魔攻成形。'
 elif mode=='aram':text+='以這條路線的輸出距離打團，死亡回補時再決定後續防護；沒有回城購物可補救每次換血。'
 else:text+='保留五件成裝與獨立鞋線；核心未成形時不把最後一格的保命／穿透能力當成已有。'
 if first=='巨蛇鋒牙' or second=='巨蛇鋒牙':text+='反盾是有條件位置：確認敵方反覆大盾後才優先，護盾少時依情境表替換。'
 if h.get('id')=='sylas-mid' or (mode=='aram' and h['id']=='sylas'):text+='賽勒斯以時光／巫妖保留第二輪技能，中婭在死亡之帽之前提高進場容錯；短局可用火箭腰帶替時光，但犧牲魔力與成長。'
 return text
def runetext(h):
 rr=ids(h['runes']);text=RU[rr[0]]['name']+'：'+keylogic[rr[0]]
 text+='其餘選用'+ '、'.join(RU[x]['name'] for x in rr[1:])+'，依本頁輸出方式與生存需求配套。'
 return text
def spelltext(h,mode):
 ss=ids(h['spells']);text='＋'.join(SP.get(x,'雪球戰車' if x=='snowball-chariot' else x) for x in ss)+'。'
 if mode=='aram':return text+('雪球提供接近機會，命中後仍要確認隊友距離，不必每球都進。' if any('snowball' in x or x=='mark' for x in ss) else '保留位移／保命用途，避免為一輪消耗同時用掉全部防護。')+'標準ARAM不套用打野重擊收益。'
 if 'smite' in ss:return text+'重擊留意物件血線，野區收益與承傷調整後先判斷續航再入侵；另一技能服務進退，不能預設同時有點燃。'
 return text+'閃現優先保留應對致命控制或完成有隊友跟進的擊殺；第二技能依對線用途使用，不替代走位。'
def skilltext(h,mode):
 if h.get('id')=='camille-baron':return h['skillSequenceNote']
 if mode=='aram':return h['skillOrder']+'。'+h.get('skillNote','依可升級等級分配。')
 keys=h['skillOrder'].split(' > ');ab={a['key']:a.get('title',a['key']) for a in h.get('abilities',[])}
 return f"優先 {h['skillOrder']}，以{ab.get(keys[0],keys[0])}承擔主要循環；初級取點仍依15級表保留完整基本技能，不把主升順序誤認成開局必須連點同一招。"
method='本站獨立邏輯複核：以既有手機版技能／裝備／符文資料與已整理的7.3f官方差異推演；本輪不採用外站評級、勝率或推薦配置。'
limit='完成策略與配置一致性複核，不等於全部技能逐級數值、傷害計算及所有特殊互動已實測；既有缺證項目仍保留。'
for mode,ls in [('rift',hs),('aram',ars)]:
 for h in ls:
  base=h.get('baseId') or h['id'];before=h['tier'];decisions=changes if mode=='rift' else aChanges;after,why=decisions.get(h['id'],(before,''));h['tier']=after
  if before!=after:tierlog.append({'mode':mode,'id':h['id'],'name':h['name'],'before':before,'after':after,'reason':why})
  role=rolelogic[h['roleId']] if mode=='rift' else '單線五人戰重視消耗、清兵、開戰或保排；側線壓力與野區入侵優勢不直接計分，回血也不能假設抵銷全部消耗。'
  reason=f"{'調整為' if before!=after else '維持'} {after}。"+(why or notes[base]+' '+scale[after])
  if why:reason+=' '+notes[base]
  logic={'version':'v127','date':DATE,'method':method,'externalRankingsUsed':False,'confidence':'low' if base=='sylas' else 'editorial','tierLabel':'保守暫定' if base=='sylas' else '本站邏輯評級','tierBefore':before,'tierAfter':after,'tierReason':reason,'mechanics':notes[base],'roleTask':role,'build':buildtext(h,mode),'runes':runetext(h),'spells':spelltext(h,mode),'skills':skilltext(h,mode),'matchups':notes[base]+' 名單僅作機制對位提示；優先看控制是否交掉、兵線／地形與隊友跟進，不宣稱勝率剋制榜。','scope':limit}
  h['logicReview127']=logic;h['reviewedAt']=DATE;h['sourceNote']=method+' '+limit;h['reviewStatus']='7.3f-independent-editorial-review';h['tierLabel']=logic['tierLabel']
  if mode=='rift':
   old=copy.deepcopy(h.get('editorialReview',{}));h['editorialReviewBefore127']=old
   checks=[copy.deepcopy(x) for x in old.get('checks',[]) if x.get('status')=='pending' and x.get('field') not in ['tier','source']]
   if base=='sylas':checks.append({'field':'ability','title':'完整逐級值與偷取互動','status':'pending','detail':'截圖僅能確認當時顯示條件；逐級冷卻／傷害與各英雄大絕特殊互動仍待遊戲內核實。','sources':[]})
   checks.append({'field':'tier','title':'本站獨立評級','status':'editorial','detail':reason,'sources':[]})
   er={'version':'v127','date':DATE,'status':'independent-editorial-review','sourcePatch':'7.3f（官方差異與既有遊戲資料）','sources':[],'checks':checks,'pending':[x['detail'] for x in checks if x['status']=='pending'],'limitation':limit}
   for k in ['tier','build','runes','spells','skills','mechanics','matchups']:er[k]={'status':'conservative-provisional' if base=='sylas' and k=='tier' else 'site-logic-reviewed','reason':logic['tierReason'] if k=='tier' else logic[k]}
   h['editorialReview']=er;h['patch73fReview'].update({k:logic[k] for k in ['date','version','tierBefore','tierAfter','tierReason','build','runes','spells','scope']});h['patch73fReview']['scope']=method+' '+limit
   h['guideContentAudit']={'version':'v127','date':DATE,'status':'independent-editorial-review','sourcePatch':'7.3f'}
   h['provisional']=base=='sylas'
  else:
   h['tierReason']=reason;h['review73f'].update(date=DATE,version='v127',tierBefore=before,tierAfter=after,tierReason=reason,scope=method+' '+limit+' 標準ARAM倍率沿用既有記錄；賽勒斯倍率仍未確認。')
   h['review73f']['logicNotes']=[logic[k] for k in ['roleTask','build','runes','spells','skills']]
   h['sourcesBefore127']=h.get('sources',[]);h['sources']=[x for x in h.get('sources',[]) if 'wildrift.leagueoflegends.com' in x.get('url','')]
   h['runes'][0]['reason']=h['runes'][0].get('reason','') if h['id'] in rfix else RU[h['runes'][0]['id']]['name']+'：'+keylogic[h['runes'][0]['id']]
   aaa=h['aaaAram'];aaa['logicReview127']={'date':DATE,'status':'hero-route-reviewed','reason':notes[base]+' 增幅先補本套缺少的進場、生存或輸出條件，再看上限；未取得卡面要求的觸發方式就不為它換掉核心。','scope':'143位英雄的打法與路線條件複核；既有單卡分級與相容表保留其原有版本，不宣稱全部英雄×全部卡片重新實測或重評。','globalTier':None};aaa['pilotNote']=aaa['logicReview127']['reason'];aaa['sourceNote']=method+' '+aaa['logicReview127']['scope'];aaa['reviewedAt']=DATE
   if base=='sylas':aaa['pilotNote']+='賽勒斯優先能安全完成二技與被動普攻的條件；技能循環增幅也不代表可無限偷同一人的大絕。'
# Catalog and counts must agree with role-specific pages.
byid={h['id']:h for h in hs}
for c in H['heroCatalog']:
 for role in c.get('roles',[]):
  if role.get('detailHeroId') in byid:role['tier']=byid[role['detailHeroId']]['tier']
H['version']='7.3f';H['updated']=DATE;H['logicReview127']={'date':DATE,'version':'v127','champions':len(notes),'guides':len(hs),'method':method,'tiers':dict(Counter(h['tier'] for h in hs))};H['patch73fAudit'].update(date=DATE,scope='independent-logic-and-configuration-review',tierReranked=True)
A['updated']=DATE;A['tierCounts']=dict(Counter(h['tier'] for h in ars));A['tierMethodology']=method+' 標準ARAM與峽谷分開評；符文大亂鬥不套一個固定總Tier。';A['logicReview127']={'date':DATE,'standardGuides':len(ars),'aaaHeroRoutes':len(ars),'method':method};A['notes']=[method,limit,'標準ARAM倍率沿用既有可追溯記錄；沒有7.3f新倍率公告時不自行改數值。']
report={'version':'v127','patch':'7.3f','date':DATE,'method':method,'scope':limit,'criteria':scale,'riftGuides':len(hs),'aramGuides':len(ars),'uniqueChampions':len(notes),'aaaHeroRoutes':len(ars),'tierChanges':tierlog,'configurationChanges':config,'pendingMechanics':[{'id':h['id'],**c} for h in hs for c in h['editorialReview']['checks'] if c['status']=='pending'],'records':[{'mode':mode,'id':h['id'],'name':h['name'],'role':roles[h['roleId']] if mode=='rift' else '標準ARAM',**h['logicReview127']} for mode,ls in [('rift',hs),('aram',ars)] for h in ls]}
save('heroes.json',H);save('hwei-profile.json',W);save('aram/heroes.json',A);save('logic-review-7.3f-v127.json',report)
print(json.dumps({k:v for k,v in report.items() if k not in ['records','criteria','pendingMechanics','tierChanges','configurationChanges']}|{'tierChangeCount':len(tierlog),'configurationChangeCount':len(config),'pending':len(report['pendingMechanics'])},ensure_ascii=False,indent=2))
