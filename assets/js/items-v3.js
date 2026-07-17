
let ITEM_DATA={items:[],materials:[]};
let selectedId=null, currentTier="all", currentCategory="鞋子";

function allNodes(){
  return [...ITEM_DATA.items,...ITEM_DATA.materials.map(x=>({...x,category:"材料",tier:0,passives:[],buildFrom:[],upgrades:[]}))];
}
function findNode(id){return allNodes().find(x=>x.id===id)}

function treeNode(id, cls=""){
  const x=findNode(id); if(!x)return "";
  return `<button class="build-node ${cls}" data-node="${x.id}">
    <img src="${x.icon}" alt="${x.name}"><span>${x.name}</span>
  </button>`;
}
function buildTree(x){
  const from=x.buildFrom||[];
  const upgrades=x.upgrades||[];
  let html=`<section class="build-tree"><h3>合成樹</h3>`;
  if(x.tier===3 && from.length){
    const parent=findNode(from[0]);
    const base=(parent?.buildFrom||[]);
    html+=`<div class="tree-level">${treeNode(x.id,"current")}</div><div class="tree-line"></div>
      <div class="tree-level">${treeNode(parent.id)}</div>`;
    if(base.length){
      html+=`<div class="tree-branch"></div><div class="tree-level tree-materials">${base.map(id=>treeNode(id)).join("")}</div>`;
    }
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
  if(!x)return '<div class="empty">將滑鼠移到鞋子上，或點擊鞋子查看詳細資料。</div>';
  const stats=(x.stats||[]).map(s=>`<li>${s}</li>`).join("");
  const passives=(x.passives||[]).map(p=>`<p>${p}</p>`).join("");
  const tier=x.tier?`${x.tier} 級鞋`:"合成材料";
  return `<img src="${x.icon}" alt="${x.name}">
  <h2>${x.name}</h2>
  <div class="detail-meta">${tier}</div>
  <ul class="item-stats">${stats}</ul>
  ${passives?`<div class="item-passives">${passives}</div>`:""}
  ${buildTree(x)}`;
}
function bindTree(panel){
  panel.querySelectorAll("[data-node]").forEach(btn=>{
    const x=findNode(btn.dataset.node);
    btn.addEventListener("mouseenter",()=>showDetail(x,false));
    btn.addEventListener("click",()=>showDetail(x,false));
  });
}
function showDetail(x, activate=true){
  selectedId=x.id;
  if(activate)document.querySelectorAll(".item-icon").forEach(el=>el.classList.toggle("active",el.dataset.id===x.id));
  ["#item-detail","#mobile-item-detail"].forEach(sel=>{
    const p=document.querySelector(sel); if(!p)return;
    p.classList.add("is-changing");
    setTimeout(()=>{p.innerHTML=detailMarkup(x);p.classList.remove("is-changing");bindTree(p)},80);
  });
}
function render(){
  const q=document.querySelector("#item-search").value.trim().toLowerCase();
  let rows=ITEM_DATA.items.filter(x=>x.category===currentCategory);
  if(currentTier!=="all")rows=rows.filter(x=>String(x.tier)===currentTier);
  rows=rows.filter(x=>(x.name+(x.stats||[]).join("")+(x.passives||[]).join("")).toLowerCase().includes(q));
  rows.sort((a,b)=>a.order-b.order);
  const target=document.querySelector("#item-grid");
  target.innerHTML=rows.length?rows.map(x=>`<article class="item-icon interactive-icon" data-id="${x.id}">
    <img src="${x.icon}" alt="${x.name}"><strong>${x.name}</strong><small>${x.tier}級鞋</small>
  </article>`).join(""):'<div class="empty">此分類目前尚未整理。</div>';
  document.querySelectorAll(".item-icon").forEach(el=>{
    const x=findNode(el.dataset.id);
    el.addEventListener("mouseenter",()=>showDetail(x));
    el.addEventListener("click",()=>showDetail(x));
  });
  const first=rows.find(x=>x.id===selectedId)||rows[0];
  if(first)showDetail(first);
}
(async()=>{
  ITEM_DATA=await getJSON("../assets/data/items.json");
  document.querySelectorAll(".item-tab").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".item-tab").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");currentCategory=btn.dataset.category;
    if(currentCategory!=="鞋子"){
      document.querySelector("#item-grid").innerHTML='<div class="empty">此裝備分類尚未開始整理。</div>';
      document.querySelector("#item-detail").innerHTML='<div class="empty">目前先完成鞋子資料。</div>';
      document.querySelector("#mobile-item-detail").innerHTML='';
      return;
    }
    render();
  }));
  document.querySelectorAll(".shoe-level").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".shoe-level").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");currentTier=btn.dataset.tier;selectedId=null;render();
  }));
  document.querySelector("#item-search").addEventListener("input",render);
  render();
})();
