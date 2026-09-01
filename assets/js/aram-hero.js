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

  const renderSkillOrder=(hero,sectionId='')=>`<section class="aram-detail-section"${sectionId?` id="${esc(sectionId)}" tabindex="-1"`:''}>
    <div class="aram-detail-section-head"><div><span>SKILL ORDER</span><h2>技能升級</h2></div><small>${esc(hero.skillOrder)}</small></div>
    <div class="aram-skill-order"><div class="aram-skill-icons">${(hero.skillIcons||[]).map((src,index)=>`${index?'<b>→</b>':''}<img src="${esc(src)}" alt="技能順位 ${index+1}"/>`).join('')}</div><p>${esc(hero.skillNote)}</p></div>
  </section>`;

  const renderHighlightedAaaText=(text='')=>{
    let output=esc(text);
    ['暴擊','攻速','普攻','攻擊距離'].forEach(keyword=>{
      output=output.split(keyword).join(`<mark class="aaa-inline-keyword">${keyword}</mark>`);
    });
    return output;
  };

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
    const [res,augmentRes]=await Promise.all([
      fetch('assets/data/aram/heroes.json?v=93.0.0',{cache:'no-store'}),
      fetch('assets/data/aram/augments.json?v=81.0.0',{cache:'no-store'})
    ]);
    if(!res.ok)throw new Error('ARAM data load failed');
    const data=await res.json();
    const augmentData=augmentRes.ok?await augmentRes.json():{augments:[]};
    const standardVersion=data.standardGameVersion||data.gameVersion||'7.2d';
    const aaaVersion=augmentData.gameVersion||data.aaaGameVersion||'7.2b';
    const augmentMap=new Map((augmentData.augments||[]).map(item=>[item.id,item]));
    const hero=(data.heroes||[]).find(item=>item.id===id);
    if(!hero)throw new Error('Hero not found');

    const hasAaa=Boolean(hero.aaaAram);
    let currentMode=params.get('mode')==='aaa'&&hasAaa?'aaa':'standard';

    root.innerHTML=`<div data-aram-hero-header></div>${hasAaa?`<section class="aram-mode-switch-panel" aria-label="攻略模式切換">
      <div class="aram-mode-switch" role="tablist" aria-label="選擇攻略模式">
        <button type="button" role="tab" data-guide-mode="standard">標準 ARAM</button>
        <button type="button" role="tab" data-guide-mode="aaa"><span>正式</span>符文大亂鬥</button>
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
      const kicker=isAaa?`AAA ARAM · PATCH ${esc(aaaVersion)}`:`ARAM HERO GUIDE · PATCH ${esc(standardVersion)}`;
      const badgeMain=isAaa?'正式':hero.tier;
      const badgeSub=isAaa?'符文大亂鬥':hero.tierLabel;
      const reasonTitle=isAaa?'符文大亂鬥怎麼用？':`為什麼是 ${esc(hero.tier)}？`;
      const reasonText=isAaa?aaa.pilotNote:hero.tierReason;
      const pills=(tags||[]).map(tag=>`<span>${esc(tag)}</span>`).join('');
      headerRoot.innerHTML=`<section class="aram-detail-hero ${isAaa?'is-aaa-mode':''}">
        <div class="aram-detail-portrait"><img src="${esc(hero.avatar)}" alt="${esc(hero.name)}"/></div>
        <div class="aram-detail-copy">
          <div class="aram-detail-kicker">${kicker}</div>
          <div class="aram-detail-titleline"><div><h1>${esc(hero.name)}</h1><span>${esc(hero.enName)}</span></div><div class="aram-detail-tier ${isAaa?'is-pilot':''}"><strong>${esc(badgeMain)}</strong><span>${esc(badgeSub)}</span></div></div>
          <p class="aram-detail-position">${esc(position)}</p><div class="aram-detail-tags">${pills}</div>
          <p class="aram-detail-summary">${isAaa?renderHighlightedAaaText(summary):esc(summary)}</p>
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
        <div class="aram-detail-section-head"><div><span>ARAM BALANCE</span><h2>模式平衡修正</h2></div><small>${esc(standardVersion)} 基準</small></div>
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
      const quickPlaystyles=(aaa.quickPlaystyles||[]).map(plan=>`<article class="aaa-quick-playstyle">
        <span>${esc(plan.badge)}</span><strong>${esc(plan.title)}</strong><p>${esc(plan.description)}</p>
        <div>${(plan.keywords||[]).map(keyword=>`<b>${esc(keyword)}</b>`).join('')}</div>
      </article>`).join('');
      const keywordGuide=aaa.augmentKeywordGuide||{};
      const keywordSteps=(keywordGuide.steps||[]).map(item=>`<article><span>${esc(item.step)}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.description)}</p></div></article>`).join('');
      const keywordGroups=(keywordGuide.groups||[]).map(group=>`<article class="aaa-keyword-group tone-${esc(group.tone||'b')}">
        <div class="aaa-keyword-group-head"><strong>${esc(group.level)}</strong><span>${esc(group.summary)}</span></div>
        <div class="aaa-keyword-chips">${(group.keywords||[]).map(keyword=>`<button type="button" data-aaa-keyword="${esc(keyword.query||keyword.label)}">${esc(keyword.label)}</button>`).join('')}</div>
      </article>`).join('');
      const compatibility=aaa.augmentCompatibility||{};
      const categoryDecision=aaa.augmentCategoryDecision||{};
      const sPlusIds=new Set(categoryDecision.sPlusIds||[]);
      const categoryCards=(categoryDecision.categories||[]).map((item,index)=>`<button type="button" class="aaa-category-card level-${index<2?'core':index<4?'high':'fit'}" data-aaa-category="${esc(item.tag)}">
        <span>${esc(item.level||'適配')}</span>
        <strong>${esc(item.tag)}</strong>
        <b>${esc(item.hint||'查看')}</b>
        <small>${esc(item.note||'')}</small>
      </button>`).join('');
      const compatibilityRows=(compatibility.ratings||[]).map((rating,index)=>{
        const augment=augmentMap.get(rating.id)||{};
        const baseTier=String(rating.tier||'C').toUpperCase();
        const tier=sPlusIds.has(rating.id)?'S+':baseTier;
        const officialTags=augment.officialTags||[];
        const searchText=[augment.name,augment.effect,...officialTags,rating.tag,rating.reason,tier].filter(Boolean).join(' ').toLowerCase();
        return `<details class="aaa-fit-card rank-${esc(tier).toLowerCase().replace('+','plus')}" data-aaa-fit-card data-tier="${esc(tier)}" data-base-tier="${esc(baseTier)}" data-official-tags="${esc(officialTags.join('|'))}" data-search-text="${esc(searchText)}" hidden>
          <summary class="aaa-fit-card-summary">
            <div class="aaa-fit-card-head"><span>${esc(tier)}</span><div><strong>${esc(augment.name||rating.id)}</strong><small>${esc(rating.tag||'適配判斷')}</small><div class="aaa-fit-official-tags">${officialTags.map(tag=>`<i>${esc(tag)}</i>`).join('')}</div></div></div>
            <b class="aaa-fit-toggle"><span>詳細</span><i aria-hidden="true">⌄</i></b>
          </summary>
          <div class="aaa-fit-card-body">
            <p class="aaa-fit-effect"><b>效果：</b>${esc(augment.effect||'效果資料載入失敗')}</p>
            <p class="aaa-fit-reason"><b>推薦判斷：</b>${esc(rating.reason||'')}</p>
          </div>
        </details>`;
      }).join('');
      const tierCounts=(compatibility.ratings||[]).reduce((counts,item)=>{const tier=String(item.tier||'C').toUpperCase();counts[tier]=(counts[tier]||0)+1;return counts;},{});
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
        <details class="aaa-shared-disclosure">
          <summary>
            <div class="aram-detail-section-head"><div><span>AAA ARAM</span><h2>哪些資料可以共用？</h2></div><small>標準 ARAM 為基底</small></div>
            <b class="aaa-disclosure-toggle"><span>展開查看</span><i aria-hidden="true">⌄</i></b>
          </summary>
          <div class="aaa-shared-disclosure-body">
            <div class="aaa-shared-grid">${sharedCards}</div>
            <p class="aaa-pilot-note">${esc(aaa.pilotNote)}</p>
          </div>
        </details>
        <nav class="aaa-section-jump" aria-label="符文大亂鬥內容快速跳轉">
          <a href="#aaa-build-section"><span>01</span>依增幅出裝</a>
          <a href="#aaa-runes-section"><span>02</span>一般符文可直接共用</a>
          <a href="#aaa-skill-section"><span>03</span>技能升級</a>
        </nav>
      </section>
      <section class="aram-detail-section aaa-decision-section">
        <div class="aram-detail-section-head"><div><span>CATEGORY FIRST</span><h2>${esc(hero.name)}增幅分類</h2></div><small>先看分類，再看單卡</small></div>
        <div class="aaa-category-howto"><b>遊戲看到 3 張增幅</b><span>看卡片下方分類 → 點下面相同分類 → 左側分級越高越優先</span></div>
        <div class="aaa-category-grid" data-aaa-category-grid>${categoryCards}</div>
        <div class="aaa-category-results" data-aaa-category-results>
          <div class="aaa-category-empty" data-aaa-category-empty><strong>先點一個分類</strong><span>例如卡片寫「暴擊」，就直接點「暴擊」。</span></div>
          <div class="aaa-fit-block" data-aaa-fit-root hidden>
            <div class="aaa-fit-title"><div><strong data-aaa-category-title>分類增幅</strong><span data-aaa-category-note></span></div><small data-aaa-fit-state></small></div>
            <div class="aaa-fit-tools">
              <label><span>分類內搜尋</span><input type="search" placeholder="輸入增幅名稱" data-aaa-fit-search/></label>
            </div>
            <div class="aaa-fit-grid">${compatibilityRows}</div>
          </div>
        </div>
      </section>
      <section class="aram-detail-section" id="aaa-build-section" tabindex="-1">
        <div class="aram-detail-section-head"><div><span>ADAPTIVE BUILD</span><h2>依增幅切換出裝</h2></div><small>${buildPlans.length} 條路線</small></div>
        <div class="aaa-build-list">${buildPlans}</div>
      </section>
      <section class="aram-detail-section" id="aaa-runes-section" tabindex="-1">
        <div class="aram-detail-section-head"><div><span>BASE RUNES</span><h2>${esc(aaa.runeReuse?.title||'一般符文')}</h2></div><small>與標準 ARAM 共用</small></div>
        <p class="aaa-section-intro">${esc(aaa.runeReuse?.note||'')}</p>
        <div class="aram-rune-grid">${aaaRunes}</div>
      </section>
      ${renderSkillOrder(hero,'aaa-skill-section')}
      ${renderPlaystyle(aaa.playstyle,'符文大亂鬥玩法','AAA GAME PLAN')}
      ${renderSources(aaa.sourceNote,aaa.sources||[])}`;
    };

    const bindAaaSectionJumps=()=>{
      contentRoot.querySelectorAll('.aaa-section-jump a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
        const target=contentRoot.querySelector(link.getAttribute('href'));
        if(!target)return;
        event.preventDefault();
        target.scrollIntoView({behavior:'smooth',block:'start'});
        window.setTimeout(()=>target.focus({preventScroll:true}),420);
      }));
    };

    const bindAugmentRecommendation=()=>{
      const lab=contentRoot.querySelector('[data-aaa-recommend-lab]');
      if(!lab)return;
      const aaa=hero.aaaAram||{};
      const model=aaa.augmentRecommendationLab||{};
      const ratings=new Map((aaa.augmentCompatibility?.ratings||[]).map(item=>[item.id,item]));
      const byName=new Map((augmentData.augments||[]).map(item=>[item.name,item]));
      const byId=new Map((augmentData.augments||[]).map(item=>[item.id,item]));
      const synergyMap=new Map();
      (model.strongSynergies||[]).forEach(pair=>{
        const key=[pair.a,pair.b].sort().join('|');
        synergyMap.set(key,pair);
      });
      const ownedInputs=[...lab.querySelectorAll('[data-aaa-owned]')];
      const candidateInputs=[...lab.querySelectorAll('[data-aaa-candidate]')];
      const results=lab.querySelector('[data-aaa-recommend-results]');
      const getAugment=input=>byName.get((input.value||'').trim());
      const scoreCandidate=(candidate,owned)=>{
        const rating=ratings.get(candidate.id)||{tier:'C',tag:'適配判斷',reason:''};
        const tier=String(rating.tier||'C').toUpperCase();
        const base=Number(model.tierScores?.[tier]??44);
        const officialTags=candidate.officialTags||[];
        const category=officialTags.reduce((sum,tag)=>sum+Number(model.heroTagWeights?.[tag]||0),0);
        let soft=0,strong=0;
        const reasons=[];
        owned.forEach(current=>{
          const shared=officialTags.filter(tag=>(current.officialTags||[]).includes(tag));
          if(shared.length){
            const add=Math.min(shared.length*Number(model.sameOfficialTagBonus||2),Number(model.sameOfficialTagCap||4));
            soft+=add;
            reasons.push(`與「${current.name}」同屬 ${shared.join('／')}，軟連動 +${add}`);
          }
          const pair=synergyMap.get([candidate.id,current.id].sort().join('|'));
          if(pair){
            strong+=Number(pair.score||0);
            reasons.push(`${current.name} × ${candidate.name}：${pair.reason} +${pair.score}`);
          }
        });
        strong=Math.min(strong,Number(model.synergyCap||20));
        soft=Math.min(soft,Number(model.sameOfficialTagCap||4));
        const raw=base+category+soft+strong;
        return {candidate,rating,tier,base,category,soft,strong,score:Math.min(100,raw),reasons};
      };
      const render=()=>{
        const owned=ownedInputs.map(getAugment).filter(Boolean);
        const candidates=candidateInputs.map(getAugment).filter(Boolean).filter((item,index,arr)=>arr.findIndex(x=>x.id===item.id)===index).filter(item=>!owned.some(x=>x.id===item.id));
        if(candidates.length<2){
          results.innerHTML='<p>請至少輸入兩張不同的候選增幅；已拿到的增幅不會再列入候選。</p>';
          return;
        }
        const ranked=candidates.map(item=>scoreCandidate(item,owned)).sort((a,b)=>b.score-a.score||b.base-a.base);
        results.innerHTML=ranked.map((result,index)=>`<article class="aaa-recommend-result ${index===0?'is-winner':''}">
          <div class="aaa-recommend-rank"><span>${index===0?'首選':`第 ${index+1} 名`}</span><strong>${result.score}</strong><small>推薦分</small></div>
          <div class="aaa-recommend-result-body"><div class="aaa-recommend-result-title"><div><strong>${esc(result.candidate.name)}</strong><span>${esc(result.tier)} · ${esc(result.rating.tag||'適配判斷')}</span></div><div>${(result.candidate.officialTags||[]).map(tag=>`<i>${esc(tag)}</i>`).join('')}</div></div>
          <p>${esc(result.rating.reason||'')}</p>
          <div class="aaa-recommend-breakdown"><span>英雄底分 <b>${result.base}</b></span><span>分類適性 <b>+${result.category}</b></span><span>同類軟連動 <b>+${result.soft}</b></span><span>效果連動 <b>+${result.strong}</b></span></div>
          ${result.reasons.length?`<ul>${result.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul>`:'<small class="aaa-recommend-no-synergy">目前沒有額外確認的增幅連動，主要依英雄本身適性排序。</small>'}
          </div>
        </article>`).join('');
      };
      lab.querySelector('[data-aaa-recommend-run]')?.addEventListener('click',render);
      lab.querySelector('[data-aaa-recommend-clear]')?.addEventListener('click',()=>{[...ownedInputs,...candidateInputs].forEach(input=>input.value='');render();});
      [...ownedInputs,...candidateInputs].forEach(input=>input.addEventListener('change',()=>{if(candidateInputs.filter(x=>getAugment(x)).length>=2)render();}));
    };

    const bindAugmentCompatibility=()=>{
      const fitRoot=contentRoot.querySelector('[data-aaa-fit-root]');
      const categoryButtons=[...contentRoot.querySelectorAll('[data-aaa-category]')];
      if(!fitRoot||!categoryButtons.length)return;
      const search=fitRoot.querySelector('[data-aaa-fit-search]');
      const state=fitRoot.querySelector('[data-aaa-fit-state]');
      const title=fitRoot.querySelector('[data-aaa-category-title]');
      const note=fitRoot.querySelector('[data-aaa-category-note]');
      const empty=contentRoot.querySelector('[data-aaa-category-empty]');
      const cards=[...fitRoot.querySelectorAll('[data-aaa-fit-card]')];
      const categoryModel=hero.aaaAram?.augmentCategoryDecision||{};
      const categoryInfo=new Map((categoryModel.categories||[]).map(item=>[item.tag,item]));
      const tierWeight={'S+':6,'S':5,'A':4,'B':3,'C':2,'D':1};
      let activeCategory='';
      const apply=()=>{
        const query=(search?.value||'').trim().toLowerCase();
        const visibleCards=[];
        cards.forEach(card=>{
          const tags=(card.dataset.officialTags||'').split('|').filter(Boolean);
          const categoryMatch=activeCategory&&tags.includes(activeCategory);
          const queryMatch=!query||(card.dataset.searchText||'').includes(query);
          card.hidden=!(categoryMatch&&queryMatch);
          if(!card.hidden)visibleCards.push(card);
        });
        visibleCards.sort((a,b)=>(tierWeight[b.dataset.tier]||0)-(tierWeight[a.dataset.tier]||0));
        const grid=fitRoot.querySelector('.aaa-fit-grid');
        visibleCards.forEach(card=>grid?.appendChild(card));
        if(state)state.textContent=activeCategory?`${visibleCards.length} 張 · S+ 最優先`:'';
      };
      categoryButtons.forEach(button=>button.addEventListener('click',()=>{
        activeCategory=button.dataset.aaaCategory||'';
        categoryButtons.forEach(item=>item.classList.toggle('is-active',item===button));
        const info=categoryInfo.get(activeCategory)||{};
        if(title)title.textContent=`${activeCategory}｜${hero.name}`;
        if(note)note.textContent=info.note||'';
        if(search)search.value='';
        if(empty)empty.hidden=true;
        fitRoot.hidden=false;
        apply();
        fitRoot.scrollIntoView({behavior:'smooth',block:'nearest'});
      }));
      if(search){
        search.addEventListener('input',apply,{passive:true});
        search.addEventListener('search',apply,{passive:true});
      }
    };

    const syncModeUi=()=>{
      const isAaa=currentMode==='aaa';
      document.body.classList.toggle('aaa-aram-mode',isAaa);
      root.querySelectorAll('[data-guide-mode]').forEach(button=>{
        const active=button.dataset.guideMode===currentMode;
        button.classList.toggle('is-active',active);
        button.setAttribute('aria-selected',active?'true':'false');
      });
      if(modeNote)modeNote.textContent=isAaa?`符文大亂鬥資料版本 ${aaaVersion}：看遊戲卡片下方分類 → 點相同分類 → 優先看 S+／S／A，再依增幅方向選出裝。`:`目前已完成的標準 ARAM ${standardVersion} 攻略。`;
      const titleMode=isAaa?'符文大亂鬥':'ARAM';
      document.title=`${hero.name} ${titleMode} 出裝、符文與攻略｜Wild Rift Guide`;
      const meta=document.querySelector('meta[name="description"]');
      if(meta)meta.setAttribute('content',isAaa?`${hero.name} Wild Rift ${aaaVersion} 符文大亂鬥攻略：官方增幅分類、S+ 至 D 單卡評級、增幅導向出裝與玩法。`:`${hero.name} Wild Rift ${standardVersion} 隨機單中 ARAM 攻略：Tier、出裝、符文、模式平衡與玩法重點。`);
      renderHeader(currentMode);
      contentRoot.innerHTML=isAaa?renderAaa():renderStandard();
      if(isAaa){bindAaaSectionJumps();bindAugmentCompatibility();}
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
