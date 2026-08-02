(async()=>{
  const root=document.querySelector('[data-aram-tier-root]');
  const state=document.querySelector('[data-aram-data-state]');
  if(!root)return;
  try{
    const res=await fetch('assets/data/aram/heroes.json?v=79.7.0',{cache:'no-store'});
    if(!res.ok)throw new Error('ARAM data load failed');
    const data=await res.json();
    const heroes=Array.isArray(data.heroes)?data.heroes:[];
    const order=Array.isArray(data.tierOrder)?data.tierOrder:['S+','S','A','B'];
    if(state)state.textContent=`${data.gameVersion}｜已建立 ${heroes.length} 位英雄母版`;
    root.innerHTML=order.map(tier=>{
      const list=heroes.filter(hero=>hero.tier===tier);
      return `<section class="aram-tier-row" data-tier="${tier}">
        <div class="aram-tier-badge"><strong>${tier}</strong><span>${tier==='S+'?'頂級強勢':tier==='S'?'強勢推薦':tier==='A'?'穩定可選':'情境選擇'}</span></div>
        <div class="aram-tier-heroes">${list.length?list.map(hero=>`<a class="aram-hero-card" href="aram-hero.html?id=${encodeURIComponent(hero.id)}">
          <img src="${hero.avatar}" alt="${hero.name}" loading="lazy"/>
          <div><strong>${hero.name}</strong><span>${hero.enName}</span><small>${hero.position}</small></div>
          <em>查看攻略 →</em>
        </a>`).join(''):'<div class="aram-tier-empty">尚未加入英雄</div>'}</div>
      </section>`;
    }).join('');
  }catch(err){
    console.error(err);
    if(state)state.textContent='ARAM 資料載入失敗';
    root.innerHTML='<div class="aram-tier-load-error">目前無法載入 ARAM 英雄資料，請稍後再試。</div>';
  }
})();
