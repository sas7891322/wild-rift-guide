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

  function sessionGet(key) {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  }

  function sessionSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (_) {}
  }

  function sessionRemove(key) {
    try { sessionStorage.removeItem(key); } catch (_) {}
  }

  function showMessage(text = '', type = 'info') {
    if (!message) return;
    message.textContent = text;
    message.className = `member-message ${type}`;
    message.hidden = !text;
  }

  function setBusy(form, busy) {
    if (!form) return;
    form.setAttribute('aria-busy', String(Boolean(busy)));
    $$('button,input', form).forEach((node) => { node.disabled = Boolean(busy); });
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
      login: ['登入攻略帳號', '會員名稱與登入狀態會同步到同一個帳號。'],
      register: ['建立會員帳號', '完成 Email 驗證後即可登入。'],
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

  function renderDashboard() {
    if (!auth.user) return;
    const name = auth.displayName();
    $('#memberAvatarLetter').textContent = auth.avatarLetter();
    $('#memberGreeting').textContent = `${name}，歡迎回來`;
    $('#memberEmail').textContent = auth.user.email || '';
    $('#profileDisplayName').value = name;
    $('#memberJoinedAt').textContent = formatJoinDate(auth.profile?.created_at || auth.user.created_at);
  }

  function renderState() {
    const usable = auth.configured && Boolean(auth.client);
    setupPanel.hidden = usable;
    if (!usable) {
      authPanel.hidden = true;
      dashboard.hidden = true;
      recoveryPanel.hidden = true;
      if (auth.snapshot().error) showMessage('會員系統連線失敗，請檢查 Supabase 設定或網路連線。', 'error');
      return;
    }

    const recovery = params.get('mode') === 'recovery' || sessionGet('wrg-password-recovery') === '1';
    recoveryPanel.hidden = !(recovery && auth.user);
    dashboard.hidden = !auth.user || recovery;
    authPanel.hidden = Boolean(auth.user) || recovery;

    if (auth.user && !recovery) renderDashboard();
    if (!auth.user && recovery) {
      recoveryPanel.hidden = true;
      authPanel.hidden = false;
      showMessage('重設連結已失效，請重新寄送密碼重設信件。', 'error');
      showAuthMode('forgot');
    }
  }

  $$('.member-auth-switch').forEach((button) => button.addEventListener('click', () => showAuthMode(button.dataset.authMode)));

  $('#memberLoginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(form, true);
    showMessage('正在登入…');
    try {
      const { error } = await auth.client.auth.signInWithPassword({
        email: $('#loginEmail').value.trim(),
        password: $('#loginPassword').value
      });
      if (error) throw error;
      location.replace(safeReturn() || 'member.html?login=1');
    } catch (error) {
      console.error(error);
      showMessage('登入失敗，請確認 Email、密碼與信箱驗證狀態。', 'error');
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

    setBusy(form, true);
    showMessage('正在建立帳號…');
    try {
      const { data, error } = await auth.client.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: auth.callbackUrl('signup')
        }
      });
      if (error) throw error;

      if (data.session) {
        location.replace('member.html?registered=1');
        return;
      }
      form.reset();
      showAuthMode('login');
      $('#loginEmail').value = email;
      showMessage('註冊資料已送出，請到信箱完成驗證後再登入。', 'success');
    } catch (error) {
      console.error(error);
      showMessage(error.message || '註冊失敗，請稍後再試。', 'error');
    } finally {
      setBusy(form, false);
    }
  });

  $('#memberForgotForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(form, true);
    showMessage('正在寄送重設信件…');
    try {
      const { error } = await auth.client.auth.resetPasswordForEmail(
        $('#forgotEmail').value.trim(),
        { redirectTo: auth.callbackUrl('recovery') }
      );
      if (error) throw error;
      form.reset();
      showMessage('重設密碼信件已寄出，請檢查信箱。', 'success');
    } catch (error) {
      console.error(error);
      showMessage(error.message || '無法寄送重設信件，請稍後再試。', 'error');
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

    setBusy(form, true);
    showMessage('正在更新密碼…');
    try {
      const { error } = await auth.client.auth.updateUser({ password });
      if (error) throw error;
      sessionRemove('wrg-password-recovery');
      form.reset();
      params.delete('mode');
      params.set('password', 'updated');
      history.replaceState(null, '', `member.html?${params.toString()}`);
      showMessage('密碼已更新完成。', 'success');
      renderState();
    } catch (error) {
      console.error(error);
      showMessage(error.message || '密碼更新失敗，請重新開啟重設信件。', 'error');
    } finally {
      setBusy(form, false);
    }
  });

  $('#memberProfileForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const displayName = $('#profileDisplayName').value.trim();
    if (displayName.length < 2 || displayName.length > 20) return showMessage('顯示名稱請輸入 2～20 個字。', 'error');

    setBusy(form, true);
    showMessage('正在儲存…');
    try {
      const profileResult = await auth.client
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', auth.user.id);
      if (profileResult.error) throw profileResult.error;

      const authResult = await auth.client.auth.updateUser({ data: { display_name: displayName } });
      if (authResult.error) throw authResult.error;

      await auth.refresh();
      renderDashboard();
      showMessage('顯示名稱已更新。', 'success');
    } catch (error) {
      console.error(error);
      showMessage(error.message || '會員資料更新失敗。', 'error');
    } finally {
      setBusy(form, false);
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
      console.error(error);
      button.disabled = false;
      showMessage('登出失敗，請稍後再試。', 'error');
    }
  });

  auth.subscribe(renderState);
  auth.ready.then(() => {
    if (params.get('verified') === '1') showMessage('Email 驗證完成，會員帳號已啟用。', 'success');
    if (params.get('login') === '1') showMessage('登入成功。', 'success');
    if (params.get('logout') === '1') showMessage('已從這台裝置登出。', 'success');
    if (params.get('registered') === '1') showMessage('會員帳號已建立。', 'success');
    if (params.get('password') === 'updated') showMessage('密碼已更新完成。', 'success');
    renderState();
  });
})();
