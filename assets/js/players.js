(() => {
  'use strict';

  const grid = document.querySelector('#playerCardGrid');
  if (!grid) return;

  const auth = window.WRGAuth;
  const DAY = 24 * 60 * 60 * 1000;
  const POST_DAYS = 14;
  const HIDDEN_KEY = 'wrg.hiddenPlayerPosts.v91';

  const labels = {
    server: { tw:'台港澳', sea:'東南亞', jp:'日本', kr:'韓國', other:'其他' },
    rank: { unranked:'未定級', iron:'鐵牌', bronze:'銅牌', silver:'銀牌', gold:'金牌', platinum:'白金', emerald:'翡翠', diamond:'鑽石', master:'大師', grandmaster:'宗師', challenger:'菁英' },
    role: { baron:'巴龍路', jungle:'打野', mid:'中路', duo:'飛龍路', support:'輔助', fill:'補位／不限' },
    mode: { duoRank:'積分雙排', rankTeam:'積分組隊', normal:'一般對戰', aram:'ARAM', newbie:'新手交流' },
    time: { morning:'早上', afternoon:'下午', evening:'晚上', late:'深夜', weekend:'週末為主', flexible:'時間彈性' },
    voice: { yes:'可語音', no:'不開語音', either:'語音皆可' }
  };

  const allowed = {
    server: new Set(Object.keys(labels.server)),
    rank: new Set(Object.keys(labels.rank)),
    role: new Set(Object.keys(labels.role)),
    mode: new Set(Object.keys(labels.mode)),
    time: new Set(Object.keys(labels.time)),
    voice: new Set(Object.keys(labels.voice))
  };

  const elements = {
    keyword: document.querySelector('#playerKeyword'),
    server: document.querySelector('#playerServer'),
    rank: document.querySelector('#playerRank'),
    role: document.querySelector('#playerRole'),
    wantedRole: document.querySelector('#playerWantedRole'),
    mode: document.querySelector('#playerMode'),
    time: document.querySelector('#playerTime'),
    reset: document.querySelector('#resetPlayerFilters'),
    refresh: document.querySelector('#refreshPlayerPosts'),
    visible: document.querySelector('#playerVisibleCount'),
    own: document.querySelector('#playerOwnCount'),
    result: document.querySelector('#playerResultText'),
    empty: document.querySelector('#playerEmpty'),
    notice: document.querySelector('#playerServiceNotice'),
    noticeTitle: document.querySelector('#playerServiceTitle'),
    noticeText: document.querySelector('#playerServiceText'),
    dialog: document.querySelector('#playerPostDialog'),
    dialogTitle: document.querySelector('#playerDialogTitle'),
    form: document.querySelector('#playerPostForm'),
    open: document.querySelector('#openPlayerPost'),
    close: document.querySelector('#closePlayerPost'),
    cancel: document.querySelector('#cancelPlayerPost'),
    noteCount: document.querySelector('#playerNoteCount'),
    reportDialog: document.querySelector('#playerReportDialog'),
    reportForm: document.querySelector('#playerReportForm'),
    toast: document.querySelector('#playerToast')
  };

  let posts = [];
  let ownPost = null;
  let loading = true;
  let saving = false;
  let lastUserId = '';
  let hiddenIds = new Set(readJSON(HIDDEN_KEY));

  function readJSON(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function persistHidden() {
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hiddenIds])); } catch (_) {}
  }

  const cleanText = (value) => String(value || '').replace(/[<>]/g, '').trim();
  const normalized = (value) => cleanText(value).normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/\s+/g, '');
  const currentUser = () => auth?.user || null;

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  }

  function errorInfo(error, fallback = '操作失敗，請稍後再試') {
    if (auth?.errorDetails) return auth.errorDetails(error, fallback);
    return { message: String(error?.message || fallback), technical: '' };
  }

  function isMissingTable(error) {
    const message = String(error?.message || error?.details || error || '').toLocaleLowerCase('en');
    return ['42p01', 'pgrst205'].includes(String(error?.code || '').toLocaleLowerCase('en'))
      || (/player_posts|player_reports/.test(message) && /does not exist|schema cache|could not find/.test(message));
  }

  function setNotice(title, content, type = '') {
    elements.noticeTitle.textContent = title;
    elements.noticeText.textContent = content;
    elements.notice.classList.toggle('is-error', type === 'error');
    elements.notice.classList.toggle('is-ready', type === 'ready');
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 2800);
  }

  function setBusy(button, busy, busyText = '') {
    if (!button) return;
    if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
    button.disabled = Boolean(busy);
    button.textContent = busy && busyText ? busyText : button.dataset.originalText;
  }

  async function copyText(value, message = '已複製遊戲 ID') {
    try {
      await navigator.clipboard.writeText(value);
    } catch (_) {
      const temp = document.createElement('textarea');
      temp.value = value;
      temp.setAttribute('readonly', '');
      temp.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
    showToast(message);
  }

  function relativeTime(value) {
    const diff = Math.max(0, Date.now() - new Date(value || 0).getTime());
    if (diff < 60 * 1000) return '剛剛更新';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} 分鐘前更新`;
    if (diff < DAY) return `${Math.floor(diff / (60 * 60 * 1000))} 小時前更新`;
    return `${Math.floor(diff / DAY)} 天前更新`;
  }

  function expiryText(value) {
    const remaining = new Date(value || 0).getTime() - Date.now();
    if (remaining <= 0) return '已到期';
    return `剩餘 ${Math.max(1, Math.ceil(remaining / DAY))} 天`;
  }

  function rowToPost(row) {
    return {
      id: row.id,
      userId: row.user_id,
      displayName: row.display_name,
      riotId: row.riot_id,
      server: row.server,
      rank: row.rank,
      roles: [row.primary_role, row.secondary_role].filter(Boolean),
      wantedRoles: Array.isArray(row.wanted_roles) ? row.wanted_roles : [],
      mode: row.mode,
      onlineTime: row.online_time,
      voice: row.voice || 'either',
      contact: row.contact || '',
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      expiresAt: row.expires_at,
      status: row.status
    };
  }

  function currentFilters() {
    return {
      keyword: normalized(elements.keyword.value),
      server: elements.server.value,
      rank: elements.rank.value,
      role: elements.role.value,
      wantedRole: elements.wantedRole.value,
      mode: elements.mode.value,
      time: elements.time.value
    };
  }

  function matches(post, filters) {
    const haystack = normalized([post.displayName, post.riotId, post.note, post.contact].join(' '));
    return (!filters.keyword || haystack.includes(filters.keyword))
      && (filters.server === 'all' || post.server === filters.server)
      && (filters.rank === 'all' || post.rank === filters.rank)
      && (filters.role === 'all' || post.roles.includes(filters.role))
      && (filters.wantedRole === 'all' || post.wantedRoles.includes(filters.wantedRole) || post.wantedRoles.includes('fill'))
      && (filters.mode === 'all' || post.mode === filters.mode)
      && (filters.time === 'all' || post.onlineTime === filters.time);
  }

  function initials(name) {
    return escapeHTML([...cleanText(name)].slice(0, 2).join('') || 'WR');
  }

  function roleChips(values, className) {
    return values.map((role) => `<span class="player-chip ${className}">${escapeHTML(labels.role[role] || role)}</span>`).join('');
  }

  function renderCard(post) {
    const user = currentUser();
    const isOwn = Boolean(user && post.userId === user.id);
    const contact = post.contact ? `<div class="player-contact"><span>聯絡方式</span><strong>${escapeHTML(post.contact)}</strong></div>` : '';
    const ownerActions = `<button type="button" class="primary" data-edit-id="${escapeHTML(post.id)}">編輯／延長刊登</button><button type="button" class="danger" data-delete-id="${escapeHTML(post.id)}">刪除</button>`;
    const publicActions = `<button type="button" class="primary" data-copy-id="${escapeHTML(post.riotId)}">＋ 複製並加好友</button><button type="button" data-report-id="${escapeHTML(post.id)}">檢舉／隱藏</button>`;
    return `<article class="player-card" data-player-id="${escapeHTML(post.id)}">
      <div class="player-card-top">
        <div class="player-avatar-mark">${initials(post.displayName)}</div>
        <div class="player-card-title"><div><div><h3>${escapeHTML(post.displayName)}</h3>${isOwn ? '<span class="player-own-label">你的刊登</span>' : ''}</div><small>${escapeHTML(expiryText(post.expiresAt))}</small></div><small>${escapeHTML(relativeTime(post.updatedAt))}</small></div>
      </div>
      <div class="player-id-row"><code>${escapeHTML(post.riotId)}</code><button type="button" data-copy-id="${escapeHTML(post.riotId)}">複製 ID</button></div>
      <div class="player-card-meta"><span>${escapeHTML(labels.server[post.server] || post.server)}</span><span>${escapeHTML(labels.rank[post.rank] || post.rank)}</span><span>${escapeHTML(labels.mode[post.mode] || post.mode)}</span><span>${escapeHTML(labels.time[post.onlineTime] || post.onlineTime)}</span><span>${escapeHTML(labels.voice[post.voice] || post.voice)}</span></div>
      <div class="player-role-group"><span>我玩的位置</span><div>${roleChips(post.roles, 'role')}</div></div>
      <div class="player-role-group"><span>想找的位置</span><div>${roleChips(post.wantedRoles, 'wanted')}</div></div>
      <p class="player-note">${escapeHTML(post.note)}</p>
      ${contact}
      <div class="player-card-actions">${isOwn ? ownerActions : publicActions}</div>
    </article>`;
  }

  function render() {
    const visible = posts.filter((post) => !hiddenIds.has(post.id)).filter((post) => matches(post, currentFilters()));
    grid.innerHTML = visible.map(renderCard).join('');
    elements.visible.textContent = String(visible.length);
    elements.own.textContent = ownPost ? '1' : '0';
    elements.result.textContent = loading ? '載入中…' : `共 ${visible.length} 筆符合條件`;
    elements.empty.hidden = loading || visible.length !== 0;
    grid.hidden = loading || visible.length === 0;
    elements.open.textContent = ownPost ? '編輯我的刊登' : '＋ 發布找隊友';
  }

  function updateServiceStatus() {
    if (loading) {
      setNotice('正在連線找隊友資料', '稍候一下，完成後即可查看所有公開貼文。');
    } else if (currentUser()) {
      setNotice('找隊友服務已連線', ownPost ? '你的刊登已公開，可隨時編輯或延長 14 天。' : '你已登入，可以發布一篇找隊友貼文。', 'ready');
    } else {
      setNotice('所有玩家都能瀏覽貼文', '登入會員後即可發布、編輯、刪除或檢舉找隊友內容。', 'ready');
    }
  }

  async function loadPosts({ quiet = false } = {}) {
    if (!auth?.client) {
      loading = false;
      posts = [];
      ownPost = null;
      setNotice('找隊友服務尚未連線', '會員服務目前無法使用，請稍後重新整理。', 'error');
      render();
      return;
    }
    loading = true;
    if (!quiet) setBusy(elements.refresh, true, '更新中…');
    render();
    try {
      const user = currentUser();
      const publicQuery = auth.client.from('player_posts')
        .select('id,user_id,display_name,riot_id,server,rank,primary_role,secondary_role,wanted_roles,mode,online_time,voice,contact,note,status,created_at,updated_at,expires_at')
        .eq('status', 'active').gt('expires_at', new Date().toISOString())
        .order('updated_at', { ascending: false }).limit(200);
      const ownQuery = user ? auth.client.from('player_posts').select('*').eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null, error: null });
      const reportsQuery = user ? auth.client.from('player_reports').select('post_id').eq('reporter_id', user.id) : Promise.resolve({ data: [], error: null });
      const [publicResult, ownResult, reportsResult] = await Promise.all([publicQuery, ownQuery, reportsQuery]);
      if (publicResult.error) throw publicResult.error;
      if (ownResult.error) throw ownResult.error;
      if (reportsResult.error) throw reportsResult.error;
      ownPost = ownResult.data ? rowToPost(ownResult.data) : null;
      (reportsResult.data || []).forEach((row) => hiddenIds.add(row.post_id));
      persistHidden();
      posts = (publicResult.data || []).map(rowToPost);
      loading = false;
      updateServiceStatus();
      render();
    } catch (error) {
      console.error('找隊友資料載入失敗', error);
      loading = false;
      posts = [];
      ownPost = null;
      const info = errorInfo(error, '找隊友資料載入失敗，請稍後重試。');
      setNotice(isMissingTable(error) ? '找隊友資料表尚未啟用' : '找隊友資料載入失敗', isMissingTable(error) ? '請先執行 v91 找隊友資料庫安裝檔，再重新整理頁面。' : info.message, 'error');
      render();
    } finally {
      setBusy(elements.refresh, false);
    }
  }

  function openModal(dialog) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeModal(dialog) {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function requireLogin() {
    if (currentUser()) return true;
    location.href = auth.memberUrl(auth.currentRelativeUrl());
    return false;
  }

  function setWantedRoles(values = []) {
    const selected = new Set(values);
    elements.form.querySelectorAll('input[name="wantedRoles"]').forEach((input) => { input.checked = selected.has(input.value); });
  }

  function openPostDialog() {
    if (!requireLogin()) return;
    elements.form.reset();
    const post = ownPost;
    elements.dialogTitle.textContent = post ? '編輯找隊友刊登' : '發布找隊友';
    elements.form.elements.displayName.value = post?.displayName || auth.displayName();
    elements.form.elements.riotId.value = post?.riotId || '';
    elements.form.elements.server.value = post?.server || '';
    elements.form.elements.rank.value = post?.rank || '';
    elements.form.elements.primaryRole.value = post?.roles?.[0] || '';
    elements.form.elements.secondaryRole.value = post?.roles?.[1] || '';
    elements.form.elements.mode.value = post?.mode || '';
    elements.form.elements.onlineTime.value = post?.onlineTime || '';
    elements.form.elements.voice.value = post?.voice || 'either';
    elements.form.elements.contact.value = post?.contact || '';
    elements.form.elements.note.value = post?.note || '';
    elements.form.elements.agree.checked = Boolean(post);
    setWantedRoles(post?.wantedRoles || []);
    elements.noteCount.textContent = String((post?.note || '').length);
    openModal(elements.dialog);
    setTimeout(() => elements.form.elements.displayName?.focus(), 30);
  }

  function validValue(group, value) {
    return allowed[group].has(value) ? value : '';
  }

  function postPayload(formData) {
    const primaryRole = validValue('role', cleanText(formData.get('primaryRole')));
    let secondaryRole = validValue('role', cleanText(formData.get('secondaryRole'))) || null;
    if (secondaryRole === primaryRole) secondaryRole = null;
    const wantedRoles = [...new Set(formData.getAll('wantedRoles').map((value) => validValue('role', cleanText(value))).filter(Boolean))];
    return {
      user_id: currentUser().id,
      display_name: cleanText(formData.get('displayName')).slice(0, 20),
      riot_id: cleanText(formData.get('riotId')).slice(0, 36),
      server: validValue('server', cleanText(formData.get('server'))),
      rank: validValue('rank', cleanText(formData.get('rank'))),
      primary_role: primaryRole,
      secondary_role: secondaryRole,
      wanted_roles: wantedRoles,
      mode: validValue('mode', cleanText(formData.get('mode'))),
      online_time: validValue('time', cleanText(formData.get('onlineTime'))),
      voice: validValue('voice', cleanText(formData.get('voice'))) || 'either',
      contact: cleanText(formData.get('contact')).slice(0, 40) || null,
      note: cleanText(formData.get('note')).slice(0, 120),
      status: 'active',
      expires_at: new Date(Date.now() + POST_DAYS * DAY).toISOString()
    };
  }

  function payloadComplete(payload) {
    return payload.display_name && payload.riot_id && payload.server && payload.rank
      && payload.primary_role && payload.wanted_roles.length && payload.mode && payload.online_time && payload.note;
  }

  async function savePost(event) {
    event.preventDefault();
    if (saving || !elements.form.reportValidity() || !requireLogin()) return;
    const payload = postPayload(new FormData(elements.form));
    if (!payloadComplete(payload)) {
      showToast(payload.wanted_roles.length ? '請完成所有必填欄位' : '請至少選擇一個想找的位置');
      return;
    }
    saving = true;
    const submit = elements.form.querySelector('button[type="submit"]');
    setBusy(submit, true, ownPost ? '儲存中…' : '發布中…');
    try {
      const wasEditing = Boolean(ownPost);
      const result = ownPost
        ? await auth.client.from('player_posts').update(payload).eq('id', ownPost.id).eq('user_id', currentUser().id).select().single()
        : await auth.client.from('player_posts').insert(payload).select().single();
      if (result.error) throw result.error;
      closeModal(elements.dialog);
      await loadPosts({ quiet: true });
      showToast(wasEditing ? '刊登已更新並延長 14 天' : '找隊友貼文已公開發布');
    } catch (error) {
      console.error('找隊友貼文儲存失敗', error);
      showToast(errorInfo(error, '貼文儲存失敗，請稍後再試。').message);
    } finally {
      saving = false;
      setBusy(submit, false);
    }
  }

  async function deletePost(id) {
    if (!requireLogin() || !ownPost || ownPost.id !== id) return;
    if (!confirm('確定刪除這篇找隊友刊登嗎？刪除後無法復原。')) return;
    try {
      const { error } = await auth.client.from('player_posts').delete().eq('id', id).eq('user_id', currentUser().id);
      if (error) throw error;
      await loadPosts({ quiet: true });
      showToast('找隊友刊登已刪除');
    } catch (error) {
      console.error('刪除找隊友貼文失敗', error);
      showToast(errorInfo(error, '刪除失敗，請稍後再試。').message);
    }
  }

  function openReportDialog(id) {
    if (!requireLogin()) return;
    const post = posts.find((item) => item.id === id);
    if (!post || post.userId === currentUser().id) return;
    elements.reportForm.reset();
    elements.reportForm.elements.postId.value = id;
    openModal(elements.reportDialog);
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!elements.reportForm.reportValidity() || !requireLogin()) return;
    const data = new FormData(elements.reportForm);
    const postId = cleanText(data.get('postId'));
    const reason = cleanText(data.get('reason'));
    const detail = cleanText(data.get('detail')).slice(0, 120) || null;
    if (!postId || !['abuse', 'spam', 'scam', 'personal', 'other'].includes(reason)) return;
    const submit = elements.reportForm.querySelector('button[type="submit"]');
    setBusy(submit, true, '送出中…');
    try {
      const { error } = await auth.client.from('player_reports').insert({ post_id: postId, reporter_id: currentUser().id, reason, detail });
      if (error && String(error.code || '') !== '23505') throw error;
      hiddenIds.add(postId);
      persistHidden();
      closeModal(elements.reportDialog);
      render();
      showToast(error ? '你已檢舉過這篇貼文，已為你隱藏' : '檢舉已送出，貼文已為你隱藏');
    } catch (error) {
      console.error('找隊友檢舉失敗', error);
      showToast(errorInfo(error, '檢舉送出失敗，請稍後再試。').message);
    } finally {
      setBusy(submit, false);
    }
  }

  [elements.keyword, elements.server, elements.rank, elements.role, elements.wantedRole, elements.mode, elements.time].forEach((input) => {
    input.addEventListener(input.tagName === 'INPUT' ? 'input' : 'change', render);
  });

  elements.reset.addEventListener('click', () => {
    elements.keyword.value = '';
    [elements.server, elements.rank, elements.role, elements.wantedRole, elements.mode, elements.time].forEach((select) => { select.value = 'all'; });
    render();
  });
  elements.refresh.addEventListener('click', () => loadPosts());
  elements.open.addEventListener('click', openPostDialog);
  document.querySelectorAll('[data-open-player-post]').forEach((button) => button.addEventListener('click', openPostDialog));
  elements.close.addEventListener('click', () => closeModal(elements.dialog));
  elements.cancel.addEventListener('click', () => closeModal(elements.dialog));
  elements.dialog.addEventListener('click', (event) => { if (event.target === elements.dialog) closeModal(elements.dialog); });
  elements.reportDialog.addEventListener('click', (event) => { if (event.target === elements.reportDialog) closeModal(elements.reportDialog); });
  document.querySelectorAll('[data-close-report]').forEach((button) => button.addEventListener('click', () => closeModal(elements.reportDialog)));
  elements.form.elements.note.addEventListener('input', (event) => { elements.noteCount.textContent = String(event.target.value.length); });
  elements.form.addEventListener('submit', savePost);
  elements.reportForm.addEventListener('submit', submitReport);

  grid.addEventListener('click', (event) => {
    const copyButton = event.target.closest('[data-copy-id]');
    if (copyButton) return void copyText(copyButton.dataset.copyId);
    const editButton = event.target.closest('[data-edit-id]');
    if (editButton) return void openPostDialog();
    const deleteButton = event.target.closest('[data-delete-id]');
    if (deleteButton) return void deletePost(deleteButton.dataset.deleteId);
    const reportButton = event.target.closest('[data-report-id]');
    if (reportButton) openReportDialog(reportButton.dataset.reportId);
  });

  async function initialize() {
    render();
    if (!auth) {
      loading = false;
      setNotice('會員服務尚未載入', '請重新整理頁面後再試。', 'error');
      render();
      return;
    }
    await auth.ready;
    lastUserId = currentUser()?.id || '';
    await loadPosts();
    auth.subscribe((snapshot) => {
      const nextUserId = snapshot.user?.id || '';
      if (nextUserId === lastUserId) return;
      lastUserId = nextUserId;
      loadPosts({ quiet: true });
    });
  }

  initialize();
})();
