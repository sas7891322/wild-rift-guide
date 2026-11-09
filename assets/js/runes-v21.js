
let DATA = {};
let current = "keystone";
let selectedId = null;
const labels = {keystone:"關鍵符文",conquest:"征服",precision:"精準",resolve:"意志",sorcery:"巫術"};
const runeEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function runeIcon(x){return x.icon?`<img src="${x.icon}" alt="${x.name}">`:'<span class="rune-text-icon" aria-label="圖示待補">速</span>';}
function runePatchMarkup(patch){
  if(!patch) return '';
  return `<details class="rune-patch-change"><summary>7.3b 官方調整（展開）</summary>${patch.groups.map(group=>`<h3>${runeEscape(group.title)}</h3>${group.rows.map(row=>`<p>${runeEscape(row.label)}：${runeEscape(row.before)} → <strong>${runeEscape(row.after)}</strong></p>`).join('')}`).join('')}<p>${runeEscape(patch.note)}</p><p><a href="${runeEscape(patch.source)}" target="_blank" rel="noopener noreferrer">官方7.3b來源 ↗</a></p></details>`;
}
function detailMarkup(x){
  if(!x) return '<div class="empty">將滑鼠移到符文上，或點擊符文查看說明。</div>';
  return `${runeIcon(x)}`+`
    <h2>${x.name}</h2>
    <div class="detail-meta rune-accent-${current}">${x.tag || labels[current]}</div>
    <div class="detail-description">${Array.isArray(x.details) && x.details.length ? x.details.map(line=>`<p>${runeEscape(line)}</p>`).join('') : runeEscape(x.description || "待補資料")}</div>
    ${runePatchMarkup(x.patch73bChange)}
    <div class="detail-chips"><span class="chip rune-chip-${current}">${labels[current]}</span></div>`;
}
function showDetail(x){
  selectedId = x.id;
  document.querySelectorAll(".interactive-card").forEach(el=>el.classList.toggle("active",el.dataset.id===x.id));
  ["#rune-detail","#mobile-rune-detail"].forEach(sel=>{
    const p=document.querySelector(sel); if(!p) return;
    p.classList.add("is-changing");
    setTimeout(()=>{p.innerHTML=detailMarkup(x);p.classList.remove("is-changing")},90);
  });
}
function card(x){
  return `<article class="rune-card interactive-card" data-id="${x.id}">
    <div class="rune-card-head">${runeIcon(x)}
    <div><h3>${x.name}</h3><div class="meta">${x.tag || labels[current]}</div></div></div>
  </article>`;
}
function bind(){
  document.querySelectorAll(".interactive-card").forEach(el=>{
    const x=(DATA[current]||[]).find(r=>r.id===el.dataset.id);
    el.addEventListener("mouseenter",()=>showDetail(x));
    el.addEventListener("click",()=>showDetail(x));
  });
}
function render(){
  const k=document.querySelector("#q").value.trim().toLowerCase();
  const source=(DATA[current]||[]).filter(x=>x.available!==false).filter(x=>(x.name+(x.aliases||[]).join(' ')+(x.tag||"")+(x.description||"")).toLowerCase().includes(k));
  const target=document.querySelector("#rune-content");
  if(!source.length){target.innerHTML='<div class="empty">沒有符合條件的符文。</div>';return;}
  if(current==="keystone"){
    target.innerHTML=`<div class="keystone-grid">${[...source].sort((a,b)=>a.order-b.order).map(card).join("")}</div>`;
  }else{
    const ordered=[...source].sort((a,b)=>(a.row-b.row)||(a.rowOrder-b.rowOrder));
    const rows=[...new Set(ordered.map(x=>x.row))];
    target.innerHTML=rows.map(n=>{
      const entries=ordered.filter(x=>x.row===n);
      return `<div class="rune-row-block"><div class="rune-row-title">第 ${n} 列</div><div class="rune-row cols-${entries.length}">${entries.map(card).join("")}</div></div>`;
    }).join("");
  }
  bind();
  const initial=source.find(x=>x.id===selectedId)||source[0];
  showDetail(initial);
}
(async()=>{
  DATA=await getJSON("../assets/data/runes.json?v=123.0.0");
  document.querySelectorAll(".rune-tab").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".rune-tab").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active"); current=btn.dataset.key; selectedId=null; render();
  }));
  document.querySelector("#q").addEventListener("input",render);
  render();
})();
