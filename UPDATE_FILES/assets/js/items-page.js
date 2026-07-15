
const labels={physical:"物理",magic:"魔法",defense:"防禦",support:"輔助"};
let data,active="physical",query="";
const $=s=>document.querySelector(s);
fetch("../assets/data/items.json").then(r=>r.json()).then(j=>{data=j;init()});
function init(){
  $("#counts").innerHTML=Object.entries(data.counts).map(([k,v])=>`<div class="count"><strong>${v}</strong><span>${labels[k]}</span></div>`).join("");
  $("#tabs").innerHTML=Object.keys(data.categories).map(k=>`<button class="tab ${k===active?"active":""}" data-tab="${k}">${labels[k]} ${data.counts[k]}</button>`).join("");
  $("#tabs").onclick=e=>{const b=e.target.closest("[data-tab]");if(!b)return;active=b.dataset.tab;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));render()};
  $("#search").oninput=e=>{query=e.target.value.trim().toLowerCase();render()};
  document.querySelectorAll("[data-close]").forEach(x=>x.onclick=closeModal);
  render();
}
function render(){
  const items=data.categories[active].filter(i=>`${i.name} ${i.stats.join(" ")} ${i.description}`.toLowerCase().includes(query));
  $("#grid").innerHTML=items.length?items.map((i,n)=>`<button class="item-card" data-index="${data.categories[active].indexOf(i)}"><img src="../${i.icon}" alt="${i.name}"><h3>${i.name}</h3><div class="price">${i.price} 金幣</div><div class="mini-stats">${i.stats.slice(0,3).join("<br>")}</div></button>`).join(""):`<div class="empty">找不到符合條件的裝備。</div>`;
  $("#grid").onclick=e=>{const c=e.target.closest("[data-index]");if(c)openModal(data.categories[active][+c.dataset.index])};
}
function openModal(i){
  $("#detailIcon").src="../"+i.icon;$("#detailIcon").alt=i.name;$("#detailCategory").textContent=labels[active]+"・中階";
  $("#detailName").textContent=i.name;$("#detailPrice").textContent=i.price+" 金幣";
  $("#detailStats").innerHTML=i.stats.map(s=>`<li>${s}</li>`).join("");
  $("#detailDesc").textContent=i.description||"此裝備沒有額外被動說明。";
  $("#modal").classList.add("open");$("#modal").setAttribute("aria-hidden","false");
}
function closeModal(){$("#modal").classList.remove("open");$("#modal").setAttribute("aria-hidden","true")}
