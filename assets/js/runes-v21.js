
let DATA = {};
let current = "keystone";
let selectedId = null;
const labels = {keystone:"關鍵符文",conquest:"征服",precision:"精準",resolve:"意志",sorcery:"巫術"};

function detailMarkup(x){
  if(!x) return '<div class="empty">將滑鼠移到符文上，或點擊符文查看說明。</div>';
  return `<img src="${x.icon}" alt="${x.name}">
    <h2>${x.name}</h2>
    <div class="detail-meta">${x.tag || labels[current]}</div>
    <div class="detail-description">${x.description || "待補資料"}</div>
    <div class="detail-chips"><span class="chip">${labels[current]}</span></div>`;
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
    <div class="rune-card-head"><img src="${x.icon}" alt="${x.name}">
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
  const source=(DATA[current]||[]).filter(x=>(x.name+(x.tag||"")+(x.description||"")).toLowerCase().includes(k));
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
  DATA=await getJSON("../assets/data/runes.json");
  document.querySelectorAll(".rune-tab").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".rune-tab").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active"); current=btn.dataset.key; selectedId=null; render();
  }));
  document.querySelector("#q").addEventListener("input",render);
  render();
})();
