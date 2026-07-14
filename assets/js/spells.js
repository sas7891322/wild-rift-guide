
(async()=>{
 const data=await getJSON('../assets/data/spells.json');
 const q=document.querySelector('#q'), cat=document.querySelector('#cat'), target=document.querySelector('#cards');
 const cats=['全部',...new Set(data.map(x=>x.category))];cat.innerHTML=cats.map(x=>`<option>${x}</option>`).join('');
 function render(){const k=q.value.trim().toLowerCase(),c=cat.value;const rows=data.filter(x=>(x.name+x.description+x.category).toLowerCase().includes(k)&&(c==='全部'||x.category===c));document.querySelector('#count').textContent=rows.length;target.innerHTML=rows.map(x=>`<article class="card"><img src="${x.icon}" alt="${x.name}"><div><h3>${x.name}</h3><div class="meta">${x.category}｜冷卻 ${x.cooldown} 秒</div><div class="desc">${x.description}</div><div class="chips">${x.maps.map(m=>`<span class="chip">${m}</span>`).join('')}</div></div></article>`).join('');}
 q.oninput=render;cat.onchange=render;render();
})();
