import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=f=>JSON.parse(fs.readFileSync(path.join(root,'assets/data',f),'utf8'));
const data=read('heroes.json'),hs=[...data.heroes,read('hwei-profile.json')];
const items=read('items-7.3.json').items, im=new Map(items.map(x=>[x.id,x]));
const runes=Object.entries(read('runes.json')).flatMap(([branch,a])=>a.map(x=>({...x,branch}))),rm=new Map(runes.map(x=>[x.id,x]));
const spells=read('spells.json'),sm=new Map(spells.map(x=>[x.id,x]));
const failures=[];let checks=0;
const ok=(v,message)=>{checks++;if(!v)failures.push(message);};
const exists=p=>p&&fs.existsSync(path.resolve(root,'pages',p));
const count=a=>a.reduce((o,x)=>(o[x]=(o[x]||0)+1,o),{});
function config(c,label,role){
  ok(c.items.length===5&&new Set(c.items).size===5,label+' five unique items');
  for(const id of [...c.items,...c.boots])ok(im.has(id),label+' item '+id);
  const income=c.items.filter(id=>['群山堡壘','黯霧之鐮','霜牙'].includes(im.get(id)?.name));
  if(role==='support')ok(income.length===1,label+' one support income item');
  ok(c.spells.length===2&&new Set(c.spells).size===2,label+' two unique spells');
  c.spells.forEach(id=>ok(sm.has(id),label+' spell '+id));
  if(role==='jungle')ok(c.spells.includes('smite'),label+' smite');
  ok(c.runes.length===5&&new Set(c.runes).size===5,label+' five unique runes');
  const rr=c.runes.map(id=>rm.get(id));
  rr.forEach((r,i)=>ok(r&&!r.removedPatch,label+' current rune '+c.runes[i]));
  ok(rr[0]?.branch==='keystone',label+' keystone');
  const primary=rr.slice(1,4);
  ok(primary.every(r=>r?.branch===primary[0]?.branch),label+' primary branch');
  ok(primary.map(r=>r?.row).sort().join(',')==='1,2,3',label+' one rune per primary row');
  ok(rr[4]?.branch!==primary[0]?.branch&&rr[4]?.branch!=='keystone',label+' secondary branch');
  const groups=[['史特拉克手套','魔提斯深淵','不朽盾弓'],['三相之力','寒冰霸拳','聖裂之杖','巫妖之禍'],['多明尼克的問候','致死宣告','席利妲咒怨']];
  for(const g of groups)ok(c.items.map(id=>im.get(id)?.name).filter(n=>g.includes(n)).length<=1,label+' unique effect '+g[0]);
}
for(const h of hs){
  config(h,h.id,h.roleId);
  ok(h.skillSequence.length===15,h.id+' skill sequence 15');
  let expected=h.baseId==='jayce'?{Q:5,W:5,E:5}:h.baseId==='yuumi'?{Q:5,W:3,E:4,R:3}:{Q:4,W:4,E:4,R:3};
  const allocated=count(h.skillSequence);
  for(const [k,n]of Object.entries(expected))ok(allocated[k]===n,h.id+' points '+k);
  let spent={};h.skillSequence.forEach((key,i)=>{spent[key]=(spent[key]||0)+1;if(key==='R')ok([5,9,13].includes(i+1),h.id+' ult level '+(i+1));else ok(i+1>=2*spent[key]-1,h.id+' rank gate '+(i+1));});
  ok(h.abilities.length===5&&new Set(h.abilities.map(a=>a.key)).size===5,h.id+' 5 skills');
  for(const a of h.abilities)ok(exists(a.icon),h.id+' image '+a.key);
  ok(exists(h.avatar),h.id+' portrait');
  if(h.baseId!=='hwei')ok(h.patch73AttackSpeed?.rows.length===4,h.id+' attack speed');
  for(const v of h.buildVariants||[])config({...v,boots:v.boots||h.boots,spells:v.spells||h.spells,runes:v.runes||h.runes},h.id+'/'+v.title,h.roleId);
  for(const s of h.matchupAdjustments?.situations||[])for(const c of s.changes||[]){
    if(c.type==='item'){ok([...h.items,...h.boots].includes(c.fromId),h.id+' swap from '+c.fromId);ok(im.has(c.toId),h.id+' swap to '+c.toId);ok(![...h.items,...h.boots].includes(c.toId),h.id+' swap target duplicate '+c.toId);}
  }
  ok(h.officialReview114?.status==='public-source-reviewed',h.id+' audit status');
}
for(const c of data.heroCatalog)for(const role of c.roles){const h=hs.find(h=>h.id===role.detailHeroId);ok(h?.baseId===c.id,c.id+' catalog target');ok(h?.tier===role.tier,c.id+' catalog tier');}
for(const role of ['baron','mid','jungle','duo','support'])ok(hs.filter(h=>h.roleId===role).length===data.laneMeta[role].nativeCount,role+' total');
ok(hs.length===203,'203 profiles');ok(new Set(hs.map(h=>h.baseId)).size===142,'142 unique heroes');

