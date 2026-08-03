(async()=>{
  const root=document.querySelector('[data-aram-hero-root]');
  if(!root)return;

  const esc=(value)=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const params=new URLSearchParams(location.search);
  const id=params.get('id')||'jinx';
  document.body.classList.add('aram-mobile-master');

  const renderItems=(items=[])=>items.map((item,index)=>`<article class="aram-loadout-card">
    <div class="aram-loadout-index">${index+1}</div>
    <img src="${esc(item.icon)}" alt="${esc(item.name)}"/>
    <div><strong>${esc(item.name)}</strong><p>${esc(item.reason)}</p></div>
  </article>`).join('');

  const renderRunes=(runes=[])=>runes.map((rune,index)=>`<article class="aram-rune-card ${index===0?'keystone':''}">
    <img src="${esc(rune.icon)}" alt="${esc(rune.name)}"/>
    <div><strong>${esc(rune.name)}</strong><p>${esc(rune.reason)}</p></div>
  </article>`).join('');

  const renderBoots=(boots=[])=>boots.map((boot,index)=>`<article class="aram-compact-card">
    <span class="aram-step-label">${index===0?'鞋子':'升級'}</span>
    <img src="${esc(boot.icon)}" alt="${esc(boot.name)}"/>
    <div><strong>${esc(boot.name)}</strong><p>${esc(boot.reason)}</p></div>
  </article>`).join('');

  const renderSpells=(spells=[])=>spells.map(spell=>`<article class="aram-compact-card">
    <img src="${esc(spell.icon)}" alt="${esc(spell.name)}"/>
    <div><strong>${esc(spell.name)}</strong><p>${esc(spell.reason)}</p></div>
  </article>`).join('');

  const renderSkillOrder=(hero)=>`<section class="aram-detail-section">
    <div class="aram-detail-section-head"><div><span>SKILL ORDER</span><h2>技能升級</h2></div><small>${esc(hero.skillOrder)}</small></div>
    <div class="aram-skill-order"><div class="aram-skill-icons">${(hero.skillIcons||[]).map((src,index)=>`${index?'<b>→</b>':''}<img src="${esc(src)}" alt="技能順位 ${index+1}"/>`).join('')}</div><p>${esc(hero.skillNote)}</p></div>
  </section>`;

  const renderPlaystyle=(playstyle={},heading='ARAM 玩法重點',kicker='GAME PLAN')=>{
    const entries=Object.entries(playstyle||{});
    const desktop=entries.map(([phase,text])=>`<article><span>${esc(phase)}</span><p>${esc(text)}</p></article>`).join('');
    const mobile=entries.map(([phase,text],index)=>`<details class="aram-playstyle-mobile-item" ${index===0?'open':''}><summary><span>${esc(phase)}</span><b>查看重點</b></summary><p>${esc(text)}</p></details>`).join('');
    return `<section class="aram-detail-section">
      <div class="aram-detail-section-head"><div><span>${esc(kicker)}</span><h2>${esc(heading)}</h2></div></div>
      <div class="aram-playstyle-grid">${desktop}</div><div class="aram-playstyle-mobile">${mobile}</div>
    </section>`;
  };

  const renderSources=(note='',sources=[])=>`<section class="aram-source-panel"><strong>資料說明</strong><p>${esc(note)}</p><div>${sources.map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a>`).join('')}</div></section>`;

  try{
    const res=await fetch('assets/data/aram/heroes.json?v=80.21.0',{cache:'no-store'});
    if(!res.ok)throw new Error('ARAM data load failed');
    const data=await res.json();
    const hero=(data.heroes||[]).find(item=>item.id===id);
    if(!hero)throw new Error('Hero not found');

    const hasAaa=Boolean(hero.aaaAram);
    let currentMode=params.get('mode')==='aaa'&&hasAaa?'aaa':'standard';

    root.innerHTML=`<div data-aram-hero-header></div>${hasAaa?`<section class="aram-mode-switch-panel" aria-label="攻略模式切換">
      <div class="aram-mode-switch" role="tablist" aria-label="選擇攻略模式">
        <button type="button" role="tab" data-guide-mode="standard">標準 ARAM</button>
        <button type="button" role="tab" data-guide-mode="aaa"><span>NEW</span>符文大亂鬥</button>
      </div>
      <p data-mode-switch-note></p>
    </section>`:''}<div data-aram-mode-content></div>`;

    const headerRoot=root.querySelector('[data-aram-hero-header]');
    const contentRoot=root.querySelector('[data-aram-mode-content]');
    const modeNote=root.querySelector('[data-mode-switch-note]');

    const renderHeader=(mode)=>{
      const aaa=hero.aaaAram;
      const isAaa=mode==='aaa'&&aaa;
      const position=isAaa?aaa.position:hero.position;
      const tags=isAaa?aaa.tags:hero.tags;
      const summary=isAaa?aaa.summary:hero.summary;
      const kicker=isAaa?`AAA ARAM PILOT · PATCH ${esc(data.gameVersion)}`:`ARAM HERO GUIDE · PATCH ${esc(data.gameVersion)}`;
      const badgeMain=isAaa?'試作':hero.tier;
      const badgeSub=isAaa?'符文大亂鬥':hero.tierLabel;
      const reasonTitle=isAaa?'這次試作要測什麼？':`為什麼是 ${esc(hero.tier)}？`;
      const reasonText=isAaa?aaa.pilotNote:hero.tierReason;
      const pills=(tags||[]).map(tag=>`<span>${esc(tag)}</span>`).join('');
      headerRoot.innerHTML=`<section class="aram-detail-hero ${isAaa?'is-aaa-mode':''}">
        <div class="aram-detail-portrait"><img src="${esc(hero.avatar)}" alt="${esc(hero.name)}"/></div>
        <div class="aram-detail-copy">
          <div class="aram-detail-kicker">${kicker}</div>
          <div class="aram-detail-titleline"><div><h1>${esc(hero.name)}</h1><span>${esc(hero.enName)}</span></div><div class="aram-detail-tier ${isAaa?'is-pilot':''}"><strong>${esc(badgeMain)}</strong><span>${esc(badgeSub)}</span></div></div>
          <p class="aram-detail-position">${esc(position)}</p><div class="aram-detail-tags">${pills}</div>
          <p class="aram-detail-summary">${esc(summary)}</p>
          <div class="aram-tier-reason"><strong>${reasonTitle}</strong><span>${esc(reasonText)}</span></div>
        </div>
      </section>`;
    };

    const renderStandard=()=>{
      const itemCards=renderItems(hero.items||[]);
      const runeCards=renderRunes(hero.runes||[]);
      const bootCards=renderBoots(hero.boots||[]);
      const spellCards=renderSpells(hero.spells||[]);
      const situational=(hero.situationalItems||[]).map(item=>`<article class="aram-situational-card"><img src="${esc(item.icon)}" alt="${esc(item.name)}"/><div><strong>${esc(item.name)}</strong>${item.when?`<span>${esc(item.when)}</span>`:''}<p>${esc(item.reason)}</p></div></article>`).join('');
      return `<section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>ARAM BALANCE</span><h2>模式平衡修正</h2></div><small>7.2b 基準</small></div>
        <div class="aram-balance-grid"><article><span>造成傷害</span><strong>${esc(hero.balance.damageDealt)}</strong></article><article><span>承受傷害</span><strong>${esc(hero.balance.damageTaken)}</strong></article><article><span>治療效果</span><strong>${esc(hero.balance.healing)}</strong></article><article><span>護盾效果</span><strong>${esc(hero.balance.shielding)}</strong></article></div>
        <p class="aram-detail-note">${esc(hero.balance.note)}</p>
      </section>
      <section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>BUILD</span><h2>推薦出裝</h2></div><small>核心 5 件</small></div>
        <div class="aram-starter-row"><strong>開局</strong>${(hero.starterItems||[]).map(item=>`<span><img src="${esc(item.icon)}" alt="${esc(item.name)}"/>${esc(item.name)}</span>`).join('')}<p>${esc((hero.starterItems||[])[0]?.reason||'')}</p></div>
        <div class="aram-loadout-grid">${itemCards}</div>
        <div class="aram-subgrid"><div><h3>鞋子</h3>${bootCards}</div><div><h3>召喚師技能</h3>${spellCards}</div></div>
      </section>
      <section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>RUNES</span><h2>推薦符文</h2></div><small>合法排列：關鍵 → 一 → 二 → 三 → 副系</small></div>
        <div class="aram-rune-grid">${runeCards}</div>
      </section>
      ${renderSkillOrder(hero)}
      ${renderPlaystyle(hero.playstyle)}
      <section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>SITUATIONAL</span><h2>情境裝備</h2></div><small>依敵方陣容替換</small></div>
        <div class="aram-situational-grid">${situational}</div>
      </section>
      ${renderSources(hero.sourceNote,hero.sources||[])}`;
    };

    const renderAaa=()=>{
      const aaa=hero.aaaAram;
      const sharedCards=(aaa.sharedWithStandard||[]).map(card=>`<article class="aaa-shared-card"><span>${esc(card.title)}</span><strong>${esc(card.value)}</strong><p>${esc(card.note)}</p></article>`).join('');
      const priorityCards=(aaa.augmentPriorities||[]).map(group=>`<article class="aaa-augment-priority rank-${esc(group.rank).toLowerCase()}">
        <div class="aaa-augment-rank"><strong>${esc(group.rank)}</strong><span>${esc(group.label)}</span></div>
        <div><h3>${esc(group.title)}</h3><p>${esc(group.description)}</p><div class="aaa-keywords">${(group.keywords||[]).map(keyword=>`<span>${esc(keyword)}</span>`).join('')}</div></div>
      </article>`).join('');
      const exampleCards=(aaa.augmentExamples||[]).map(card=>`<article class="aaa-example-card"><div class="aaa-example-head"><strong>${esc(card.name)}</strong><span class="priority-${esc(card.priority).toLowerCase()}">${esc(card.priority)}</span></div><small>${esc(card.type)}</small><p>${esc(card.reason)}</p></article>`).join('');
      const buildPlans=(aaa.buildPlans||[]).map((plan,index)=>`<details class="aaa-build-plan" ${index===0?'open':''}>
        <summary><div><span>${esc(plan.badge)}</span><strong>${esc(plan.title)}</strong><small>${esc(plan.trigger)}</small></div><b>展開出裝</b></summary>
        <div class="aaa-build-plan-body"><p class="aaa-build-description">${esc(plan.description)}</p>
          <div class="aram-starter-row"><strong>開局</strong>${(plan.starterItems||[]).map(item=>`<span><img src="${esc(item.icon)}" alt="${esc(item.name)}"/>${esc(item.name)}</span>`).join('')}<p>${esc((plan.starterItems||[])[0]?.reason||'')}</p></div>
          <div class="aram-loadout-grid">${renderItems(plan.items||[])}</div>
          <div class="aaa-plan-boots"><h3>鞋子</h3>${renderBoots(plan.boots||[])}</div>
        </div>
      </details>`).join('');
      const aaaRunes=renderRunes(aaa.runeReuse?.runes||hero.runes||[]);
      return `<section class="aram-detail-section aaa-overview-section">
        <div class="aram-detail-section-head"><div><span>AAA ARAM PILOT</span><h2>哪些資料可以共用？</h2></div><small>標準 ARAM 為基底</small></div>
        <div class="aaa-shared-grid">${sharedCards}</div>
        <p class="aaa-pilot-note">${esc(aaa.pilotNote)}</p>
      </section>
      <section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>AUGMENTS</span><h2>增幅裝置優先級</h2></div><small>先看類型，再看稀有度</small></div>
        <div class="aaa-augment-priority-list">${priorityCards}</div>
        <div class="aaa-example-block"><div class="aaa-example-title"><strong>官方公告曾出現的增幅範例</strong><span>用來示範判斷，不代表每局固定出現</span></div><div class="aaa-example-grid">${exampleCards}</div></div>
      </section>
      <section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>ADAPTIVE BUILD</span><h2>依增幅切換出裝</h2></div><small>三條試作路線</small></div>
        <div class="aaa-build-list">${buildPlans}</div>
      </section>
      <section class="aram-detail-section">
        <div class="aram-detail-section-head"><div><span>BASE RUNES</span><h2>${esc(aaa.runeReuse?.title||'一般符文')}</h2></div><small>與標準 ARAM 共用</small></div>
        <p class="aaa-section-intro">${esc(aaa.runeReuse?.note||'')}</p>
        <div class="aram-rune-grid">${aaaRunes}</div>
      </section>
      ${renderSkillOrder(hero)}
      ${renderPlaystyle(aaa.playstyle,'符文大亂鬥玩法','AAA GAME PLAN')}
      ${renderSources(aaa.sourceNote,aaa.sources||[])}`;
    };

    const syncModeUi=()=>{
      const isAaa=currentMode==='aaa';
      document.body.classList.toggle('aaa-aram-mode',isAaa);
      root.querySelectorAll('[data-guide-mode]').forEach(button=>{
        const active=button.dataset.guideMode===currentMode;
        button.classList.toggle('is-active',active);
        button.setAttribute('aria-selected',active?'true':'false');
      });
      if(modeNote)modeNote.textContent=isAaa?'試作版：增幅類型、出裝轉向與符文大亂鬥玩法。':'目前已完成的標準 ARAM 7.2b 攻略。';
      const titleMode=isAaa?'符文大亂鬥試作':'ARAM';
      document.title=`${hero.name} ${titleMode} 出裝、符文與攻略｜Wild Rift Guide`;
      const meta=document.querySelector('meta[name="description"]');
      if(meta)meta.setAttribute('content',isAaa?`${hero.name} Wild Rift 7.2b 符文大亂鬥試作攻略：增幅優先級、出裝轉向、一般符文與玩法。`:`${hero.name} Wild Rift 7.2b 隨機單中 ARAM 攻略：Tier、出裝、符文、模式平衡與玩法重點。`);
      renderHeader(currentMode);
      contentRoot.innerHTML=isAaa?renderAaa():renderStandard();
    };

    root.querySelectorAll('[data-guide-mode]').forEach(button=>button.addEventListener('click',()=>{
      currentMode=button.dataset.guideMode==='aaa'?'aaa':'standard';
      const url=new URL(location.href);
      if(currentMode==='aaa')url.searchParams.set('mode','aaa');
      else url.searchParams.delete('mode');
      history.replaceState({},'',url);
      syncModeUi();
      window.scrollTo({top:0,behavior:'smooth'});
    }));

    syncModeUi();
  }catch(err){
    console.error(err);
    root.innerHTML='<section class="aram-detail-error"><h1>找不到這位 ARAM 英雄</h1><p>目前母版資料可能尚未建立。</p><a href="aram.html">← 回 ARAM 專區</a></section>';
  }
})();
