(() => {
  'use strict';
  let spells = [], selected = null;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const detailsText = spell => (spell.details || []).map(section => `${section.title} ${section.paragraphs.join(' ')}`).join(' ');
  function detailMarkup(spell) {
    if (!spell) return '<div class="empty">沒有符合條件的召喚師技能。</div>';
    const cooldown = spell.chargeCooldown ? `施放間隔 ${spell.cooldown} 秒｜充能 ${spell.chargeCooldown} 秒／層（最多 ${spell.maxCharges} 層）` : `冷卻 ${spell.cooldown} 秒`;
    return `<img src="${escape(spell.icon)}" alt="${escape(spell.name)}">
      <h2 tabindex="-1">${escape(spell.name)}</h2>
      <div class="detail-meta">${escape(spell.category)}｜${cooldown}</div>
      <div class="detail-description">${escape(spell.description)}</div>
      ${(spell.details || []).map(section => `<section class="spell-effect-section"><h3>${escape(section.title)}</h3>${section.paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}</section>`).join('')}
      <div class="detail-chips">${(spell.maps || []).map(m => `<span class="chip">${escape(m)}</span>`).join('')}</div>`;
  }
  function show(spell, navigate = false) {
    selected = spell?.id || null;
    document.querySelectorAll('.spell-icon').forEach(el => el.classList.toggle('active', el.dataset.id === selected));
    ['#spell-detail','#mobile-spell-detail'].forEach(selector => {$(selector).innerHTML = detailMarkup(spell);});
    if (navigate && matchMedia('(max-width: 900px)').matches) {
      $('#mobile-spell-detail').scrollIntoView({block:'start',behavior:'smooth'});
      $('#mobile-spell-detail h2')?.focus({preventScroll:true});
    }
  }
  function render() {
    const query = $('#q').value.trim().toLocaleLowerCase(), category = $('#cat').value;
    const rows = spells.filter(s => `${s.name} ${s.description} ${s.category} ${detailsText(s)}`.toLocaleLowerCase().includes(query) && (category === '全部' || s.category === category));
    $('#spell-icons').innerHTML = rows.length ? rows.map(s => `<button type="button" class="spell-icon interactive-icon" data-id="${escape(s.id)}" aria-label="查看${escape(s.name)}的效果與冷卻時間"><img src="${escape(s.icon)}" alt="" width="76" height="76"><strong>${escape(s.name)}</strong></button>`).join('') : '<div class="empty">沒有符合條件的召喚師技能。</div>';
    $('#spell-count').textContent = `${rows.length}／${spells.length} 個召喚師技能`;
    document.querySelectorAll('.spell-icon').forEach(button => {
      const spell = spells.find(s => s.id === button.dataset.id);
      button.onclick = () => show(spell, true);
      button.onmouseenter = () => {if (matchMedia('(hover: hover)').matches && !matchMedia('(max-width: 900px)').matches) show(spell);};
      button.onfocus = () => {if (!matchMedia('(max-width: 900px)').matches) show(spell);};
    });
    show(rows.find(s => s.id === selected) || rows[0]);
  }
  async function load() {
    try {
      const response = await fetch('../assets/data/spells.json?v=110.0.0');
      if (!response.ok) throw new Error('Unable to load spells');
      spells = (await response.json()).sort((a,b) => a.order - b.order);
      if (!spells.length) throw new Error('No spells');
      $('#cat').innerHTML = ['全部',...new Set(spells.map(s => s.category))].map(c => `<option value="${escape(c)}">${escape(c)}</option>`).join('');
      render();
    } catch (error) {
      $('#spell-count').textContent = '';
      $('#spell-icons').innerHTML = '<div class="empty">召喚師技能資料暫時無法載入。<button type="button" id="spell-retry">重新載入</button></div>';
      $('#spell-retry').onclick = load;
    }
  }
  $('#q').oninput = render;
  $('#cat').onchange = render;
  load();
})();
