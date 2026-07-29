let DATA={};
let current='keystone';
let selectedId=null;
const labels={keystone:'關鍵符文',conquest:'征服',precision:'精準',resolve:'意志',sorcery:'巫術'};
const normalizeSearch=value=>String(value||'').normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/[\s·・_.\-/]+/g,'');

function detailMarkup(x){
  if(!x)return '<div class="empty">選擇符文查看說明。</div>';
  return `<img src="${x.icon}" alt="${x.name}">
    <h2>${x.name}</h2>
    <div class="detail-meta rune-accent-${current}">${x.tag||labels[current]}</div>
    <div class="detail-description">${x.description||'待補資料'}</div>
    <div class="detail-chips"><span class="chip rune-chip-${current}">${labels[current]}</span></div>`;
}
function showDetail(x){
  if(!x)return;
  selectedId=x.id;
  document.querySelectorAll('.interactive-card').forEach(el=>{
    const active=el.dataset.id===x.id;
    el.classList.toggle('active',active);
    el.setAttribute('aria-selected',String(active));
  });
  ['#rune-detail','#mobile-rune-detail'].forEach(sel=>{
    const p=document.querySelector(sel);if(!p)return;
    p.innerHTML=detailMarkup(x);
  });
}
function clearDetails(message){
  ['#rune-detail','#mobile-rune-detail'].forEach(sel=>{const p=document.querySelector(sel);if(p)p.innerHTML=`<div class="empty">${message}</div>`;});
}
function card(x){
  return `<article class="rune-card interactive-card" role="button" tabindex="0" aria-selected="false" data-id="${x.id}">
    <div class="rune-card-head"><img src="${x.icon}" alt="${x.name}"><div><h3>${x.name}</h3><div class="meta">${x.tag||labels[current]}</div></div></div>
  </article>`;
}
function bind(){
  document.querySelectorAll('.interactive-card').forEach(el=>{
    const x=(DATA[current]||[]).find(r=>r.id===el.dataset.id);
    el.addEventListener('mouseenter',()=>showDetail(x));
    el.addEventListener('focus',()=>showDetail(x));
    el.addEventListener('click',()=>showDetail(x));
    el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();showDetail(x);}});
  });
}
function render(){
  const query=document.querySelector('#q').value.trim();
  const k=normalizeSearch(query);
  const source=(DATA[current]||[])
    .filter(x=>normalizeSearch(`${x.name}${x.tag||''}${x.description||''}`).includes(k))
    .sort((a,b)=>current==='keystone'
      ? ((a.order??999)-(b.order??999)||String(a.name||'').localeCompare(String(b.name||''),'zh-Hant'))
      : ((a.row??999)-(b.row??999)||((a.rowOrder??999)-(b.rowOrder??999))||String(a.name||'').localeCompare(String(b.name||''),'zh-Hant')));
  const target=document.querySelector('#rune-content');
  if(!source.length){
    const message='沒有符合條件的符文。';
    target.innerHTML=`<div class="empty">${message}</div>`;selectedId=null;clearDetails(message);return;
  }
  if(current==='keystone'){
    target.innerHTML=`<div class="keystone-grid">${source.map(card).join('')}</div>`;
  }else{
    const rows=[...new Set(source.map(x=>x.row))];
    target.innerHTML=rows.map(n=>{
      const entries=source.filter(x=>x.row===n);
      return `<div class="rune-row-block"><div class="rune-row-title">第 ${n} 列</div><div class="rune-row cols-${entries.length}">${entries.map(card).join('')}</div></div>`;
    }).join('');
  }
  bind();
  showDetail(source.find(x=>x.id===selectedId)||source[0]);
}
(async()=>{
  try{
    DATA=await getJSON('../assets/data/runes.json');
    document.querySelectorAll('.rune-tab').forEach(btn=>{
      btn.setAttribute('aria-pressed',String(btn.classList.contains('active')));
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.rune-tab').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');});
        btn.classList.add('active');btn.setAttribute('aria-pressed','true');current=btn.dataset.key;selectedId=null;render();
      });
    });
    document.querySelector('#q').addEventListener('input',render);
    render();
  }catch(error){console.error(error);document.querySelector('#rune-content').innerHTML='<div class="empty">符文資料載入失敗。</div>';}
})();
