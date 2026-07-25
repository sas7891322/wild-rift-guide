(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const star = n => '★'.repeat(n) + '☆'.repeat(5-n);
  const roleNames = {baron:'巴龍路', jungle:'打野', mid:'中路', duo:'飛龍路', support:'輔助'};
  const tierOrder = ['S+','S','A','B'];

  const state = { role:'duo', heroId:'', heroes:[], runes:[], items:[], spells:[] };

  function flattenRunes(data){ return Object.values(data || {}).flatMap(v => Array.isArray(v) ? v : []); }
  function normalizeItems(data){ return Array.isArray(data) ? data : (data?.items || []); }
  function byId(arr,id){ return arr.find(x=>x.id===id); }
  function safeIcon(x){ return x?.icon || ''; }
  function safeText(x){ return x || ''; }

  function buildMiniCard(x, type='item'){
    if(!x) return '<div class="build-mini missing">資料待補</div>';
    return `<div class="build-mini ${type}"><img src="${safeIcon(x)}" alt="${x.name}" loading="lazy"><span>${x.name}</span></div>`;
  }

  function roleHeroes(){ return state.heroes.filter(h=>h.roleId===state.role); }

  function syncUrl(){
    const p = new URLSearchParams(location.search);
    p.set('role', state.role);
    if(state.heroId) p.set('hero', state.heroId); else p.delete('hero');
    history.replaceState(null,'',`${location.pathname}?${p.toString()}`);
  }

  function renderRoleTabs(){
    $$('.hero-role-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.role===state.role));
  }

  function renderOverview(){
    const heroes = roleHeroes();
    const title = roleNames[state.role] || '英雄';
    const content = $('#heroContent');
    const groups = tierOrder.map(tier => {
      const members = heroes.filter(h=>h.tier===tier);
      if(!members.length) return '';
      return `<section class="tier-overview-section">
        <div class="tier-overview-heading"><span class="tier-overview-badge tier-${tier.toLowerCase().replace('+','p')}">${tier}</span><strong>${tier} Tier</strong><small>${members.length} 位英雄</small></div>
        <div class="tier-hero-grid">
          ${members.map(h=>`<button class="tier-hero-card" data-hero="${h.id}">
            <span class="tier-hero-avatar-wrap">${h.avatar?`<img src="${h.avatar}" alt="${h.name}" class="tier-hero-avatar" loading="lazy">`:`<span class="tier-hero-placeholder">${h.name.slice(0,1)}</span>`}</span>
            <strong>${h.name}</strong><small>${h.enName}</small>
          </button>`).join('')}
        </div>
      </section>`;
    }).join('');

    content.innerHTML = `<section class="hero-overview-shell">
      <div class="hero-overview-head"><div><span class="eyebrow">${state.role==='duo'?'DRAGON LANE':title.toUpperCase()}</span><h2>${title} Tier 總覽</h2><p>先看版本分級，再點英雄頭像進入完整資料。</p></div><span class="hero-overview-count">${heroes.length}</span></div>
      ${groups || `<div class="hero-profile-empty">${title}尚未匯入英雄資料。</div>`}
    </section>`;

    $$('.tier-hero-card', content).forEach(btn=>btn.addEventListener('click',()=>{
      state.heroId=btn.dataset.hero; syncUrl(); renderDetail();
    }));
  }

  function renderRatings(hero){
    return Object.entries(hero.ratings).map(([name,n])=>`<div class="hero-rating"><div class="rating-label"><span>${name}</span><strong>${n}/5</strong></div><div class="rating-stars">${star(n)}</div><div class="rating-bar"><i style="width:${n*20}%"></i></div></div>`).join('');
  }

  function renderSkillGrid(hero){
    const abilities = Object.fromEntries((hero.abilities||[]).filter(a=>['Q','W','E','R'].includes(a.key)).map(a=>[a.key,a]));
    const sequence = hero.skillSequence || [];
    const levels = Array.from({length:15},(_,i)=>i+1);
    const rows = ['Q','W','E','R'].map(key=>{
      const a=abilities[key]||{};
      return `<div class="skill-grid-row">
        <div class="skill-grid-skill"><img src="${safeIcon(a)}" alt="${safeText(a.label)}"><div><b>${safeText(a.label)||key}</b><small>${safeText(a.title)}</small></div></div>
        ${levels.map((lvl,i)=>`<div class="skill-grid-cell ${sequence[i]===key?'active':''}" aria-label="等級 ${lvl}${sequence[i]===key?' 點 '+key:''}">${sequence[i]===key?'<span>●</span>':''}</div>`).join('')}
      </div>`;
    }).join('');
    return `<div class="skill-level-grid"><div class="skill-grid-row skill-grid-header"><div class="skill-grid-skill label">技能</div>${levels.map(x=>`<div class="skill-grid-cell">${x}</div>`).join('')}</div>${rows}</div>`;
  }

  function renderDetail(){
    const hero=state.heroes.find(h=>h.id===state.heroId);
    if(!hero){ state.heroId=''; syncUrl(); renderOverview(); return; }
    const runes=hero.runes.map(id=>byId(state.runes,id));
    const items=hero.items.map(id=>byId(state.items,id));
    const boots=hero.boots.map(id=>byId(state.items,id));
    const spells=hero.spells.map(id=>byId(state.spells,id));
    const tags=hero.tags.map(t=>`<span>${t}</span>`).join('');
    const runeHTML=runes.map((x,i)=>`<div class="hero-rune-card ${i===0?'keystone':''}">${x?`<img src="${safeIcon(x)}" alt="${x.name}"><div><small>${i===0?'關鍵符文':'副符文'}</small><strong>${x.name}</strong><p>${x.tag||''}</p></div>`:'<span>資料待補</span>'}</div>`).join('');
    const itemHTML=items.map((x,i)=>`<div class="hero-build-slot"><b>${i+1}</b>${buildMiniCard(x)}</div>`).join('');
    const bootHTML=boots.map((x,i)=>`<div class="hero-build-slot boot"><b>${i===0?'II':'III'}</b>${buildMiniCard(x,'boot')}</div>`).join('<div class="build-arrow">→</div>');
    const spellHTML=spells.map(x=>buildMiniCard(x,'spell')).join('');
    const abilities = Array.isArray(hero.abilities) ? hero.abilities : [];
    const passive = abilities.find(x=>x.key==='P');
    const activeAbilities = abilities.filter(x=>x.key!=='P');
    const abilityHTML = activeAbilities.map(x=>`<div class="ability-card ability-${(x.key||'').toLowerCase()}"><div class="ability-head"><img src="${safeIcon(x)}" alt="${x.label || x.title || hero.name}" loading="lazy"><div><small>${safeText(x.label)}</small><strong>${safeText(x.title)}</strong></div></div><p>${safeText(x.summary)}</p></div>`).join('');

    $('#heroContent').innerHTML=`
      <div class="hero-detail-toolbar"><button id="backToTier" class="hero-back-button">← 返回 ${roleNames[state.role]} Tier 總覽</button></div>
      <section class="hero-profile">
        <section class="hero-profile-hero">
          ${hero.avatar ? `<img class="hero-avatar hero-avatar-image" src="${hero.avatar}" alt="${hero.name}" loading="lazy">` : `<div class="hero-avatar hero-avatar-placeholder"><span>${hero.name.slice(0,1)}</span></div>`}
          <div class="hero-title-block"><div class="hero-title-row"><h2>${hero.name}</h2><span class="tier-badge-large">${hero.tier}</span></div><div class="hero-en">${hero.enName} · ${hero.role}</div><div class="hero-position">${hero.position}</div><div class="hero-tags">${tags}</div></div>
        </section>
        <section class="hero-summary-box"><span>一句話玩法</span><p>${hero.summary}</p></section>
        <section class="hero-section"><div class="hero-section-title"><h3>綜合評分</h3><span>7.2a</span></div><div class="hero-ratings">${renderRatings(hero)}</div></section>
        <section class="hero-section"><div class="hero-section-title"><h3>符文</h3><span>主流配置</span></div><div class="hero-runes">${runeHTML}</div></section>
        <section class="hero-section"><div class="hero-section-title"><h3>推薦出裝</h3><span>6 件完整出裝</span></div><div class="hero-item-build">${itemHTML}</div><div class="hero-build-subrow"><strong>鞋子</strong><div class="hero-boot-path">${bootHTML}</div></div></section>
        <section class="hero-section hero-section-split"><div><div class="hero-section-title"><h3>召喚師技能</h3></div><div class="hero-spells">${spellHTML}</div></div><div><div class="hero-section-title"><h3>技能優先級</h3></div><div class="skill-order"><span>主升順序</span><strong>${hero.skillOrder}</strong></div></div></section>
        <section class="hero-section"><div class="hero-section-title"><h3>技能加點</h3><span>Lv.1 ～ Lv.15</span></div>${renderSkillGrid(hero)}</section>
        ${passive?`<section class="hero-section"><div class="hero-section-title"><h3>被動</h3><span>Passive</span></div><div class="passive-feature"><img src="${safeIcon(passive)}" alt="${safeText(passive.title)}"><div><small>${safeText(passive.label)}</small><strong>${safeText(passive.title)}</strong><p>${safeText(passive.summary)}</p></div></div></section>`:''}
        <section class="hero-section"><div class="hero-section-title"><h3>技能介紹</h3><span>Q / W / E / R</span></div><div class="ability-grid">${abilityHTML}</div></section>
        <section class="hero-section"><div class="hero-section-title"><h3>對局</h3><span>Matchup</span></div><div class="matchup-grid"><div class="matchup-box good"><span>較好打</span><div>${hero.matchups.good.map(x=>`<b>${x}</b>`).join('')}</div></div><div class="matchup-box bad"><span>較難打</span><div>${hero.matchups.bad.map(x=>`<b>${x}</b>`).join('')}</div></div><div class="matchup-box ban"><span>優先 Ban</span><strong>${hero.matchups.ban}</strong></div></div></section>
        <section class="hero-section"><div class="hero-section-title"><h3>被動堆層節點</h3><span>25 / 100 / 175</span></div><div class="stack-grid">${hero.stackBreakpoints.map(x=>`<div class="stack-card">${x.icon?`<img src="${x.icon}" alt="${x.title}" loading="lazy">`:''}<strong>${x.stacks}</strong><span>${x.title}</span><p>${x.text}</p></div>`).join('')}</div></section>
        <section class="hero-section"><div class="hero-section-title"><h3>實戰節奏</h3></div><div class="playstyle-timeline">${Object.entries(hero.playstyle).map(([k,v])=>`<div class="playstyle-step"><b>${k}</b><p>${v}</p></div>`).join('')}</div></section>
        <div class="hero-source-note">${hero.sourceNote}</div>
      </section>`;

    $('#backToTier').addEventListener('click',()=>{ state.heroId=''; syncUrl(); renderOverview(); });
  }

  function render(){ renderRoleTabs(); state.heroId ? renderDetail() : renderOverview(); }

  async function init(){
    try{
      const [heroData,runeData,itemData,spellData]=await Promise.all([
        getJSON('../assets/data/heroes.json'), getJSON('../assets/data/runes.json'), getJSON('../assets/data/items.json'), getJSON('../assets/data/spells.json')
      ]);
      state.heroes=heroData.heroes||heroData||[]; state.runes=flattenRunes(runeData); state.items=normalizeItems(itemData); state.spells=spellData;
      const params=new URLSearchParams(location.search);
      if(params.get('role')) state.role=params.get('role');
      if(params.get('hero')) state.heroId=params.get('hero');
      $$('.hero-role-tab').forEach(btn=>btn.addEventListener('click',()=>{ state.role=btn.dataset.role; state.heroId=''; syncUrl(); render(); }));
      render();
    }catch(err){
      console.error(err); $('#heroContent').innerHTML='<div class="hero-profile-empty">英雄資料載入失敗。<small>請確認網站是透過 HTTP / GitHub Pages 開啟。</small></div>';
    }
  }
  init();
})();
