(async()=>{
  const root=document.querySelector('[data-aram-hero-root]');
  if(!root)return;
  const esc=(value)=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const params=new URLSearchParams(location.search);
  const id=params.get('id')||'jinx';
  document.body.classList.add('aram-mobile-master');
  try{
    const res=await fetch('assets/data/aram/heroes.json?v=80.0.1',{cache:'no-store'});
    if(!res.ok)throw new Error('ARAM data load failed');
    const data=await res.json();
    const hero=(data.heroes||[]).find(item=>item.id===id);
    if(!hero)throw new Error('Hero not found');
    document.title=`${hero.name} ARAM 出裝、符文與攻略｜Wild Rift Guide`;
    const meta=document.querySelector('meta[name="description"]');
    if(meta)meta.setAttribute('content',`${hero.name} Wild Rift 7.2b 隨機單中 ARAM 攻略：Tier、出裝、符文、模式平衡與玩法重點。`);
    const pills=(hero.tags||[]).map(tag=>`<span>${esc(tag)}</span>`).join('');
    const itemCards=(hero.items||[]).map((item,index)=>`<article class="aram-loadout-card">
      <div class="aram-loadout-index">${index+1}</div><img src="${esc(item.icon)}" alt="${esc(item.name)}"/><div><strong>${esc(item.name)}</strong><p>${esc(item.reason)}</p></div>
    </article>`).join('');
    const runeCards=(hero.runes||[]).map((rune,index)=>`<article class="aram-rune-card ${index===0?'keystone':''}">
      <img src="${esc(rune.icon)}" alt="${esc(rune.name)}"/><div><strong>${esc(rune.name)}</strong><p>${esc(rune.reason)}</p></div>
    </article>`).join('');
    const bootCards=(hero.boots||[]).map((boot,index)=>`<article class="aram-compact-card"><span class="aram-step-label">${index===0?'鞋子':'升級'}</span><img src="${esc(boot.icon)}" alt="${esc(boot.name)}"/><div><strong>${esc(boot.name)}</strong><p>${esc(boot.reason)}</p></div></article>`).join('');
    const spellCards=(hero.spells||[]).map(spell=>`<article class="aram-compact-card"><img src="${esc(spell.icon)}" alt="${esc(spell.name)}"/><div><strong>${esc(spell.name)}</strong><p>${esc(spell.reason)}</p></div></article>`).join('');
    const situational=(hero.situationalItems||[]).map(item=>`<article class="aram-situational-card"><img src="${esc(item.icon)}" alt="${esc(item.name)}"/><div><strong>${esc(item.name)}</strong><span>${esc(item.when)}</span><p>${esc(item.reason)}</p></div></article>`).join('');
    const playstyleEntries=Object.entries(hero.playstyle||{});
    const playstyle=playstyleEntries.map(([phase,text])=>`<article><span>${esc(phase)}</span><p>${esc(text)}</p></article>`).join('');
    const playstyleMobile=playstyleEntries.map(([phase,text],index)=>`<details class="aram-playstyle-mobile-item" ${index===0?'open':''}><summary><span>${esc(phase)}</span><b>查看重點</b></summary><p>${esc(text)}</p></details>`).join('');
    const sourceLinks=(hero.sources||[]).map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a>`).join('');
    root.innerHTML=`
      <section class="aram-detail-hero">
        <div class="aram-detail-portrait"><img src="${esc(hero.avatar)}" alt="${esc(hero.name)}"/></div>
        <div class="aram-detail-copy">
          <div class="aram-detail-kicker">ARAM HERO GUIDE · PATCH ${esc(data.gameVersion)}</div>
          <div class="aram-detail-titleline"><div><h1>${esc(hero.name)}</h1><span>${esc(hero.enName)}</span></div><div class="aram-detail-tier"><strong>${esc(hero.tier)}</strong><span>${esc(hero.tierLabel)}</span></div></div>
          <p class="aram-detail-position">${esc(hero.position)}</p><div class="aram-detail-tags">${pills}</div>
          <p class="aram-detail-summary">${esc(hero.summary)}</p>
          <div class="aram-tier-reason"><strong>為什麼是 ${esc(hero.tier)}？</strong><span>${esc(hero.tierReason)}</span></div>
        </div>
      </section>
      <section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>ARAM BALANCE</span><h2>模式平衡修正</h2></div><small>7.2b 基準</small></div>
        <div class="aram-balance-grid"><article><span>造成傷害</span><strong>${esc(hero.balance.damageDealt)}</strong></article><article><span>承受傷害</span><strong>${esc(hero.balance.damageTaken)}</strong></article><article><span>治療效果</span><strong>${esc(hero.balance.healing)}</strong></article><article><span>護盾效果</span><strong>${esc(hero.balance.shielding)}</strong></article></div>
        <p class="aram-detail-note">${esc(hero.balance.note)}</p>
      </section>
      <section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>BUILD</span><h2>推薦出裝</h2></div><small>核心 5 件</small></div>
        <div class="aram-starter-row"><strong>開局</strong>${(hero.starterItems||[]).map(item=>`<span><img src="${esc(item.icon)}" alt="${esc(item.name)}"/>${esc(item.name)}</span>`).join('')}<p>${esc((hero.starterItems||[])[0]?.reason||'')}</p></div>
        <div class="aram-loadout-grid">${itemCards}</div>
        <div class="aram-subgrid"><div><h3>鞋子</h3>${bootCards}</div><div><h3>召喚師技能</h3>${spellCards}</div></div>
      </section>
      <section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>RUNES</span><h2>推薦符文</h2></div><small>ARAM 專用配置</small></div>
        <div class="aram-rune-grid">${runeCards}</div>
      </section>
      <section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>SKILL ORDER</span><h2>技能升級</h2></div><small>${esc(hero.skillOrder)}</small></div>
        <div class="aram-skill-order"><div class="aram-skill-icons">${(hero.skillIcons||[]).map((src,index)=>`${index?'<b>→</b>':''}<img src="${esc(src)}" alt="技能順位 ${index+1}"/>`).join('')}</div><p>${esc(hero.skillNote)}</p></div>
      </section>
      <section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>GAME PLAN</span><h2>ARAM 玩法重點</h2></div></div>
        <div class="aram-playstyle-grid">${playstyle}</div><div class="aram-playstyle-mobile">${playstyleMobile}</div>
      </section>
      <section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>SITUATIONAL</span><h2>情境裝備</h2></div><small>依敵方陣容替換</small></div>
        <div class="aram-situational-grid">${situational}</div>
      </section>
      <section class="aram-source-panel"><strong>資料說明</strong><p>${esc(hero.sourceNote)}</p><div>${sourceLinks}</div></section>`;
  }catch(err){
    console.error(err);
    root.innerHTML='<section class="aram-detail-error"><h1>找不到這位 ARAM 英雄</h1><p>目前母版資料可能尚未建立。</p><a href="aram.html">← 回 ARAM 專區</a></section>';
  }
})();
