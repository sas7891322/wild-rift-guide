(async()=>{
  const root=document.querySelector('[data-aram-augment-root]');
  const state=document.querySelector('[data-aram-augment-state]');
  const search=document.querySelector('[data-aram-augment-search]');
  const searchState=document.querySelector('[data-aram-augment-search-state]');
  if(!root)return;
  const escapeHtml=(value)=>String(value??'').replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
  try{
    const response=await fetch('assets/data/aram/augments.json?v=80.23.0',{cache:'no-store'});
    if(!response.ok)throw new Error('Augment data load failed');
    const data=await response.json();
    const augments=Array.isArray(data.augments)?data.augments:[];
    if(state)state.textContent=`${data.gameVersion||'7.2b'}｜共 ${augments.length} 個`;
    root.innerHTML=augments.map((augment,index)=>{
      const name=escapeHtml(augment.name);
      const effect=escapeHtml(augment.effect||'');
      const number=String(index+1).padStart(3,'0');
      const searchText=`${augment.name||''} ${augment.effect||''}`.toLowerCase();
      return `<article class="aram-augment-card" data-aram-augment-entry data-search-text="${escapeHtml(searchText)}"><span>${number}</span><div><strong>${name}</strong><p>${effect}</p></div></article>`;
    }).join('');

    const applySearch=()=>{
      const query=(search?.value||'').trim().toLowerCase();
      let visible=0;
      root.querySelectorAll('[data-aram-augment-entry]').forEach(card=>{
        const match=!query||(card.dataset.searchText||'').includes(query);
        card.hidden=!match;
        if(match)visible++;
      });
      if(searchState)searchState.textContent=query?`找到 ${visible} 個增幅裝置`:`顯示全部 ${augments.length} 個`;
    };
    if(search){
      search.addEventListener('input',applySearch,{passive:true});
      search.addEventListener('search',applySearch,{passive:true});
      applySearch();
    }
  }catch(error){
    console.error(error);
    if(state)state.textContent='增幅裝置資料載入失敗';
    root.innerHTML='<div class="aram-tier-load-error">目前無法載入增幅裝置資料，請稍後再試。</div>';
  }
})();
