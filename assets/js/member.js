(() => {
  'use strict';

  const auth = window.WRGAuth;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo') || '';

  const setupPanel = $('#memberSetupRequired');
  const authPanel = $('#memberAuthPanel');
  const dashboard = $('#memberDashboard');
  const recoveryPanel = $('#memberRecoveryPanel');
  const message = $('#memberMessage');
  const connectionStatus = $('#memberConnectionStatus');

  let heroCatalog = [];
  let lastRenderedUserId = '';

  function sessionGet(key) {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  }

  function sessionSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (_) {}
  }

  function sessionRemove(key) {
    try { sessionStorage.removeItem(key); } catch (_) {}
  }

  function showMessage(content = '', type = 'info', technical = '') {
    if (!message) return;
    message.replaceChildren();
    message.className = `member-message ${type}`;
    const text = String(content || '').trim();
    if (!text) {
      message.hidden = true;
      return;
    }

    const main = document.createElement('span');
    main.textContent = text;
    message.appendChild(main);

    const detailText = String(technical || '').trim();
    if (detailText && detailText !== text) {
      const details = document.createElement('details');
      details.className = 'member-error-details';
      const summary = document.createElement('summary');
      summary.textContent = '查看技術資訊';
      const code = document.createElement('code');
      code.textContent = detailText;
      details.append(summary, code);
      message.appendChild(details);
    }
    message.hidden = false;
  }

  function showError(error, fallback) {
    const info = auth?.errorDetails ? auth.errorDetails(error, fallback) : { message: fallback, technical: String(error || '') };
    console.error(error);
    showMessage(info.message || fallback, 'error', error?.technical || info.technical);
  }

  function setBusy(form, busy, busyText = '') {
    if (!form) return;
    form.setAttribute('aria-busy', String(Boolean(busy)));
    $$('button,input', form).forEach((node) => { node.disabled = Boolean(busy); });
    const submit = $('button[type="submit"]', form);
    if (submit) {
      if (!submit.dataset.originalText) submit.dataset.originalText = submit.textContent;
      submit.textContent = busy && busyText ? busyText : submit.dataset.originalText;
    }
  }

  function safeReturn() {
    if (!returnTo) return '';
    try {
      const url = new URL(returnTo, location.origin);
      if (url.origin === location.origin && !/\/auth-callback\.html/i.test(url.pathname)) {
        return `${url.pathname}${url.search}${url.hash}`;
      }
    } catch (_) {}
    return '';
  }

  function showAuthMode(mode = 'login') {
    $$('.member-auth-form').forEach((form) => { form.hidden = form.dataset.authForm !== mode; });
    $$('.member-auth-switch').forEach((button) => {
      button.setAttribute('aria-current', String(button.dataset.authMode === mode));
    });
    const titleMap = {
      login: ['登入攻略帳號', '會員名稱、收藏英雄與最近瀏覽會同步到同一個帳號。'],
      register: ['建立會員帳號', '完成 Email 驗證後即可登入並同步收藏。'],
      forgot: ['重設會員密碼', '輸入註冊 Email，我們會寄送重設連結。']
    };
    const [title, description] = titleMap[mode] || titleMap.login;
    $('#memberAuthTitle').textContent = title;
    $('#memberAuthDescription').textContent = description;
    showMessage('');
  }

  function formatJoinDate(value) {
    if (!value) return '—';
    try {
      return new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
    } catch (_) {
      return '—';
    }
  }

  function formatViewTime(value) {
    if (!value) return '';
    try {
      return new Intl.RelativeTimeFormat('zh-TW', { numeric: 'auto' }).format(
        Math.max(-30, Math.min(0, Math.round((new Date(value).getTime() - Date.now()) / 86400000))),
        'day'
      );
    } catch (_) {
      return '';
    }
  }

  function baseIdOf(value) {
    return String(value || '').replace(/-(baron|jungle|mid|duo|support)$/, '');
  }

  function findCatalogHero(heroId) {
    const id = baseIdOf(heroId);
    return heroCatalog.find((hero) => String(hero.id) === id) || null;
  }

  function heroGuideId(hero, recentRow = null) {
    if (recentRow?.guide_id) return recentRow.guide_id;
    const roleId = String(recentRow?.role_id || '').trim();
    const role = (hero?.roles || []).find((item) => item.roleId === roleId && item.detailHeroId);
    return role?.detailHeroId || (hero?.roles || []).find((item) => item.detailHeroId)?.detailHeroId || '';
  }

  function heroAvatar(hero) {
    return String(hero?.avatar || hero?.roles?.find((item) => item.avatar)?.avatar || '');
  }

  function createHeroLink(hero, recentRow = null) {
    const guideId = heroGuideId(hero, recentRow);
    const link = document.createElement(guideId ? 'a' : 'div');
    link.className = 'member-hero-bubble';
    if (guideId) link.href = `heroes.html?hero=${encodeURIComponent(guideId)}`;

    const media = document.createElement('span');
    media.className = 'member-hero-avatar';
    const avatar = heroAvatar(hero);
    if (avatar) {
      const img = document.createElement('img');
      img.src = avatar;
      img.alt = hero?.name || '英雄';
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        media.textContent = String(hero?.name || '?').slice(0, 1);
      }, { once: true });
      media.appendChild(img);
    } else {
      media.textContent = String(hero?.name || '?').slice(0, 1);
    }

    const name = document.createElement('strong');
    name.textContent = hero?.name || recentRow?.hero_id || '未知英雄';
    link.append(media, name);

    if (recentRow?.viewed_at) {
      const time = document.createElement('small');
      time.textContent = formatViewTime(recentRow.viewed_at);
      link.appendChild(time);
    }
    return link;
  }

  function renderFavoriteHeroes() {
    const grid = $('#memberFavoriteGrid');
    const empty = $('#memberFavoriteEmpty');
    const count = $('#memberFavoriteCount');
    if (!grid || !empty || !count) return;
    grid.replaceChildren();
    const ids = auth.favorites || [];
    count.textContent = String(ids.length);
    const stat = $('#memberFavoriteStat');
    if (stat) stat.textContent = String(ids.length);
    empty.hidden = ids.length > 0;
    ids.forEach((heroId) => {
      const hero = findCatalogHero(heroId);
      grid.appendChild(createHeroLink(hero || { id: heroId, name: heroId, roles: [] }));
    });
  }

  function renderRecentViews() {
    const grid = $('#memberRecentGrid');
    const empty = $('#memberRecentEmpty');
    const clear = $('#memberRecentClear');
    if (!grid || !empty || !clear) return;
    grid.replaceChildren();
    const rows = auth.recentViews || [];
    const count = $('#memberRecentCount');
    const stat = $('#memberRecentStat');
    if (count) count.textContent = String(rows.length);
    if (stat) stat.textContent = String(rows.length);
    empty.hidden = rows.length > 0;
    clear.hidden = rows.length === 0;
    rows.forEach((row) => {
      const hero = findCatalogHero(row.hero_id);
      grid.appendChild(createHeroLink(hero || { id: row.hero_id, name: row.hero_id, roles: [] }, row));
    });
  }

  function renderMemberCollections() {
    renderFavoriteHeroes();
    renderRecentViews();
  }

  function renderDashboard() {
    if (!auth.user) return;
    const name = auth.displayName();
    $('#memberAvatarLetter').textContent = auth.avatarLetter();
    $('#memberGreeting').textContent = `${name}，歡迎回來`;
    $('#memberEmail').textContent = auth.user.email || '';
    $('#profileDisplayName').value = name;
    $('#memberJoinedAt').textContent = formatJoinDate(auth.profile?.created_at || auth.user.created_at);
    renderMemberCollections();
  }

  function renderConnectionStatus() {
    if (!connectionStatus) return;
    const diagnostics = auth.snapshot().diagnostics;
    if (!diagnostics) {
      connectionStatus.hidden = true;
      return;
    }
    connectionStatus.hidden = false;
    connectionStatus.className = `member-connection-status ${diagnostics.ok ? 'ok' : 'error'}`;
    if (diagnostics.ok) {
      connectionStatus.textContent = diagnostics.emailSignupEnabled
        ? 'Supabase Auth 連線正常 · Email 註冊已開啟'
        : 'Supabase Auth 已連線，但 Email 註冊目前關閉';
    } else {
      connectionStatus.textContent = diagnostics.error?.message || 'Supabase Auth 連線檢查失敗';
    }
  }

  function renderState() {
    const usable = auth.configured && Boolean(auth.client);
    setupPanel.hidden = usable;
    renderConnectionStatus();
    if (!usable) {
      authPanel.hidden = true;
      dashboard.hidden = true;
      recoveryPanel.hidden = true;
      if (auth.snapshot().error) showError(auth.snapshot().error, '會員系統連線失敗，請檢查 Supabase 設定或網路連線。');
      return;
    }

    const recovery = params.get('mode') === 'recovery' || sessionGet('wrg-password-recovery') === '1';
    recoveryPanel.hidden = !(recovery && auth.user);
    dashboard.hidden = !auth.user || recovery;
    authPanel.hidden = Boolean(auth.user) || recovery;

    if (auth.user && !recovery) {
      renderDashboard();
      lastRenderedUserId = auth.user.id;
    }
    if (!auth.user && recovery) {
      recoveryPanel.hidden = true;
      authPanel.hidden = false;
      showMessage('重設連結已失效，請重新寄送密碼重設信件。', 'error');
      showAuthMode('forgot');
    }
  }

  async function loadHeroCatalog() {
    try {
      const response = await fetch('../assets/data/heroes.json?v=79.5', { cache: 'force-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      heroCatalog = Array.isArray(data.heroCatalog) ? data.heroCatalog : [];
      renderMemberCollections();
    } catch (error) {
      console.error('會員英雄資料載入失敗', error);
    }
  }

  $$('.member-auth-switch').forEach((button) => button.addEventListener('click', () => showAuthMode(button.dataset.authMode)));

  $('#memberLoginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(form, true, '登入中…');
    showMessage('正在登入…');
    try {
      await auth.signIn($('#loginEmail').value.trim(), $('#loginPassword').value);
      location.replace(safeReturn() || 'member.html?login=1');
    } catch (error) {
      showError(error, '登入失敗，請確認 Email、密碼與信箱驗證狀態。');
    } finally {
      setBusy(form, false);
    }
  });

  $('#memberRegisterForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const displayName = $('#registerDisplayName').value.trim();
    const email = $('#registerEmail').value.trim();
    const password = $('#registerPassword').value;
    const confirmPassword = $('#registerPasswordConfirm').value;

    if (displayName.length < 2 || displayName.length > 20) return showMessage('顯示名稱請輸入 2～20 個字。', 'error');
    if (password.length < 8) return showMessage('密碼至少需要 8 個字元。', 'error');
    if (password !== confirmPassword) return showMessage('兩次輸入的密碼不一致。', 'error');

    setBusy(form, true, '建立中…');
    showMessage('正在建立帳號…');
    try {
      const data = await auth.signUp({ email, password, displayName });
      if (data?.session) {
        location.replace('member.html?registered=1');
        return;
      }
      form.reset();
      showAuthMode('login');
      $('#loginEmail').value = email;
      showMessage('註冊資料已送出，請到信箱完成驗證後再登入。', 'success');
    } catch (error) {
      showError(error, '註冊失敗，請稍後再試。');
    } finally {
      setBusy(form, false);
    }
  });

  $('#memberForgotForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(form, true, '寄送中…');
    showMessage('正在寄送重設信件…');
    try {
      await auth.sendPasswordReset($('#forgotEmail').value.trim());
      form.reset();
      showMessage('重設密碼信件已寄出，請檢查信箱。', 'success');
    } catch (error) {
      showError(error, '無法寄送重設信件，請稍後再試。');
    } finally {
      setBusy(form, false);
    }
  });

  $('#memberRecoveryForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = $('#recoveryPassword').value;
    const confirmPassword = $('#recoveryPasswordConfirm').value;
    if (password.length < 8) return showMessage('新密碼至少需要 8 個字元。', 'error');
    if (password !== confirmPassword) return showMessage('兩次輸入的新密碼不一致。', 'error');

    setBusy(form, true, '更新中…');
    showMessage('正在更新密碼…');
    try {
      await auth.updatePassword(password);
      sessionRemove('wrg-password-recovery');
      form.reset();
      params.delete('mode');
      params.set('password', 'updated');
      history.replaceState(null, '', `member.html?${params.toString()}`);
      showMessage('密碼已更新完成。', 'success');
      renderState();
    } catch (error) {
      showError(error, '密碼更新失敗，請重新開啟重設信件。');
    } finally {
      setBusy(form, false);
    }
  });

  $('#memberProfileForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const displayName = $('#profileDisplayName').value.trim();
    if (displayName.length < 2 || displayName.length > 20) return showMessage('顯示名稱請輸入 2～20 個字。', 'error');

    setBusy(form, true, '儲存中…');
    showMessage('正在儲存…');
    try {
      await auth.updateDisplayName(displayName);
      renderDashboard();
      showMessage('顯示名稱已更新。', 'success');
    } catch (error) {
      showError(error, '會員資料更新失敗。');
    } finally {
      setBusy(form, false);
    }
  });

  $('#memberRecentClear')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await auth.clearRecentViews();
      renderRecentViews();
      showMessage('最近瀏覽已清除。', 'success');
    } catch (error) {
      showError(error, '最近瀏覽清除失敗。');
    } finally {
      button.disabled = false;
    }
  });

  $('#memberRetryConnection')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    showMessage('正在重新檢查 Supabase 連線…');
    try {
      const result = await auth.probeConnection();
      renderConnectionStatus();
      if (result?.ok) showMessage('Supabase Auth 連線正常。', 'success');
      else showMessage(result?.error?.message || '連線檢查失敗。', 'error', result?.error?.technical || '');
    } finally {
      button.disabled = false;
    }
  });

  $('#memberLogout')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await auth.signOut();
      sessionRemove('wrg-password-recovery');
      location.replace('member.html?logout=1');
    } catch (error) {
      button.disabled = false;
      showError(error, '登出失敗，請稍後再試。');
    }
  });

  auth.subscribe(() => {
    renderState();
    if (auth.user && auth.user.id === lastRenderedUserId) renderMemberCollections();
  });
  document.addEventListener('wrg:memberdatachange', renderMemberCollections);

  Promise.all([auth.ready, loadHeroCatalog()]).then(() => {
    if (params.get('verified') === '1') showMessage('Email 驗證完成，會員帳號已啟用。', 'success');
    if (params.get('login') === '1') showMessage('登入成功。', 'success');
    if (params.get('logout') === '1') showMessage('已從這台裝置登出。', 'success');
    if (params.get('registered') === '1') showMessage('會員帳號已建立。', 'success');
    if (params.get('password') === 'updated') showMessage('密碼已更新完成。', 'success');
    renderState();
  });
})();
