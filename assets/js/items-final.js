(() => {
  'use strict';
  let data = {items: []}, category = '鬥士', selectedId = null, history = [];
  const stages = ['基本裝備','基本配置','中階','主動裝備','高階裝備','進化裝備','基礎鞋','二級鞋','三級鞋'];
  const $ = selector => document.querySelector(selector);
  const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const find = id => data.items.find(item => item.id === id);
  const mobile = () => matchMedia('(max-width: 900px)').matches;
  const dialog = $('#equipment-dialog');
  const priceText = item => item.evolvesFrom ? '任務進化' : `${item.price} 金幣`;
  const passiveText = item => (item.passives || []).map(p => typeof p === 'string' ? p : `${p.name} ${p.description}`).join(' ');
  function node(id) {
    const item = find(id);
    return item ? `<button type="button" class="build-node" data-node="${escape(id)}" aria-label="查看${escape(item.name)}"><img src="${escape(item.icon)}" alt="" width="48" height="48"><span>${escape(item.name)}</span><small>${escape(priceText(item))}</small></button>` : '';
  }
  function section(title, body, cls = '') {
    return body ? `<section class="equipment-detail-section ${cls}"><h3>${title}</h3>${body}</section>` : '';
  }
  function detailHTML(item) {
    if (!item) return '<div class="empty">選取裝備查看詳細資訊。</div>';
    const stats = item.stats.map(s => `<li><span class="stat-dot" aria-hidden="true"></span><span>${escape(s)}</span></li>`).join('');
    const effects = item.passives.map(p => typeof p === 'string' ? `<div class="passive-entry"><p>${escape(p)}</p></div>` : `<div class="passive-entry">${p.name ? `<strong>${escape(p.name)}</strong>` : ''}<p>${escape(p.description)}</p></div>`).join('');
    const from = item.buildFrom || [], upgrades = item.upgrades || [];
    const componentCost = from.reduce((sum, id) => sum + (find(id)?.price || 0), 0);
    const fee = item.price - componentCost;
    const recipe = from.length ? `<div class="tree-level tree-materials">${from.map(node).join('')}</div>${fee >= 0 ? `<p class="equipment-combine-cost">合成費用：${fee} 金幣 · 總價 ${item.price} 金幣</p>` : ''}` : '';
    let evolution = '';
    if (item.evolvesFrom) evolution = `<p>${escape(item.evolutionCondition)}後，由下列裝備自動進化。</p><div class="tree-level tree-materials">${node(item.evolvesFrom)}</div>`;
    if (item.evolvesTo?.length) evolution += item.evolvesTo.map(id => `<p>${escape(find(id).evolutionCondition)}後進化：</p><div class="tree-level tree-materials">${node(id)}</div>`).join('');
    return `${history.length ? '<button type="button" class="equipment-back" data-detail-back>← 返回上一件裝備</button>' : ''}
      <div class="equipment-detail-brand"><span class="brand-mark">WR</span><span>Wild Rift Guide · 7.3</span></div>
      <header class="equipment-detail-header">
        <div class="equipment-detail-icon"><img src="${escape(item.icon)}" alt="${escape(item.name)}"></div>
        <div class="equipment-detail-title"><h2 tabindex="-1">${escape(item.name)}</h2><div class="detail-meta">${escape(item.stage)}</div><div class="detail-categories">${item.categories.map(c => `<span>${escape(c)}</span>`).join('')}</div></div>
        <div class="detail-price">${item.evolvesFrom ? '<span class="equipment-evolved-price">自動進化</span>' : `<span class="coin-icon" aria-hidden="true">●</span>${item.price}<span class="sr-only"> 金幣</span>`}</div>
      </header>
      ${section('能力值', `<ul class="item-stats">${stats}</ul>`, 'stats-section')}
      ${section('裝備效果', effects ? `<div class="item-passives">${effects}</div>` : '<p class="detail-empty-note">此裝備僅提供上述能力值。</p>', 'passive-section')}
      ${section('合成材料', recipe, 'build-tree')}
      ${section('可合成裝備', upgrades.length ? `<div class="tree-level tree-materials">${upgrades.map(node).join('')}</div>` : '', 'build-tree')}
      ${section('裝備進化', evolution, 'build-tree')}`;
  }
  function updateDetail(focus = false) {
    const panel = mobile() ? $('#equipment-dialog-content') : $('#item-detail');
    const other = mobile() ? $('#item-detail') : $('#equipment-dialog-content');
    other.replaceChildren(); panel.innerHTML = detailHTML(find(selectedId));
    panel.querySelectorAll('[data-node]').forEach(button => button.onclick = () => {
      history.push(selectedId); selectedId = button.dataset.node; updateDetail(true);
    });
    const back = panel.querySelector('[data-detail-back]');
    if (back) back.onclick = () => {selectedId = history.pop(); updateDetail(true);};
    document.querySelectorAll('.item-icon').forEach(el => el.classList.toggle('active', el.dataset.id === selectedId));
    if (focus) {
      (mobile() ? dialog : panel).scrollTop = 0;
      panel.querySelector('h2')?.focus({preventScroll: true});
    }
  }
  function select(item, open = false) {
    if (!item) return;
    if (selectedId !== item.id) {selectedId = item.id; history = [];}
    if (!mobile() || open) updateDetail();
    if (mobile() && open && !dialog.open) dialog.showModal();
  }
  function card(item) {
    return `<button type="button" class="item-icon interactive-icon" data-id="${escape(item.id)}" aria-label="${escape(item.name)}，${escape(priceText(item))}，查看說明"><img src="${escape(item.icon)}" alt="" loading="lazy" width="72" height="72"><strong>${escape(item.name)}</strong><span class="item-price">${item.evolvesFrom ? '自動進化' : item.price}</span></button>`;
  }
  function render() {
    const query = $('#item-search').value.trim().toLocaleLowerCase();
    const rows = data.items.filter(item => item.categories.includes(category) && [item.name,...item.stats,passiveText(item)].join(' ').toLocaleLowerCase().includes(query))
      .sort((a,b) => a.orderByCategory[category] - b.orderByCategory[category]);
    $('#item-count').textContent = `${category} · ${rows.length} 件${query ? '符合搜尋' : ''}｜171 件裝備＋6 件進化裝備`;
    document.querySelectorAll('.item-tab').forEach(button => {const active = button.dataset.category === category;button.classList.toggle('active', active);button.setAttribute('aria-pressed', String(active));});
    const target = $('#item-content');
    if (!rows.length) {
      target.innerHTML = '<div class="empty">此分類沒有符合的裝備，請調整搜尋文字或切換分類。</div>';
      selectedId = null; history = []; $('#item-detail').innerHTML = detailHTML(null); $('#equipment-dialog-content').replaceChildren(); return;
    }
    target.innerHTML = stages.filter(stage => rows.some(item => item.stage === stage)).map(stage => `<section class="item-stage-section"><h2>${stage === '中階' ? '中階裝備' : stage}</h2><div class="item-icon-grid">${rows.filter(item => item.stage === stage).map(card).join('')}</div></section>`).join('');
    target.querySelectorAll('[data-id]').forEach(button => {
      button.onclick = () => select(find(button.dataset.id), true);
      button.onmouseenter = () => {if (matchMedia('(hover: hover)').matches && !mobile()) select(find(button.dataset.id));};
      button.onfocus = () => {if (!mobile()) select(find(button.dataset.id));};
    });
    select(rows.find(item => item.id === selectedId) || rows[0]);
  }
  dialog.querySelector('.equipment-close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  matchMedia('(max-width: 900px)').addEventListener('change', () => {if (dialog.open) dialog.close();render();});
  document.querySelectorAll('.item-tab').forEach(button => button.onclick = () => {category = button.dataset.category; selectedId = null; history = []; render();});
  $('#item-search').oninput = render;
  async function load() {
    try {
      const response = await fetch('../assets/data/items-7.3.json?v=108.0.0');
      if (!response.ok) throw new Error('無法讀取裝備資料');
      data = await response.json();
      if (!Array.isArray(data.items) || !data.items.length) throw new Error('裝備資料格式錯誤');
      const requested=find(new URLSearchParams(location.search).get('item'));
      if(requested){category=requested.categories[0];selectedId=requested.id;}
      render();
      if(requested) select(requested,true);
    } catch (error) {
      $('#item-count').textContent = '';
      $('#item-content').innerHTML = '<div class="empty">裝備資料暫時無法載入，請確認網路後重試。<br><button type="button" id="item-retry">重新載入</button></div>';
      $('#item-retry').onclick = load;
    }
  }
  load();
})();
