
let ITEM_DATA={items:[],materials:[]};
let selectedId=null;
let currentCategory="鞋子";
let currentStage="all";

function allNodes(){
  return [...(ITEM_DATA.items||[]),...(ITEM_DATA.materials||[])];
}
function findNode(id){return allNodes().find(x=>x.id===id)}
function nodeCategories(x){
  if(Array.isArray(x.categories))return x.categories;
  return x.category?[x.category]:[];
}
function stageLabel(x){
  if(x.stage)return x.stage;
  if(x.category==="鞋子" && typeof x.tier==="number")return `${x.tier}級鞋`;
  return "裝備";
}
function treeNode(id, cls=""){
  const x=findNode(id); if(!x)return "";
  return `<button class="build-node ${cls}" data-node="${x.id}">
    <img src="${x.icon}" alt="${x.name}"><span>${x.name}</span>
  </button>`;
}
function buildTree(x){
  const from=x.buildFrom||[];
  const upgrades=x.upgrades||[];
  if(!from.length && !upgrades.length)return "";
  let html=`<section class="build-tree"><h3>合成公式</h3>`;
  if(x.category==="鞋子" && x.tier===3 && from.length){
    const parent=findNode(from[0]);
    const base=(parent?.buildFrom||[]);
    html+=`<div class="tree-level">${treeNode(x.id,"current")}</div><div class="tree-line"></div>`;
    if(parent)html+=`<div class="tree-level">${treeNode(parent.id)}</div>`;
    if(base.length)html+=`<div class="tree-branch"></div><div class="tree-level tree-materials">${base.map(id=>treeNode(id)).join("")}</div>`;
  }else if(from.length){
    html+=`<div class="tree-level">${treeNode(x.id,"current")}</div><div class="tree-branch"></div>
      <div class="tree-level tree-materials">${from.map(id=>treeNode(id)).join("")}</div>`;
  }else{
    html+=`<div class="tree-level">${treeNode(x.id,"current")}</div>`;
  }
  if(upgrades.length){
    html+=`<h3 class="upgrade-title">可升級</h3><div class="tree-level tree-materials">${upgrades.map(id=>treeNode(id)).join("")}</div>`;
  }
  return html+`</section>`;
}
function detailMarkup(x){
  if(!x)return '<div class="empty">將滑鼠移到裝備上，手機請點擊裝備，即可在這裡查看詳細資料。</div>';
  const stats=(x.stats||[]).map(s=>`<li>${s}</li>`).join("");
  const passives=(x.passives||[]).filter(Boolean).map(p=>`<p>${p}</p>`).join("");
  const cats=nodeCategories(x).join("・");
  const price=Number(x.price)>0?`<div class="detail-price">${x.price} 金幣</div>`:"";
  return `<img src="${x.icon}" alt="${x.name}">
    <h2>${x.name}</h2>
    <div class="detail-meta">${stageLabel(x)}</div>
    <div class="detail-categories">${cats}</div>
    ${price}
    <ul class="item-stats">${stats}</ul>
    ${passives?`<div class="item-passives">${passives}</div>`:""}
    ${buildTree(x)}`;
}
function bindTree(panel){
  panel.querySelectorAll("[data-node]").forEach(btn=>{
    const x=findNode(btn.dataset.node);
    if(!x)return;
    btn.addEventListener("mouseenter",()=>showDetail(x,false));
    btn.addEventListener("click",()=>showDetail(x,false));
  });
}
function showDetail(x,activate=true){
  if(!x)return;
  selectedId=x.id;
  if(activate){
    document.querySelectorAll(".item-icon").forEach(el=>{
      el.classList.toggle("active",el.dataset.id===x.id);
    });
  }
  ["#item-detail","#mobile-item-detail"].forEach(sel=>{
    const panel=document.querySelector(sel); if(!panel)return;
    panel.classList.add("is-changing");
    setTimeout(()=>{
      panel.innerHTML=detailMarkup(x);
      panel.classList.remove("is-changing");
      bindTree(panel);
    },60);
  });
}
function matchesCategory(x){
  const cats=nodeCategories(x);
  if(currentCategory==="全部")return true;
  if(currentCategory==="鞋子")return cats.includes("鞋子") || x.category==="鞋子";
  return cats.includes(currentCategory);
}
function matchesStage(x){
  if(currentStage==="all")return true;
  if(currentStage==="basic")return x.stage==="基本";
  if(currentStage==="intermediate")return x.stage==="中階";
  if(currentStage==="shoes")return x.stage==="鞋子";
  if(currentStage==="advanced")return x.stage==="高階";
  return true;
}
function render(){
  const q=(document.querySelector("#item-search")?.value||"").trim().toLowerCase();
  let rows=allNodes().filter(matchesCategory).filter(matchesStage);
  rows=rows.filter(x=>(x.name+(x.stats||[]).join("")+(x.passives||[]).join("")).toLowerCase().includes(q));
  rows.sort((a,b)=>(a.order||999)-(b.order||999));
  const target=document.querySelector("#item-grid");
  target.innerHTML=rows.length?rows.map(x=>`<article class="item-icon interactive-icon" data-id="${x.id}">
    <img src="${x.icon}" alt="${x.name}">
    <strong>${x.name}</strong>
    <small>${stageLabel(x)}</small>
    ${Number(x.price)>0?`<span class="item-price">${x.price}</span>`:""}
  </article>`).join(""):'<div class="empty">此分類或階級目前尚未整理資料。</div>';
  target.querySelectorAll(".item-icon").forEach(el=>{
    const x=findNode(el.dataset.id);
    el.addEventListener("mouseenter",()=>showDetail(x));
    el.addEventListener("focus",()=>showDetail(x));
    el.addEventListener("click",()=>showDetail(x));
  });
  const first=rows.find(x=>x.id===selectedId)||rows[0];
  if(first)showDetail(first);
  else{
    document.querySelector("#item-detail").innerHTML='<div class="empty">此分類目前尚未整理資料。</div>';
    document.querySelector("#mobile-item-detail").innerHTML='';
  }
}
(async()=>{
  ITEM_DATA=await getJSON("../assets/data/items.json");
  document.querySelectorAll(".item-tab").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".item-tab").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    currentCategory=btn.dataset.category;
    selectedId=null;
    render();
  }));
  document.querySelectorAll(".equipment-stage").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".equipment-stage").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    currentStage=btn.dataset.stage;
    selectedId=null;
    render();
  }));
  document.querySelector("#item-search").addEventListener("input",render);
  render();
})();
