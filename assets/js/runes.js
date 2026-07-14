
let DATA = {};
let current = "keystone";
const labels = {
  keystone: "關鍵符文",
  conquest: "征服",
  precision: "精準",
  resolve: "意志",
  sorcery: "巫術"
};

function runeCard(x){
  const status = x.status
    ? `<span class="chip ${x.status.includes("待") ? "status-wait" : "status-ok"}">${x.status}</span>`
    : "";
  return `<article class="rune-card">
    <div class="rune-card-head">
      <img src="${x.icon}" alt="${x.name}">
      <div>
        <h3>${x.name}</h3>
        <div class="meta">${x.tag || labels[current]}</div>
      </div>
    </div>
    <div class="desc">${x.description || "待補資料"}</div>
    <div class="chips">${status}</div>
  </article>`;
}

function render(){
  const keyword = document.querySelector("#q").value.trim().toLowerCase();
  const source = (DATA[current] || [])
    .filter(x => (x.name + (x.tag || "") + (x.description || "")).toLowerCase().includes(keyword))
    .sort((a,b)=>(a.row-b.row)||(a.rowOrder-b.rowOrder));

  const target = document.querySelector("#rune-content");
  if (!source.length){
    target.innerHTML = `<div class="empty">${current === "sorcery" ? "巫術符文素材尚未完成匯入。" : "目前沒有符合條件的資料。"}</div>`;
    return;
  }

  const rows = [...new Set(source.map(x=>x.row))];
  target.innerHTML = rows.map(rowNumber => {
    const entries = source.filter(x=>x.row===rowNumber);
    const cols = Math.min(Math.max(entries.length,3),5);
    const title = current === "keystone" ? `第 ${rowNumber} 排` : `第 ${rowNumber} 列`;
    return `<div class="rune-row-block">
      <div class="rune-row-title">${title}</div>
      <div class="rune-row cols-${cols}">${entries.map(runeCard).join("")}</div>
    </div>`;
  }).join("");
}

(async()=>{
  DATA = await getJSON("../assets/data/runes.json");
  document.querySelectorAll(".rune-tab").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".rune-tab").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      current = btn.dataset.key;
      render();
    });
  });
  document.querySelector("#q").addEventListener("input",render);
  render();
})();
