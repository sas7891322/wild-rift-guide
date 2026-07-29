let SPELLS=[],selected=null;
const normalizeSearch=value=>String(value||'').normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/[\s·・_.\-/]+/g,'');
function detailMarkup(x){
  if(!x)return '<div class="empty">選擇召喚師技能查看說明。</div>';
  return `<img src="${x.icon}" alt="${x.name}">
  <h2>${x.name}</h2>
  <div class="detail-meta">${x.category}｜冷卻 ${x.cooldown} 秒</div>
  <div class="detail-description">${x.description}</div>
  <div class="detail-chips">${(x.maps||[]).map(m=>`<span class="chip">${m}</span>`).join('')}</div>`;
}
function show(x){
  if(!x)return;
  selected=x.id;
  document.querySelectorAll('.spell-icon').forEach(el=>{
    const active=el.dataset.id===x.id;
    el.classList.toggle('active',active);
    el.setAttribute('aria-selected',String(active));
  });
  ['#spell-detail','#mobile-spell-detail'].forEach(sel=>{const p=document.querySelector(sel);if(p)p.innerHTML=detailMarkup(x);});
}
function clearDetails(message){
  ['#spell-detail','#mobile-spell-detail'].forEach(sel=>{const p=document.querySelector(sel);if(p)p.innerHTML=`<div class="empty">${message}</div>`;});
}
function render(){
  const q=normalizeSearch(document.querySelector('#q').value.trim());
  const cat=document.querySelector('#cat').value;
  const rows=SPELLS
    .filter(x=>normalizeSearch(`${x.name}${x.description}${x.category}`).includes(q)&&(cat==='全部'||x.category===cat))
    .sort((a,b)=>((a.order??999)-(b.order??999))||String(a.name||'').localeCompare(String(b.name||''),'zh-Hant'));
  const target=document.querySelector('#spell-icons');
  if(!rows.length){
    const message='沒有符合條件的召喚師技能。';
    target.innerHTML=`<div class="empty">${message}</div>`;selected=null;clearDetails(message);return;
  }
  target.innerHTML=rows.map(x=>`<article class="spell-icon interactive-icon" role="button" tabindex="0" aria-selected="false" data-id="${x.id}">
    <img src="${x.icon}" alt="${x.name}"><strong>${x.name}</strong>
  </article>`).join('');
  document.querySelectorAll('.spell-icon').forEach(el=>{
    const x=SPELLS.find(s=>s.id===el.dataset.id);
    el.addEventListener('mouseenter',()=>show(x));
    el.addEventListener('focus',()=>show(x));
    el.addEventListener('click',()=>show(x));
    el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();show(x);}});
  });
  show(rows.find(x=>x.id===selected)||rows[0]);
}
(async()=>{
  try{
    SPELLS=await getJSON('../assets/data/spells.json');
    const cats=['全部',...new Set(SPELLS.map(x=>x.category))];
    document.querySelector('#cat').innerHTML=cats.map(x=>`<option value="${x}">${x}</option>`).join('');
    document.querySelector('#q').addEventListener('input',render);
    document.querySelector('#cat').addEventListener('change',render);
    render();
  }catch(error){console.error(error);document.querySelector('#spell-icons').innerHTML='<div class="empty">召喚師技能資料載入失敗。</div>';}
})();
