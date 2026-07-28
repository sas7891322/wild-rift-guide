(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const star = n => '★'.repeat(n) + '☆'.repeat(5-n);
  const roleNames = {all:'ALL', baron:'巴龍路', jungle:'打野', mid:'中路', duo:'飛龍路', support:'輔助'};
  const tierOrder = ['S+','S','A','B'];

  const state = { role:'all', heroId:'', heroes:[], laneTiers:{}, laneMeta:{}, runes:[], items:[], spells:[] };

  function flattenRunes(data){ return Object.values(data || {}).flatMap(v => Array.isArray(v) ? v : []); }
  function normalizeItems(data){ return Array.isArray(data) ? data : (data?.items || []); }
  function byId(arr,id){ return arr.find(x=>x.id===id); }
  function safeIcon(x){ return x?.icon || ''; }
  function safeText(x){ return x || ''; }
  function abilityMedia(x, cls='ability-icon-placeholder'){ return safeIcon(x) ? `<img src="${safeIcon(x)}" alt="${safeText(x?.label)||safeText(x?.title)}" loading="lazy">` : `<span class="${cls}">${safeText(x?.key)||'?'}</span>`; }
  function abilityVariants(x){ const arr=Array.isArray(x?.variantIcons)?x.variantIcons:[]; if(arr.length<=1) return ''; return `<div class="ability-variants">${arr.map((src,i)=>`<img src="${src}" alt="${safeText(x?.label)||safeText(x?.title)} ${i+1}" loading="lazy">`).join('')}</div>`; }

  function heroByName(name){ return state.heroes.find(h=>h.name===name); }
  function matchupChip(name){
    const h=heroByName(name);
    return h?.avatar
      ? `<span class="matchup-chip has-icon"><img src="${h.avatar}" alt="${name}" loading="lazy"><b>${name}</b></span>`
      : `<span class="matchup-chip"><b>${name}</b></span>`;
  }
  function getSkillPriority(hero){
    const raw=String(hero.skillOrder||'').split('>').map(x=>x.trim()).filter(Boolean);
    const numMap={'1':'Q','2':'W','3':'E','4':'R'};
    return raw.map(x=>numMap[x]||x.toUpperCase());
  }
  function renderSkillPriority(hero){
    const abilities=Object.fromEntries((hero.abilities||[]).map(a=>[a.key,a]));
    return `<div class="skill-priority-row">${getSkillPriority(hero).map((key,i)=>{
      const a=abilities[key]||{key,label:key,title:''};
      return `<div class="skill-priority-step"><span class="skill-priority-rank">${i+1}</span>${abilityMedia(a,'skill-priority-placeholder')}<div><b>${safeText(a.label)||key}</b><small>${safeText(a.title)}</small></div></div>${i<getSkillPriority(hero).length-1?'<span class="skill-priority-arrow">→</span>':''}`;
    }).join('')}</div>`;
  }
  function firstBasicComponent(item, seen=new Set()){
    if(!item || seen.has(item.id)) return null;
    seen.add(item.id);
    if(String(item.id||'').startsWith('basic-') || String(item.id||'').startsWith('support-')) return item;
    for(const id of (item.buildFrom||[])){
      const child=byId(state.items,id);
      const found=firstBasicComponent(child,seen);
      if(found) return found;
    }
    return null;
  }
  function buildSet(title, subtitle, cards, cls=''){
    return `<div class="build-group ${cls}"><div class="build-group-head"><strong>${title}</strong>${subtitle?`<small>${subtitle}</small>`:''}</div><div class="build-group-items">${cards}</div></div>`;
  }

  function buildMiniCard(x, type='item'){
    if(!x) return '<div class="build-mini missing">資料待補</div>';
    return `<div class="build-mini ${type}"><img src="${safeIcon(x)}" alt="${x.name}" loading="lazy"><span>${x.name}</span></div>`;
  }

  const rolePriority=['baron','jungle','mid','duo','support'];
  function baseIdOf(x){ return x?.baseId || String(x?.id||'').replace(/-(baron|jungle|mid|duo|support)$/,''); }
  function allHeroes(){
    const map=new Map();
    for(const role of rolePriority){
      for(const h of (state.laneTiers?.[role]||[])){
        const key=baseIdOf(h);
        if(!map.has(key)) map.set(key,{id:key,name:h.name,enName:h.enName,avatar:h.avatar||'',roles:[],detailIds:[]});
        const x=map.get(key);
        if(!x.avatar && h.avatar) x.avatar=h.avatar;
        if(!x.roles.includes(role)) x.roles.push(role);
        if(h.detailHeroId && !x.detailIds.includes(h.detailHeroId)) x.detailIds.push(h.detailHeroId);
      }
    }
    return [...map.values()].sort((a,b)=>(a.enName||a.name).localeCompare(b.enName||b.name,'en'));
  }
  function roleHeroes(){
    if(state.role==='all') return allHeroes();
    const lane=state.laneTiers?.[state.role];
    if(Array.isArray(lane)) return lane;
    return state.heroes.filter(h=>h.roleId===state.role).map(h=>({...h,detailHeroId:h.id,origin:'native'}));
  }

  function syncUrl(){
    const p = new URLSearchParams(location.search);
    if(state.role==='all') p.delete('role'); else p.set('role', state.role);
    if(state.heroId) p.set('hero', state.heroId); else p.delete('hero');
    history.replaceState(null,'',`${location.pathname}?${p.toString()}`);
  }

  function renderRoleTabs(){
    $$('.hero-role-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.role===state.role));
  }

  function renderOverview(){
    const heroes = roleHeroes();
    const content = $('#heroContent');
    if(state.role==='all'){
      content.innerHTML = `<section class="hero-overview-shell all-heroes-shell">
        <div class="hero-overview-head"><div><span class="eyebrow">ALL CHAMPIONS</span><h2>全英雄列表</h2><p>同一英雄只顯示一次；下方位置標籤代表目前遊戲內可選路線。已完成詳細資料的英雄可直接點入。</p></div><span class="hero-overview-count">${heroes.length}</span></div>
        <div class="tier-hero-grid all-hero-grid">${heroes.map(h=>{
          const media=`<span class="tier-hero-avatar-wrap">${h.avatar?`<img src="${h.avatar}" alt="${h.name}" class="tier-hero-avatar" loading="lazy">`:`<span class="tier-hero-placeholder">${h.name.slice(0,1)}</span>`}</span>`;
          const roleBadges=`<span class="all-role-badges">${h.roles.map(r=>`<i>${roleNames[r]}</i>`).join('')}</span>`;
          const label=`${media}<strong>${h.name}</strong><small>${h.enName||''}</small>${roleBadges}`;
          const detail=h.detailIds?.[0]||'';
          return detail?`<button class="tier-hero-card all-hero-card" data-hero="${detail}">${label}</button>`:`<div class="tier-hero-card all-hero-card is-pending" title="詳細攻略待補">${label}</div>`;
        }).join('')}</div>
      </section>`;
      $$('.tier-hero-card[data-hero]', content).forEach(btn=>btn.addEventListener('click',()=>{ state.heroId=btn.dataset.hero; syncUrl(); renderDetail(); }));
      return;
    }
    const title = roleNames[state.role] || '英雄';
    const meta = state.laneMeta?.[state.role] || {};
    const nativeCount = Number(meta.nativeCount ?? heroes.filter(h=>h.origin!=='cross').length);
    const crossCount = Number(meta.crossCount ?? heroes.filter(h=>h.origin==='cross').length);
    const groups = tierOrder.map(tier => {
      const members = heroes.filter(h=>h.tier===tier);
      if(!members.length) return '';
      return `<section class="tier-overview-section">
        <div class="tier-overview-heading"><span class="tier-overview-badge tier-${tier.toLowerCase().replace('+','p')}">${tier}</span><strong>${tier} Tier</strong><small>${members.length} 位英雄</small></div>
        <div class="tier-hero-grid">
          ${members.map(h=>{
            const avatar=h.avatar||'';
            const media=`<span class="tier-hero-avatar-wrap">${avatar?`<img src="${avatar}" alt="${h.name}" class="tier-hero-avatar" loading="lazy">`:`<span class="tier-hero-placeholder">${h.name.slice(0,1)}</span>`}</span>`;
            const label=`${media}<strong>${h.name}</strong><small>${h.enName}</small>${h.origin==='cross'?'<span class="tier-cross-tag">跨路</span>':''}`;
            return h.detailHeroId
              ? `<button class="tier-hero-card" data-hero="${h.detailHeroId}">${label}</button>`
              : `<div class="tier-hero-card is-pending" title="頭像與詳細資料待補">${label}</div>`;
          }).join('')}
        </div>
      </section>`;
    }).join('');
    const countCopy = crossCount>0 ? `原生 ${nativeCount}＋跨路 ${crossCount}` : `原生 ${nativeCount}`;
    content.innerHTML = `<section class="hero-overview-shell">
      <div class="hero-overview-head"><div><span class="eyebrow">${state.role==='duo'?'DRAGON LANE':title.toUpperCase()}</span><h2>${title} Tier 總覽</h2><p>各路線獨立評級 · ${countCopy}${meta.detailComplete?' · 詳細攻略已開放':(state.role==='duo'?' · 已完成英雄可點擊查看詳細資料':(meta.avatarComplete?' · 英雄頭像已完成 · 詳細攻略後續補齊':' · 頭像與詳細資料後續補齊'))}</p></div><span class="hero-overview-count">${heroes.length}</span></div>
      ${groups || `<div class="hero-profile-empty">${title}尚未匯入英雄資料。</div>`}
    </section>`;
    $$('.tier-hero-card[data-hero]', content).forEach(btn=>btn.addEventListener('click',()=>{ state.heroId=btn.dataset.hero; syncUrl(); renderDetail(); }));
  }

  function renderRatings(hero){
    return Object.entries(hero.ratings).map(([name,n])=>`<div class="hero-rating"><div class="rating-label"><span>${name}</span><strong>${n}/5</strong></div><div class="rating-stars">${star(n)}</div><div class="rating-bar"><i style="width:${n*20}%"></i></div></div>`).join('');
  }

  function renderSkillGrid(hero){
    const abilities = Object.fromEntries((hero.abilities||[]).filter(a=>['Q','W','E','R'].includes(a.key)).map(a=>[a.key,a]));
    const sequence = hero.skillSequence || [];
    const levels = Array.from({length:15},(_,i)=>i+1);
    const compact = hero.detailTemplate==='lucian-mobile-formal-v2';
    const rows = ['Q','W','E','R'].map(key=>{
      const a=abilities[key]||{};
      return `<div class="skill-grid-row">
        <div class="skill-grid-skill">${abilityMedia(a,'skill-icon-placeholder')}<div><b>${safeText(a.label)||key}</b><small>${safeText(a.title)}</small></div></div>
        ${levels.map((lvl,i)=>`<div class="skill-grid-cell ${sequence[i]===key?'active':''}" aria-label="等級 ${lvl}${sequence[i]===key?' 點 '+key:''}">${sequence[i]===key?'<span>●</span>':''}</div>`).join('')}
      </div>`;
    }).join('');
    return `<div class="skill-level-grid ${compact?'no-swipe':''}"><div class="skill-grid-row skill-grid-header"><div class="skill-grid-skill label">技能</div>${levels.map(x=>`<div class="skill-grid-cell">${x}</div>`).join('')}</div>${rows}</div>`;
  }

  function renderCombos(hero){
    const combos=Array.isArray(hero.combos)?hero.combos:[];
    if(!combos.length) return '';
    const names={Q:'1 技',Q3:'1 技擊飛',W:'2 技',E:'3 技',E2:'返回',R:'4 技',AA:'普攻'};
    const abilityByKey=Object.fromEntries((hero.abilities||[]).map(a=>[a.key,a]));
    const stepHTML=step=>{
      const base=step==='Q3'?'Q':step==='E2'?'E':step;
      const ability=abilityByKey[base];
      const media=ability&&['Q','W','E','R'].includes(base)
        ? abilityMedia(ability,'combo-icon-placeholder')
        : `<span class="combo-text-icon">${step==='AA'?'A':'↩'}</span>`;
      return `<span class="combo-step">${media}<b>${names[step]||step}</b></span>`;
    };
    return `<section class="hero-section hero-combo-section"><div class="hero-section-title"><h3>技能連招</h3><span>Combo</span></div><div class="hero-combo-list">${combos.map(combo=>`<article class="hero-combo-card"><strong>${safeText(combo.name)}</strong><div class="combo-steps">${combo.steps.map((step,i)=>`${stepHTML(step)}${i<combo.steps.length-1?'<i>→</i>':''}`).join('')}</div><p>${safeText(combo.note)}</p></article>`).join('')}</div></section>`;
  }

  function renderDetail(){
    const hero=state.heroes.find(h=>h.id===state.heroId);
    if(!hero){ state.heroId=''; syncUrl(); renderOverview(); return; }
    const runes=(hero.runes||[]).map(id=>byId(state.runes,id));
    const items=(hero.items||[]).map(id=>byId(state.items,id));
    const boots=(hero.boots||[]).map(id=>byId(state.items,id));
    const spells=(hero.spells||[]).map(id=>byId(state.spells,id));
    const tags=(hero.tags||[]).map(t=>`<span>${t}</span>`).join('');
    const profiles=state.heroes.filter(x=>baseIdOf(x)===baseIdOf(hero));
    const laneSwitch=profiles.length>1?`<div class="hero-lane-switch">${profiles.map(x=>`<button data-profile="${x.id}" class="${x.id===hero.id?'active':''}">${roleNames[x.roleId]||x.role}</button>`).join('')}</div>`:'';
    const runeHTML=runes.map((x,i)=>`<div class="hero-rune-card ${i===0?'keystone':''}">${x?`<img src="${safeIcon(x)}" alt="${x.name}"><div><small>${i===0?'關鍵符文':'副符文'}</small><strong>${x.name}</strong><p>${x.tag||''}</p></div>`:'<span>資料待補</span>'}</div>`).join('');
    const spellHTML=spells.map(x=>buildMiniCard(x,'spell')).join('');
    const isLucianFormal=hero.detailTemplate==='lucian-mobile-formal-v2';
    const starterIds=Array.isArray(hero.starterItems)&&hero.starterItems.length?hero.starterItems:[];
    const starterItems=starterIds.map(id=>byId(state.items,id)).filter(Boolean);
    const starter=starterItems[0]||firstBasicComponent(items[0]);
    const starterHTML=(starterItems.length?starterItems:[starter]).map(x=>buildMiniCard(x,'starter')).join('');
    const coreItems=(Array.isArray(hero.coreItems)&&hero.coreItems.length?hero.coreItems.map(id=>byId(state.items,id)).filter(Boolean):items.slice(0,3));
    const coreHTML=coreItems.map((x,i)=>`<div class="hero-build-slot"><b>${i+1}</b>${buildMiniCard(x)}</div>`).join('');
    const bootHTML=boots.map((x,i)=>`<div class="hero-build-slot boot"><b>${i===0?'II':'III'}</b>${buildMiniCard(x,'boot')}</div>`).join('<div class="build-arrow">→</div>');
    const finalHTML=[...items.slice(0,5),boots[1]].map((x,i)=>`<div class="hero-build-slot final"><b>${i<5?i+1:'III'}</b>${buildMiniCard(x,i===5?'boot':'item')}</div>`).join('');
    const buildSection=isLucianFormal
      ? `<section class="hero-section lucian-formal-section"><div class="hero-section-title"><h3>裝備配置</h3><span>Build Path</span></div><div class="build-groups lucian-formal-build">${buildSet('起手裝備','開局優先',starterHTML,'starter-group')}${buildSet('鞋子','二級 → 三級',`<div class="hero-boot-path">${bootHTML}</div>`,'boots-group')}${buildSet('核心裝備','三件核心',coreHTML,'core-group')}</div></section>`
      : `<section class="hero-section"><div class="hero-section-title"><h3>裝備配置</h3><span>Build Path</span></div><div class="build-groups">${buildSet('起手裝備','開局優先',starterHTML,'starter-group')}${buildSet('三件核心裝備','核心成形',coreHTML,'core-group')}${buildSet('鞋子','二級 → 三級',`<div class="hero-boot-path">${bootHTML}</div>`,'boots-group')}${buildSet('完整成裝','5 件裝備＋三級鞋',finalHTML,'final-group')}</div></section>`;
    const matchupSection=`<section class="hero-section"><div class="hero-section-title"><h3>對局</h3><span>Matchup</span></div><div class="matchup-grid ${hero.hideBan||!hero.matchups?.ban?'no-ban':''}"><div class="matchup-box good"><span>較好打</span><div>${(hero.matchups?.good||[]).map(matchupChip).join('')}</div></div><div class="matchup-box bad"><span>較難打</span><div>${(hero.matchups?.bad||[]).map(matchupChip).join('')}</div></div>${hero.hideBan||!hero.matchups?.ban?'':`<div class="matchup-box ban"><span>優先 Ban</span><div>${matchupChip(hero.matchups.ban)}</div></div>`}</div></section>`;
    const abilities = Array.isArray(hero.abilities) ? hero.abilities : [];
    const passive = abilities.find(x=>x.key==='P');
    const activeAbilities = abilities.filter(x=>x.key!=='P');
    const abilityHTML = activeAbilities.map(x=>`<div class="ability-card ability-${(x.key||'').toLowerCase()}"><div class="ability-head">${abilityMedia(x)}<div><small>${safeText(x.label)}</small><strong>${safeText(x.title)}</strong></div></div>${abilityVariants(x)}<p>${safeText(x.summary)}</p></div>`).join('');

    $('#heroContent').innerHTML=`
      <div class="hero-detail-toolbar"><button id="backToTier" class="hero-back-button">← 返回 ${state.role==='all'?'ALL 英雄列表':roleNames[state.role]+' Tier 總覽'}</button>${laneSwitch}</div>
      <section class="hero-profile">
        <section class="hero-profile-hero">
          ${hero.avatar ? `<img class="hero-avatar hero-avatar-image" src="${hero.avatar}" alt="${hero.name}" loading="lazy">` : `<div class="hero-avatar hero-avatar-placeholder"><span>${hero.name.slice(0,1)}</span></div>`}
          <div class="hero-title-block"><div class="hero-title-row"><h2>${hero.name}</h2><span class="tier-badge-large">${hero.tier}</span></div><div class="hero-en">${hero.enName} · ${hero.role}</div><div class="hero-position">${hero.position}</div><div class="hero-tags">${tags}</div></div>
        </section>
        <section class="hero-summary-box"><span>一句話玩法</span><p>${hero.summary}</p></section>
        <details class="hero-section hero-rating-details"><summary><span><b>綜合評分</b><small>7.2a · 點擊展開</small></span><i>⌄</i></summary><div class="hero-ratings rating-details-body">${renderRatings(hero)}</div></details>
        <section class="hero-section"><div class="hero-section-title"><h3>召喚師技能＋符文</h3><span>Summoner / Runes</span></div><div class="summoner-rune-layout"><div class="summoner-box"><div class="subsection-label">召喚師技能</div><div class="hero-spells">${spellHTML}</div></div><div class="rune-box"><div class="subsection-label">符文</div><div class="hero-runes">${runeHTML}</div></div></div></section>
        ${buildSection}
        <section class="hero-section"><div class="hero-section-title"><h3>技能優先級</h3><span>Skill Priority</span></div>${renderSkillPriority(hero)}</section>
        ${renderCombos(hero)}
        <section class="hero-section"><div class="hero-section-title"><h3>技能加點</h3><span>Lv.1 ～ Lv.15</span></div>${renderSkillGrid(hero)}</section>
        ${passive?`<section class="hero-section"><div class="hero-section-title"><h3>被動</h3><span>Passive</span></div><div class="passive-feature">${abilityMedia(passive,'passive-icon-placeholder')}<div><small>${safeText(passive.label)}</small><strong>${safeText(passive.title)}</strong>${abilityVariants(passive)}<p>${safeText(passive.summary)}</p></div></div></section>`:''}
        <section class="hero-section"><div class="hero-section-title"><h3>技能介紹</h3><span>Q / W / E / R</span></div><div class="ability-grid">${abilityHTML}</div></section>
        ${matchupSection}
        ${Array.isArray(hero.mechanics)&&hero.mechanics.length?`<section class="hero-section"><div class="hero-section-title"><h3>${hero.mechanicsTitle||'特殊機制'}</h3><span>Champion Mechanic</span></div><div class="stack-grid">${hero.mechanics.map(x=>`<div class="stack-card">${x.icon?`<img src="${x.icon}" alt="${x.title}" loading="lazy">`:''}${x.stacks!=null?`<strong>${x.stacks}</strong>`:''}<span>${x.title}</span><p>${x.text}</p></div>`).join('')}</div></section>`:''}
        <section class="hero-section"><div class="hero-section-title"><h3>實戰節奏</h3></div><div class="playstyle-timeline">${Object.entries(hero.playstyle).map(([k,v])=>`<div class="playstyle-step"><b>${k}</b><p>${v}</p></div>`).join('')}</div></section>
        <div class="hero-source-note">${hero.sourceNote}</div>
      </section>`;

    $('#backToTier').addEventListener('click',()=>{ state.heroId=''; syncUrl(); renderOverview(); });
    $$('.hero-lane-switch button').forEach(btn=>btn.addEventListener('click',()=>{ const p=state.heroes.find(x=>x.id===btn.dataset.profile); if(!p) return; state.heroId=p.id; if(state.role!=='all') state.role=p.roleId; syncUrl(); render(); }));
  }

  function render(){ renderRoleTabs(); state.heroId ? renderDetail() : renderOverview(); }

  async function init(){
    try{
      const [heroData,runeData,itemData,spellData]=await Promise.all([
        getJSON('../assets/data/heroes.json'), getJSON('../assets/data/runes.json'), getJSON('../assets/data/items.json'), getJSON('../assets/data/spells.json')
      ]);
      state.heroes=heroData.heroes||heroData||[]; state.laneTiers=heroData.laneTiers||{}; state.laneMeta=heroData.laneMeta||{}; state.runes=flattenRunes(runeData); state.items=normalizeItems(itemData); state.spells=spellData;
      const params=new URLSearchParams(location.search);
      if(params.get('role') && ['baron','jungle','mid','duo','support','all'].includes(params.get('role'))) state.role=params.get('role');
      if(params.get('hero')) state.heroId=params.get('hero');
      $$('.hero-role-tab').forEach(btn=>btn.addEventListener('click',()=>{ state.role=btn.dataset.role; state.heroId=''; syncUrl(); render(); }));
      render();
    }catch(err){
      console.error(err); $('#heroContent').innerHTML='<div class="hero-profile-empty">英雄資料載入失敗。<small>請確認網站是透過 HTTP / GitHub Pages 開啟。</small></div>';
    }
  }
  init();
})();
