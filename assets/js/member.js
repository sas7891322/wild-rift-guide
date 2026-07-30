(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const auth = window.WRGAuth;
  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo') || '';
  const setupPanel = $('#memberSetupRequired');
  const authPanel = $('#memberAuthPanel');
  const dashboard = $('#memberDashboard');
  const recoveryPanel = $('#memberRecoveryPanel');
  const message = $('#memberMessage');
  const roleNames = { baron: '巴龍路', jungle: '打野', mid: '中路', duo: '飛龍路', support: '輔助' };
  let heroCatalog = [];

  function showMessage(text = '', type = 'info') {
    if (!message) return;
    message.textContent = text;
    message.className = `member-message ${type}`;
    message.hidden = !text;
  }

  function setBusy(form, busy) {
    if (!form) return;
    form.setAttribute('aria-busy', String(Boolean(busy)));
    $$('button,input', form).forEach(node => { node.disabled = Boolean(busy); });
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

  function heroAvatar(path) {
    return String(path || '').replace(/^\.\.\/assets\//, '../assets/');
  }

  async function loadHeroes() {
    if (heroCatalog.length) return heroCatalog;
    const response = await fetch('../assets/data/heroes.json?v=79.1');
    if (!response.ok) throw new Error('英雄資料載入失敗');
    const data = await response.json();
    heroCatalog = Array.isArray(data.heroCatalog) ? data.heroCatalog : [];
    return heroCatalog;
  }

  function showAuthMode(mode) {
    $$('.member-auth-tab').forEach(button => {
      const active = button.dataset.authMode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $$('.member-auth-form').forEach(form => { form.hidden = form.dataset.authForm !== mode; });
    showMessage('');
  }

  function catalogHero(heroId) {
    return heroCatalog.find(hero => hero.id === heroId) || null;
  }

  async function renderFavorites() {
    const grid = $('#memberFavoriteGrid');
    const empty = $('#memberFavoriteEmpty');
    const count = $('#memberFavoriteCount');
    if (!grid || !empty || !count) return;

    await loadHeroes();
    const ids = [...auth.favorites];
    count.textContent = `${ids.length} 位`;
    const heroes = ids
      .map(catalogHero)
      .filter(Boolean)
      .sort((a, b) => String(a.enName || a.name).localeCompare(String(b.enName || b.name), 'zh-Hant'));

    empty.hidden = heroes.length > 0;
    grid.hidden = heroes.length === 0;
    grid.innerHTML = heroes.map(hero => {
      const detailId = hero.roles?.find(role => role.detailHeroId)?.detailHeroId || '';
      const link = detailId ? `heroes.html?hero=${encodeURIComponent(detailId)}` : 'heroes.html';
      const avatar = heroAvatar(hero.avatar || hero.roles?.find(role => role.avatar)?.avatar || '');
      return `<article class="member-favorite-card" data-favorite-card="${hero.id}">
        <a href="${link}" class="member-favorite-link" aria-label="查看 ${hero.name} 攻略">
          <span class="member-favorite-avatar">${avatar ? `<img src="${avatar}" alt="${hero.name}" loading="lazy">` : `<i>${String(hero.name || '?').slice(0, 1)}</i>`}</span>
          <strong>${hero.name}</strong><small>${hero.enName || ''}</small>
        </a>
        <button type="button" class="member-favorite-remove" data-remove-favorite="${hero.id}" aria-label="取消收藏 ${hero.name}">取消收藏</button>
      </article>`;
    }).join('');

    $$('[data-remove-favorite]', grid).forEach(button => button.addEventListener('click', async () => {
      const original = button.textContent;
      button.disabled = true;
      button.textContent = '處理中…';
      try {
        await auth.toggleFavorite(button.dataset.removeFavorite);
        await renderFavorites();
        showMessage('已取消收藏英雄。', 'success');
      } catch (error) {
        button.disabled = false;
        button.textContent = original;
        showMessage(error.message || '取消收藏失敗，請稍後再試。', 'error');
      }
    }));
  }

  async function renderRecentViews() {
    const grid = $('#memberRecentGrid');
    const empty = $('#memberRecentEmpty');
    const count = $('#memberRecentCount');
    const clearButton = $('#memberClearRecents');
    if (!grid || !empty || !count || !clearButton) return;

    await loadHeroes();
    const recent = auth.recentViews;
    count.textContent = `${recent.length} 筆`;
    clearButton.hidden = recent.length === 0;
    empty.hidden = recent.length > 0;
    grid.hidden = recent.length === 0;

    grid.innerHTML = recent.map(item => {
      const hero = catalogHero(item.hero_id);
      const name = hero?.name || item.hero_id;
      const avatar = heroAvatar(hero?.avatar || hero?.roles?.find(role => role.avatar)?.avatar || '');
      const role = roleNames[item.role_id] || '英雄';
      const time = item.viewed_at ? new Intl.DateTimeFormat('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.viewed_at)) : '';
      return `<a class="member-recent-card" href="heroes.html?hero=${encodeURIComponent(item.guide_id)}" aria-label="查看 ${name}${role}攻略">
        <span class="member-recent-avatar">${avatar ? `<img src="${avatar}" alt="${name}" loading="lazy">` : `<i>${String(name || '?').slice(0, 1)}</i>`}</span>
        <span class="member-recent-copy"><strong>${name}</strong><small>${role}</small><time>${time}</time></span>
        <b aria-hidden="true">›</b>
      </a>`;
    }).join('');
  }

  async function renderDashboard() {
    if (!auth.user) return;
    const nickname = auth.safeNickname();
    $('#memberAvatarLetter').textContent = String(nickname || '會').slice(0, 1);
    $('#memberGreeting').textContent = `${nickname}，歡迎回來`;
    $('#memberEmail').textContent = auth.user.email || '';
    $('#profileNickname').value = nickname;
    const date = auth.profile?.created_at || auth.user.created_at;
    $('#memberJoinedAt').textContent = date ? new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date)) : '—';
    await Promise.all([renderFavorites(), renderRecentViews()]);
  }

  function updateView() {
    const authState = auth.snapshot();
    const usable = auth.configured && Boolean(auth.client);
    setupPanel.hidden = usable;
    if (!usable) {
      authPanel.hidden = true;
      dashboard.hidden = true;
      recoveryPanel.hidden = true;
      if (authState.error) showMessage('會員系統連線失敗，請檢查 Supabase 設定或網路連線。', 'error');
      return;
    }
    if (authState.error) showMessage('部分會員資料載入失敗，請確認正式 SQL 已完整執行。', 'error');

    const recovery = sessionStorage.getItem('wrg-password-recovery') === '1';
    recoveryPanel.hidden = !(recovery && auth.user);
    dashboard.hidden = !auth.user || recovery;
    authPanel.hidden = Boolean(auth.user) || recovery;

    if (auth.user && !recovery) renderDashboard().catch(error => showMessage(error.message, 'error'));
  }

  $$('.member-auth-tab').forEach(button => button.addEventListener('click', () => showAuthMode(button.dataset.authMode)));

  $('#memberLoginForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;
    setBusy(form, true);
    showMessage('正在登入…');
    try {
      const { error } = await auth.client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      location.replace(safeReturn() || 'member.html?login=1');
    } catch (error) {
      showMessage('登入失敗，請確認 Email、密碼及信箱驗證狀態。', 'error');
    } finally {
      setBusy(form, false);
    }
  });

  $('#memberRegisterForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const nickname = $('#registerNickname').value.trim();
    const email = $('#registerEmail').value.trim();
    const password = $('#registerPassword').value;
    const confirm = $('#registerPasswordConfirm').value;
    if (nickname.length < 2 || nickname.length > 20) return showMessage('暱稱請輸入 2～20 個字。', 'error');
    if (password.length < 8) return showMessage('密碼至少需要 8 個字元。', 'error');
    if (password !== confirm) return showMessage('兩次輸入的密碼不一致。', 'error');

    setBusy(form, true);
    showMessage('正在建立帳號…');
    try {
      const { data, error } = await auth.client.auth.signUp({
        email,
        password,
        options: {
          data: { nickname },
          emailRedirectTo: auth.callbackUrl('signup')
        }
      });
      if (error) throw error;
      if (data.session) {
        location.replace('member.html?registered=1');
      } else {
        form.reset();
        showAuthMode('login');
        $('#loginEmail').value = email;
        showMessage('註冊資料已送出，請前往信箱完成驗證後再登入。', 'success');
      }
    } catch (error) {
      showMessage(error.message || '註冊失敗，請稍後再試。', 'error');
    } finally {
      setBusy(form, false);
    }
  });

  $('#showForgotPassword')?.addEventListener('click', () => showAuthMode('forgot'));
  $('#backToLogin')?.addEventListener('click', () => showAuthMode('login'));

  $('#memberForgotForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = $('#forgotEmail').value.trim();
    setBusy(form, true);
    showMessage('正在寄送重設信件…');
    try {
      const { error } = await auth.client.auth.resetPasswordForEmail(email, { redirectTo: auth.callbackUrl('recovery') });
      if (error) throw error;
      form.reset();
      showMessage('重設密碼信件已寄出，請檢查信箱。', 'success');
    } catch (error) {
      showMessage(error.message || '無法寄送重設信件，請稍後再試。', 'error');
    } finally {
      setBusy(form, false);
    }
  });

  $('#memberRecoveryForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = $('#recoveryPassword').value;
    const confirm = $('#recoveryPasswordConfirm').value;
    if (password.length < 8) return showMessage('新密碼至少需要 8 個字元。', 'error');
    if (password !== confirm) return showMessage('兩次輸入的新密碼不一致。', 'error');
    setBusy(form, true);
    try {
      const { error } = await auth.client.auth.updateUser({ password });
      if (error) throw error;
      sessionStorage.removeItem('wrg-password-recovery');
      form.reset();
      showMessage('密碼已更新。', 'success');
      updateView();
    } catch (error) {
      showMessage(error.message || '密碼更新失敗，請重新開啟重設信件。', 'error');
    } finally {
      setBusy(form, false);
    }
  });

  $('#memberProfileForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const nickname = $('#profileNickname').value.trim();
    if (nickname.length < 2 || nickname.length > 20) return showMessage('暱稱請輸入 2～20 個字。', 'error');
    setBusy(form, true);
    try {
      const [profileResult, authResult] = await Promise.all([
        auth.client.from('profiles').update({ nickname }).eq('id', auth.user.id),
        auth.client.auth.updateUser({ data: { nickname } })
      ]);
      if (profileResult.error) throw profileResult.error;
      if (authResult.error) throw authResult.error;
      await auth.refresh();
      showMessage('個人資料已更新。', 'success');
      await renderDashboard();
    } catch (error) {
      showMessage(error.message || '個人資料更新失敗。', 'error');
    } finally {
      setBusy(form, false);
    }
  });

  $('#memberClearRecents')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    if (!confirm('確定要清除全部最近瀏覽紀錄嗎？')) return;
    button.disabled = true;
    try {
      await auth.clearRecentViews();
      await renderRecentViews();
      showMessage('最近瀏覽紀錄已清除。', 'success');
    } catch (error) {
      showMessage(error.message || '清除紀錄失敗。', 'error');
    } finally {
      button.disabled = false;
    }
  });

  $('#memberLogout')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const { error } = await auth.client.auth.signOut();
      if (error) throw error;
      sessionStorage.removeItem('wrg-password-recovery');
      location.replace('member.html?logout=1');
    } catch (error) {
      showMessage(error.message || '登出失敗。', 'error');
    } finally {
      button.disabled = false;
    }
  });

  auth.subscribe(updateView);
  auth.ready.then(() => {
    if (params.get('verified') === '1') showMessage('信箱驗證完成，帳號已登入。', 'success');
    if (params.get('registered') === '1') showMessage('註冊完成，帳號已登入。', 'success');
    if (params.get('login') === '1') showMessage('登入成功。', 'success');
    if (params.get('logout') === '1') showMessage('已登出。', 'success');
    if (params.get('reset') === '1') showMessage('請設定新的會員密碼。', 'info');
    updateView();
  });
})();
