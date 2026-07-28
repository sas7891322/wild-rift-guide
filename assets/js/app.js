document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
async function getJSON(path){const r=await fetch(path);if(!r.ok)throw new Error(r.status);return r.json();}

(() => {
  const shell=document.querySelector('#homeHeroSearch');
  if(!shell) return;

  const input=shell.querySelector('#homeHeroSearchInput');
  const results=shell.querySelector('#homeHeroSearchResults');
  const dataPath=shell.dataset.json||'assets/data/heroes.json';
  let heroes=[];

  const normalizeAvatar=src=>String(src||'').replace(/^\.\.\//,'');
  const baseIdOf=x=>x?.baseId||String(x?.id||'').replace(/-(baron|jungle|mid|duo|support)$/,'');

  function uniqueSearchHeroes(data){
    const roleOrder=['baron','jungle','mid','duo','support'];
    const map=new Map();
    for(const role of roleOrder){
      for(const hero of (data?.laneTiers?.[role]||[])){
        if(!hero?.detailHeroId) continue;
        const key=baseIdOf(hero);
        if(!map.has(key)){
          map.set(key,{
            name:hero.name||'',
            avatar:normalizeAvatar(hero.avatar),
            detailHeroId:hero.detailHeroId,
            roles:[]
          });
        }
        const item=map.get(key);
        if(!item.roles.includes(role)) item.roles.push(role);
      }
    }
    return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'zh-Hant'));
  }

  const roleNames={baron:'巴龍路',jungle:'打野',mid:'中路',duo:'飛龍路',support:'輔助'};

  function closeResults(){
    results.hidden=true;
    results.innerHTML='';
    input.setAttribute('aria-expanded','false');
  }

  function renderResults(){
    const query=input.value.trim();
    if(!query){ closeResults(); return; }
    const matched=heroes.filter(hero=>hero.name.includes(query)).slice(0,10);
    results.hidden=false;
    input.setAttribute('aria-expanded','true');
    if(!matched.length){
      results.innerHTML='<div class="home-hero-search-empty">找不到符合的英雄</div>';
      return;
    }
    results.innerHTML=matched.map(hero=>`<a class="home-hero-search-result" role="option" href="pages/heroes.html?hero=${encodeURIComponent(hero.detailHeroId)}">
      ${hero.avatar?`<img src="${hero.avatar}" alt="${hero.name}" loading="lazy">`:`<span class="home-hero-search-monogram">${hero.name.slice(0,1)}</span>`}
      <span><strong>${hero.name}</strong><small>${hero.roles.map(role=>roleNames[role]).join(' · ')}</small></span>
      <i>查看攻略 →</i>
    </a>`).join('');
  }

  input.addEventListener('input',renderResults);
  input.addEventListener('keydown',event=>{ if(event.key==='Escape'){ input.value=''; closeResults(); input.blur(); } });
  document.addEventListener('click',event=>{ if(!shell.contains(event.target)) closeResults(); });

  getJSON(dataPath).then(data=>{ heroes=uniqueSearchHeroes(data); if(input.value.trim()) renderResults(); }).catch(error=>{ console.error(error); });
})();
