document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
async function getJSON(path){const r=await fetch(path);if(!r.ok)throw new Error(r.status);return r.json();}

(() => {
  const shell=document.querySelector('#homeHeroSearch');
  if(!shell) return;

  const input=shell.querySelector('#homeHeroSearchInput');
  const results=shell.querySelector('#homeHeroSearchResults');
  const dataPath=shell.dataset.json||'assets/data/heroes.json';
  const aliasMap={ryze:['符文法師']};
  let heroes=[];
  let activeIndex=-1;

  const normalizeAvatar=src=>String(src||'').replace(/^\.\.\//,'');
  const baseIdOf=x=>x?.baseId||String(x?.id||'').replace(/-(baron|jungle|mid|duo|support)$/,'');
  const normalizeSearch=value=>String(value||'').normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/[\s·・_.\-/]+/g,'');

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
      const aliases=[...(Array.isArray(hero.aliases)?hero.aliases:[]),...(aliasMap[hero.id]||[])];
      const terms=[hero.name,hero.enName,hero.id,...aliases].map(normalizeSearch).filter(Boolean);
      return {
        id:hero.id,
        name:hero.name||'',
        enName:hero.enName||'',
        avatar:normalizeAvatar(hero.avatar||roles.find(role=>role.avatar)?.avatar||''),
        detailHeroId:roles[0]?.detailHeroId||'',
        roles:roles.map(role=>role.roleId),
        searchTerms:terms
      };
    }).filter(hero=>hero.detailHeroId).sort((a,b)=>(a.enName||a.name).localeCompare(b.enName||b.name,'en',{sensitivity:'base'}));
  }

  const roleNames={baron:'巴龍路',jungle:'打野',mid:'中路',duo:'飛龍路',support:'輔助'};

  function resultLinks(){return [...results.querySelectorAll('.home-hero-search-result')];}
  function setActive(index){
    const links=resultLinks();
    if(!links.length){activeIndex=-1;input.removeAttribute('aria-activedescendant');return;}
    activeIndex=Math.max(0,Math.min(index,links.length-1));
    links.forEach((link,i)=>{
      const active=i===activeIndex;
      link.classList.toggle('is-active',active);
      link.setAttribute('aria-selected',String(active));
      if(active){input.setAttribute('aria-activedescendant',link.id);link.scrollIntoView({block:'nearest'});}
    });
  }

  function closeResults(){
    results.hidden=true;
    results.innerHTML='';
    activeIndex=-1;
    input.setAttribute('aria-expanded','false');
    input.removeAttribute('aria-activedescendant');
  }

  function renderResults(){
    const query=normalizeSearch(input.value);
    if(!query){closeResults();return;}
    const matched=heroes.filter(hero=>hero.searchTerms.some(term=>term.includes(query))).slice(0,10);
    results.hidden=false;
    input.setAttribute('aria-expanded','true');
    activeIndex=-1;
    if(!matched.length){
      results.innerHTML='<div class="home-hero-search-empty">找不到符合的英雄</div>';
      return;
    }
    results.innerHTML=matched.map((hero,index)=>`<a id="homeHeroResult${index}" class="home-hero-search-result" role="option" aria-selected="false" href="pages/heroes.html?hero=${encodeURIComponent(hero.detailHeroId)}">
      ${hero.avatar?`<img src="${hero.avatar}" alt="${hero.name}" loading="lazy">`:`<span class="home-hero-search-monogram">${hero.name.slice(0,1)}</span>`}
      <span><strong>${hero.name}</strong><small>${hero.enName?`${hero.enName} · `:''}${hero.roles.map(role=>roleNames[role]).join(' · ')}</small></span>
      <i>查看攻略 →</i>
    </a>`).join('');
  }

  input.addEventListener('input',renderResults);
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
      setActive(activeIndex<0?0:(activeIndex+1)%links.length);
    }else if(event.key==='ArrowUp'){
      event.preventDefault();
      setActive(activeIndex<0?links.length-1:(activeIndex-1+links.length)%links.length);
    }else if(event.key==='Enter' && activeIndex>=0){
      event.preventDefault();
      links[activeIndex].click();
    }
  });
  input.addEventListener('focus',()=>{if(input.value.trim())renderResults();});
  document.addEventListener('click',event=>{if(!shell.contains(event.target))closeResults();});

  getJSON(dataPath).then(data=>{heroes=uniqueSearchHeroes(data);if(input.value.trim())renderResults();}).catch(error=>{console.error(error);closeResults();});
})();
