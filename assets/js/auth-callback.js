(() => {
  'use strict';

  const auth = window.WRGAuth;
  const params = new URLSearchParams(location.search);
  const flow = params.get('flow') || 'signup';
  const status = document.getElementById('authCallbackStatus');
  const detail = document.getElementById('authCallbackDetail');
  const action = document.getElementById('authCallbackAction');

  function setState(title, description, type = '') {
    status.textContent = title;
    detail.textContent = description;
    document.body.dataset.callbackState = type;
  }

  function errorFromUrl() {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    return params.get('error_description') || hash.get('error_description') || params.get('error') || hash.get('error');
  }

  auth.ready.then(async () => {
    const urlError = errorFromUrl();
    if (urlError) {
      setState('驗證沒有完成', decodeURIComponent(String(urlError).replace(/\+/g, ' ')), 'error');
      action.hidden = false;
      return;
    }

    if (!auth.configured || !auth.client) {
      setState('會員系統尚未連線', '請先在網站設定 Publishable key，再重新開啟驗證連結。', 'error');
      action.hidden = false;
      return;
    }

    if (flow === 'recovery') {
      if (!auth.user) {
        setState('重設連結已失效', '請回到登入頁重新寄送密碼重設信件。', 'error');
        action.hidden = false;
        return;
      }
      try { sessionStorage.setItem('wrg-password-recovery', '1'); } catch (_) {}
      setState('驗證完成', '正在前往設定新密碼…', 'success');
      window.setTimeout(() => location.replace('member.html?mode=recovery'), 800);
      return;
    }

    if (auth.user) {
      setState('Email 驗證完成', '會員帳號已啟用，正在前往會員中心…', 'success');
      window.setTimeout(() => location.replace('member.html?verified=1'), 800);
      return;
    }

    setState('驗證連結已處理', '請返回會員頁，使用剛才建立的 Email 與密碼登入。', 'success');
    action.hidden = false;
  });
})();
