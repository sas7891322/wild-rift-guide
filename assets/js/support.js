(() => {
  const root = document.querySelector('[data-support-root]');
  if (!root) return;

  const status = root.querySelector('[data-support-status]');
  const methodsRoot = root.querySelector('[data-support-methods]');
  const shareButton = root.querySelector('[data-support-share]');
  const copyButton = root.querySelector('[data-support-copy]');
  const message = root.querySelector('[data-support-message]');
  const title = root.querySelector('[data-support-title]');
  const description = root.querySelector('[data-support-description]');

  const setMessage = (text, kind='ok') => {
    if (!message) return;
    message.hidden = false;
    message.textContent = text;
    message.dataset.kind = kind;
    window.clearTimeout(setMessage.timer);
    setMessage.timer = window.setTimeout(() => { message.hidden = true; }, 2600);
  };

  const fallbackCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly','');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) {}
      area.remove();
      return ok;
    }
  };

  const renderMethods = (data) => {
    if (!methodsRoot) return;
    const methods = Array.isArray(data.paymentMethods)
      ? data.paymentMethods.filter(method => method && method.enabled && method.url)
      : [];

    if (!methods.length) {
      methodsRoot.innerHTML = `
        <article class="support-payment-empty">
          <span aria-hidden="true">☕</span>
          <div>
            <strong>${data.paymentTitle || '自願支持'}</strong>
            <p>${data.paymentDescription || '支持方式準備中。'}</p>
          </div>
        </article>`;
      return;
    }

    methodsRoot.innerHTML = methods.map(method => `
      <a class="support-payment-card" href="${String(method.url).replace(/"/g,'&quot;')}" target="_blank" rel="noopener noreferrer">
        <span class="support-payment-icon" aria-hidden="true">${method.icon || '♡'}</span>
        <span>
          <strong>${method.label || '支持網站'}</strong>
          <small>${method.note || '前往安全付款頁面'}</small>
        </span>
        <b aria-hidden="true">→</b>
      </a>`).join('');
  };

  fetch('../assets/data/support.json?v=81.1.0', {cache:'no-store'})
    .then(response => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then(data => {
      const shareUrl = data.shareUrl || 'https://wild-rift-guide.vercel.app/';
      if (title) title.textContent = data.subtitle || data.title || '支持 Wild Rift Guide';
      if (description) description.textContent = data.description || '';
      if (status) {
        status.textContent = data.paymentMethods?.some(method => method?.enabled && method?.url)
          ? '支持方式已開放'
          : '分享功能可直接使用｜付款支持準備中';
      }

      renderMethods(data);

      shareButton?.addEventListener('click', async () => {
        const shareData = {
          title: 'Wild Rift Guide｜激鬥峽谷攻略網',
          text: '激鬥峽谷繁體中文攻略、ARAM 與符文大亂鬥資料。',
          url: shareUrl
        };
        if (navigator.share) {
          try {
            await navigator.share(shareData);
            setMessage('感謝你幫忙分享攻略網 ❤️');
            return;
          } catch (error) {
            if (error?.name === 'AbortError') return;
          }
        }
        const ok = await fallbackCopy(shareUrl);
        setMessage(ok ? '網站連結已複製' : '複製失敗，請手動複製網址', ok ? 'ok' : 'error');
      });

      copyButton?.addEventListener('click', async () => {
        const ok = await fallbackCopy(shareUrl);
        setMessage(ok ? '網站連結已複製' : '複製失敗，請手動複製網址', ok ? 'ok' : 'error');
      });
    })
    .catch(() => {
      if (status) status.textContent = '支持資料暫時無法載入';
      if (methodsRoot) methodsRoot.innerHTML = '<div class="support-payment-empty"><div><strong>暫時無法載入</strong><p>請稍後再試。</p></div></div>';
    });
})();