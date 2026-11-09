// v115: first 7.3a review. Run from the project root against the original v114 commit.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const base=f=>JSON.parse(execFileSync('git',['show','9223cc207838f878113db4c49ec1584bd498b94c:'+f],{encoding:'utf8',maxBuffer:20*1024*1024}));
const save=(f,x)=>fs.writeFileSync(f,JSON.stringify(x,null,2)+'\n');
const clone=x=>JSON.parse(JSON.stringify(x));
const date='2026-10-01', patch='7.3a', version='v115';
const official=read('assets/data/official-7.3a.json'), source=official.source;
const d=base('assets/data/heroes.json'), hwei=base('assets/data/hwei-profile.json');
const all=[...d.heroes,hwei], before=new Map(all.map(h=>[h.id,clone(h)]));
const items=base('assets/data/items-7.3.json'), itemById=new Map(items.items.map(i=>[i.id,i]));
const spells=base('assets/data/spells.json'), runes=base('assets/data/runes.json');
const audit={version,patch,date,baseCommit:'9223cc207838f878113db4c49ec1584bd498b94c',source,
  scope:'召喚峽谷142位英雄／203份位置配置的7.3a差異複核；12位直接調整英雄與受裝備／打野改動影響的配置。',
  methodology:'官方數值與本站建議分開。Tier為改版首輪、依技能／裝備互動推論的暫定評級；未取得台服7.3a分路勝率樣本，不聲稱重測所有技能成長表。',
  unchangedModes:['一般ARAM英雄資料','符文大亂鬥攻略及增幅資料'],
  tierChanges:[],buildChanges:[],runeChanges:[],profiles:[],items:[],pending:clone(base('assets/data/hero-review-v114.json').pending)};
