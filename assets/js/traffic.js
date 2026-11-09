(() => {
  'use strict';

  const auth = window.WRGAuth;
  const HEARTBEAT_MS = 45_000;

  function ensureTrafficUi() {
    let panel = document.querySelector('#wrgTrafficPanel');
    if (panel) return panel;

    let slot = document.querySelector('[data-traffic-slot]');
    if (!slot) {
      const headerInner = document.querySelector('.rift-menu-inner, .mode-entry-topbar-inner, .topbar-inner');
      if (!headerInner) return null;
      slot = document.createElement('span');
      slot.className = 'site-traffic-slot';
      slot.dataset.trafficSlot = '';
      headerInner.appendChild(slot);
    }

    panel = document.createElement('span');
    panel.id = 'wrgTrafficPanel';
    panel.className = 'site-viewers';
    panel.dataset.trafficState = 'loading';
    panel.setAttribute('aria-label', '目前觀看人數');
    panel.innerHTML = `
      <span class="site-viewers-item total" title="累積瀏覽">
        <span class="site-viewers-eye" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M2.5 12s3.4-5.5 9.5-5.5S21.5 12 21.5 12s-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.7"/></svg></span>
        <strong id="wrgTotalViews">—</strong>
      </span>
      <span class="site-viewers-sep" aria-hidden="true"></span>
      <span class="site-viewers-item online" title="目前在線"><i aria-hidden="true"></i><strong id="wrgOnlineCount">—</strong></span>
      <span class="sr-only" id="wrgTrafficStatus">連線中</span>`;
    slot.appendChild(panel);
    return panel;
  }

  const panel = ensureTrafficUi();
  const totalNode = panel?.querySelector('#wrgTotalViews');
  const onlineNode = panel?.querySelector('#wrgOnlineCount');
  const statusNode = panel?.querySelector('#wrgTrafficStatus');

  function formatCount(value, compact=false) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return '—';
    if (compact && number >= 10000) return new Intl.NumberFormat('zh-TW',{notation:'compact',maximumFractionDigits:1}).format(number);
    return new Intl.NumberFormat('zh-TW').format(number);
  }

  function setStatus(mode, label) {
    if (!panel || !statusNode) return;
    panel.dataset.trafficState = mode;
    statusNode.textContent = label;
  }

  function render(payload) {
    const row = Array.isArray(payload) ? payload[0] : payload;
    if (!row) return;
    const online = new Intl.NumberFormat('zh-TW').format(Number(row.online_count) || 0);
    const views = new Intl.NumberFormat('zh-TW').format(Number(row.total_views) || 0);
    if (totalNode) totalNode.textContent = formatCount(row.total_views, true);
    if (onlineNode) onlineNode.textContent = formatCount(row.online_count);
    panel.title = `累積瀏覽 ${views}｜目前在線 ${online}`;
    panel.setAttribute('aria-label', `累積瀏覽 ${views}，目前在線 ${online} 人`);
    setStatus('ready', '即時更新');
  }

  function createSessionId() {
    const key = 'wrg_traffic_session_id';
    try {
      const existing = localStorage.getItem(key);
      if (existing && existing.length >= 8) return existing;
      const next = globalThis.crypto?.randomUUID?.()
        || `wrg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
      localStorage.setItem(key, next);
      return next;
    } catch (_) {
      return `wrg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
    }
  }

  function currentPath() {
    return `${location.pathname || '/'}${location.search || ''}`.slice(0, 500);
  }

  async function rpc(name, sessionId) {
    const client = auth?.client;
    if (!client) throw new Error('Supabase client unavailable');
    const { data, error } = await client.rpc(name, {
      p_session_id: sessionId,
      p_page_path: currentPath()
    });
    if (error) throw error;
    return data;
  }

  async function start() {
    if (!panel) return;
    if (!auth?.ready) {
      setStatus('unavailable', '統計暫時無法使用');
      return;
    }

    try {
      await auth.ready;
      if (!auth.configured || !auth.client) throw new Error('Supabase is not configured');

      const sessionId = createSessionId();
      render(await rpc('wrg_record_site_visit', sessionId));

      let running = false;
      const touch = async () => {
        if (running || document.visibilityState === 'hidden') return;
        running = true;
        try {
          render(await rpc('wrg_touch_site_presence', sessionId));
        } catch (error) {
          console.warn('網站即時人氣更新失敗', error);
          setStatus('error', '連線重新嘗試中');
        } finally {
          running = false;
        }
      };

      window.setInterval(touch, HEARTBEAT_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') touch();
      });
      window.addEventListener('focus', touch);
    } catch (error) {
      console.warn('網站即時人氣尚未啟用或連線失敗', error);
      setStatus('error', '統計尚未啟用');
    }
  }

  start();
})();
