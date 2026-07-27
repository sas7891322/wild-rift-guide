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
  function abilityMedia(x, cls='ability-icon-placeholder'){ const n={Q:'1',W:'2',E:'3',R:'4',P:'P'}[x?.key]||safeText(x?.key)||'?'; return safeIcon(x) ? `<img src="${safeIcon(x)}" alt="${safeText(x?.label)||safeText(x?.title)}" loading="lazy">` : `<span class="${cls}">${n}</span>`; }
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
    const rows = ['Q','W','E','R'].map(key=>{
      const a=abilities[key]||{};
      return `<div class="skill-grid-row">
        <div class="skill-grid-skill">${abilityMedia(a,'skill-icon-placeholder')}<div><b>${safeText(a.label)||key}</b><small>${safeText(a.title)}</small></div></div>
        ${levels.map((lvl,i)=>`<div class="skill-grid-cell ${sequence[i]===key?'active':''}" aria-label="等級 ${lvl}${sequence[i]===key?' 點 '+key:''}">${sequence[i]===key?'<span>●</span>':''}</div>`).join('')}
      </div>`;
    }).join('');
    return `<div class="skill-level-grid"><div class="skill-grid-row skill-grid-header"><div class="skill-grid-skill label">技能</div>${levels.map(x=>`<div class="skill-grid-cell">${x}</div>`).join('')}</div>${rows}</div>`;
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
    const starter=firstBasicComponent(items[0]);
    const starterHTML=buildMiniCard(starter,'starter');
    const coreHTML=items.slice(0,3).map((x,i)=>`<div class="hero-build-slot"><b>${i+1}</b>${buildMiniCard(x)}</div>`).join('');
    const lucianPilot = ['smolder','miss-fortune','ezreal','varus','zeri','lucian','xayah','jhin','kogmaw','vayne','corki','kalista','sivir','kaisa','draven','ashe','jinx','caitlyn','twitch','tristana','samira','yunara','senna'].includes(hero.id);
    const shownBoots = lucianPilot ? boots.slice(0,1) : boots;
    const bootHTML=shownBoots.map((x,i)=>`<div class="hero-build-slot boot"><b>${lucianPilot?'II':(i===0?'II':'III')}</b>${buildMiniCard(x,'boot')}</div>`).join('<div class="build-arrow">→</div>');
    const finalBoot = lucianPilot ? boots[0] : boots[1];
    const finalHTML=[...items.slice(0,5),finalBoot].map((x,i)=>`<div class="hero-build-slot final"><b>${i<5?i+1:(lucianPilot?'II':'III')}</b>${buildMiniCard(x,i===5?'boot':'item')}</div>`).join('');
    const abilities = Array.isArray(hero.abilities) ? hero.abilities : [];
    const passive = abilities.find(x=>x.key==='P');
    const activeAbilities = abilities.filter(x=>x.key!=='P');
    const abilityHTML = activeAbilities.map(x=>`<div class="ability-card ability-${(x.key||'').toLowerCase()}"><div class="ability-head">${abilityMedia(x)}<div><small>${safeText(x.label)}</small><strong>${safeText(x.title)}</strong></div></div>${abilityVariants(x)}<p>${safeText(x.summary)}</p></div>`).join('');

    $('#heroContent').innerHTML=`
      <div class="hero-detail-toolbar"><button id="backToTier" class="hero-back-button">← 返回 ${state.role==='all'?'ALL 英雄列表':roleNames[state.role]+' Tier 總覽'}</button>${laneSwitch}</div>
      <section class="hero-profile ${lucianPilot?'lucian-mobile-pilot':''}">
        <section class="hero-profile-hero">
          ${hero.avatar ? `<img class="hero-avatar hero-avatar-image" src="${hero.avatar}" alt="${hero.name}" loading="lazy">` : `<div class="hero-avatar hero-avatar-placeholder"><span>${hero.name.slice(0,1)}</span></div>`}
          <div class="hero-title-block"><div class="hero-title-row"><h2>${hero.name}</h2><span class="tier-badge-large">${hero.tier}</span></div><div class="hero-en">${hero.enName} · ${hero.role}</div><div class="hero-position">${hero.position}</div><div class="hero-tags">${tags}</div></div>
        </section>
        <section class="hero-summary-box"><span>一句話玩法</span><p>${hero.summary}</p></section>
        <details class="hero-section hero-rating-details"><summary><span><b>綜合評分</b><small>7.2a · 點擊展開</small></span><i>⌄</i></summary><div class="hero-ratings rating-details-body">${renderRatings(hero)}</div></details>
        <section class="hero-section"><div class="hero-section-title"><h3>召喚師技能＋符文</h3><span>Summoner / Runes</span></div><div class="summoner-rune-layout"><div class="summoner-box"><div class="subsection-label">召喚師技能</div><div class="hero-spells">${spellHTML}</div></div><div class="rune-box"><div class="subsection-label">符文</div><div class="hero-runes">${runeHTML}</div></div></div></section>
        <section class="hero-section"><div class="hero-section-title"><h3>裝備配置</h3><span>Build Path</span></div><div class="build-groups">${buildSet('起手裝備','開局優先',starterHTML,'starter-group')}${buildSet('鞋子',lucianPilot?'二級鞋':'二級 → 三級',`<div class="hero-boot-path">${bootHTML}</div>`,'boots-group')}${buildSet('三件核心裝備','核心成形',coreHTML,'core-group')}${buildSet('完整成裝',lucianPilot?'5 件裝備＋二級鞋':'5 件裝備＋三級鞋',finalHTML,'final-group')}</div></section>
        <section class="hero-section"><div class="hero-section-title"><h3>技能優先級</h3><span>Skill Priority</span></div>${renderSkillPriority(hero)}${lucianPilot&&hero.combo?`<div class="lucian-combo-row"><span>常用連招</span><div class="lucian-combo-seq">${(hero.comboSteps||[]).map(step=>step.type==='skill'?`<div class="lucian-combo-step">${step.icon?`<img src="${safeText(step.icon)}" alt="${safeText(step.label)}">`:`<b class="combo-number-fallback">${safeText(step.label.replace('技',''))}</b>`}<small>${safeText(step.label)}</small></div>`:`<div class="lucian-combo-aa"><b>普攻</b></div>`).join('<i>→</i>')}</div></div>`:''}</section>
        <section class="hero-section"><div class="hero-section-title"><h3>技能加點</h3><span>Lv.1 ～ Lv.15</span></div>${renderSkillGrid(hero)}</section>
        ${passive?`<section class="hero-section"><div class="hero-section-title"><h3>被動</h3><span>Passive</span></div><div class="passive-feature">${abilityMedia(passive,'passive-icon-placeholder')}<div><small>${safeText(passive.label)}</small><strong>${safeText(passive.title)}</strong>${abilityVariants(passive)}<p>${safeText(passive.summary)}</p></div></div></section>`:''}
        <section class="hero-section"><div class="hero-section-title"><h3>技能介紹</h3><span>Q / W / E / R</span></div><div class="ability-grid">${abilityHTML}</div></section>
        <section class="hero-section"><div class="hero-section-title"><h3>對局</h3><span>Matchup</span></div><div class="matchup-grid"><div class="matchup-box good"><span>較好打</span><div>${hero.matchups.good.map(matchupChip).join('')}</div></div><div class="matchup-box bad"><span>較難打</span><div>${hero.matchups.bad.map(matchupChip).join('')}</div></div>${lucianPilot&&Array.isArray(hero.synergySupports)?`<div class="matchup-box good"><span>合適輔助</span><div>${hero.synergySupports.map(matchupChip).join('')}</div></div>`:`<div class="matchup-box ban"><span>優先 Ban</span><div>${matchupChip(hero.matchups.ban)}</div></div>`}</div></section>
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


function ensureLucianPilotMobileStyle(){
  if(document.getElementById('lucian-pilot-mobile-style')) return;
  const style=document.createElement('style');
  style.id='lucian-pilot-mobile-style';
  style.textContent=`
    @media (max-width:800px){
      .hero-role-tabs{
        display:grid!important;
        grid-template-columns:repeat(6,minmax(0,1fr))!important;
        gap:3px!important;
        overflow:visible!important;
        padding:0!important;
      }
      .hero-role-tab{
        min-width:0!important;
        width:auto!important;
        padding:6px 1px!important;
        gap:2px!important;
        border-radius:10px!important;
        font-size:9px!important;
        line-height:1.1!important;
        flex-direction:column!important;
        white-space:nowrap!important;
      }
      .hero-role-tab img{
        width:24px!important;
        height:24px!important;
        border-radius:7px!important;
      }
      /* 飛龍路正式手機版：技能優先顯示縮圖＋1/2/3/4 技；Lv.1~15 全表同屏，不左右滑 */
      .lucian-mobile-pilot .skill-priority-step>div{
        display:block!important;
      }
      .lucian-mobile-pilot .skill-priority-step>div b{
        display:block;
        font-size:7px;
        line-height:1.1;
        white-space:nowrap;
      }
      .lucian-mobile-pilot .skill-priority-step>div small{
        display:none!important;
      }
      .lucian-mobile-pilot .skill-level-grid{
        overflow:visible!important;
        padding:4px!important;
      }
      .lucian-mobile-pilot .skill-grid-row{
        grid-template-columns:58px repeat(15,minmax(0,1fr))!important;
        min-width:0!important;
        width:100%!important;
      }
      .lucian-mobile-pilot .skill-grid-skill{
        position:static!important;
        grid-template-columns:22px minmax(0,1fr)!important;
        gap:2px!important;
        padding:3px!important;
      }
      .lucian-mobile-pilot .skill-grid-skill img,
      .lucian-mobile-pilot .skill-grid-skill .skill-icon-placeholder{
        width:22px!important;
        height:22px!important;
        border-radius:6px!important;
      }
      .lucian-mobile-pilot .skill-grid-skill b{
        font-size:7px!important;
        white-space:nowrap!important;
      }
      .lucian-mobile-pilot .skill-grid-skill small{
        display:none!important;
      }
      .lucian-mobile-pilot .skill-grid-cell{
        min-width:0!important;
        min-height:31px!important;
        font-size:6.5px!important;
        padding:0!important;
      }
      .lucian-mobile-pilot .skill-grid-cell.active span{
        width:13px!important;
        height:13px!important;
        font-size:6px!important;
      }
      .lucian-combo-row{
        margin-top:9px;
        display:flex;
        align-items:center;
        gap:8px;
        padding:8px 10px;
        border:1px solid rgba(216,184,108,.14);
        border-radius:11px;
        background:rgba(5,16,28,.32);
      }
      .lucian-combo-row span{
        flex:0 0 auto;
        color:#d8b86c;
        font-size:10px;
        font-weight:900;
      }
      .lucian-combo-row strong{
        min-width:0;
        font-size:11px;
        line-height:1.35;
        white-space:normal;
      }
      .lucian-combo-seq{
        display:flex;
        align-items:center;
        gap:4px;
        min-width:0;
        overflow:hidden;
      }
      .lucian-combo-seq>i{
        font-style:normal;
        color:#d8b86c;
        font-size:10px;
        flex:0 0 auto;
      }
      .lucian-combo-step{
        width:34px;
        flex:0 0 34px;
        text-align:center;
      }
      .lucian-combo-step img{
        display:block;
        width:30px;
        height:30px;
        margin:0 auto 2px;
        border-radius:8px;
        object-fit:cover;
        border:1px solid rgba(216,184,108,.25);
      }
      .lucian-combo-step small{
        display:block;
        font-size:7px;
        color:#c9d4df;
        line-height:1;
      }
      .lucian-combo-aa{
        flex:0 0 auto;
        padding:5px 6px;
        border-radius:8px;
        border:1px solid rgba(255,255,255,.08);
        background:rgba(255,255,255,.03);
      }
      .lucian-combo-aa b{
        font-size:8px;
        white-space:nowrap;
      }
    }
    @media (max-width:420px){
      .hero-role-tabs{gap:2px!important}
      .hero-role-tab{font-size:8px!important;padding:5px 0!important}
      .hero-role-tab img{width:22px!important;height:22px!important}
      .lucian-mobile-pilot .skill-grid-row{grid-template-columns:50px repeat(15,minmax(0,1fr))!important}
      .lucian-mobile-pilot .skill-grid-skill{grid-template-columns:18px minmax(0,1fr)!important}
      .lucian-mobile-pilot .skill-grid-skill img,.lucian-mobile-pilot .skill-grid-skill .skill-icon-placeholder{width:18px!important;height:18px!important}
      .lucian-mobile-pilot .skill-grid-skill b{font-size:6.5px!important}
      .lucian-mobile-pilot .skill-grid-cell{font-size:6px!important;min-height:29px!important}
    }
  `;
  document.head.appendChild(style);
}


try{ensureLucianPilotMobileStyle();}catch(e){}
