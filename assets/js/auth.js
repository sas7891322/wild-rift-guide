(() => {
  'use strict';

  const config = window.WRG_SUPABASE_CONFIG || {};
  const scriptNode = [...document.scripts].find((script) => /\/assets\/js\/auth\.js(?:\?|$)/.test(script.src));
  let siteRoot;
  try {
    siteRoot = scriptNode ? new URL('../../', scriptNode.src) : new URL('/', location.href);
  } catch (_) {
    siteRoot = new URL('https://wild-rift-guide.vercel.app/');
  }

  const projectUrl = String(config.url || '').trim().replace(/\/$/, '');
  const publishableKey = String(config.publishableKey || config.anonKey || '').trim();
  const configured = /^https:\/\/.+\.supabase\.co$/i.test(projectUrl) && /^sb_publishable_|^eyJ/i.test(publishableKey);

  const state = {
    configured,
    client: null,
    user: null,
    profile: null,
    favorites: new Set(),
    recentViews: [],
    initialized: false,
    error: null,
    diagnostics: null
  };

  const listeners = new Set();
  const recentWriteTimes = new Map();
  let resolveReady;
  const ready = new Promise((resolve) => { resolveReady = resolve; });

  function currentRelativeUrl() {
    const url = new URL(location.href);
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function memberUrl(returnTo = '') {
    const url = new URL('pages/member.html', siteRoot);
    const target = String(returnTo || '').trim();
    if (target) {
      try {
        const parsed = new URL(target, location.origin);
        if (parsed.origin === location.origin) {
          url.searchParams.set('returnTo', `${parsed.pathname}${parsed.search}${parsed.hash}`);
        }
      } catch (_) {}
    }
    return url.href;
  }

  function callbackUrl(flow = '') {
    const url = new URL('pages/auth-callback.html', siteRoot);
    if (flow) url.searchParams.set('flow', flow);
    return url.href;
  }

  function displayName(user = state.user, profile = state.profile) {
    const candidates = [
      profile?.display_name,
      profile?.username,
      user?.user_metadata?.display_name,
      user?.user_metadata?.nickname
    ];
    const found = candidates.map((value) => String(value || '').trim()).find(Boolean);
    if (found) return found;
    const email = String(user?.email || '會員');
    return email.includes('@') ? email.split('@')[0] : email;
  }

  function avatarLetter() {
    return [...displayName()].slice(0, 1).join('') || '會';
  }

  function errorDetails(error, fallback = '會員系統發生未知錯誤') {
    if (!error) return { message: fallback, technical: '', code: '', status: 0 };
    if (typeof error === 'string') return { message: error || fallback, technical: error, code: '', status: 0 };

    const candidates = [
      error.message,
      error.error_description,
      error.msg,
      error.details,
      error.hint,
      error.cause?.message,
      error.cause?.error_description
    ].map((value) => String(value || '').trim()).filter((value) => value && value !== '{}' && value !== '[object Object]');

    const rawMessage = candidates[0] || fallback;
    const code = String(error.code || error.error_code || error.cause?.code || '').trim();
    const status = Number(error.status || error.statusCode || error.cause?.status || 0) || 0;
    const lower = rawMessage.toLocaleLowerCase('en');

    let message = rawMessage;
    if (/database error saving new user|unexpected_failure/.test(lower)) {
      message = '會員資料建立失敗。請先執行 v79.2 資料庫修復 SQL，再重新註冊。';
    } else if (/user already registered|already been registered/.test(lower)) {
      message = '這個 Email 已註冊，請直接登入或使用忘記密碼。';
    } else if (/email signups are disabled|signup.*disabled/.test(lower)) {
      message = 'Supabase 尚未開啟 Email 註冊，請到 Authentication 設定啟用。';
    } else if (/invalid api key|no api key|apikey/.test(lower) && /invalid|missing|not found/.test(lower)) {
      message = 'Supabase Publishable key 無效，請重新複製 API Keys 頁面的 default key。';
    } else if (/rate limit|too many requests|email rate limit/.test(lower)) {
      message = '註冊或寄信次數過於頻繁，請稍候幾分鐘再試。';
    } else if (/password/.test(lower) && /weak|least|characters|length/.test(lower)) {
      message = '密碼強度不足，請使用至少 8 個字元。';
    } else if (/failed to fetch|load failed|network|timeout|timed out/.test(lower)) {
      message = '無法連線到 Supabase，請確認網路、內容阻擋器或稍後再試。';
    } else if (/email.*invalid|invalid.*email/.test(lower)) {
      message = 'Email 格式不正確。';
    } else if (/invalid login credentials/.test(lower)) {
      message = 'Email 或密碼不正確。';
    } else if (/email not confirmed/.test(lower)) {
      message = 'Email 尚未完成驗證，請先開啟驗證信。';
    }

    let technical = rawMessage;
    try {
      const safe = {};
      ['name', 'message', 'code', 'status', 'error_code', 'error_description', 'details', 'hint'].forEach((key) => {
        if (error[key] !== undefined && error[key] !== null && String(error[key]) !== '') safe[key] = error[key];
      });
      if (Object.keys(safe).length) technical = JSON.stringify(safe, null, 2);
    } catch (_) {}

    return { message, technical, code, status };
  }

  function createError(payload, fallback, status = 0) {
    const info = errorDetails(payload, fallback);
    const error = new Error(info.message);
    error.original = payload;
    error.technical = info.technical;
    error.code = info.code;
    error.status = status || info.status;
    return error;
  }

  function isOpaqueError(error) {
    const value = String(error?.message || error || '').trim();
    return !value || value === '{}' || value === '[object Object]';
  }

  function snapshot() {
    return {
      configured: state.configured,
      user: state.user,
      profile: state.profile,
      favorites: [...state.favorites],
      recentViews: [...state.recentViews],
      initialized: state.initialized,
      error: state.error,
      diagnostics: state.diagnostics
    };
  }

  function notify() {
    const value = snapshot();
    listeners.forEach((listener) => {
      try { listener(value); } catch (error) { console.error(error); }
    });
    document.dispatchEvent(new CustomEvent('wrg:authchange', { detail: value }));
  }

  function notifyMemberData() {
    notify();
    document.dispatchEvent(new CustomEvent('wrg:memberdatachange', {
      detail: { favorites: [...state.favorites], recentViews: [...state.recentViews] }
    }));
  }

  async function ensureSupabaseLibrary() {
    if (window.supabase?.createClient) return window.supabase;
    const libraryUrl = String(config.libraryUrl || '').trim();
    if (!libraryUrl) throw new Error('Supabase 程式庫網址未設定');

    await new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((script) => script.src === libraryUrl || /@supabase\/supabase-js@2/.test(script.src));
      if (existing) {
        if (window.supabase?.createClient) return resolve();
        const timeout = window.setTimeout(() => reject(new Error('Supabase 程式庫載入逾時')), 12000);
        existing.addEventListener('load', () => { window.clearTimeout(timeout); resolve(); }, { once: true });
        existing.addEventListener('error', () => { window.clearTimeout(timeout); reject(new Error('Supabase 程式庫載入失敗')); }, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = libraryUrl;
      script.async = true;
      script.crossOrigin = 'anonymous';
      const timeout = window.setTimeout(() => reject(new Error('Supabase 程式庫載入逾時')), 12000);
      script.addEventListener('load', () => { window.clearTimeout(timeout); resolve(); }, { once: true });
      script.addEventListener('error', () => { window.clearTimeout(timeout); reject(new Error('Supabase 程式庫載入失敗')); }, { once: true });
      document.head.appendChild(script);
    });

    if (!window.supabase?.createClient) throw new Error('Supabase 程式庫未正確初始化');
    return window.supabase;
  }

  async function readResponse(response) {
    const text = await response.text();
    if (!text) return {};
    try { return JSON.parse(text); } catch (_) { return { message: text }; }
  }

  async function directAuthRequest(path, { method = 'GET', body, query } = {}) {
    const url = new URL(`${projectUrl}/auth/v1/${String(path).replace(/^\//, '')}`);
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value)) url.searchParams.set(key, String(value));
    });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url.href, {
        method,
        headers: {
          apikey: publishableKey,
          'Content-Type': 'application/json',
          'X-Client-Info': 'wild-rift-guide/79.2'
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
        cache: 'no-store'
      });
      const payload = await readResponse(response);
      if (!response.ok) throw createError(payload, `Supabase Auth 回傳 HTTP ${response.status}`, response.status);
      return payload;
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('Supabase 連線逾時，請稍後再試。');
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function probeConnection() {
    if (!configured) return null;
    try {
      const settings = await directAuthRequest('settings');
      state.diagnostics = {
        ok: true,
        emailSignupEnabled: settings?.disable_signup !== true,
        emailAutoconfirm: settings?.mailer_autoconfirm === true,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      state.diagnostics = {
        ok: false,
        error: errorDetails(error),
        checkedAt: new Date().toISOString()
      };
    }
    return state.diagnostics;
  }

  async function loadProfile(userId = state.user?.id) {
    if (!state.client || !userId) {
      state.profile = null;
      return null;
    }

    const { data, error } = await state.client
      .from('profiles')
      .select('id,username,display_name,avatar_url,created_at,updated_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;

    if (data) {
      state.profile = data;
      return data;
    }

    const fallbackName = displayName(state.user, null);
    const { data: inserted, error: insertError } = await state.client
      .from('profiles')
      .upsert({ id: userId, display_name: fallbackName }, { onConflict: 'id' })
      .select('id,username,display_name,avatar_url,created_at,updated_at')
      .single();
    if (insertError) throw insertError;
    state.profile = inserted;
    return inserted;
  }

  async function loadMemberData() {
    state.favorites = new Set();
    state.recentViews = [];
    if (!state.client || !state.user) return;

    const [favoriteResult, recentResult] = await Promise.all([
      state.client.from('favorite_heroes').select('hero_id').eq('user_id', state.user.id),
      state.client.from('recent_hero_views').select('hero_id,guide_id,role_id,viewed_at').eq('user_id', state.user.id).order('viewed_at', { ascending: false }).limit(12)
    ]);

    if (favoriteResult.error) throw favoriteResult.error;
    state.favorites = new Set((favoriteResult.data || []).map((row) => String(row.hero_id || '').trim()).filter(Boolean));

    if (recentResult.error) {
      const fallback = await state.client.from('recent_hero_views').select('hero_id,viewed_at').eq('user_id', state.user.id).order('viewed_at', { ascending: false }).limit(12);
      if (fallback.error) throw fallback.error;
      state.recentViews = fallback.data || [];
    } else {
      state.recentViews = recentResult.data || [];
    }
  }

  async function syncUser(user) {
    state.user = user || null;
    state.profile = null;
    state.favorites = new Set();
    state.recentViews = [];
    state.error = null;
    if (state.user) {
      try {
        await loadProfile(state.user.id);
        await loadMemberData();
      } catch (error) {
        state.error = error;
        console.error('會員資料載入失敗', error);
      }
    }
    renderMemberLinks();
    renderAccountSheet();
    notify();
  }

  function makeMemberLabel(link) {
    link.replaceChildren();
    if (!state.user) {
      link.textContent = '登入';
      link.setAttribute('aria-label', '登入或註冊會員');
      link.classList.remove('is-signed-in');
      return;
    }

    const avatar = document.createElement('span');
    avatar.className = 'member-nav-avatar';
    avatar.textContent = avatarLetter();
    const name = document.createElement('span');
    name.className = 'member-nav-name';
    name.textContent = displayName();
    link.append(avatar, name);
    link.setAttribute('aria-label', `開啟 ${displayName()} 的會員選單`);
    link.classList.add('is-signed-in');
  }

  function renderMemberLinks() {
    document.querySelectorAll('[data-member-nav]').forEach((link) => {
      link.href = memberUrl();
      makeMemberLabel(link);
      if (!link.dataset.memberBound) {
        link.dataset.memberBound = '1';
        link.addEventListener('click', (event) => {
          if (!state.user) return;
          event.preventDefault();
          openAccountSheet();
        });
      }
    });
  }

  function ensureAccountSheet() {
    let root = document.getElementById('memberAccountSheet');
    if (root) return root;

    root = document.createElement('div');
    root.id = 'memberAccountSheet';
    root.className = 'member-sheet-root';
    root.hidden = true;
    root.innerHTML = `
      <button class="member-sheet-backdrop" data-member-sheet-close aria-label="關閉會員選單" type="button"></button>
      <section class="member-sheet" role="dialog" aria-modal="true" aria-labelledby="memberSheetTitle">
        <div class="member-sheet-handle" aria-hidden="true"></div>
        <div class="member-sheet-head">
          <span class="member-sheet-avatar" data-member-sheet-avatar>會</span>
          <div><small>會員帳號</small><h2 id="memberSheetTitle" data-member-sheet-name>會員</h2><p data-member-sheet-email></p></div>
          <button class="member-sheet-close" data-member-sheet-close aria-label="關閉會員選單" type="button">×</button>
        </div>
        <div class="member-sheet-actions">
          <a class="member-sheet-action primary" data-member-sheet-center href="${memberUrl()}"><span>會員中心</span><b>›</b></a>
          <a class="member-sheet-action" data-member-sheet-favorites href="${memberUrl()}#favorite-heroes"><span>收藏英雄</span><b>›</b></a>
          <a class="member-sheet-action" data-member-sheet-settings href="${memberUrl()}#account-settings"><span>帳號設定</span><b>›</b></a>
          <button class="member-sheet-action danger" data-member-sheet-logout type="button"><span>登出此裝置</span><b>↗</b></button>
        </div>
      </section>`;
    document.body.appendChild(root);

    root.querySelectorAll('[data-member-sheet-close]').forEach((button) => button.addEventListener('click', closeAccountSheet));
    root.querySelector('[data-member-sheet-logout]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        await signOut();
        closeAccountSheet();
      } catch (error) {
        console.error(error);
        button.disabled = false;
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !root.hidden) closeAccountSheet();
    });
    return root;
  }

  function renderAccountSheet() {
    const root = ensureAccountSheet();
    root.querySelector('[data-member-sheet-avatar]').textContent = avatarLetter();
    root.querySelector('[data-member-sheet-name]').textContent = displayName();
    root.querySelector('[data-member-sheet-email]').textContent = state.user?.email || '';
  }

  function openAccountSheet() {
    if (!state.user) {
      location.href = memberUrl(currentRelativeUrl());
      return;
    }
    const root = ensureAccountSheet();
    renderAccountSheet();
    root.hidden = false;
    document.body.classList.add('member-sheet-open');
    window.requestAnimationFrame(() => root.classList.add('is-open'));
    root.querySelector('[data-member-sheet-close]')?.focus({ preventScroll: true });
  }

  function closeAccountSheet() {
    const root = document.getElementById('memberAccountSheet');
    if (!root || root.hidden) return;
    root.classList.remove('is-open');
    document.body.classList.remove('member-sheet-open');
    window.setTimeout(() => { root.hidden = true; }, 180);
  }

  async function requireClient() {
    await ready;
    if (!state.client) throw new Error('會員系統尚未完成初始化。');
    return state.client;
  }

  async function signUp({ email, password, displayName }) {
    const client = await requireClient();
    const options = {
      data: { display_name: displayName },
      emailRedirectTo: callbackUrl('signup')
    };
    try {
      const result = await client.auth.signUp({ email, password, options });
      if (result.error) throw result.error;
      return result.data;
    } catch (sdkError) {
      if (!isOpaqueError(sdkError)) throw sdkError;
      try {
        const payload = await directAuthRequest('signup', {
          method: 'POST',
          query: { redirect_to: options.emailRedirectTo },
          body: { email, password, data: options.data }
        });
        if (payload?.access_token && payload?.refresh_token) {
          const sessionResult = await client.auth.setSession({ access_token: payload.access_token, refresh_token: payload.refresh_token });
          if (sessionResult.error) throw sessionResult.error;
          return { user: payload.user || sessionResult.data.user, session: sessionResult.data.session };
        }
        return { user: payload.user || payload, session: null };
      } catch (directError) {
        directError.sdkError = sdkError;
        throw directError;
      }
    }
  }

  async function signIn(email, password) {
    const client = await requireClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function sendPasswordReset(email) {
    const client = await requireClient();
    const { data, error } = await client.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl('recovery') });
    if (error) throw error;
    return data;
  }

  async function updatePassword(password) {
    const client = await requireClient();
    const { data, error } = await client.auth.updateUser({ password });
    if (error) throw error;
    return data;
  }

  async function updateDisplayName(nextName) {
    const client = await requireClient();
    if (!state.user) throw new Error('請先登入會員。');
    const profileResult = await client.from('profiles').upsert({ id: state.user.id, display_name: nextName }, { onConflict: 'id' });
    if (profileResult.error) throw profileResult.error;
    const authResult = await client.auth.updateUser({ data: { display_name: nextName } });
    if (authResult.error) throw authResult.error;
    await refresh();
    return snapshot();
  }

  async function signOut() {
    const client = await requireClient();
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }

  function isFavorite(heroId) {
    return state.favorites.has(String(heroId || '').trim());
  }

  async function toggleFavorite(heroId) {
    const client = await requireClient();
    if (!state.user) throw new Error('請先登入會員。');
    const id = String(heroId || '').trim();
    if (!id) throw new Error('英雄資料不完整。');

    if (state.favorites.has(id)) {
      const { error } = await client.from('favorite_heroes').delete().eq('user_id', state.user.id).eq('hero_id', id);
      if (error) throw error;
      state.favorites.delete(id);
    } else {
      const { error } = await client.from('favorite_heroes').insert({ user_id: state.user.id, hero_id: id });
      if (error && String(error.code || '') !== '23505') throw error;
      state.favorites.add(id);
    }
    notifyMemberData();
    return state.favorites.has(id);
  }

  async function recordHeroView({ heroId, guideId = '', roleId = '' } = {}) {
    await ready;
    if (!state.client || !state.user) return false;
    const id = String(heroId || '').trim();
    if (!id) return false;
    const now = Date.now();
    if (now - Number(recentWriteTimes.get(id) || 0) < 15000) return true;
    recentWriteTimes.set(id, now);

    const row = {
      user_id: state.user.id,
      hero_id: id,
      guide_id: String(guideId || '').trim() || null,
      role_id: String(roleId || '').trim() || null,
      viewed_at: new Date().toISOString()
    };
    let result = await state.client.from('recent_hero_views').upsert(row, { onConflict: 'user_id,hero_id' });
    if (result.error) {
      const fallback = { user_id: row.user_id, hero_id: row.hero_id, viewed_at: row.viewed_at };
      result = await state.client.from('recent_hero_views').upsert(fallback, { onConflict: 'user_id,hero_id' });
    }
    if (result.error) throw result.error;

    state.recentViews = [row, ...state.recentViews.filter((item) => item.hero_id !== id)].slice(0, 12);
    notifyMemberData();
    return true;
  }

  async function clearRecentViews() {
    const client = await requireClient();
    if (!state.user) return;
    const { error } = await client.from('recent_hero_views').delete().eq('user_id', state.user.id);
    if (error) throw error;
    state.recentViews = [];
    notifyMemberData();
  }

  async function refresh() {
    if (state.user) {
      await loadProfile();
      await loadMemberData();
    }
    renderMemberLinks();
    renderAccountSheet();
    notify();
    return snapshot();
  }

  async function initialize() {
    renderMemberLinks();
    ensureAccountSheet();

    if (!configured) {
      state.initialized = true;
      resolveReady(snapshot());
      notify();
      return;
    }

    try {
      await ensureSupabaseLibrary();
      state.client = window.supabase.createClient(projectUrl, publishableKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        },
        global: { headers: { 'X-Client-Info': 'wild-rift-guide/79.2' } }
      });

      state.client.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') return;
        window.setTimeout(() => syncUser(session?.user || null), 0);
      });

      const { data, error } = await state.client.auth.getSession();
      if (error) throw error;
      await syncUser(data?.session?.user || null);
      probeConnection().then(() => notify()).catch(() => {});
    } catch (error) {
      state.error = error;
      console.error('會員系統初始化失敗', error);
    }

    state.initialized = true;
    resolveReady(snapshot());
    notify();
  }

  window.WRGAuth = Object.freeze({
    ready,
    get client() { return state.client; },
    get configured() { return state.configured; },
    get user() { return state.user; },
    get profile() { return state.profile; },
    get favorites() { return [...state.favorites]; },
    get recentViews() { return [...state.recentViews]; },
    snapshot,
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      if (state.initialized) listener(snapshot());
      return () => listeners.delete(listener);
    },
    memberUrl,
    callbackUrl,
    currentRelativeUrl,
    relativeCurrentUrl: currentRelativeUrl,
    displayName,
    avatarLetter,
    errorDetails,
    loadProfile,
    loadMemberData,
    openAccountSheet,
    closeAccountSheet,
    signUp,
    signIn,
    sendPasswordReset,
    updatePassword,
    updateDisplayName,
    signOut,
    isFavorite,
    toggleFavorite,
    recordHeroView,
    clearRecentViews,
    probeConnection,
    refresh
  });

  initialize();
})();
