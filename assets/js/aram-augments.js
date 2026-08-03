(async()=>{
  const root=document.querySelector('[data-aram-augment-root]');
  const state=document.querySelector('[data-aram-augment-state]');
  const search=document.querySelector('[data-aram-augment-search]');
  const searchState=document.querySelector('[data-aram-augment-search-state]');
  const filterRoot=document.querySelector('[data-aram-augment-filters]');
  if(!root)return;

  const escapeHtml=(value)=>String(value??'').replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]));
  let activeTag='';

  try{
    const response=await fetch('assets/data/aram/augments.json?v=80.27.0',{cache:'no-store'});
    if(!response.ok)throw new Error('Augment data load failed');
    const data=await response.json();
    const augments=Array.isArray(data.augments)?data.augments:[];
    const tagGroups=data.officialTagGroups||{};
    const tagToGroup=new Map();
    Object.entries(tagGroups).forEach(([groupKey,group])=>(group.tags||[]).forEach(tag=>tagToGroup.set(tag,groupKey)));
    const tagCounts=augments.reduce((counts,augment)=>{
      (augment.officialTags||[]).forEach(tag=>counts.set(tag,(counts.get(tag)||0)+1));
      return counts;
    },new Map());

    if(state)state.textContent=`${data.gameVersion||'7.2b'}｜共 ${augments.length} 個｜${tagCounts.size} 種官方分類`;

    if(filterRoot){
      const groupHtml=Object.entries(tagGroups).map(([groupKey,group])=>`<section class="aram-augment-filter-group" data-filter-group="${escapeHtml(groupKey)}">
        <strong>${escapeHtml(group.label||groupKey)}</strong>
        <div>${(group.tags||[]).map(tag=>`<button type="button" data-augment-filter="${escapeHtml(tag)}" aria-pressed="false"><span>${escapeHtml(tag)}</span><small>${tagCounts.get(tag)||0}</small></button>`).join('')}</div>
      </section>`).join('');
      filterRoot.innerHTML=`<div class="aram-augment-filter-all"><button type="button" class="is-active" data-augment-filter="" aria-pressed="true"><span>全部分類</span><small>${augments.length}</small></button></div>${groupHtml}`;
    }

    root.innerHTML=augments.map((augment,index)=>{
      const name=escapeHtml(augment.name);
      const effect=escapeHtml(augment.effect||'');
      const number=String(index+1).padStart(3,'0');
      const tags=Array.isArray(augment.officialTags)?augment.officialTags:[];
      const tagText=tags.join(' ');
      const searchText=`${augment.name||''} ${augment.effect||''} ${tagText}`.toLowerCase();
      const tagHtml=tags.length?`<div class="aram-augment-tags" aria-label="官方分類">${tags.map(tag=>`<button type="button" class="aram-augment-tag tag-${escapeHtml(tagToGroup.get(tag)||'other')}" data-card-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join('')}</div>`:'';
      return `<article class="aram-augment-card" data-aram-augment-entry data-tags="${escapeHtml(tags.join('|'))}" data-search-text="${escapeHtml(searchText)}"><span>${number}</span><div><strong>${name}</strong>${tagHtml}<p>${effect}</p></div></article>`;
    }).join('');

    const syncFilterButtons=()=>{
      if(!filterRoot)return;
      filterRoot.querySelectorAll('[data-augment-filter]').forEach(button=>{
        const selected=(button.dataset.augmentFilter||'')===activeTag;
        button.classList.toggle('is-active',selected);
        button.setAttribute('aria-pressed',selected?'true':'false');
      });
    };

    const applyFilters=()=>{
      const query=(search?.value||'').trim().toLowerCase();
      let visible=0;
      root.querySelectorAll('[data-aram-augment-entry]').forEach(card=>{
        const tagMatch=!activeTag||(card.dataset.tags||'').split('|').includes(activeTag);
        const searchMatch=!query||(card.dataset.searchText||'').includes(query);
        const match=tagMatch&&searchMatch;
        card.hidden=!match;
        if(match)visible++;
      });
      if(searchState){
        const scope=activeTag?`「${activeTag}」`:'全部分類';
        searchState.textContent=query?`${scope}｜找到 ${visible} 個`:`${scope}｜顯示 ${visible} 個`;
      }
    };

    const setTag=(tag)=>{
      activeTag=tag||'';
      syncFilterButtons();
      applyFilters();
    };

    if(filterRoot){
      filterRoot.addEventListener('click',event=>{
        const button=event.target.closest('[data-augment-filter]');
        if(!button)return;
        setTag(button.dataset.augmentFilter||'');
      });
    }

    root.addEventListener('click',event=>{
      const button=event.target.closest('[data-card-tag]');
      if(!button)return;
      setTag(button.dataset.cardTag||'');
      filterRoot?.scrollIntoView({behavior:'smooth',block:'center'});
    });

    if(search){
      search.addEventListener('input',applyFilters,{passive:true});
      search.addEventListener('search',applyFilters,{passive:true});
    }
    syncFilterButtons();
    applyFilters();
  }catch(error){
    console.error(error);
    if(state)state.textContent='增幅裝置資料載入失敗';
    root.innerHTML='<div class="aram-tier-load-error">目前無法載入增幅裝置資料，請稍後再試。</div>';
  }
})();
