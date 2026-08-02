(() => {
  'use strict';

  const auth = window.WRGAuth;
  const totalNode = document.querySelector('#wrgTotalViews');
  const onlineNode = document.querySelector('#wrgOnlineCount');
  const statusNode = document.querySelector('#wrgTrafficStatus');
  const panel = document.querySelector('#wrgTrafficPanel');
  const HEARTBEAT_MS = 45_000;

  function formatCount(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0
      ? new Intl.NumberFormat('zh-TW').format(number)
      : '—';
  }

  function setStatus(mode, label) {
    if (!panel || !statusNode) return;
    panel.dataset.trafficState = mode;
    statusNode.textContent = label;
  }

  function render(payload) {
    const row = Array.isArray(payload) ? payload[0] : payload;
    if (!row) return;
    if (totalNode) totalNode.textContent = formatCount(row.total_views);
    if (onlineNode) onlineNode.textContent = formatCount(row.online_count);
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
