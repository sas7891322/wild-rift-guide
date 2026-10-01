// DOM unit tests only: jsdom does not verify browser layout, Safari, or touch rendering.
// npm install --prefix /your/test-deps jsdom
// WRG_TEST_DEPS=/your/test-deps/node_modules node scripts/test-dom-v115.mjs
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM,VirtualConsole}=require(require.resolve('jsdom',{paths:[process.env.WRG_TEST_DEPS||process.cwd()]}));
const root=process.cwd(),get=f=>fs.readFileSync(path.join(root,f),'utf8'),read=f=>JSON.parse(get('assets/data/'+f));
const heroes=[...read('heroes.json').heroes,read('hwei-profile.json')];
const failures=[],errors=[];let checks=0;
const ok=(v,s)=>{checks++;if(!v)failures.push(s);};
function page(file,query=''){
  const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(file+': '+e.message));
  const dom=new JSDOM(get(file),{url:'http://localhost/'+file+query,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window;
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.matchMedia=()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.getJSON=async p=>JSON.parse(get(new URL(p,w.location.href).pathname.slice(1)));
  w.fetch=async p=>({ok:true,json:()=>w.getJSON(p)});
  w.eval(get('assets/js/seo.js'));
  return dom;
}
async function settle(){await new Promise(r=>setTimeout(r,15));}
const home=page('summoners-rift.html'),d=home.window.document;
home.window.eval(get('assets/js/home-updates.js'));
ok(d.querySelectorAll('#official-73a [data-official-hero]').length===12,'official hero cards');
ok(d.querySelectorAll('#official-73a [data-official-item]').length===4,'official item cards');
ok(d.querySelectorAll('#site-73a [data-tier-hero]').length===8,'tier cards');
ok(d.querySelectorAll('.update-history-v115:not([open])').length===2,'histories closed');
ok(!d.querySelector('#homeUpdateOfficial').hidden,'official tab initially visible');
d.querySelector('#homeUpdateSiteTab').click();
ok(!d.querySelector('#homeUpdateSite').hidden&&d.querySelector('#homeUpdateOfficial').hidden,'site tab switch');
ok(d.querySelector('#homeUpdateSiteTab').getAttribute('aria-selected')==='true','selected ARIA');
d.querySelector('#homeUpdateSiteTab').dispatchEvent(new home.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
ok(!d.querySelector('#homeUpdateChampions').hidden,'keyboard tabs');
const allIds=[...d.querySelectorAll('[id]')].map(x=>x.id);
ok(new Set(allIds).size===allIds.length,'no duplicate homepage ids');
for(const el of d.querySelectorAll('.update-v115 [href],.update-v115 img')){
  const raw=el.getAttribute('href')||el.getAttribute('src');
  if(/^https?:/.test(raw))continue;
  const url=new URL(raw,home.window.location.href);
  ok(fs.existsSync(path.join(root,url.pathname)), 'update resource '+raw);
  if(url.searchParams.has('hero'))ok(heroes.some(h=>h.id===url.searchParams.get('hero')),'hero link '+raw);
}
home.window.close();
for(const h of heroes){
  const dom=page('pages/heroes.html','?hero='+h.id),w=dom.window;
  w.eval(get('assets/js/heroes.js'));await settle();
  const doc=w.document;
  ok(doc.querySelector('.hero-title-row h2')?.textContent===h.name,h.id+' title');
  ok(doc.querySelector('.hero-title-row .tier-badge-large')?.textContent===h.tier,h.id+' tier');
  ok(doc.querySelector('.hero-patch-review > summary')?.textContent.includes('7.3a'),h.id+' current review');
  ok(!doc.querySelector('.hero-patch-review')?.open,h.id+' review closed');
  ok(doc.querySelectorAll('.build-mini.missing').length===0,h.id+' no missing builds');
  ok(!doc.querySelector('#heroContent').textContent.includes('undefined'),h.id+' no undefined');
  for(const a of h.abilities)for(const r of a.patch73aValues||[])ok(doc.querySelector('.yone-skill-list').textContent.includes(r.value),h.id+' value '+r.value);
  if(h.baseId==='hwei')ok(doc.querySelector('.yone-skill-list img').getAttribute('src')===h.abilities[0].icon,'Hwei passive retained');
  dom.window.close();
}
const itemDom=page('pages/items.html','?item=wr73-8961');
itemDom.window.eval(get('assets/js/items-final.js'));await settle();
ok(itemDom.window.document.querySelector('#item-detail').textContent.includes('3300'),'item detail new price');
ok(itemDom.window.document.querySelector('#item-detail').textContent.includes('7.3a 官方調整'),'item comparison section');
itemDom.window.close();
const spellDom=page('pages/spells.html');
spellDom.window.eval(get('assets/js/spells-v21.js'));await settle();
spellDom.window.document.querySelector('[data-id="smite"]').click();
ok(spellDom.window.document.querySelector('#spell-detail').textContent.includes('22–162'),'smite detail');
spellDom.window.close();
ok(errors.length===0,'no DOM runtime errors');
console.log(JSON.stringify({scope:'DOM unit tests; no visual/mobile-browser verification',checks,failures,errors},null,2));
if(failures.length||errors.length)process.exitCode=1;
