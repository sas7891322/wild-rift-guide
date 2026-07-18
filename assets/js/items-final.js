
let DATA={items:[]};
let category="物理";
let selectedId=null;
const stageOrder=["基本裝備","基本配置","中階","高階裝備","基礎鞋","二級鞋","三級鞋"];

function findItem(id){return DATA.items.find(x=>x.id===id)}
function categoriesOf(x){return Array.isArray(x.categories)?x.categories:[x.category].filter(Boolean)}
function stageOf(x){
  if(x.stage)return x.stage;
  if(x.category==="鞋子")return "鞋子";
  return "中階";
}
function priceText(x){return Number(x.price)>0?`${x.price} 金幣`:""}
function treeNode(id,cls=""){
  const x=findItem(id); if(!x)return "";
  return `<button class="build-node ${cls}" data-node="${x.id}"><img src="${x.icon}" alt="${x.name}"><span>${x.name}</span></button>`;
}
function buildTree(x){
  const from=x.buildFrom||[], upgrades=x.upgrades||[];
  if(!from.length&&!upgrades.length)return "";
  let h='<section class="build-tree"><h3>合成資訊</h3>';
  if(from.length)h+=`<div class="tree-level">${treeNode(x.id,"current")}</div><div class="tree-branch"></div><div class="tree-level tree-materials">${from.map(treeNode).join("")}</div>`;
  if(upgrades.length)h+=`<h3 class="upgrade-title">可升級</h3><div class="tree-level tree-materials">${upgrades.map(treeNode).join("")}</div>`;
  return h+"</section>";
}
function detailHTML(x){
  if(!x)return '<div class="empty">將滑鼠移到裝備上查看詳細資訊。</div>';
  const stats=(x.stats||[]).map(s=>`<li>${s}</li>`).join("");
  const passives=(x.passives||[]).filter(Boolean).map(p=>`<p>${p}</p>`).join("");
  return `<img src="${x.icon}" alt="${x.name}">
    <h2>${x.name}</h2>
    <div class="detail-meta">${stageOf(x)}</div>
    ${priceText(x)?`<div class="detail-price">${priceText(x)}</div>`:""}
    <ul class="item-stats">${stats}</ul>
    ${passives?`<div class="item-passives">${passives}</div>`:""}
    ${buildTree(x)}`;
}
function bindDetailNodes(panel){
  panel.querySelectorAll("[data-node]").forEach(el=>{
    const x=findItem(el.dataset.node);
    if(x){el.onmouseenter=()=>showDetail(x,false);el.onclick=()=>showDetail(x,false)}
  });
}
function showDetail(x,activate=true){
  selectedId=x.id;
  if(activate)document.querySelectorAll(".item-icon").forEach(el=>el.classList.toggle("active",el.dataset.id===x.id));
  ["#item-detail","#mobile-item-detail"].forEach(sel=>{
    const p=document.querySelector(sel); if(!p)return;
    p.innerHTML=detailHTML(x);bindDetailNodes(p);
  });
}
function card(x){
  return `<article class="item-icon interactive-icon" tabindex="0" data-id="${x.id}">
    <img src="${x.icon}" alt="${x.name}">
    <strong>${x.name}</strong>
    ${priceText(x)?`<span class="item-price">${x.price}</span>`:""}
  </article>`;
}
function render(){
  const q=document.querySelector("#item-search").value.trim().toLowerCase();
  const rows=DATA.items.filter(x=>categoriesOf(x).includes(category))
    .filter(x=>(x.name+(x.stats||[]).join("")+(x.passives||[]).join("")).toLowerCase().includes(q))
    .sort((a,b)=>(a.order||999)-(b.order||999));
  const target=document.querySelector("#item-content");
  if(!rows.length){target.innerHTML='<div class="empty">此分類目前尚未整理資料。</div>';return;}
  const stages=[...new Set(rows.map(stageOf))].sort((a,b)=>stageOrder.indexOf(a)-stageOrder.indexOf(b));
  target.innerHTML=stages.map(stage=>{
    const items=rows.filter(x=>stageOf(x)===stage);
    const title=stage==="中階"?"中階裝備":stage;
    return `<section class="item-stage-section"><h2>${title}</h2><div class="item-icon-grid">${items.map(card).join("")}</div></section>`;
  }).join("");
  document.querySelectorAll(".item-icon").forEach(el=>{
    const x=findItem(el.dataset.id);
    el.onmouseenter=()=>showDetail(x);
    el.onfocus=()=>showDetail(x);
    el.onclick=()=>showDetail(x);
  });
  showDetail(rows.find(x=>x.id===selectedId)||rows[0]);
}
(async()=>{
  DATA=await getJSON("../assets/data/items.json");
  document.querySelectorAll(".item-tab").forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll(".item-tab").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");category=btn.dataset.category;selectedId=null;render();
  });
  document.querySelector("#item-search").oninput=render;
  render();
})();
