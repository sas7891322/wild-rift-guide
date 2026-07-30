(async () => {
  'use strict';

  const auth = window.WRGAuth;
  const status = document.querySelector('#authCallbackStatus');
  const params = new URLSearchParams(location.search);
  const flow = params.get('flow') || 'signup';

  function setStatus(text, error = false) {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('error', error);
  }

  await auth.ready;
  if (!auth.configured || !auth.client) {
    setStatus('會員資料庫尚未設定，無法完成驗證。', true);
    return;
  }

  try {
    const code = params.get('code');
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    let error = null;

    if (code) {
      ({ error } = await auth.client.auth.exchangeCodeForSession(code));
    } else if (hash.get('access_token') && hash.get('refresh_token')) {
      ({ error } = await auth.client.auth.setSession({
        access_token: hash.get('access_token'),
        refresh_token: hash.get('refresh_token')
      }));
    }
    if (error) throw error;

    if (flow === 'recovery') {
      sessionStorage.setItem('wrg-password-recovery', '1');
      setStatus('驗證完成，正在前往設定新密碼…');
      location.replace('member.html?reset=1');
    } else {
      setStatus('信箱驗證完成，正在前往會員中心…');
      location.replace('member.html?verified=1');
    }
  } catch (error) {
    console.error(error);
    setStatus('驗證連結無效或已過期，請返回會員頁重新操作。', true);
    const link = document.querySelector('#authCallbackBack');
    if (link) link.hidden = false;
  }
})();
