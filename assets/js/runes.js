
let DATA={}, current='keystone';
const labels={keystone:'關鍵符文',conquest:'征服',precision:'精準',resolve:'意志',sorcery:'巫術'};
function render(){
 const q=document.querySelector('#q').value.trim().toLowerCase();
 const rows=(DATA[current]||[]).filter(x=>(x.name+x.tag+x.description).toLowerCase().includes(q));
 const target=document.querySelector('#cards');
 target.innerHTML=rows.length?rows.map(x=>`<article class="card"><img src="${x.icon}" alt="${x.name}"><div><h3>${x.name}</h3><div class="meta">${x.tag||labels[current]}</div><div class="desc">${x.description||'待補資料'}</div><div class="chips"><span class="chip">${labels[current]}</span>${x.status?`<span class="chip ${x.status.includes('待')?'status-wait':'status-ok'}">${x.status}</span>`:''}</div></div></article>`).join(''):`<div class="empty">目前沒有符合條件的資料。</div>`;
 document.querySelector('#count').textContent=rows.length;
}
(async()=>{
 DATA=await getJSON('../assets/data/runes.json');
 document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');current=b.dataset.key;render();});
 document.querySelector('#q').addEventListener('input',render);render();
})();
