
let SPELLS=[], selected=null;
function detailMarkup(x){
  if(!x)return '<div class="empty">將滑鼠移到技能上，或點擊技能查看說明。</div>';
  return `<img src="${x.icon}" alt="${x.name}">
  <h2>${x.name}</h2>
  <div class="detail-meta">${x.category}｜冷卻 ${x.cooldown} 秒</div>
  <div class="detail-description">${x.descriptionHtml || x.description}</div>
  <div class="detail-chips">${(x.maps||[]).map(m=>`<span class="chip">${m}</span>`).join("")}</div>`;
}
function show(x){
  selected=x.id;
  document.querySelectorAll(".spell-icon").forEach(el=>el.classList.toggle("active",el.dataset.id===x.id));
  ["#spell-detail","#mobile-spell-detail"].forEach(sel=>{
    const p=document.querySelector(sel);p.classList.add("is-changing");
    setTimeout(()=>{p.innerHTML=detailMarkup(x);p.classList.remove("is-changing")},90);
  });
}
function render(){
  const q=document.querySelector("#q").value.trim().toLowerCase();
  const cat=document.querySelector("#cat").value;
  const rows=SPELLS.filter(x=>(x.name+x.description+x.category).toLowerCase().includes(q)&&(cat==="全部"||x.category===cat));
  const target=document.querySelector("#spell-icons");
  target.innerHTML=rows.length?rows.map(x=>`<article class="spell-icon interactive-icon" data-id="${x.id}">
    <img src="${x.icon}" alt="${x.name}"><strong>${x.name}</strong>
  </article>`).join(""):'<div class="empty">沒有符合條件的召喚師技能。</div>';
  document.querySelectorAll(".spell-icon").forEach(el=>{
    const x=SPELLS.find(s=>s.id===el.dataset.id);
    el.addEventListener("mouseenter",()=>show(x));el.addEventListener("click",()=>show(x));
  });
  const first=rows.find(x=>x.id===selected)||rows[0];if(first)show(first);
}
(async()=>{
  SPELLS=await getJSON("../assets/data/spells.json");
  const cats=["全部",...new Set(SPELLS.map(x=>x.category))];
  document.querySelector("#cat").innerHTML=cats.map(x=>`<option value="${x}">${x}</option>`).join("");
  document.querySelector("#q").addEventListener("input",render);
  document.querySelector("#cat").addEventListener("change",render);
  render();
})();
