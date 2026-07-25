(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const star = n => '★'.repeat(n) + '☆'.repeat(5-n);
  const roleNames = {baron:'巴龍路', jungle:'打野', mid:'中路', duo:'飛龍路', support:'輔助'};

  const state = { role:'duo', heroId:'smolder', heroes:[], runes:[], items:[], spells:[] };

  function flattenRunes(data){
    return Object.values(data || {}).flatMap(v => Array.isArray(v) ? v : []);
  }
  function normalizeItems(data){ return Array.isArray(data) ? data : (data?.items || []); }
  function byId(arr,id){ return arr.find(x=>x.id===id); }
  function safeIcon(x){ return x?.icon || ''; }

  function buildMiniCard(x, type='item'){
    if(!x) return '<div class="build-mini missing">資料待補</div>';
    return `<div class="build-mini ${type}">
      <img src="${safeIcon(x)}" alt="${x.name}" loading="lazy">
      <span>${x.name}</span>
    </div>`;
  }

  function renderRoleTabs(){
    $$('.hero-role-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.role===state.role));
    $('.hero-list-kicker').textContent = state.role==='duo' ? 'DRAGON LANE' : roleNames[state.role].toUpperCase();
    $('.hero-list-heading h2').textContent = roleNames[state.role];
  }

  function renderList(){
    const list = $('#heroList');
    const empty = $('#heroListEmpty');
    const heroes = state.heroes.filter(h=>h.roleId===state.role);
    $('#heroCount').textContent = heroes.length;
    list.innerHTML = '';
    empty.hidden = heroes.length !== 0;
    if(!heroes.length){ $('#heroProfile').innerHTML='<div class="hero-profile-empty">此路線尚未匯入英雄。<small>試作版目前只有飛龍路的史矛德。</small></div>'; return; }
    if(!heroes.some(h=>h.id===state.heroId)) state.heroId = heroes[0].id;
    heroes.forEach(h=>{
      const el=document.createElement('button');
      el.className='hero-list-card'+(h.id===state.heroId?' active':'');
      el.innerHTML=`<div class="hero-monogram">${h.name.slice(0,1)}</div>
        <div class="hero-list-info"><strong>${h.name}</strong><span>${h.enName}</span><small>${h.position}</small></div>
        <span class="tier-pill tier-sp">${h.tier}</span>`;
      el.addEventListener('click',()=>{state.heroId=h.id;renderList();renderProfile();});
      list.appendChild(el);
    });
  }

  function renderRatings(hero){
    return Object.entries(hero.ratings).map(([name,n])=>`<div class="hero-rating">
      <div class="rating-label"><span>${name}</span><strong>${n}/5</strong></div>
      <div class="rating-stars" aria-label="${name} ${n} 星">${star(n)}</div>
      <div class="rating-bar"><i style="width:${n*20}%"></i></div>
    </div>`).join('');
  }

  function renderProfile(){
    const hero=state.heroes.find(h=>h.id===state.heroId);
    if(!hero) return;
    const runes=hero.runes.map(id=>byId(state.runes,id));
    const items=hero.items.map(id=>byId(state.items,id));
    const boots=hero.boots.map(id=>byId(state.items,id));
    const spells=hero.spells.map(id=>byId(state.spells,id));
    const tags=hero.tags.map(t=>`<span>${t}</span>`).join('');
    const runeHTML=runes.map((x,i)=>`<div class="hero-rune-card ${i===0?'keystone':''}">
      ${x?`<img src="${safeIcon(x)}" alt="${x.name}"><div><small>${i===0?'關鍵符文':'副符文'}</small><strong>${x.name}</strong><p>${x.tag||''}</p></div>`:'<span>資料待補</span>'}
    </div>`).join('');
    const itemHTML=items.map((x,i)=>`<div class="hero-build-slot"><b>${i+1}</b>${buildMiniCard(x)}</div>`).join('');
    const bootHTML=boots.map((x,i)=>`<div class="hero-build-slot boot"><b>${i===0?'II':'III'}</b>${buildMiniCard(x,'boot')}</div>`).join('<div class="build-arrow">→</div>');
    const spellHTML=spells.map(x=>buildMiniCard(x,'spell')).join('');

    $('#heroProfile').innerHTML=`
      <section class="hero-profile-hero">
        <div class="hero-avatar hero-avatar-placeholder"><span>${hero.name.slice(0,1)}</span><small>官方頭像待補</small></div>
        <div class="hero-title-block">
          <div class="hero-title-row"><h2>${hero.name}</h2><span class="tier-badge-large">${hero.tier}</span></div>
          <div class="hero-en">${hero.enName} · ${hero.role}</div>
          <div class="hero-position">${hero.position}</div>
          <div class="hero-tags">${tags}</div>
        </div>
      </section>

      <section class="hero-summary-box"><span>一句話玩法</span><p>${hero.summary}</p></section>

      <section class="hero-section">
        <div class="hero-section-title"><h3>綜合評分</h3><span>7.2a</span></div>
        <div class="hero-ratings">${renderRatings(hero)}</div>
      </section>

      <section class="hero-section">
        <div class="hero-section-title"><h3>符文</h3><span>主流配置</span></div>
        <div class="hero-runes">${runeHTML}</div>
      </section>

      <section class="hero-section">
        <div class="hero-section-title"><h3>推薦出裝</h3><span>6 件完整出裝</span></div>
        <div class="hero-item-build">${itemHTML}</div>
        <div class="hero-build-subrow"><strong>鞋子</strong><div class="hero-boot-path">${bootHTML}</div></div>
      </section>

      <section class="hero-section hero-section-split">
        <div>
          <div class="hero-section-title"><h3>召喚師技能</h3></div>
          <div class="hero-spells">${spellHTML}</div>
        </div>
        <div>
          <div class="hero-section-title"><h3>技能點法</h3></div>
          <div class="skill-order"><span>優先順序</span><strong>${hero.skillOrder}</strong></div>
        </div>
      </section>

      <section class="hero-section">
        <div class="hero-section-title"><h3>對局</h3><span>Matchup</span></div>
        <div class="matchup-grid">
          <div class="matchup-box good"><span>較好打</span><div>${hero.matchups.good.map(x=>`<b>${x}</b>`).join('')}</div></div>
          <div class="matchup-box bad"><span>較難打</span><div>${hero.matchups.bad.map(x=>`<b>${x}</b>`).join('')}</div></div>
          <div class="matchup-box ban"><span>優先 Ban</span><strong>${hero.matchups.ban}</strong></div>
        </div>
      </section>

      <section class="hero-section">
        <div class="hero-section-title"><h3>被動堆層節點</h3><span>25 / 100 / 175</span></div>
        <div class="stack-grid">${hero.stackBreakpoints.map(x=>`<div class="stack-card"><strong>${x.stacks}</strong><span>${x.title}</span><p>${x.text}</p></div>`).join('')}</div>
      </section>

      <section class="hero-section">
        <div class="hero-section-title"><h3>實戰節奏</h3></div>
        <div class="playstyle-timeline">${Object.entries(hero.playstyle).map(([k,v])=>`<div class="playstyle-step"><b>${k}</b><p>${v}</p></div>`).join('')}</div>
      </section>

      <div class="hero-source-note">${hero.sourceNote}</div>`;
  }

  async function init(){
    try{
      const [heroData,runeData,itemData,spellData]=await Promise.all([
        getJSON('../assets/data/heroes.json'),
        getJSON('../assets/data/runes.json'),
        getJSON('../assets/data/items.json'),
        getJSON('../assets/data/spells.json')
      ]);
      state.heroes=heroData.heroes||heroData||[];
      state.runes=flattenRunes(runeData);
      state.items=normalizeItems(itemData);
      state.spells=spellData;
      const params=new URLSearchParams(location.search);
      if(params.get('role')) state.role=params.get('role');
      if(params.get('hero')) state.heroId=params.get('hero');
      $$('.hero-role-tab').forEach(btn=>btn.addEventListener('click',()=>{
        state.role=btn.dataset.role;
        const match=state.heroes.find(h=>h.roleId===state.role);
        state.heroId=match?.id||'';
        renderRoleTabs();renderList();if(match) renderProfile();
      }));
      renderRoleTabs();renderList();renderProfile();
    }catch(err){
      console.error(err);
      $('#heroProfile').innerHTML='<div class="hero-profile-empty">英雄資料載入失敗。<small>請確認網站是透過 HTTP / GitHub Pages 開啟，而不是直接以 file:// 執行。</small></div>';
    }
  }
  init();
})();