const tierEdits={
  samira:['S','傷害係數與三項防禦成長同時提高，現有暴擊／吸血配置更能發揮進場收割；仍怕硬控中斷。'],
  tristana:['A','三技基礎傷害及額外物攻、暴擊成長提高，搭配雲陶攻速加強；一技滿級略降，不直接跳到最高評級。'],
  draven:['S','一技額外物攻、二技攻速及大絕係數回升，嗜血者高物攻核心的收益提高；接斧與對線風險仍在。'],
  'rammus-jungle':['A','基礎物防與低等級二技一起降低，再遇重擊燃燒削弱，前期清野與入侵容錯下降；後期反普攻定位仍保留。'],
  'malphite-baron':['S','二、三技物防傷害與大絕週期下修，但坦克承傷與團控功能仍在；不把這個分路評級套給輔助。'],
  'syndra-mid':['S','碎片門檻提高且二技成長下修，原本的成形速度優勢縮小；長手暈眩與單點爆發仍具價值。'],
  'senna-support':['A','攻速係數、成長與前搖收益同步削弱，原先偏多攻速的功能出裝效益下降；射程、治療與物理減防價值仍在。'],
  'viego-jungle':['S','一技被動與暴擊、大絕暴擊係數提高，現有暴擊配置的首殺能力受益；重擊燃燒下降及進場被秒風險另計。']
};
for(const [id,[tier,reason]] of Object.entries(tierEdits)){
  const h=all.find(x=>x.id===id);audit.tierChanges.push({id,baseId:h.baseId,name:h.name,role:h.role,from:h.tier,to:tier,reason,confidence:'first-pass-editorial',winRateVerified:false});h.tier=tier;
}
const itemNotes={
  'wr73-9087':'雲陶狂箭常駐與觸發攻速皆為35%，但觸發冷卻延長至25秒；保留需要普攻疊暴擊的路線，開戰前留意效果是否可用。',
  'wr73-8961':'死亡之舞總價3300，能力值與延遲傷害機制不變；仍依生存壓力購買，不能按舊3200金幣抓回城完成點。',
  'wr73-9159':'低語之環／歌謠之冠的和諧轉換係數減半，魔力需求與保排需求須分開判斷，不再只為轉換係數盲目首出。',
  'wr73-9159-evolved':'歌謠之冠的和諧轉換改為0.25%；不影響本次未調整的冠冕治療。'
};
const editReasons={};
function editItems(id,next,reason){
  const h=all.find(x=>x.id===id),old=[...h.items];h.items=next;h.coreItems=next.slice(0,3);
  editReasons[id]??={};editReasons[id].build=reason;
  audit.buildChanges.push({id,name:h.name,role:h.role,before:old,after:next,reason});
  const removed=old.filter(x=>!next.includes(x)),added=next.filter(x=>!old.includes(x));
  const mapping=new Map(removed.map((x,i)=>[x,added[i]]).filter(x=>x[1]));
  for(const s of h.matchupAdjustments?.situations||[])s.changes=(s.changes||[]).map(c=>c.type==='item'&&mapping.has(c.fromId)?{...c,fromId:mapping.get(c.fromId)}:c).filter(c=>c.type!=='item'||(![...next,...h.boots].includes(c.toId)&&c.fromId!==c.toId));
}
function editRune(id,from,to,reason){
  const h=all.find(x=>x.id===id),old=[...h.runes];h.runes=h.runes.map(x=>x===from?to:x);
  editReasons[id]??={};editReasons[id].rune=reason;
  audit.runeChanges.push({id,name:h.name,role:h.role,from,to,reason});
  for(const v of h.buildVariants||[])v.runes=v.runes.map(x=>x===from?to:x);
  for(const s of h.matchupAdjustments?.situations||[])s.changes=(s.changes||[]).map(c=>c.type==='rune'&&c.fromId===from?{...c,fromId:to}:c).filter(c=>c.type!=='rune'||(!h.runes.includes(c.toId)&&c.fromId!==c.toId));
}
editItems('caitlyn',['wr73-9004','wr73-9050','wr73-9101','wr73-9096','wr73-8956'],'預設第二件由海克斯光學C44改衝擊火炮，補攻速並保留安全充能點射；C44保留為能安全連續輸出的高物攻情境方案。此為本站取捨，不代表官方指定出裝。');
const caitlyn=all.find(h=>h.id==='caitlyn');
caitlyn.buildVariants=[{title:'安全輸出／高物攻點射',when:'有隊友保護、能維持長距離連續普攻，且偏好高物攻爆頭時。',items:clone(before.get('caitlyn').items),boots:clone(caitlyn.boots),runes:clone(caitlyn.runes),spells:clone(caitlyn.spells),note:'C44整格替換火炮；失去火炮的40%攻速與充能射程，不是額外第六件成裝。'}];
editRune('caitlyn','legend-bloodline','legend-alacrity','每級攻速成長下修後，預設改傳奇：敏捷補持續普攻節奏；續航由瞬疾步法與後段嗜血者支援。對線回復壓力大時可改回血脈。');
caitlyn.playstyle['中期']='蒐集者、衝擊火炮成形後，利用充能點射與陷阱壓迫；對方踩陷阱再接一技。火炮不是全程加射程，點射後仍須拉開。安全高物攻方案可整格改C44。';
caitlyn.playstyle['後期']=caitlyn.playstyle['後期'].replace('鬼步用來延長走砍距離','本頁預設光盾保命；若選角時改帶鬼步，則用來延長走砍距離');
editItems('senna-support',['wr73-8938','wr73-9060','wr73-9050','wr73-8956','wr73-9335-evolved'],'不再以電刀首件疊攻速；改黑色切割者→C44建立物攻與團隊削甲，火炮留作安全接觸距離，末件嗜血者為高經濟續航位。黯霧之鐮占一格；功能急迫時先依情境補裝，不強求昂貴滿裝。');
const senna=all.find(h=>h.id==='senna-support');
senna.playstyle['中期']='先以黑色切割者提供團隊削甲，再補C44的長距離物攻收益；火炮服務安全接觸，不是靠大量攻速維持舊版前搖。依隊友需要治療、控制及蒐集靈魂，保留黯霧之鐮。';
for(const id of ['sona-support','seraphine-support']){
  const h=all.find(x=>x.id===id),old=before.get(id);
  editItems(id,['wr73-9408','wr73-9159','wr73-9385','wr73-9149','wr73-9335-evolved'],'將和諧回音提前到第一件，先取得保排與技能加速；低語之環延後到第二件處理魔力，仍可進化歌謠之冠。長局且急需魔力時可用原魔力優先方案；和諧係數削弱不等於整件裝備失效。');
  h.buildVariants=[...(h.buildVariants||[]),{title:'長局／魔力優先',when:'前期施法魔力壓力明顯、能穩定累積魔力，且隊友不急需第一件即時保排時。',items:clone(old.items),runes:clone(h.runes),spells:clone(h.spells),boots:clone(h.boots),note:'保留低語之環先出的選項；和諧已改0.25%，不能沿用舊0.5%收益估算。任務裝仍占一格。'}];
  h.playstyle['中期']='和諧回音先提供群體保排，再以低語之環處理魔力，第三件希利亞的迴響；末件依爆發或控制改功能裝。任務裝保留，主動裝不是額外鞋子附魔。';
  const ap=h.matchupAdjustments?.situations.find(s=>s.id==='apcarry');if(ap){ap.trigger='法術主力需要增益時，可把末件贖罪神石換為流水之杖，先確認保排需求。';for(const c of ap.changes){c.condition=ap.trigger;c.reason='本套沒有熾灼魔器；實際替換的是末件贖罪神石，不移除不存在的裝備。';}}
}
editRune('syndra-mid','hextech-flashtraption','manaflow-band','碎片門檻提高後，預設由海克斯閃現改附魔之帶支援發育與反覆清線；卓越、光輝披風和死亡電刑保留。需要特定隔牆先手時才回選海克斯閃現。');
editRune('rammus-jungle','second-wind','bone-plating','低等級雙防與清野能力下修，預設把偏換血回復的回春改成骨甲，支援遭英雄反野或第一次進場承傷；骨甲不減野怪傷害。');
editRune('viego-jungle','absolute-focus','bone-plating','暴擊傷害提升但仍需活到首次收割；預設用骨甲換下要求高血量的絕對專注，降低英雄接戰時被一輪擊倒的風險，不把骨甲當清野減傷。');
const directNotes={
  hwei:'被動、壞滅熾燄、震顫轟雷及大絕爆炸下修後，保留消耗與控場配置；不再用舊係數估算斬殺線。A暫留，待新版對局資料再判斷是否降級。',
  samira:'生命、雙防成長與傷害一起提高，保留征服者及暴擊／吸血路線；不能忽略硬控中斷大絕。',
  rammus:'前期先穩定清野與觀察線權；基礎物防、二技低等級係數及重擊燃燒同降，不沿用舊版無損入侵判斷。',
  malphite:'坦裝與團控定位保留；二、三技傷害降低，大絕各級多10秒，物件前更要確認冷卻。輔助原B暫留，不等同巴龍路S。',
  tristana:'主三技、副一技不變；雲陶＋那歐支援連續普攻與炸彈，一技前兩級提高但滿級略降，別把所有等級都寫成攻速增強。',
  draven:'保留嗜血者與高物攻核心，接斧增傷、二技攻速和大絕係數提高；新增傷害也不代表能無視對方控制直接追斧。',
  caitlyn:'攻速成長與爆頭後段傷害削弱；預設以火炮和敏捷補普攻節奏，B暫留，不因公告削弱就自動再降一級。',
  senna:'同時檢查基礎攻速、係數、額外攻速、成長與前搖；減少只堆攻速的預設取向，保留物攻、射程與團隊功能。飛龍路B暫留。',
  syndra:'被動強化時間往後、二技魔攻比下降；用較穩定的魔力配置延續清線，不把舊40/60/80/100/120門檻當現行。',
  swain:'基礎治療提高、魔攻治療成長降低，三技重複傷害提高；保留生命／抗性站場與現有分路評級，不把公告增強解讀成純魔攻一定更好。',
  yuumi:'二技治療護盾強度下修；預設本來沒有歌謠之冠，不為了版本更新硬塞一件削弱裝。艾莉、甦醒與既有保排裝保留，C暫留。',
  viego:'主一技與現有暴擊打野配置保留，善用更高一技及大絕暴擊收益；巴龍路較重視對線續戰，保留鬥士裝與B評級。'
};
for(const h of all){
  const old=before.get(h.id), direct=official.heroes.find(x=>x.baseId===h.baseId);
  const refs=new Set([...h.items,...(h.buildVariants||[]).flatMap(v=>v.items),...(h.matchupAdjustments?.situations||[]).flatMap(s=>(s.changes||[]).filter(c=>c.type==='item').map(c=>c.toId))]);
  const affectedItems=official.items.filter(i=>refs.has(i.id));
  const notes=affectedItems.map(i=>itemNotes[i.id]);
  if(h.roleId==='jungle')notes.push('7.3a重擊野怪燃燒基礎傷害為每秒22–162（隨等級）；主動600／1000／1400未改。清野與搶物件分開估算，不沿用舊清野秒數。');
  if(direct)notes.unshift(directNotes[h.baseId]);
  const tc=audit.tierChanges.find(x=>x.id===h.id);
  h.patch=patch;h.reviewedAt=date;h.reviewStatus='v115-first-pass-delta-reviewed';
  h.patch73aReview={version,date,source,status:'first-pass-editorial',directChange:!!direct,affectedItems:affectedItems.map(i=>i.id),jungleChange:h.roleId==='jungle',previousTier:old.tier,currentTier:h.tier,
    tierReason:tc?`${tc.from} → ${tc.to}（首輪暫定）：${tc.reason}`:`維持${h.tier}（暫定）；${direct?directNotes[h.baseId]:'本次沒有足夠的新分路證據調整評級，先保留既有判斷。'}`,
    buildReason:editReasons[h.id]?.build||'沿用既有五件成裝與鞋線；'+(notes.filter(x=>!x.startsWith('7.3a重擊')).join(' ')||'本次公告未直接改變這套核心的能力值。'),
    runeReason:editReasons[h.id]?.rune||'一般符文沒有7.3a直接數值調整；核對本頁關鍵符文、主系各列與副系後保留原搭配。',
    spellReason:h.roleId==='jungle'?'閃現／位移選擇與重擊配置保留；本版只降低重擊的野怪燃燒，不改主動斬殺傷害。':'保留既有召喚師技能；7.3a未直接改動本配置所用技能。',
    skillReason:h.skillSequenceNote||`維持 ${h.skillOrder} 與既有15級分配；本次變動未改變可升級規則。`,notes,
    limitation:'依官方差異與配置互動作首輪複核，不代表台服勝率結論或所有技能完整數值重新實測。'};
  if(direct){
    h.patch73aNumbers=clone(direct.groups);
    for(const a of h.abilities){const groups=direct.groups.filter(g=>g.key===a.key);if(groups.length)a.patch73aValues=groups.flatMap(g=>g.rows.map(r=>({label:g.title+' · '+r.label,value:r.after,kind:r.kind})));}
    if(['caitlyn','senna'].includes(h.baseId)){
      h.patch73aAttackSpeed=clone(h.patch73AttackSpeed);h.patch73aAttackSpeed.source=source;
      for(const r of h.patch73aAttackSpeed.rows){const ch=direct.groups.flatMap(g=>g.rows).find(x=>x.label===r.label);if(ch)r.value=ch.after;}
      h.patch73aAttackSpeed.note='7.3基準加上7.3a更新後的現行攻速參數；比例1.1＝110%、0.025＝2.5%，不是直接填入每秒攻擊次數。';
    }
  }
  if(h.baseId==='syndra')h.abilities.find(a=>a.key==='W').summary='抓取附近星體或可作用單位，再投向指定區域造成傷害與緩速。7.3a魔攻係數為50%、緩速固定25%。';
  if(h.baseId==='yuumi')h.abilities.find(a=>a.key==='W').summary='飛向友軍並附著，通常無法被指定。附著摯友的治療與護盾增益在7.3a改為6%/7%/8%/9%＋0.01%魔攻；冷卻與開局自帶一級的規則未被本次公告更改。';
  // Do not relabel the old 7.3 tables as current; they remain historical.
  audit.profiles.push({id:h.id,baseId:h.baseId,roleId:h.roleId,direct:!!direct,items:affectedItems.map(i=>i.id),jungle:h.roleId==='jungle',tierBefore:old.tier,tierAfter:h.tier,buildChanged:JSON.stringify(old.items)!==JSON.stringify(h.items),runesChanged:JSON.stringify(old.runes)!==JSON.stringify(h.runes)});
}
const abilities=Object.fromEntries(hwei.abilities.map(a=>[a.key,a]));
abilities.P.details[0]='再次以傷害技能命中標記敵人，消耗筆跡並引爆範圍魔法傷害；7.3a為40–285（隨等級）＋30%魔攻。每項技能只能對同一目標觸發此效果一次。';
abilities.P.details[1]='本段傷害已用官方7.3a公告取代舊截圖；其他未公布數值仍按原來源標示，未冒充完整成長表。';
abilities.Q.details[0]='1 → 1｜壞滅熾燄：火球命中後範圍爆炸；7.3a傷害為50/85/120/155＋70%魔攻＋4%/5%/6%/7%目標最大生命。';
abilities.Q.details[1]='1 → 2｜震顫轟雷：延遲攻擊遠距目標；對受硬控或單獨命中的目標，依已損失生命提高傷害的係數在7.3a改為100%/150%/200%/250%。本次公告未列完整基礎傷害成長，不沿用舊截圖的最高傷害作現行斬殺線。';
abilities.R.details[1]='領域引爆時的7.3a魔法傷害為200/300/400＋70%魔攻。';
hwei.version=version;
for(const entry of official.items){
  const i=itemById.get(entry.id);audit.items.push({id:i.id,name:i.name,before:clone(i),changes:clone(entry.groups)});
  if(i.id==='wr73-9087'){i.stats=i.stats.map(s=>s.replace('+25% 攻擊速度','+35% 攻擊速度'));i.passives.find(p=>p.name==='無雙亂舞').description='普攻敵方英雄時獲得35%攻速，持續6秒。冷卻25秒；普攻使冷卻縮短1秒，暴擊時縮短2秒。';}
  if(i.id==='wr73-9159'||i.id==='wr73-9159-evolved')i.passives.find(p=>p.name==='和諧').description=i.passives.find(p=>p.name==='和諧').description.replace('0.5%','0.25%');
  if(i.id==='wr73-8961')i.price=3300;
  i.dataVersion=patch;i.patch73a={date,source,groups:clone(entry.groups),note:entry.note};
}
items.version='7.3a-v115';items.updatedAt=date;items.notes='7.3a：4件公告裝備數值已同步；舊截圖只作歷史來源，以文字中的最新版本為準。 '+items.notes;
const smite=spells.find(s=>s.id==='smite');smite.dataVersion=patch;smite.patch73aSource=source;
smite.details[0].paragraphs[0]='重擊主動對士兵和野怪的600／1000／1400真實傷害不變。野區專精的野怪燃燒基礎傷害在7.3a改為每秒22–162（隨等級），持續2秒；額外物攻10%、額外魔攻12%、額外物防25%、額外魔防25%、額外生命4%的加成，本次公告未調整。';
for(const c of d.heroCatalog)for(const r of c.roles){const h=all.find(x=>x.id===r.detailHeroId);if(h)r.tier=h.tier;}
const lead='v115｜7.3a第一次校正：官方12位英雄／17份位置數值、4件裝備與重擊燃燒同步；一般符文無直接改值。本站8份Tier首輪暫定調整、4份出裝順序／裝備與4份符文搭配調整，恢復頭像數值公告與Tier升降卡片。';
d.version='7.3a-v115-first-review';d.updated=date;d.notes.unshift(lead);
d.patch73aProgress={version,date,reviewed:203,total:203,directHeroes:12,directProfiles:17,tierChanges:audit.tierChanges.length,buildChanges:audit.buildChanges.length,runeChanges:audit.runeChanges.length,scope:audit.scope,methodology:audit.methodology};
for(const [role,m] of Object.entries(d.laneMeta)){m.guideAuditVersion=version;m.guideAuditStatus='7.3a-first-pass';m.verification=`${all.filter(h=>h.roleId===role).length}份位置攻略完成7.3a差異與配置引用複核；Tier是首輪暫定，不代表全技能實測或台服勝率。`;}
const patchData=base('assets/data/patch.json');Object.assign(patchData,{version:patch,updated:date,siteVersion:version,dataVersion:version});patchData.notes.unshift(lead);
audit.counts={heroes:142,profiles:203,directHeroes:12,directProfiles:audit.profiles.filter(h=>h.direct).length,affectedItemProfiles:audit.profiles.filter(h=>h.items.length).length,jungleProfiles:51,tierChanges:audit.tierChanges.length,buildChanges:audit.buildChanges.length,runeChanges:audit.runeChanges.length,officialItems:4,officialRuneChanges:0};
audit.runes={source,directChanges:0,retainedVersion:'7.3',count:Object.values(runes).flat().filter(r=>r.available!==false).length,changes:audit.runeChanges};
save('assets/data/heroes.json',d);save('assets/data/hwei-profile.json',hwei);save('assets/data/items-7.3.json',items);save('assets/data/spells.json',spells);save('assets/data/patch.json',patchData);save('assets/data/hero-review-v115.json',audit);
console.log(JSON.stringify(audit.counts,null,2));
