(() => {
  'use strict';
  let data = {items: []}, category = '鬥士', selectedId = null, imageIndex = 0;
  const stages = ['基本裝備','基本配置','中階','主動裝備','高階裝備','基礎鞋','二級鞋','三級鞋'];
  const $ = selector => document.querySelector(selector);
  const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const find = id => data.items.find(item => item.id === id);
  const mobile = () => matchMedia('(max-width: 900px)').matches;
  const dialog = $('#equipment-dialog');
  const imageTitle = (shot, index) => `${shot.kind === 'recipe' ? '合成與升級' : '能力值與效果'} · ${index + 1}`;
  function detailHTML(item) {
    if (!item) return '<div class="empty">選取裝備查看詳細資訊。</div>';
    const shot = item.images[imageIndex];
    return `<div class="equipment-detail-brand"><span class="brand-mark">WR</span><span>Wild Rift Guide · 7.3</span></div>
      <header class="equipment-detail-header">
        <div class="equipment-detail-icon"><img src="${escape(item.icon)}" alt="${escape(item.name)}"></div>
        <div class="equipment-detail-title"><h2>${escape(item.name)}</h2><div class="detail-meta">${escape(item.stage)}</div><div class="detail-categories">${item.categories.map(c => `<span>${escape(c)}</span>`).join('')}</div></div>
        <div class="detail-price"><span class="coin-icon" aria-hidden="true">●</span>${item.price}<span class="sr-only"> 金幣</span></div>
      </header>
      <section class="equipment-detail-section equipment-source-section"><h3>遊戲內說明</h3>
        <p class="equipment-source-note">能力值、效果與合成依遊戲截圖呈現；長篇說明請切換下方頁籤。</p>
        <div class="equipment-shot-tabs" role="group" aria-label="說明圖片">${item.images.map((s, i) => `<button type="button" data-shot="${i}" aria-pressed="${i === imageIndex}">${imageTitle(s, i)}</button>`).join('')}</div>
        <figure class="equipment-shot"><a href="${escape(shot.src)}" target="_blank" rel="noopener" aria-label="放大${escape(item.name)}的${imageTitle(shot, imageIndex)}"><img src="${escape(shot.src)}" alt="${escape(item.name)}：${imageTitle(shot, imageIndex)}，遊戲內裝備說明" decoding="async"></a><figcaption>點圖可開啟大圖 · ${imageIndex + 1} / ${item.images.length}</figcaption></figure>
        <div class="equipment-shot-nav"><button type="button" data-step="-1" ${imageIndex === 0 ? 'disabled' : ''}>上一張</button><button type="button" data-step="1" ${imageIndex === item.images.length - 1 ? 'disabled' : ''}>下一張</button></div>
      </section>`;
  }
  function bindPanel(panel) {
    panel.querySelectorAll('[data-shot]').forEach(button => button.onclick = () => {
      imageIndex = Number(button.dataset.shot); updateDetail();
      panel.querySelector(`[data-shot="${imageIndex}"]`)?.focus({preventScroll: true});
    });
    panel.querySelectorAll('[data-step]').forEach(button => button.onclick = () => {
      imageIndex += Number(button.dataset.step); updateDetail();
      panel.querySelector(`[data-shot="${imageIndex}"]`)?.focus({preventScroll: true});
    });
  }
  function updateDetail() {
    const item = find(selectedId);
    const panel = mobile() ? $('#equipment-dialog-content') : $('#item-detail');
    const other = mobile() ? $('#item-detail') : $('#equipment-dialog-content');
    other.replaceChildren(); panel.innerHTML = detailHTML(item); bindPanel(panel);
    document.querySelectorAll('.item-icon').forEach(el => el.classList.toggle('active', el.dataset.id === selectedId));
  }
  function select(item, open = false) {
    if (!item) return;
    if (selectedId !== item.id) { selectedId = item.id; imageIndex = 0; }
    if (!mobile() || open) updateDetail();
    if (mobile() && open && !dialog.open) dialog.showModal();
  }
  function card(item) {
    return `<button type="button" class="item-icon interactive-icon" data-id="${item.id}" aria-label="${escape(item.name)}，${item.price} 金幣，查看說明"><img src="${escape(item.icon)}" alt="" loading="lazy" width="72" height="72"><strong>${escape(item.name)}</strong><span class="item-price">${item.price}</span></button>`;
  }
  function render() {
    const query = $('#item-search').value.trim().toLocaleLowerCase();
    const rows = data.items.filter(item => item.categories.includes(category) && item.name.toLocaleLowerCase().includes(query))
      .sort((a,b) => a.orderByCategory[category] - b.orderByCategory[category]);
    $('#item-count').textContent = `${category} · ${rows.length} 件${query ? '符合搜尋' : ''}｜全資料庫 ${data.items.length} 筆裝備，跨分類共用資料`;
    document.querySelectorAll('.item-tab').forEach(button => {const active = button.dataset.category === category;button.classList.toggle('active', active);button.setAttribute('aria-pressed', String(active));});
    const target = $('#item-content');
    if (!rows.length) {
      target.innerHTML = '<div class="empty">此分類沒有符合名稱的裝備，請調整搜尋文字或切換分類。</div>';
      selectedId = null; imageIndex = 0; $('#item-detail').innerHTML = detailHTML(null); $('#equipment-dialog-content').replaceChildren(); return;
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
  dialog.addEventListener('click', event => {if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right)) dialog.close();});
  matchMedia('(max-width: 900px)').addEventListener('change', () => {if (dialog.open) dialog.close();render();});
  document.querySelectorAll('.item-tab').forEach(button => button.onclick = () => {category = button.dataset.category; selectedId = null;imageIndex = 0;render();});
  $('#item-search').oninput = render;
  async function load() {
    try {
      const response = await fetch('../assets/data/items-7.3.json?v=101.0.0');
      if (!response.ok) throw new Error('無法讀取裝備資料');
      data = await response.json();
      if (!Array.isArray(data.items) || !data.items.length) throw new Error('裝備資料格式錯誤');
      render();
    } catch (error) {
      $('#item-count').textContent = '';
      $('#item-content').innerHTML = '<div class="empty">裝備資料暫時無法載入，請確認網路後重試。<br><button type="button" id="item-retry">重新載入</button></div>';
      $('#item-retry').onclick = load;
    }
  }
  load();
})();
