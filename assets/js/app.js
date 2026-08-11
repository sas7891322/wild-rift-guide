// Google Analytics 4
(() => {
  const measurementId = 'G-VLJH8KK4NK';
  if (window.__WRG_GA4_LOADED__) return;
  window.__WRG_GA4_LOADED__ = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
})();

document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
async function getJSON(path){const r=await fetch(path);if(!r.ok)throw new Error(r.status);return r.json();}

(() => {
  const shell=document.querySelector('#homeHeroSearch');
  if(!shell) return;

  const input=shell.querySelector('#homeHeroSearchInput');
  const results=shell.querySelector('#homeHeroSearchResults');
  const dataPath=shell.dataset.json||'assets/data/heroes.json';
  let heroes=[];
  let activeIndex=-1;

  const normalizeAvatar=src=>String(src||'').replace(/^\.\.\//,'');
  const baseIdOf=x=>x?.baseId||String(x?.id||'').replace(/-(baron|jungle|mid|duo|support)$/,'');
  const normalizeSearch=value=>String(value||'')
    .normalize('NFKD')
    .toLocaleLowerCase('en')
    .replace(/[\s\-_'’.’·]/g,'');

  function catalogFromLegacyLaneTiers(laneTiers={}){
    const roleOrder=['baron','jungle','mid','duo','support'];
    const map=new Map();
    for(const roleId of roleOrder){
      for(const hero of (laneTiers?.[roleId]||[])){
        const key=baseIdOf(hero);
        if(!map.has(key)) map.set(key,{id:key,name:hero.name||'',enName:hero.enName||'',avatar:hero.avatar||'',roles:[]});
        map.get(key).roles.push({roleId,detailHeroId:hero.detailHeroId||'',avatar:hero.avatar||''});
      }
    }
    return [...map.values()];
  }

  function uniqueSearchHeroes(data){
    const catalog=Array.isArray(data?.heroCatalog)?data.heroCatalog:catalogFromLegacyLaneTiers(data?.laneTiers||{});
    return catalog.map(hero=>{
      const roles=(hero.roles||[]).filter(role=>role.detailHeroId);
      return {
        id:hero.id||baseIdOf(hero),
        name:hero.name||'',
        enName:hero.enName||'',
        aliases:Array.isArray(hero.aliases)?hero.aliases:[],
        avatar:normalizeAvatar(hero.avatar||roles.find(role=>role.avatar)?.avatar||''),
        detailHeroId:roles[0]?.detailHeroId||'',
        roles:roles.map(role=>role.roleId)
      };
    }).filter(hero=>hero.detailHeroId).sort((a,b)=>(a.enName||a.name).localeCompare(b.enName||b.name,'en'));
  }

  const roleNames={baron:'巴龍路',jungle:'打野',mid:'中路',duo:'飛龍路',support:'輔助'};
  const heroMatches=(hero,query)=>{
    const q=normalizeSearch(query);
    if(!q) return true;
    return [hero.name,hero.enName,hero.id,...(hero.aliases||[])].some(value=>normalizeSearch(value).includes(q));
  };

  function resultLinks(){ return [...results.querySelectorAll('.home-hero-search-result')]; }

  function setActiveResult(index){
    const links=resultLinks();
    if(!links.length){ activeIndex=-1; return; }
    activeIndex=Math.max(0,Math.min(index,links.length-1));
    links.forEach((link,i)=>{
      const active=i===activeIndex;
      link.classList.toggle('is-active',active);
      link.setAttribute('aria-selected',String(active));
    });
    input.setAttribute('aria-activedescendant',links[activeIndex].id);
    links[activeIndex].scrollIntoView({block:'nearest'});
  }

  function closeResults(){
    results.hidden=true;
    results.innerHTML='';
    activeIndex=-1;
    input.setAttribute('aria-expanded','false');
    input.removeAttribute('aria-activedescendant');
  }

  function renderResults(){
    const query=input.value.trim();
    if(!query){ closeResults(); return; }
    const matched=heroes.filter(hero=>heroMatches(hero,query)).slice(0,10);
    results.hidden=false;
    activeIndex=-1;
    input.setAttribute('aria-expanded','true');
    if(!matched.length){
      results.innerHTML='<div class="home-hero-search-empty">找不到符合的英雄</div>';
      return;
    }
    results.innerHTML=matched.map((hero,index)=>`<a id="homeHeroSearchOption${index}" class="home-hero-search-result" role="option" aria-selected="false" href="pages/heroes.html?hero=${encodeURIComponent(hero.detailHeroId)}">
      ${hero.avatar?`<img src="${hero.avatar}" alt="${hero.name}" loading="lazy" data-home-hero-fallback data-fallback-letter="${hero.name.slice(0,1)}">`:`<span class="home-hero-search-monogram">${hero.name.slice(0,1)}</span>`}
      <span><strong>${hero.name}</strong><small>${[hero.enName,hero.roles.map(role=>roleNames[role]).join(' · ')].filter(Boolean).join(' · ')}</small></span>
      <i>查看攻略 →</i>
    </a>`).join('');
    results.querySelectorAll('img[data-home-hero-fallback]').forEach(img=>{ const fallback=()=>{ if(!img.isConnected) return; const span=document.createElement('span'); span.className='home-hero-search-monogram'; span.textContent=img.dataset.fallbackLetter||'?'; span.setAttribute('aria-label',`${img.alt||'英雄'}頭像暫時無法載入`); img.replaceWith(span); }; img.addEventListener('error',fallback,{once:true}); if(img.complete && img.naturalWidth===0) fallback(); });
  }

  input.addEventListener('input',renderResults);
  input.addEventListener('focus',()=>{ if(input.value.trim()) renderResults(); });
  input.addEventListener('keydown',event=>{
    const links=resultLinks();
    if(event.key==='Escape'){
      input.value='';
      closeResults();
      input.blur();
      return;
    }
    if(!links.length) return;
    if(event.key==='ArrowDown'){
      event.preventDefault();
      setActiveResult(activeIndex<links.length-1?activeIndex+1:0);
    }else if(event.key==='ArrowUp'){
      event.preventDefault();
      setActiveResult(activeIndex>0?activeIndex-1:links.length-1);
    }else if(event.key==='Enter' && activeIndex>=0){
      event.preventDefault();
      links[activeIndex].click();
    }
  });
  document.addEventListener('click',event=>{ if(!shell.contains(event.target)) closeResults(); });

  getJSON(dataPath).then(data=>{
    heroes=uniqueSearchHeroes(data);
    if(input.value.trim()) renderResults();
  }).catch(error=>{
    console.error(error);
    results.hidden=false;
    results.innerHTML='<div class="home-hero-search-empty">英雄資料載入失敗</div>';
  });
})();

(() => {
  'use strict';
  const panel = document.querySelector('#homeMemberPanel');
  const auth = window.WRGAuth;
  if (!panel || !auth) return;

  let catalog = [];
  const baseIdOf = (value) => String(value || '').replace(/-(baron|jungle|mid|duo|support)$/, '');

  function findHero(heroId) {
    const id = baseIdOf(heroId);
    return catalog.find((hero) => String(hero.id) === id) || null;
  }

  function guideId(hero, row) {
    if (row?.guide_id) return row.guide_id;
    const roleId = String(row?.role_id || '').trim();
    const role = (hero?.roles || []).find((item) => item.roleId === roleId && item.detailHeroId);
    return role?.detailHeroId || (hero?.roles || []).find((item) => item.detailHeroId)?.detailHeroId || '';
  }

  function avatarOf(hero) {
    return String(hero?.avatar || hero?.roles?.find((item) => item.avatar)?.avatar || '').replace(/^\.\.\//, '');
  }

  function renderRecent(rows) {
    const root = panel.querySelector('#homeMemberRecentList');
    if (!root) return;
    root.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement('span');
      empty.className = 'home-member-recent-empty';
      empty.textContent = '尚無最近瀏覽';
      root.appendChild(empty);
      return;
    }

    rows.slice(0, 4).forEach((row) => {
      const hero = findHero(row.hero_id);
      const id = guideId(hero, row);
      const item = document.createElement(id ? 'a' : 'span');
      item.className = 'home-member-recent-hero';
      if (id) item.href = `pages/heroes.html?hero=${encodeURIComponent(id)}`;
      const avatar = avatarOf(hero);
      if (avatar) {
        const img = document.createElement('img');
        img.src = avatar;
        img.alt = hero?.name || row.hero_id || '英雄';
        img.loading = 'lazy';
        img.addEventListener('error', () => {
          img.replaceWith(document.createTextNode(String(hero?.name || row.hero_id || '?').slice(0, 1)));
        }, { once: true });
        item.appendChild(img);
      } else {
        item.textContent = String(hero?.name || row.hero_id || '?').slice(0, 1);
      }
      item.title = hero?.name || row.hero_id || '英雄';
      root.appendChild(item);
    });
  }

  function render() {
    if (!auth.user) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const name = auth.displayName();
    const avatar = panel.querySelector('#homeMemberAvatar');
    const greeting = panel.querySelector('#homeMemberGreeting');
    const favoriteCount = panel.querySelector('#homeMemberFavoriteCount');
    const recentCount = panel.querySelector('#homeMemberRecentCount');
    if (avatar) avatar.textContent = auth.avatarLetter();
    if (greeting) greeting.textContent = `${name}，歡迎回來`;
    if (favoriteCount) favoriteCount.textContent = String((auth.favorites || []).length);
    if (recentCount) recentCount.textContent = String((auth.recentViews || []).length);
    renderRecent(auth.recentViews || []);
  }

  async function loadCatalog() {
    try {
      const response = await fetch('assets/data/heroes.json?v=79.5.1', { cache: 'force-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      catalog = Array.isArray(data.heroCatalog) ? data.heroCatalog : [];
    } catch (error) {
      console.warn('首頁會員英雄資料載入失敗', error);
    }
    render();
  }

  auth.subscribe(render);
  document.addEventListener('wrg:memberdatachange', render);
  Promise.all([auth.ready, loadCatalog()]).then(render);
})();

