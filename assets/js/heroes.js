(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const star = n => '★'.repeat(n) + '☆'.repeat(5-n);
  const roleNames = {all:'ALL', baron:'巴龍路', jungle:'打野', mid:'中路', duo:'飛龍路', support:'輔助'};
  const tierOrder = ['S+','S','A','B','C'];

  const state = { role:'all', heroId:'', query:'', filter:'all', heroes:[], heroCatalog:[], laneMeta:{}, runes:[], items:[], spells:[] };


  function clipDescription(value, max=155){
    const text=String(value||'').replace(/\s+/g,' ').trim();
    return text.length>max?`${text.slice(0,max-1)}…`:text;
  }
  function updateHeroPageHeading({eyebrow,title,description,badgeLabel,badgeText}){
    const eyebrowNode=$('#heroPageEyebrow');
    const titleNode=$('#heroPageTitle');
    const descriptionNode=$('#heroPageDescription');
    const badgeLabelNode=$('#heroPageBadgeLabel');
    const badgeTextNode=$('#heroPageBadgeText');
    if(eyebrowNode) eyebrowNode.textContent=eyebrow;
    if(titleNode) titleNode.textContent=title;
    if(descriptionNode) descriptionNode.textContent=description;
    if(badgeLabelNode) badgeLabelNode.textContent=badgeLabel;
    if(badgeTextNode) badgeTextNode.textContent=badgeText;
  }
  function heroCanonicalPath(hero){
    return `/pages/heroes.html?hero=${encodeURIComponent(hero.id)}`;
  }
  function setHeroListSeo(){
    if(!window.WRGSeo) return;
    const roleLabel=state.role==='all'?'全英雄':(roleNames[state.role]||'英雄');
    const limited=Boolean(state.query)||state.filter!=='all';
    const roleSeo={
      baron:{title:'激鬥峽谷巴龍路英雄推薦與 Tier List｜Wild Rift Guide',heading:'巴龍路英雄推薦與 Tier List',description:'激鬥峽谷 7.2b 巴龍路英雄推薦、Tier 排名與完整攻略，整理出裝、符文、技能加點、對線與實戰節奏。',count:'50 位巴龍路英雄 · 49 份完整攻略'},
      jungle:{title:'激鬥峽谷打野英雄推薦與 Tier List｜Wild Rift Guide',heading:'打野英雄推薦與 Tier List',description:'激鬥峽谷 7.2b 打野英雄推薦、Tier 排名與完整攻略，整理出裝、符文、技能加點、刷野與帶節奏方式。',count:'51 位打野英雄 · 50 份完整攻略'},
      mid:{title:'激鬥峽谷中路英雄推薦與 Tier List｜Wild Rift Guide',heading:'中路英雄推薦與 Tier List',description:'激鬥峽谷 7.2b 中路英雄推薦、Tier 排名與完整攻略，整理出裝、符文、技能加點、對線與支援節奏。',count:'46 位中路攻略'},
      duo:{title:'激鬥峽谷飛龍路英雄推薦與 Tier List｜Wild Rift Guide',heading:'飛龍路英雄推薦與 Tier List',description:'激鬥峽谷 7.2b 飛龍路射手英雄推薦、Tier 排名與完整攻略，整理出裝、符文、技能加點、對線與合適輔助。',count:'23 位飛龍路攻略'},
      support:{title:'激鬥峽谷輔助英雄推薦與 Tier List｜Wild Rift Guide',heading:'輔助英雄推薦與 Tier List',description:'激鬥峽谷 7.2b 輔助英雄推薦、Tier 排名與完整攻略，整理輔助裝、符文、技能加點、對線與開戰保排方式。',count:'32 位輔助攻略'}
    };
    const current=roleSeo[state.role];
    const title=current?.title||'激鬥峽谷英雄攻略與 Tier List｜Wild Rift Guide';
    const description=current?.description||'激鬥峽谷 7.2b 英雄攻略資料庫，收錄 141 位英雄與 200 份完整位置攻略，可依五路 Tier、繁體中文或英文名稱搜尋，查看出裝、符文、技能加點與對局。';
    const heading=current?.heading||'英雄攻略與 Tier List';
    const path=state.role==='all'?'/pages/heroes.html':`/pages/heroes.html?role=${encodeURIComponent(state.role)}`;
    updateHeroPageHeading({
      eyebrow:'激鬥峽谷 · PATCH 7.2B',title:heading,description,
      badgeLabel:state.role==='all'?'繁體中文英雄攻略':`${roleLabel}攻略資料`,
      badgeText:current?.count||'141 位英雄 · 200 份完整位置攻略'
    });
    window.WRGSeo.set({
      title,description,path,
      robots:limited?'noindex,follow':'index,follow,max-image-preview:large',
      structuredData:{
        '@context':'https://schema.org','@graph':[
          {'@type':'WebSite','@id':`${window.WRGSeo.SITE_ORIGIN}/#website`,url:window.WRGSeo.absolute('/'),name:'激鬥峽谷攻略網',alternateName:'Wild Rift Guide',inLanguage:'zh-Hant-TW'},
          {'@type':'CollectionPage',name:heading,description,url:window.WRGSeo.absolute(path),inLanguage:'zh-Hant-TW',isPartOf:{'@id':`${window.WRGSeo.SITE_ORIGIN}/#website`}},
          {'@type':'BreadcrumbList',itemListElement:[
            {'@type':'ListItem',position:1,name:'首頁',item:window.WRGSeo.absolute('/')},
            {'@type':'ListItem',position:2,name:heading,item:window.WRGSeo.absolute(path)}
          ]}
        ]
      }
    });
  }
  function setHeroDetailSeo(hero){
    if(!window.WRGSeo||!hero) return;
    const roleLabel=roleNames[hero.roleId]||hero.role||'英雄';
    const heading=`${hero.name}${roleLabel}攻略`;
    const title=`${hero.name}攻略｜${roleLabel}出裝、符文、技能加點｜激鬥峽谷`;
    const description=clipDescription(`${hero.name}（${hero.enName||''}）激鬥峽谷 7.2b ${roleLabel}完整攻略，整理推薦出裝、符文搭配、召喚師技能、技能加點、對線與實戰節奏。${hero.summary||''}`);
    const path=heroCanonicalPath(hero);
    updateHeroPageHeading({
      eyebrow:`激鬥峽谷 ${roleLabel}攻略 · PATCH 7.2B`,title:heading,description,
      badgeLabel:'英雄完整攻略',badgeText:'出裝 · 符文 · 技能 · 對局'
    });
    window.WRGSeo.set({
      title,description,path,image:hero.avatar||undefined,type:'article',
      robots:'index,follow,max-image-preview:large',
      structuredData:{
        '@context':'https://schema.org','@graph':[
          {'@type':'WebSite','@id':`${window.WRGSeo.SITE_ORIGIN}/#website`,url:window.WRGSeo.absolute('/'),name:'激鬥峽谷攻略網',alternateName:'Wild Rift Guide',inLanguage:'zh-Hant-TW'},
          {'@type':'Article','@id':`${window.WRGSeo.absolute(path)}#article`,headline:heading,name:title,description,
            url:window.WRGSeo.absolute(path),mainEntityOfPage:window.WRGSeo.absolute(path),
            image:window.WRGSeo.absolute(String(hero.avatar||'/assets/images/brand/wild-rift-guide-og.png').replace(/^\.\.\//,'/')),
            inLanguage:'zh-Hant-TW',dateModified:'2026-07-31',
            author:{'@type':'Organization',name:'Wild Rift Guide'},
            about:{'@type':'VideoGame',name:'英雄聯盟：激鬥峽谷',alternateName:'League of Legends: Wild Rift'}},
          {'@type':'BreadcrumbList',itemListElement:[
            {'@type':'ListItem',position:1,name:'首頁',item:window.WRGSeo.absolute('/')},
            {'@type':'ListItem',position:2,name:'英雄攻略',item:window.WRGSeo.absolute('/pages/heroes.html')},
            {'@type':'ListItem',position:3,name:heading,item:window.WRGSeo.absolute(path)}
          ]}
        ]
      }
    });
  }
  async function shareHeroGuide(hero,button){
    const roleLabel=roleNames[hero.roleId]||hero.role||'英雄';
    const url=window.WRGSeo?.heroShareUrl(hero.id)||location.href;
    const data={title:`${hero.name}攻略｜${roleLabel}出裝與符文｜激鬥峽谷`,text:`${hero.name}激鬥峽谷 7.2b ${roleLabel}出裝、符文、技能加點與對局攻略`,url};
    try{
      if(navigator.share){ await navigator.share(data); return; }
      if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(url);
        const original=button.textContent;
        button.textContent='連結已複製';
        setTimeout(()=>{ if(button.isConnected) button.textContent=original; },1600);
        return;
      }
    }catch(err){
      if(err?.name==='AbortError') return;
    }
    window.prompt('複製英雄攻略連結',url);
  }

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
  function resolveTier2Boot(item, seen=new Set()){
    if(!item || seen.has(item.id)) return item||null;
    seen.add(item.id);
    if(Number(item.tier)===2 || item.stage==='二級鞋') return item;
    for(const id of (item.buildFrom||[])){
      const parent=byId(state.items,id);
      const found=resolveTier2Boot(parent,seen);
      if(found && (Number(found.tier)===2 || found.stage==='二級鞋')) return found;
    }
    return item;
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
  function catalogFromLegacyLaneTiers(laneTiers={}){
    const map=new Map();
    for(const roleId of rolePriority){
      for(const h of (laneTiers?.[roleId]||[])){
        const key=baseIdOf(h);
        if(!map.has(key)) map.set(key,{id:key,name:h.name||'',enName:h.enName||'',avatar:h.avatar||'',roles:[]});
        const item=map.get(key);
        item.roles.push({roleId,tier:h.tier||'',origin:h.origin||'native',detailHeroId:h.detailHeroId||'',avatar:h.avatar||item.avatar||''});
      }
    }
    return [...map.values()];
  }
  function roleEntry(catalogHero,roleId){ return (catalogHero?.roles||[]).find(x=>x.roleId===roleId); }
  function catalogHeroByBaseId(id){ return state.heroCatalog.find(x=>x.id===id); }
  function activeGuideIds(){ return new Set(state.heroCatalog.flatMap(h=>(h.roles||[]).map(r=>r.detailHeroId).filter(Boolean))); }
  function resolveHeroId(heroId){
    if(!heroId) return '';
    const active=activeGuideIds();
    if(active.has(heroId)) return heroId;
    const catalog=catalogHeroByBaseId(baseIdOf({id:heroId}));
    return catalog?.roles?.find(r=>r.detailHeroId)?.detailHeroId||'';
  }
  function allHeroes(){
    return state.heroCatalog.map(h=>({
      id:h.id,
      name:h.name,
      enName:h.enName,
      aliases:Array.isArray(h.aliases)?h.aliases:[],
      avatar:h.avatar||h.roles?.find(r=>r.avatar)?.avatar||'',
      roles:(h.roles||[]).map(r=>r.roleId),
      detailIds:(h.roles||[]).map(r=>r.detailHeroId).filter(Boolean)
    })).sort((a,b)=>(a.enName||a.name).localeCompare(b.enName||b.name,'en'));
  }
  function roleHeroesRaw(){
    if(state.role==='all') return allHeroes();
    return state.heroCatalog.flatMap(h=>{
      const lane=roleEntry(h,state.role);
      return lane?[{
        id:h.id,
        name:h.name,
        enName:h.enName,
        aliases:Array.isArray(h.aliases)?h.aliases:[],
        avatar:lane.avatar||h.avatar||'',
        tier:lane.tier,
        origin:lane.origin||'native',
        detailHeroId:lane.detailHeroId
      }]:[];
    });
  }
  function normalizeSearch(value){
    return String(value||'')
      .normalize('NFKD')
      .toLocaleLowerCase('en')
      .replace(/[\s\-_'’.’·]/g,'');
  }
  function heroMatches(h,query){
    const q=normalizeSearch(query);
    if(!q) return true;
    return [h.name,h.enName,h.id,...(h.aliases||[])].some(value=>normalizeSearch(value).includes(q));
  }
  function searchedHeroes(){
    const heroes=roleHeroesRaw();
    const query=state.query.trim();
    return query ? heroes.filter(h=>heroMatches(h,query)) : heroes;
  }
  function normalizeFilter(role,filter){
    const value=String(filter||'all');
    if(role==='all') return ['all','single','multi'].includes(value)?value:'all';
    return ['all',...tierOrder].includes(value)?value:'all';
  }
  function roleHeroes(){
    const heroes=searchedHeroes();
    const filter=normalizeFilter(state.role,state.filter);
    if(filter==='all') return heroes;
    if(state.role==='all') return heroes.filter(h=>filter==='multi'?h.roles.length>1:h.roles.length===1);
    return heroes.filter(h=>h.tier===filter);
  }

  function buildUrl({role=state.role,heroId=state.heroId,query=state.query,filter=state.filter}={}){
    const p=new URLSearchParams();
    if(role && role!=='all') p.set('role',role);
    if(heroId) p.set('hero',heroId);
    if(query) p.set('q',query);
    const safeFilter=normalizeFilter(role,filter);
    if(safeFilter!=='all') p.set('filter',safeFilter);
    const qs=p.toString();
    return `${location.pathname}${qs?`?${qs}`:''}`;
  }
  function makeHistoryState(view=state.heroId?'detail':'list',scrollY=0){
    return {wrgHeroes:true,view,role:state.role,heroId:view==='detail'?state.heroId:'',query:state.query,filter:state.filter,scrollY:Number(scrollY)||0};
  }
  function syncUrl(view=state.heroId?'detail':'list',scrollY=state.heroId?0:window.scrollY){
    history.replaceState(makeHistoryState(view,scrollY),'',buildUrl());
  }
  function openHero(heroId){
    heroId=resolveHeroId(heroId);
    if(!heroId) return;
    history.replaceState(makeHistoryState('list',window.scrollY),'',buildUrl({heroId:''}));
    state.heroId=heroId;
    history.pushState(makeHistoryState('detail',0),'',buildUrl());
    renderDetail();
  }
  function restoreListScroll(scrollY){
    const y=Number(scrollY)||0;
    requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,y)));
  }
  function syncSearchUI(){
    const input=$('#heroSearchInput');
    const clear=$('#heroSearchClear');
    const status=$('#heroSearchStatus');
    if(input && input.value!==state.query) input.value=state.query;
    if(clear) clear.hidden=!state.query;
    if(status){
      const total=roleHeroesRaw().length;
      const visible=roleHeroes().length;
      const isLimited=Boolean(state.query)||state.filter!=='all';
      status.textContent=isLimited?`顯示 ${visible} / ${total} 位英雄`:`共 ${total} 位英雄`;
    }
  }

  function resetHeroConditions({focus=true}={}){
    state.query='';
    state.filter='all';
    state.heroId='';
    const input=$('#heroSearchInput');
    if(input) input.value='';
    syncUrl('list',window.scrollY);
    renderOverview();
    if(focus && input) input.focus();
  }
  function noResultHTML(){
    const query=state.query.trim();
    const detail=query?`目前沒有名稱包含「${query.replace(/[<>&\"']/g,'')}」且符合篩選條件的英雄。`:'目前沒有符合所選條件的英雄。';
    return `<div class="hero-search-no-result" role="status"><strong>沒有符合條件的英雄</strong><p>${detail}</p><button type="button" class="hero-result-reset">清除搜尋與篩選</button></div>`;
  }
  function bindHeroImageFallbacks(root=document){
    $$('img[data-hero-fallback]',root).forEach(img=>{
      const fallback=()=>{
        if(!img.isConnected) return;
        const span=document.createElement('span');
        span.className=img.dataset.fallbackClass||'tier-hero-placeholder';
        span.textContent=img.dataset.fallbackLetter||'?';
        span.setAttribute('aria-label',`${img.alt||'英雄'}頭像暫時無法載入`);
        img.replaceWith(span);
      };
      img.addEventListener('error',fallback,{once:true});
      if(img.complete && img.naturalWidth===0) fallback();
    });
  }
  function favoriteButtonHTML(heroId, heroName, detail=false){
    const label=detail?'收藏英雄':'收藏';
    return `<button type="button" class="hero-favorite-button ${detail?'detail':''}" data-favorite-hero="${heroId}" data-hero-name="${heroName}" aria-label="${label} ${heroName}" aria-pressed="false"><span aria-hidden="true">☆</span>${detail?'<b>收藏英雄</b>':''}</button>`;
  }
  async function syncFavoriteButtons(root=document){
    const buttons=$$('[data-favorite-hero]',root);
    if(!buttons.length || !window.WRGAuth) return;
    await window.WRGAuth.ready;
    buttons.forEach(button=>{
      const name=button.dataset.heroName||'英雄';
      const active=window.WRGAuth.isFavorite(button.dataset.favoriteHero);
      button.classList.toggle('is-favorite',active);
      button.setAttribute('aria-pressed',String(active));
      const icon=button.querySelector('span');
      const text=button.querySelector('b');
      if(icon) icon.textContent=active?'★':'☆';
      if(text) text.textContent=active?'已收藏':'收藏英雄';
      button.setAttribute('aria-label',`${active?'取消收藏':'收藏'} ${name}`);
    });
  }
  function bindFavoriteButtons(root=document){
    $$('[data-favorite-hero]',root).forEach(button=>button.addEventListener('click',async event=>{
      event.preventDefault();
      event.stopPropagation();
      if(!window.WRGAuth) return;
      await window.WRGAuth.ready;
      if(!window.WRGAuth.configured || !window.WRGAuth.user){
        location.href=window.WRGAuth.memberUrl(window.WRGAuth.relativeCurrentUrl());
        return;
      }
      button.disabled=true;
      try{
        await window.WRGAuth.toggleFavorite(button.dataset.favoriteHero);
        await syncFavoriteButtons(document);
      }catch(error){
        console.error(error);
        window.alert('收藏操作失敗，請稍後再試。');
      }finally{
        button.disabled=false;
      }
    }));
    syncFavoriteButtons(root);
  }
  function bindOverviewActions(content){
    $$('.tier-hero-card[data-hero]',content).forEach(btn=>btn.addEventListener('click',()=>openHero(btn.dataset.hero)));
    $$('.hero-result-reset',content).forEach(btn=>btn.addEventListener('click',()=>resetHeroConditions()));
    bindHeroImageFallbacks(content);
    bindFavoriteButtons(content);
  }

  function renderRoleTabs(){
    $$('.hero-role-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.role===state.role));
  }

  function renderFilterBar(){
    const shell=$('#heroFilterBar');
    if(!shell) return;
    state.filter=normalizeFilter(state.role,state.filter);
    const source=searchedHeroes();
    const options=state.role==='all'
      ? [
          {value:'all',label:'全部英雄',count:source.length},
          {value:'single',label:'單一路線',count:source.filter(h=>h.roles.length===1).length},
          {value:'multi',label:'多路線',count:source.filter(h=>h.roles.length>1).length}
        ]
      : [
          {value:'all',label:'全部 Tier',count:source.length},
          ...tierOrder.map(tier=>({value:tier,label:`${tier} Tier`,count:source.filter(h=>h.tier===tier).length}))
        ];
    const limited=Boolean(state.query)||state.filter!=='all';
    shell.innerHTML=`<span class="hero-filter-label">條件篩選</span><div class="hero-filter-options" role="group" aria-label="${state.role==='all'?'依可用路線數篩選':'依 Tier 篩選'}">${options.map(option=>`<button type="button" class="hero-filter-chip ${option.value===state.filter?'active':''}" data-filter="${option.value}" aria-pressed="${option.value===state.filter}"><span>${option.label}</span><small>${option.count}</small></button>`).join('')}</div>${limited?'<button type="button" class="hero-filter-reset">重設條件</button>':''}`;
    $$('.hero-filter-chip',shell).forEach(btn=>btn.addEventListener('click',()=>{
      const next=normalizeFilter(state.role,btn.dataset.filter);
      if(next===state.filter && !state.heroId) return;
      state.filter=next;
      state.heroId='';
      syncUrl('list',window.scrollY);
      renderOverview();
    }));
    $('.hero-filter-reset',shell)?.addEventListener('click',()=>resetHeroConditions());
  }

  function renderOverview(){
    setHeroListSeo();
    const heroes = roleHeroes();
    const content = $('#heroContent');
    renderFilterBar();
    syncSearchUI();
    if(state.role==='all'){
      content.innerHTML = `<section class="hero-overview-shell all-heroes-shell">
        <div class="hero-overview-head"><div><span class="eyebrow">ALL CHAMPIONS</span><h2>全英雄列表</h2><p>同一英雄只顯示一次；下方位置標籤代表目前遊戲內可選路線。已完成詳細資料的英雄可直接點入。</p></div><span class="hero-overview-count">${heroes.length}</span></div>
        ${heroes.length?`<div class="tier-hero-grid all-hero-grid">${heroes.map(h=>{
          const media=`<span class="tier-hero-avatar-wrap">${h.avatar?`<img src="${h.avatar}" alt="${h.name}" class="tier-hero-avatar" loading="lazy" data-hero-fallback data-fallback-letter="${h.name.slice(0,1)}">`:`<span class="tier-hero-placeholder">${h.name.slice(0,1)}</span>`}</span>`;
          const roleBadges=`<span class="all-role-badges">${h.roles.map(r=>`<i>${roleNames[r]}</i>`).join('')}</span>`;
          const label=`${media}<strong>${h.name}</strong><small>${h.enName||''}</small>${roleBadges}`;
          const detail=h.detailIds?.[0]||'';
          const card=detail?`<button class="tier-hero-card all-hero-card" data-hero="${detail}">${label}</button>`:`<div class="tier-hero-card all-hero-card is-pending" title="詳細攻略待補">${label}</div>`;
          return `<div class="tier-hero-card-wrap">${card}</div>`;
        }).join('')}</div>`:noResultHTML()}
      </section>`;
      bindOverviewActions(content);
      return;
    }
    const title = roleNames[state.role] || '英雄';
    const meta = state.laneMeta?.[state.role] || {};
    const limited=Boolean(state.query)||state.filter!=='all';
    const nativeCount = limited?heroes.filter(h=>h.origin!=='cross').length:Number(meta.nativeCount ?? heroes.filter(h=>h.origin!=='cross').length);
    const crossCount = limited?heroes.filter(h=>h.origin==='cross').length:Number(meta.crossCount ?? heroes.filter(h=>h.origin==='cross').length);
    const groups = tierOrder.map(tier => {
      const members = heroes.filter(h=>h.tier===tier);
      if(!members.length) return '';
      return `<section class="tier-overview-section">
        <div class="tier-overview-heading"><span class="tier-overview-badge tier-${tier.toLowerCase().replace('+','p')}">${tier}</span><strong>${tier} Tier</strong><small>${members.length} 位英雄</small></div>
        <div class="tier-hero-grid">
          ${members.map(h=>{
            const avatar=h.avatar||'';
            const media=`<span class="tier-hero-avatar-wrap">${avatar?`<img src="${avatar}" alt="${h.name}" class="tier-hero-avatar" loading="lazy" data-hero-fallback data-fallback-letter="${h.name.slice(0,1)}">`:`<span class="tier-hero-placeholder">${h.name.slice(0,1)}</span>`}</span>`;
            const label=`${media}<strong>${h.name}</strong><small>${h.enName}</small>${h.origin==='cross'?'<span class="tier-cross-tag">跨路</span>':''}`;
            const card=h.detailHeroId
              ? `<button class="tier-hero-card" data-hero="${h.detailHeroId}">${label}</button>`
              : `<div class="tier-hero-card is-pending" title="完整攻略待補">${label}</div>`;
            return `<div class="tier-hero-card-wrap">${card}</div>`;
          }).join('')}
        </div>
      </section>`;
    }).join('');
    const countCopy = crossCount>0 ? `原生 ${nativeCount}＋跨路 ${crossCount}` : `原生 ${nativeCount}`;
    content.innerHTML = `<section class="hero-overview-shell">
      <div class="hero-overview-head"><div><span class="eyebrow">${state.role==='duo'?'DRAGON LANE':title.toUpperCase()}</span><h2>${title} Tier 總覽</h2><p>各路線獨立評級 · ${countCopy}${meta.detailComplete?' · 詳細攻略已開放':(state.role==='duo'?' · 已完成英雄可點擊查看詳細資料':(meta.avatarComplete?' · 英雄頭像已完成 · 詳細攻略後續補齊':' · 頭像與詳細資料後續補齊'))}</p></div><span class="hero-overview-count">${heroes.length}</span></div>
      ${groups || ((state.query||state.filter!=='all')?noResultHTML():`<div class="hero-profile-empty">${title}尚未匯入英雄資料。</div>`)}
    </section>`;
    bindOverviewActions(content);
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

  function renderStructuredPriority(hero){
    const abilities=Object.fromEntries((hero.abilities||[]).map(a=>[a.key,a]));
    const priority=getSkillPriority(hero).filter(key=>['Q','W','E'].includes(key));
    return `<div class="yone-priority-icons">${priority.map((key,index)=>{
      const ability=abilities[key]||{key};
      return `<span class="yone-priority-item">
        ${abilityMedia(ability,'yone-priority-placeholder')}
        <i>${index+1}</i>
      </span>${index<priority.length-1?'<b>＞</b>':''}`;
    }).join('')}</div>`;
  }

  function renderStructuredSkillGrid(hero){
    const abilities=Object.fromEntries((hero.abilities||[]).map(a=>[a.key,a]));
    const sequence=Array.isArray(hero.skillSequence)?hero.skillSequence:[];
    const levels=Array.from({length:15},(_,i)=>i+1);
    const labelMap={Q:'1',W:'2',E:'3',R:'4'};

    const rows=['Q','W','E','R'].map(key=>`
      <div class="yone-level-row">
        <div class="yone-level-skill">
          ${abilityMedia(abilities[key]||{},'yone-level-placeholder')}
          <span>${labelMap[key]}</span>
        </div>
        ${levels.map((level,index)=>`
          <div class="yone-level-cell ${sequence[index]===key?'active':''}" aria-label="等級 ${level}">
            ${sequence[index]===key?'<i></i>':''}
          </div>
        `).join('')}
      </div>
    `).join('');

    return `<div class="yone-level-block">
      <div class="yone-level-title">
        <strong>技能加點順序</strong>
        ${renderStructuredPriority(hero)}
      </div>
      <div class="yone-level-table">
        <div class="yone-level-row header">
          <div class="yone-level-skill title">1～15等</div>
          ${levels.map(level=>`<div class="yone-level-cell">${level}</div>`).join('')}
        </div>
        ${rows}
      </div>
    </div>`;
  }

  function renderStructuredSkillInfo(hero){
    const abilities=Object.fromEntries((hero.abilities||[]).map(a=>[a.key,a]));
    const labels={P:'被動',Q:'1技',W:'2技',E:'3技',R:'4技'};

    return `<div class="yone-skill-list">${['P','Q','W','E','R'].map(key=>{
      const ability=abilities[key]||{};
      return `<article class="yone-skill-row">
        <div class="yone-skill-image">${abilityMedia(ability,'yone-skill-placeholder')}</div>
        <div class="yone-skill-text">
          <strong>${labels[key]}｜${safeText(ability.title)}</strong>
          <p>${safeText(ability.summary)}</p>
        </div>
      </article>`;
    }).join('')}</div>`;
  }

  function renderStructuredCombos(hero){
    const combos=Array.isArray(hero.combos)?hero.combos:[];
    const abilities=Object.fromEntries((hero.abilities||[]).map(a=>[a.key,a]));
    const names={P:'被動',Q:'1技',Q3:'1技擊飛',W:'2技',E:'3技',E1:'3技第一段',E2:'返回',R:'4技',AA:'普攻'};
    const actionMarks={FLASH:'閃',F:'閃',IGNITE:'燃',EXHAUST:'虛',SMITE:'重',GHOST:'鬼',BARRIER:'盾',HEAL:'療',MOVE:'移',ITEM:'裝',WAIT:'等',KILL:'收'};

    function renderStep(rawStep){
      const isObject=rawStep&&typeof rawStep==='object';
      const step=isObject?String(rawStep.key||'').toUpperCase():String(rawStep||'').toUpperCase();
      const label=isObject&&rawStep.label?safeText(rawStep.label):(names[step]||step);
      if(step==='AA'){
        return `<span class="yone-combo-step"><i class="yone-combo-aa">A</i><small>${label||'普攻'}</small></span>`;
      }
      if(actionMarks[step]){
        return `<span class="yone-combo-step"><i class="yone-combo-action">${actionMarks[step]}</i><small>${label}</small></span>`;
      }
      const baseKey=step==='Q3'?'Q':(step==='E1'||step==='E2')?'E':step;
      const ability=abilities[baseKey];
      if(!ability){
        return `<span class="yone-combo-step"><i class="yone-combo-action">${safeText(step).slice(0,1)||'?'}</i><small>${label}</small></span>`;
      }
      return `<span class="yone-combo-step">
        ${abilityMedia(ability,'yone-combo-placeholder')}
        <small>${label}</small>
      </span>`;
    }

    return `<div class="yone-combo-list">
      <div class="yone-subheading">技能連招</div>
      ${combos.map(combo=>`<details class="yone-combo-item">
        <summary>${safeText(combo.name)}<i>⌄</i></summary>
        <div class="yone-combo-content">
          <div class="yone-combo-steps">
            ${combo.steps.map((step,index)=>`${renderStep(step)}${index<combo.steps.length-1?'<b>→</b>':''}`).join('')}
          </div>
          <p>${safeText(combo.note)}</p>
        </div>
      </details>`).join('')}
    </div>`;
  }

  function renderStructuredSkillSection(hero){
    return `<section class="hero-section yone-structured-skills">
      <div class="hero-section-title"><h3>技能</h3><span>Skills</span></div>
      <div class="yone-subheading">技能說明</div>
      ${renderStructuredSkillInfo(hero)}
      ${renderStructuredSkillGrid(hero)}
      ${renderStructuredCombos(hero)}
    </section>`;
  }

  function renderStructuredBuildSection(hero,items,boots){
    const starterIds=Array.isArray(hero.starterItems)?hero.starterItems:[];
    const starter=starterIds.map(id=>byId(state.items,id)).find(Boolean)||firstBasicComponent(items[0]);
    const coreIds=Array.isArray(hero.coreItems)?hero.coreItems:[];
    const coreItems=coreIds.map(id=>byId(state.items,id)).filter(Boolean);
    const isChogath=baseIdOf(hero)==='chogath';
    const secondTierBoot=isChogath
      ? (boots.find(x=>Number(x?.tier)===3 || x?.stage==='三級鞋')||boots[0]||null)
      : (resolveTier2Boot(boots[0])||boots[0]||null);
    const sixItems=[...items.slice(0,5),secondTierBoot].filter(Boolean).slice(0,6);

    function circleItem(item){
      if(!item) return '';
      return `<div class="yone-item">
        <div class="yone-item-circle">${buildMiniCard(item)}</div>
        <small>${safeText(item.name)}</small>
      </div>`;
    }

    return `<section class="hero-section yone-structured-build">
      <div class="hero-section-title"><h3>裝備配置</h3><span>Build</span></div>

      <div class="yone-build-top">
        <div class="yone-build-group">
          <strong>起手裝備</strong>
          ${circleItem(starter)}
        </div>
        <div class="yone-build-group">
          <strong>${isChogath?'三級鞋':'鞋子'}</strong>
          ${circleItem(secondTierBoot)}
        </div>
        <div class="yone-build-group core">
          <strong>核心三件裝</strong>
          <div class="yone-core-items">${coreItems.map(circleItem).join('')}</div>
        </div>
      </div>

      <div class="yone-six-build">
        <div class="yone-subheading">六件裝備</div>
        <div class="yone-six-grid">${sixItems.map(circleItem).join('')}</div>
      </div>
    </section>`;
  }

  function renderStructuredMatchups(hero){
    return `<section class="hero-section">
      <div class="hero-section-title"><h3>對局</h3><span>Matchup</span></div>
      <div class="matchup-grid yone-no-ban">
        <div class="matchup-box good">
          <span>較好打</span>
          <div>${(hero.matchups?.good||[]).map(matchupChip).join('')}</div>
        </div>
        <div class="matchup-box bad">
          <span>較難打</span>
          <div>${(hero.matchups?.bad||[]).map(matchupChip).join('')}</div>
        </div>
      </div>
    </section>`;
  }

  function renderSuitableSupports(hero){
    const pairs=Array.isArray(hero.suitableSupports)?hero.suitableSupports:[];
    if(hero.roleId!=='duo' || !pairs.length) return '';
    return `<section class="hero-section duo-support-section">
      <div class="hero-section-title"><h3>合適輔助</h3><span>Support Synergy</span></div>
      <div class="duo-support-grid">${pairs.map(pair=>`<article class="duo-support-card">${matchupChip(pair.name)}<p>${safeText(pair.reason)}</p></article>`).join('')}</div>
    </section>`;
  }


  function renderMatchupAdjustments(hero){
    const config=hero?.matchupAdjustments;
    const situations=Array.isArray(config?.situations)?config.situations:[];
    if(!situations.length) return '';

    function assetCard(type,id,side){
      const source=type==='rune'?state.runes:state.items;
      const asset=byId(source,id);
      if(!asset) return `<div class="matchup-adjust-asset missing"><span>${side==='from'?'原配置':'調整後'}</span><strong>資料待補</strong></div>`;
      return `<div class="matchup-adjust-asset ${side}">
        <span>${side==='from'?'原配置':'調整後'}</span>
        ${safeIcon(asset)?`<img src="${safeIcon(asset)}" alt="${safeText(asset.name)}" loading="lazy">`:''}
        <strong>${safeText(asset.name)}</strong>
      </div>`;
    }

    function renderChange(change){
      return `<article class="matchup-adjust-change">
        <div class="matchup-adjust-change-head"><b>${safeText(change.title)}</b><span>${change.type==='rune'?'符文調整':'裝備調整'}</span></div>
        <div class="matchup-adjust-swap">
          ${assetCard(change.type,change.fromId,'from')}
          <i aria-hidden="true">→</i>
          ${assetCard(change.type,change.toId,'to')}
        </div>
        <p><b>什麼時候換：</b>${safeText(change.condition)}</p>
        <p><b>為什麼：</b>${safeText(change.reason)}</p>
      </article>`;
    }

    return `<section class="hero-section matchup-adjust-section">
      <div class="hero-section-title"><h3>對局調整</h3><span>Adaptive Build</span></div>
      <p class="matchup-adjust-intro">${safeText(config.intro)}</p>
      <div class="matchup-adjust-tabs" role="tablist" aria-label="吉茵珂絲對局調整情境">
        ${situations.map((x,i)=>`<button type="button" class="matchup-adjust-tab ${i===0?'active':''}" data-adjustment-target="${safeText(x.id)}" role="tab" aria-selected="${i===0?'true':'false'}"><b>${safeText(x.label)}</b></button>`).join('')}
      </div>
      <div class="matchup-adjust-panels">
        ${situations.map((x,i)=>`<article class="matchup-adjust-panel ${i===0?'active':''}" data-adjustment-panel="${safeText(x.id)}" ${i===0?'':'hidden'}>
          <div class="matchup-adjust-panel-head"><strong>${safeText(x.label)}</strong><span>優先度：${safeText(x.priority)}</span></div>
          <p class="matchup-adjust-trigger"><b>適用情況：</b>${safeText(x.trigger)}</p>
          ${Array.isArray(x.changes)&&x.changes.length?`<div class="matchup-adjust-change-list">${x.changes.map(renderChange).join('')}</div>`:`<div class="matchup-adjust-nochange"><b>✓ ${safeText(x.keepTitle||'維持標準配置')}</b><p>${safeText(x.keepText)}</p></div>`}
          ${Array.isArray(x.changes)&&x.changes.length&&x.keepText?`<div class="matchup-adjust-keep"><b>${safeText(x.keepTitle)}</b><p>${safeText(x.keepText)}</p></div>`:''}
          ${x.warning?`<div class="matchup-adjust-warning"><b>注意：</b>${safeText(x.warning)}</div>`:''}
        </article>`).join('')}
      </div>
    </section>`;
  }

  function bindMatchupAdjustments(root=document){
    const tabs=$$('.matchup-adjust-tab',root);
    if(!tabs.length) return;
    tabs.forEach(tab=>tab.addEventListener('click',()=>{
      const target=tab.dataset.adjustmentTarget;
      tabs.forEach(x=>{ const active=x===tab; x.classList.toggle('active',active); x.setAttribute('aria-selected',active?'true':'false'); });
      $$('.matchup-adjust-panel',root).forEach(panel=>{
        const active=panel.dataset.adjustmentPanel===target;
        panel.classList.toggle('active',active);
        panel.hidden=!active;
      });
    }));
  }


  function resetHeroDetailScroll(){
    const goTop=()=>{
      window.scrollTo(0,0);
      document.documentElement.scrollTop=0;
      document.body.scrollTop=0;
      const content=$('#heroContent');
      if(content) content.scrollTop=0;
    };
    goTop();
    requestAnimationFrame(()=>requestAnimationFrame(goTop));
    setTimeout(goTop,40);
  }

  function renderDetail(){
    const resolvedHeroId=resolveHeroId(state.heroId);
    if(resolvedHeroId && resolvedHeroId!==state.heroId){ state.heroId=resolvedHeroId; syncUrl('detail',0); }
    const hero=state.heroes.find(h=>h.id===state.heroId);
    if(!hero){ state.heroId=''; syncUrl('list',0); renderOverview(); return; }
    setHeroDetailSeo(hero);
    const runes=(hero.runes||[]).map(id=>byId(state.runes,id));
    const items=(hero.items||[]).map(id=>byId(state.items,id));
    const boots=(hero.boots||[]).map(id=>byId(state.items,id));
    const spells=(hero.spells||[]).map(id=>byId(state.spells,id));
    const tags=(hero.tags||[]).map(t=>`<span>${t}</span>`).join('');
    const catalogHero=catalogHeroByBaseId(baseIdOf(hero));
    const profiles=(catalogHero?.roles||[]).map(role=>state.heroes.find(x=>x.id===role.detailHeroId)).filter(Boolean);
    const laneSwitch=profiles.length>1?`<div class="hero-lane-switch">${profiles.map(x=>`<button data-profile="${x.id}" class="${x.id===hero.id?'active':''}">${roleNames[x.roleId]||x.role}</button>`).join('')}</div>`:'';
    const runeHTML=runes.map((x,i)=>`<div class="hero-rune-card ${i===0?'keystone':''}">${x?`<img src="${safeIcon(x)}" alt="${x.name}"><div><small>${i===0?'關鍵符文':'副符文'}</small><strong>${x.name}</strong><p>${x.tag||''}</p></div>`:'<span>資料待補</span>'}</div>`).join('');
    const spellHTML=spells.map(x=>buildMiniCard(x,'spell')).join('');
    const starter=firstBasicComponent(items[0]);
    const starterHTML=buildMiniCard(starter,'starter');
    const coreHTML=items.slice(0,3).map((x,i)=>`<div class="hero-build-slot"><b>${i+1}</b>${buildMiniCard(x)}</div>`).join('');
    const bootHTML=boots.map((x,i)=>`<div class="hero-build-slot boot"><b>${i===0?'II':'III'}</b>${buildMiniCard(x,'boot')}</div>`).join('<div class="build-arrow">→</div>');
    const finalHTML=[...items.slice(0,5),boots[1]].map((x,i)=>`<div class="hero-build-slot final"><b>${i<5?i+1:'III'}</b>${buildMiniCard(x,i===5?'boot':'item')}</div>`).join('');
    const abilities = Array.isArray(hero.abilities) ? hero.abilities : [];
    const passive = abilities.find(x=>x.key==='P');
    const activeAbilities = abilities.filter(x=>x.key!=='P');
    const abilityHTML = activeAbilities.map(x=>`<div class="ability-card ability-${(x.key||'').toLowerCase()}"><div class="ability-head">${abilityMedia(x)}<div><small>${safeText(x.label)}</small><strong>${safeText(x.title)}</strong></div></div>${abilityVariants(x)}<p>${safeText(x.summary)}</p></div>`).join('');

    const useStructuredYone=['structured-yone-v38','structured-baron-v40'].includes(hero.detailTemplate);

    const defaultBuildSection=`<section class="hero-section"><div class="hero-section-title"><h3>裝備配置</h3><span>Build Path</span></div><div class="build-groups">${buildSet('起手裝備','開局優先',starterHTML,'starter-group')}${buildSet('三件核心裝備','核心成形',coreHTML,'core-group')}${buildSet('鞋子','二級 → 三級',`<div class="hero-boot-path">${bootHTML}</div>`,'boots-group')}${buildSet('完整成裝','5 件裝備＋三級鞋',finalHTML,'final-group')}</div></section>`;

    const defaultSkillSection=`
      <section class="hero-section"><div class="hero-section-title"><h3>技能優先級</h3><span>Skill Priority</span></div>${renderSkillPriority(hero)}</section>
      <section class="hero-section"><div class="hero-section-title"><h3>技能加點</h3><span>Lv.1 ～ Lv.15</span></div>${renderSkillGrid(hero)}</section>
      ${passive?`<section class="hero-section"><div class="hero-section-title"><h3>被動</h3><span>Passive</span></div><div class="passive-feature">${abilityMedia(passive,'passive-icon-placeholder')}<div><small>${safeText(passive.label)}</small><strong>${safeText(passive.title)}</strong>${abilityVariants(passive)}<p>${safeText(passive.summary)}</p></div></div></section>`:''}
      <section class="hero-section"><div class="hero-section-title"><h3>技能介紹</h3><span>Q / W / E / R</span></div><div class="ability-grid">${abilityHTML}</div></section>`;

    const defaultMatchupSection=`<section class="hero-section"><div class="hero-section-title"><h3>對局</h3><span>Matchup</span></div><div class="matchup-grid"><div class="matchup-box good"><span>較好打</span><div>${hero.matchups.good.map(matchupChip).join('')}</div></div><div class="matchup-box bad"><span>較難打</span><div>${hero.matchups.bad.map(matchupChip).join('')}</div></div><div class="matchup-box ban"><span>優先 Ban</span><div>${matchupChip(hero.matchups.ban)}</div></div></div></section>`;

    const buildSection=useStructuredYone
      ? renderStructuredBuildSection(hero,items,boots)
      : defaultBuildSection;
    const skillSection=useStructuredYone
      ? renderStructuredSkillSection(hero)
      : defaultSkillSection;
    const matchupSection=useStructuredYone
      ? renderStructuredMatchups(hero)
      : defaultMatchupSection;
    const suitableSupportSection=renderSuitableSupports(hero);
    const matchupAdjustmentSection=renderMatchupAdjustments(hero);

    $('#heroContent').innerHTML=`
      <div class="hero-detail-toolbar"><button id="backToTier" class="hero-back-button">← 返回 ${state.role==='all'?'ALL 英雄列表':roleNames[state.role]+' Tier 總覽'}</button><div class="hero-detail-actions">${laneSwitch}${favoriteButtonHTML(baseIdOf(hero),hero.name,true)}<button id="shareHeroGuide" class="hero-share-button" type="button">分享攻略</button></div></div>
      <section class="hero-profile">
        <section class="hero-profile-hero">
          ${hero.avatar ? `<img class="hero-avatar hero-avatar-image" src="${hero.avatar}" alt="${hero.name}" loading="lazy" data-hero-fallback data-fallback-letter="${hero.name.slice(0,1)}" data-fallback-class="hero-avatar hero-avatar-placeholder">` : `<div class="hero-avatar hero-avatar-placeholder"><span>${hero.name.slice(0,1)}</span></div>`}
          <div class="hero-title-block"><div class="hero-title-row"><h2>${hero.name}</h2><span class="tier-badge-large">${hero.tier}</span></div><div class="hero-en">${hero.enName} · ${hero.role}</div><div class="hero-position">${hero.position}</div><div class="hero-tags">${tags}</div></div>
        </section>
        <section class="hero-summary-box"><span>一句話玩法</span><p>${hero.summary}</p></section>
        <details class="hero-section hero-rating-details"><summary><span><b>綜合評分</b><small>7.2b · 點擊展開</small></span><i>⌄</i></summary><div class="hero-ratings rating-details-body">${renderRatings(hero)}</div></details>
        <section class="hero-section"><div class="hero-section-title"><h3>召喚師技能＋符文</h3><span>Summoner / Runes</span></div><div class="summoner-rune-layout"><div class="summoner-box"><div class="subsection-label">召喚師技能</div><div class="hero-spells">${spellHTML}</div></div><div class="rune-box"><div class="subsection-label">符文</div><div class="hero-runes">${runeHTML}</div></div></div></section>
        ${buildSection}
        ${matchupAdjustmentSection}
        ${skillSection}
        ${matchupSection}
        ${suitableSupportSection}
        ${Array.isArray(hero.mechanics)&&hero.mechanics.length?`<section class="hero-section"><div class="hero-section-title"><h3>${hero.mechanicsTitle||'特殊機制'}</h3><span>Champion Mechanic</span></div><div class="stack-grid">${hero.mechanics.map(x=>`<div class="stack-card">${x.icon?`<img src="${x.icon}" alt="${x.title}" loading="lazy">`:''}${x.stacks!=null?`<strong>${x.stacks}</strong>`:''}<span>${x.title}</span><p>${x.text}</p></div>`).join('')}</div></section>`:''}
        <section class="hero-section"><div class="hero-section-title"><h3>實戰節奏</h3></div><div class="playstyle-timeline">${Object.entries(hero.playstyle).map(([k,v])=>`<div class="playstyle-step"><b>${k}</b><p>${v}</p></div>`).join('')}</div></section>
        <div class="hero-source-note">${hero.sourceNote}</div>
      </section>`;

    bindHeroImageFallbacks($('#heroContent'));
    bindFavoriteButtons($('#heroContent'));
    bindMatchupAdjustments($('#heroContent'));

    window.WRGAuth?.recordHeroView({ guideId: hero.id, heroId: baseIdOf(hero), roleId: hero.roleId })
      .catch(error => console.warn('最近瀏覽紀錄寫入失敗', error));

    $('#shareHeroGuide')?.addEventListener('click',event=>shareHeroGuide(hero,event.currentTarget));

    $('#backToTier').addEventListener('click',()=>{
      if(history.state?.wrgHeroes && history.state.view==='detail') history.back();
      else { state.heroId=''; syncUrl('list',0); renderOverview(); restoreListScroll(0); }
    });
    $$('.hero-lane-switch button').forEach(btn=>btn.addEventListener('click',()=>{ const p=state.heroes.find(x=>x.id===btn.dataset.profile); if(!p) return; state.heroId=p.id; if(state.role!=='all') state.role=p.roleId; syncUrl('detail',0); render(); }));
    resetHeroDetailScroll();
  }

  function render(){ renderRoleTabs(); if(state.heroId){ renderFilterBar(); renderDetail(); } else renderOverview(); }

  async function init(){
    window.WRGAuth?.subscribe(()=>syncFavoriteButtons(document));
    try{
      const [heroData,runeData,itemData,spellData]=await Promise.all([
        getJSON('../assets/data/heroes.json?v=82.5.0'), getJSON('../assets/data/runes.json?v=79.5.1'), getJSON('../assets/data/items.json?v=79.5.1'), getJSON('../assets/data/spells.json?v=79.5.1')
      ]);
      state.heroes=heroData.heroes||heroData||[]; state.heroCatalog=Array.isArray(heroData.heroCatalog)?heroData.heroCatalog:catalogFromLegacyLaneTiers(heroData.laneTiers||{}); state.laneMeta=heroData.laneMeta||{}; state.runes=flattenRunes(runeData); state.items=normalizeItems(itemData); state.spells=spellData;

      const params=new URLSearchParams(location.search);
      const saved=history.state?.wrgHeroes?history.state:null;
      const validRoles=['baron','jungle','mid','duo','support','all'];
      if(saved){
        if(validRoles.includes(saved.role)) state.role=saved.role;
        state.query=String(saved.query||'');
        state.filter=normalizeFilter(state.role,saved.filter);
        state.heroId=saved.view==='detail'?resolveHeroId(String(saved.heroId||'')):'';
      }else{
        if(params.get('role') && validRoles.includes(params.get('role'))) state.role=params.get('role');
        state.query=String(params.get('q')||'');
        state.filter=normalizeFilter(state.role,params.get('filter'));
        const initialHero=resolveHeroId(String(params.get('hero')||''));
        if(initialHero){
          const detailUrl=buildUrl({heroId:initialHero});
          state.heroId='';
          history.replaceState(makeHistoryState('list',0),'',buildUrl({heroId:''}));
          state.heroId=initialHero;
          history.pushState(makeHistoryState('detail',0),'',detailUrl);
        }else{
          state.heroId='';
          syncUrl('list',0);
        }
      }

      $$('.hero-role-tab').forEach(btn=>btn.addEventListener('click',()=>{
        state.role=btn.dataset.role;
        state.filter='all';
        state.heroId='';
        syncUrl('list',0);
        render();
        restoreListScroll(0);
      }));

      const searchInput=$('#heroSearchInput');
      const searchClear=$('#heroSearchClear');
      if(searchInput){
        searchInput.value=state.query;
        searchInput.addEventListener('input',()=>{
          state.query=searchInput.value.trim();
          state.heroId='';
          syncUrl('list',window.scrollY);
          renderOverview();
        });
        searchInput.addEventListener('keydown',event=>{
          if(event.key==='Escape' && state.query){
            searchInput.value='';
            state.query='';
            syncUrl('list',window.scrollY);
            renderOverview();
          }
        });
      }
      if(searchClear) searchClear.addEventListener('click',()=>{
        state.query='';
        if(searchInput){ searchInput.value=''; searchInput.focus(); }
        syncUrl('list',window.scrollY);
        renderOverview();
      });

      let scrollTimer=0;
      window.addEventListener('scroll',()=>{
        if(state.heroId) return;
        window.clearTimeout(scrollTimer);
        scrollTimer=window.setTimeout(()=>syncUrl('list',window.scrollY),80);
      },{passive:true});

      window.addEventListener('popstate',event=>{
        const entry=event.state?.wrgHeroes?event.state:null;
        const urlParams=new URLSearchParams(location.search);
        if(entry){
          state.role=validRoles.includes(entry.role)?entry.role:'all';
          state.query=String(entry.query||'');
          state.filter=normalizeFilter(state.role,entry.filter);
          state.heroId=entry.view==='detail'?resolveHeroId(String(entry.heroId||'')):'';
          render();
          if(!state.heroId) restoreListScroll(entry.scrollY||0);
          return;
        }
        state.role=validRoles.includes(urlParams.get('role'))?urlParams.get('role'):'all';
        state.query=String(urlParams.get('q')||'');
        state.filter=normalizeFilter(state.role,urlParams.get('filter'));
        state.heroId=resolveHeroId(String(urlParams.get('hero')||''));
        render();
        if(!state.heroId) restoreListScroll(0);
      });

      render();
      if(!state.heroId) restoreListScroll(saved?.scrollY||0);
    }catch(err){
      console.error(err); $('#heroContent').innerHTML='<div class="hero-profile-empty">英雄資料載入失敗。<small>請確認網站是透過 HTTP / GitHub Pages 開啟。</small></div>';
    }
  }
  init();
})();
