// Regression checks for actual audit failures. DOM tests do not test mobile layout/gameplay.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const {JSDOM,VirtualConsole}=require(require.resolve('jsdom',{paths:[process.env.WRG_TEST_DEPS||process.cwd()]}));
const get=f=>fs.readFileSync(f,'utf8'),read=f=>JSON.parse(get(f));
let checks=0;const failures=[],errors=[];
const ok=(v,s)=>{checks++;if(!v)failures.push(s);};
const pause=()=>new Promise(r=>setTimeout(r,120));
function page(file,query='',failHwei=false){
  const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(get(file),{url:'https://wild-rift-guide.vercel.app/'+file+query,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.matchMedia=()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}});
  const localJSON=async p=>{if(failHwei&&String(p).includes('hwei-profile'))throw new Error('test optional profile unavailable');return read(new URL(p,w.location).pathname.slice(1));};
  w.getJSON=localJSON;
  w.fetch=async p=>({ok:true,json:()=>localJSON(p)});
  return dom;
}

for(const failHwei of [false,true]){
  const dom=page('summoners-rift.html','',failHwei),w=dom.window,d=w.document;
  w.eval(get('assets/js/app.js'));await pause();
  const input=d.querySelector('#homeHeroSearchInput');
  for(const [term,id]of (failHwei?[['Jinx','jinx']]:[['赫威','hwei-mid'],['Hwei','hwei-mid'],['Jinx','jinx']])){
    input.value=term;input.dispatchEvent(new w.Event('input'));
    const links=[...d.querySelectorAll('.home-hero-search-result')];
    ok(links.some(a=>a.getAttribute('href').includes('hero='+id)),'home search '+term+' fallback='+failHwei);
  }
  dom.window.close();
}

const h=read('assets/data/heroes.json').heroes;
const keys={FLASH:'flash',F:'flash',IGNITE:'ignite',EXHAUST:'exhaust',HEAL:'heal',GHOST:'ghost',SMITE:'smite',BARRIER:'barrier'};
let conditional=0;
for(const hero of h)for(const combo of hero.combos||[])for(const step of combo.steps){
  const spell=keys[typeof step==='string'?step:step.key];
  if(spell&&!hero.spells.includes(spell)){conditional++;ok(step.label.includes('改帶時才使用')&&combo.note.includes('改帶'),hero.id+' non-default spell condition');}
}
ok(conditional===22,'22 conditional spell steps');
for(const id of ['galio-mid','galio-support','vladimir-mid','wukong-jungle','yuumi-support','morgana-support','brand-support']){
  const dom=page('pages/heroes.html','?hero='+id),w=dom.window;
  w.eval(get('assets/js/heroes.js'));await pause();
  const text=w.document.querySelector('#heroContent').textContent;
  ok(!text.includes('蓄力二技接閃現')&&!text.includes('一技降低目標防禦')&&!text.includes('治療補全隊血量')&&!text.includes('保命附魔'),id+' no stale mechanism');
  if(id==='brand-support')ok(text.includes('改帶時才使用'),id+' visible spell condition');
  if(id==='vladimir-mid')ok(text.includes('4秒')&&text.includes('普攻'),id+' phase rush hits');
  dom.window.close();
}
const items=read('assets/data/items-7.3.json').items;
for(const hero of h)for(const boot of hero.boots||[])ok(items.find(x=>x.id===boot)?.categories.includes('鞋子'),hero.id+' boot entry is footwear');
const sterak=items.find(x=>x.id==='wr73-8958');
ok(!sterak.passives.some(x=>x.description.includes('獲得30%韌性')),'Sterak no removed proc');

const dom=page('aram-augments.html'),w=dom.window,d=w.document;
w.eval(get('assets/js/aram-augments.js'));await pause();
ok(d.querySelectorAll('[data-aram-augment-entry]').length===151,'151 base cards');
ok(d.querySelector('[data-aram-augment-state]').textContent.includes('部分校正'),'honest partial version');
ok(d.querySelectorAll('#aaa-patch-73a li').length===14,'12 augments and 2 AAA champions');
const search=d.querySelector('[data-aram-augment-search]');
for(const [name,number]of [['生命循環','200%'],['疾風斬','至9'],['加速巫術','66層'],['完美巔峰','44.44%']]){
  search.value=name;search.dispatchEvent(new w.Event('input'));
  const visible=[...d.querySelectorAll('[data-aram-augment-entry]')].filter(x=>!x.hidden);
  ok(visible.length===1&&visible[0].textContent.includes(number)&&visible[0].textContent.includes('已校正'),'search corrected '+name);
}
dom.window.close();

const home=page('summoners-rift.html'),hd=home.window.document;
for(const [name,text]of [['日炎聖盾','炎之觸'],['無限寶珠','40%'],['史特拉克手套','20%']]){
  const cards=[...hd.querySelectorAll('.patch106-numeric')].filter(c=>c.querySelector('summary strong')?.textContent===name);
  ok(cards.length===1&&cards[0].textContent.includes(text),'official independent item '+name);
  if(name==='日炎聖盾')ok(!cards[0].textContent.includes('20%')&&!cards[0].textContent.includes('暴擊門檻'),'Sunfire no other items values');
}
ok(!hd.querySelector('#audit-fix-v1153').open,'audit update collapsed');
home.window.close();

for(const file of execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim().split('\n').filter(f=>f.endsWith('.html'))){
  const before=execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'}),after=get(file);
  ok(JSON.stringify(before.match(/(?:ca-)?pub-\d+/g))===JSON.stringify(after.match(/(?:ca-)?pub-\d+/g)),file+' AdSense retained');
  ok(JSON.stringify(before.match(/<meta name="robots"[^>]*>/g))===JSON.stringify(after.match(/<meta name="robots"[^>]*>/g)),file+' robots retained');
}
ok(errors.length===0,'no runtime errors');
console.log(JSON.stringify({checks,failures,errors,scope:'data and DOM regression; not game-client or mobile visual testing'},null,2));
if(failures.length||errors.length)process.exitCode=1;
