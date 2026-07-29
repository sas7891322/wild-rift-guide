(() => {
  'use strict';

  const grid = document.querySelector('#playerCardGrid');
  if (!grid) return;

  const STORAGE_KEY = 'wrg.playerPosts.v1';
  const REPORT_KEY = 'wrg.reportedPlayerPosts.v1';
  const DAY = 24 * 60 * 60 * 1000;
  const MAX_AGE = 14 * DAY;

  const labels = {
    server: {tw:'台港澳',sea:'東南亞',jp:'日本',kr:'韓國',other:'其他'},
    rank: {unranked:'未定級',iron:'鐵牌',bronze:'銅牌',silver:'銀牌',gold:'金牌',platinum:'白金',emerald:'翡翠',diamond:'鑽石',master:'大師',grandmaster:'宗師',challenger:'菁英'},
    role: {baron:'巴龍路',jungle:'打野',mid:'中路',duo:'飛龍路',support:'輔助',fill:'補位'},
    mode: {duoRank:'積分雙排',rankTeam:'積分組隊',normal:'一般對戰',aram:'ARAM',newbie:'新手交流'},
    time: {morning:'早上',afternoon:'下午',evening:'晚上',late:'深夜',weekend:'週末為主',flexible:'時間彈性'},
    voice: {yes:'可語音',no:'不開語音',either:'語音皆可'}
  };

  const now = Date.now();
  const samples = [
    {id:'sample-1',sample:true,displayName:'心豈',riotId:'心豈#TW2',server:'tw',rank:'emerald',roles:['duo','support'],mode:'duoRank',onlineTime:'evening',voice:'yes',contact:'',note:'晚上固定上線，想找不嘴砲、願意溝通的雙排隊友。',createdAt:now-22*60*1000},
    {id:'sample-2',sample:true,displayName:'補位不嘴',riotId:'補位不嘴#0420',server:'tw',rank:'platinum',roles:['jungle','mid'],mode:'rankTeam',onlineTime:'late',voice:'either',contact:'Discord：Fill0420',note:'主打野也能補中，輸贏都不怪隊友，希望一起檢討進步。',createdAt:now-3*60*60*1000},
    {id:'sample-3',sample:true,displayName:'輔助找ADC',riotId:'保你不保KDA#SUPP',server:'tw',rank:'diamond',roles:['support'],mode:'duoRank',onlineTime:'evening',voice:'yes',contact:'',note:'常玩瑟雷西、露璐和娜米，想找穩定飛龍路一起爬分。',createdAt:now-7*60*60*1000},
    {id:'sample-4',sample:true,displayName:'峽谷養生玩家',riotId:'峽谷養生#7788',server:'tw',rank:'master',roles:['baron','fill'],mode:'normal',onlineTime:'weekend',voice:'no',contact:'',note:'週末為主，一般場練角或輕鬆玩，不吵架、不催投降。',createdAt:now-DAY},
    {id:'sample-5',sample:true,displayName:'ARAM只想笑',riotId:'雪球丟歪#5566',server:'sea',rank:'unranked',roles:['fill'],mode:'aram',onlineTime:'late',voice:'either',contact:'',note:'深夜 ARAM 歡樂團，不在意勝率，會丟雪球就能加入。',createdAt:now-2*DAY},
    {id:'sample-6',sample:true,displayName:'新手慢慢來',riotId:'第一次進峽谷#0808',server:'tw',rank:'silver',roles:['mid','support'],mode:'newbie',onlineTime:'afternoon',voice:'no',contact:'',note:'剛開始玩，希望找願意一起練習、不會因失誤生氣的玩家。',createdAt:now-3*DAY}
  ];

  const elements = {
    keyword: document.querySelector('#playerKeyword'),
    server: document.querySelector('#playerServer'),
    rank: document.querySelector('#playerRank'),
    role: document.querySelector('#playerRole'),
    mode: document.querySelector('#playerMode'),
    time: document.querySelector('#playerTime'),
    reset: document.querySelector('#resetPlayerFilters'),
    visible: document.querySelector('#playerVisibleCount'),
    own: document.querySelector('#playerOwnCount'),
    result: document.querySelector('#playerResultText'),
    empty: document.querySelector('#playerEmpty'),
    dialog: document.querySelector('#playerPostDialog'),
    form: document.querySelector('#playerPostForm'),
    open: document.querySelector('#openPlayerPost'),
    close: document.querySelector('#closePlayerPost'),
    cancel: document.querySelector('#cancelPlayerPost'),
    noteCount: document.querySelector('#playerNoteCount'),
    toast: document.querySelector('#playerToast')
  };

  const readJSON = (key, fallback=[]) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (_) { return fallback; }
  };

  const writeJSON = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  };

  const cleanText = value => String(value || '').replace(/[<>]/g, '').trim();
  const normalized = value => cleanText(value).normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/\s+/g,'');

  let ownPosts = readJSON(STORAGE_KEY).filter(post => Number(post.createdAt) > now - MAX_AGE);
  writeJSON(STORAGE_KEY, ownPosts);
  let reported = new Set(readJSON(REPORT_KEY));

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  function relativeTime(timestamp) {
    const diff = Math.max(0, Date.now() - Number(timestamp || 0));
    if (diff < 60 * 1000) return '剛剛';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} 分鐘前`;
    if (diff < DAY) return `${Math.floor(diff / (60 * 60 * 1000))} 小時前`;
    return `${Math.floor(diff / DAY)} 天前`;
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 2400);
  }

  async function copyText(text, message='已複製遊戲 ID') {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.setAttribute('readonly','');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
    showToast(message);
  }

  function allPosts() {
    return [...ownPosts, ...samples]
      .filter(post => !reported.has(post.id))
      .sort((a,b) => Number(b.createdAt) - Number(a.createdAt));
  }

  function currentFilters() {
    return {
      keyword: normalized(elements.keyword.value),
      server: elements.server.value,
      rank: elements.rank.value,
      role: elements.role.value,
      mode: elements.mode.value,
      time: elements.time.value
    };
  }

  function matches(post, filters) {
    const haystack = normalized([post.displayName, post.riotId, post.note, post.contact].join(' '));
    return (!filters.keyword || haystack.includes(filters.keyword))
      && (filters.server === 'all' || post.server === filters.server)
      && (filters.rank === 'all' || post.rank === filters.rank)
      && (filters.role === 'all' || (post.roles || []).includes(filters.role))
      && (filters.mode === 'all' || post.mode === filters.mode)
      && (filters.time === 'all' || post.onlineTime === filters.time);
  }

  function initials(name) {
    const text = cleanText(name);
    return escapeHTML(text.slice(0, 2) || 'WR');
  }

  function renderCard(post) {
    const roles = (post.roles || []).map(role => `<span class="player-chip role">${escapeHTML(labels.role[role] || role)}</span>`).join('');
    const contact = post.contact ? `<div class="player-contact"><span>聯絡方式</span><strong>${escapeHTML(post.contact)}</strong></div>` : '';
    const action = post.sample
      ? `<button type="button" data-report-id="${escapeHTML(post.id)}">檢舉／隱藏</button>`
      : `<button type="button" class="danger" data-delete-id="${escapeHTML(post.id)}">刪除我的貼文</button>`;
    return `<article class="player-card" data-player-id="${escapeHTML(post.id)}">
      <div class="player-card-top">
        <div class="player-avatar-mark">${initials(post.displayName)}</div>
        <div class="player-card-title"><div><h3>${escapeHTML(post.displayName)}</h3>${post.sample?'<span class="player-sample-label">示範資料</span>':'<span class="player-own-label">你的投稿</span>'}</div><small>${relativeTime(post.createdAt)}</small></div>
      </div>
      <div class="player-id-row"><code>${escapeHTML(post.riotId)}</code><button type="button" data-copy-id="${escapeHTML(post.riotId)}">複製 ID</button></div>
      <div class="player-card-meta">
        <span>${escapeHTML(labels.server[post.server] || post.server)}</span><span>${escapeHTML(labels.rank[post.rank] || post.rank)}</span><span>${escapeHTML(labels.mode[post.mode] || post.mode)}</span><span>${escapeHTML(labels.time[post.onlineTime] || post.onlineTime)}</span><span>${escapeHTML(labels.voice[post.voice] || post.voice)}</span>
      </div>
      <div class="player-role-chips">${roles}</div>
      <p class="player-note">${escapeHTML(post.note)}</p>
      ${contact}
      <div class="player-card-actions"><button type="button" class="primary" data-copy-id="${escapeHTML(post.riotId)}">＋ 複製並加好友</button>${action}</div>
    </article>`;
  }

  function render() {
    const filters = currentFilters();
    const posts = allPosts();
    const visible = posts.filter(post => matches(post, filters));
    grid.innerHTML = visible.map(renderCard).join('');
    elements.visible.textContent = String(visible.length);
    elements.own.textContent = String(ownPosts.length);
    elements.result.textContent = `共 ${visible.length} 筆符合條件`;
    elements.empty.hidden = visible.length !== 0;
    grid.hidden = visible.length === 0;
  }

  function openDialog() {
    if (typeof elements.dialog.showModal === 'function') elements.dialog.showModal();
    else elements.dialog.setAttribute('open','');
    setTimeout(() => elements.form.elements.displayName?.focus(), 30);
  }

  function closeDialog() {
    if (typeof elements.dialog.close === 'function') elements.dialog.close();
    else elements.dialog.removeAttribute('open');
  }

  function createPost(formData) {
    const primaryRole = cleanText(formData.get('primaryRole'));
    const secondaryRole = cleanText(formData.get('secondaryRole'));
    const roles = [...new Set([primaryRole, secondaryRole].filter(Boolean))];
    return {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      sample: false,
      displayName: cleanText(formData.get('displayName')).slice(0,20),
      riotId: cleanText(formData.get('riotId')).slice(0,36),
      server: cleanText(formData.get('server')),
      rank: cleanText(formData.get('rank')),
      roles,
      mode: cleanText(formData.get('mode')),
      onlineTime: cleanText(formData.get('onlineTime')),
      voice: cleanText(formData.get('voice')) || 'either',
      contact: cleanText(formData.get('contact')).slice(0,40),
      note: cleanText(formData.get('note')).slice(0,120),
      createdAt: Date.now()
    };
  }

  [elements.keyword, elements.server, elements.rank, elements.role, elements.mode, elements.time].forEach(input => {
    input.addEventListener(input.tagName === 'INPUT' ? 'input' : 'change', render);
  });

  elements.reset.addEventListener('click', () => {
    elements.keyword.value = '';
    [elements.server, elements.rank, elements.role, elements.mode, elements.time].forEach(select => { select.value = 'all'; });
    render();
  });

  elements.open.addEventListener('click', openDialog);
  document.querySelectorAll('[data-open-player-post]').forEach(button => button.addEventListener('click', openDialog));
  elements.close.addEventListener('click', closeDialog);
  elements.cancel.addEventListener('click', closeDialog);
  elements.dialog.addEventListener('click', event => {
    if (event.target === elements.dialog) closeDialog();
  });

  elements.form.elements.note.addEventListener('input', event => {
    elements.noteCount.textContent = String(event.target.value.length);
  });

  elements.form.addEventListener('submit', event => {
    event.preventDefault();
    if (!elements.form.reportValidity()) return;
    const post = createPost(new FormData(elements.form));
    if (!post.displayName || !post.riotId || !post.roles.length || !post.note) {
      showToast('請完成所有必填欄位');
      return;
    }
    ownPosts.unshift(post);
    if (!writeJSON(STORAGE_KEY, ownPosts)) {
      ownPosts.shift();
      showToast('瀏覽器無法儲存資料，請確認沒有停用網站儲存空間');
      return;
    }
    elements.form.reset();
    elements.noteCount.textContent = '0';
    closeDialog();
    render();
    showToast('已發布展示貼文，只會保存在這台裝置');
  });

  grid.addEventListener('click', event => {
    const copyButton = event.target.closest('[data-copy-id]');
    if (copyButton) {
      copyText(copyButton.dataset.copyId);
      return;
    }
    const deleteButton = event.target.closest('[data-delete-id]');
    if (deleteButton) {
      const id = deleteButton.dataset.deleteId;
      if (!confirm('確定刪除這篇找隊友貼文嗎？')) return;
      ownPosts = ownPosts.filter(post => post.id !== id);
      writeJSON(STORAGE_KEY, ownPosts);
      render();
      showToast('貼文已刪除');
      return;
    }
    const reportButton = event.target.closest('[data-report-id]');
    if (reportButton) {
      reported.add(reportButton.dataset.reportId);
      writeJSON(REPORT_KEY, [...reported]);
      render();
      showToast('已在這台裝置隱藏該貼文');
    }
  });

  render();
})();