const audit=read('hero-review-v115.json'),official=read('official-7.3a.json');
ok(official.heroes.length===12,'12 direct champions');
ok(official.items.length===4,'4 official items');
ok(audit.profiles.filter(x=>x.direct).length===17,'17 direct profiles');
ok(audit.counts.affectedItemProfiles===42,'42 item-affected profiles');
ok(audit.tierChanges.length===8,'8 editorial tier changes');
ok(audit.runeChanges.length===4&&audit.buildChanges.length===4,'4 builds and 4 rune sets changed');
for(const h of hs){
  ok(h.patch==='7.3a'&&h.patch73aReview?.version==='v115',h.id+' current patch review');
  ok(h.coreItems.join()===h.items.slice(0,3).join(),h.id+' core order');
  const direct=official.heroes.find(x=>x.baseId===h.baseId);
  if(direct)ok(JSON.stringify(h.patch73aNumbers)===JSON.stringify(direct.groups),h.id+' official values');
  for(const s of h.matchupAdjustments?.situations||[])for(const c of s.changes||[]){
    if(c.type==='rune'){
      ok(h.runes.includes(c.fromId)&&rm.has(c.toId),h.id+' rune swap reference');
      config({...h,runes:h.runes.map(x=>x===c.fromId?c.toId:x)},h.id+'/rune-swap/'+s.id,h.roleId);
    }
  }
}
for(const c of audit.tierChanges)ok(hs.find(h=>h.id===c.id)?.tier===c.to,c.id+' audit tier');
for(const i of items)ok(exists(i.icon),'item image '+i.id);
for(const r of runes.filter(r=>!r.removedPatch&&r.icon))ok(exists(r.icon),'rune image '+r.id);
for(const s of spells)ok(exists(s.icon),'spell image '+s.id);
ok(im.get('wr73-8961').price===3300,'Death Dance price');
ok(im.get('wr73-9087').stats.includes('+35% 攻擊速度'),'Yun Tal stat');
ok(im.get('wr73-9087').passives.some(p=>p.description.includes('冷卻25秒')),'Yun Tal cooldown');
for(const id of ['wr73-9159','wr73-9159-evolved'])ok(im.get(id).passives.find(p=>p.name==='和諧').description.includes('0.25%'),id+' conversion');
ok(JSON.stringify(sm.get('smite')).includes('22–162'),'smite burn');
ok(official.runes.changed===false,'No official normal rune nerf/buff');
const currentSenna=hs.find(h=>h.id==='senna-support').patch73aAttackSpeed.rows;
ok(currentSenna.map(x=>x.value).join()==='0.3,0.3,1.1,0.025','current Senna AS');
const report={checks,failures,profiles:hs.length,heroCount:142,scope:'static data invariants; not browser or live match verification'};

console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
