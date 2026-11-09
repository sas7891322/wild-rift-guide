import fs from 'node:fs';
const file='assets/data/heroes.json';
const d=JSON.parse(fs.readFileSync(file,'utf8'));
const warning='二技蓄力期間不能使用閃現。需要閃現進場時，必須先閃現，再開始二技蓄力；敵人仍有反應與逃離空間，不是瞬間滿蓄力嘲諷。';
for(const h of d.heroes.filter(h=>['galio-mid','galio-support'].includes(h.id))){
  h.abilities.find(a=>a.key==='W').summary='被動提供魔法護盾；蓄力時減傷並減速自己，放開後嘲諷附近敵人。'+warning;
  h.combos[0]={name:'三技擊飛接二技控制',steps:[{key:'E',label:'3技命中擊飛'},{key:'W',label:'接2技蓄力並適時放開'},{key:'Q',label:'1技補傷害'},{key:'AA',label:'被動強化普攻'}],note:'三技命中後優先接二技控制，再補一技與被動普攻；依敵方位移與控制決定放開時機，不強求蓄滿，也不保證全程無縫控制。先確認隊友能跟上。'};
  h.combos[1]={name:'先閃現再二技嘲諷',steps:[{key:'FLASH',label:'先閃現進入有效距離'},{key:'W',label:'再開2技蓄力'},{key:'W',label:'適時放開嘲諷'},{key:'Q',label:'1技補傷害'},{key:'E',label:'視情況3技追擊或撤退'}],note:warning+' 一技與三技依戰況接續，不要為追求多人嘲諷而脫離隊友。'};
  h.combos[2].note='大絕優先支援仍能存活到加里歐抵達的隊友；落地後視距離以三技命中接二技，或敵人已在身旁時直接開二技，再補一技與被動普攻。二技不必每次蓄滿，避免讓敵人脫離控制範圍。';
  for(const m of h.mechanics||[])if(m.title==='二技蓄力時間決定範圍')m.text='二技蓄力越久，嘲諷範圍與控制時間越大，但自身會減速。可利用草叢或視野差接近；不能在蓄力途中閃現調位。若需閃現，必須先閃現再開二技。';
  if(h.roleId==='support')h.playstyle['前期']='利用杜蘭德之盾的魔法護盾承受法術消耗，敵方走位過前時以三技命中接二技，再補一技與被動普攻。二技蓄力會降低自身跑速，可利用草叢接近；若需閃現，先閃現再開二技，不能在蓄力途中閃現。';
  h.comboCorrection={version:'v115.1',date:'2026-10-04',reason:'玩家回報二技蓄力中無法閃現；更正本站兩分路錯誤操作順序。',note:warning};
}
fs.writeFileSync(file,JSON.stringify(d,null,2)+'\n');
for(const [f,from,to]of [['assets/js/heroes.js','heroes.json?v=115.0.0','heroes.json?v=115.1.0'],['pages/heroes.html','heroes.js?v=115.0.0','heroes.js?v=115.1.0']]){
 const s=fs.readFileSync(f,'utf8');fs.writeFileSync(f,s.replaceAll(from,to));
}
const home='summoners-rift.html';let html=fs.readFileSync(home,'utf8');
if(!html.includes('id="galio-fix-v1151"'))html=html.replace('<div class="update-v115" id="site-73a">','<div class="update-v115" id="site-73a"><div class="site-review-grid" id="galio-fix-v1151"><div><strong>10/4・v115.1 加里歐連招修正</strong><p>中路與輔助的錯誤「二技蓄力後閃現」改為「先閃現，再開二技」。二技蓄力期間不能閃現，並非瞬間滿蓄力嘲諷；同步修正基礎控制順序及技能、機制說明。這是本站攻略勘誤，不是官方平衡改動。</p><a href="pages/heroes.html?hero=galio-mid">中路攻略</a> · <a href="pages/heroes.html?hero=galio-support">輔助攻略</a></div></div>');
fs.writeFileSync(home,html);
console.log('Corrected galio-mid and galio-support; other hero objects unchanged.');
