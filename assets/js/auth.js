(() => {
  'use strict';

  const config = window.WRG_SUPABASE_CONFIG || {};
  const scriptNode = [...document.scripts].find(script => /\/assets\/js\/auth\.js(?:\?|$)/.test(script.src));
  const siteRoot = scriptNode ? new URL('../../', scriptNode.src) : new URL('/', location.href);
  const configured = Boolean(
    /^https:\/\/.+\.supabase\.co\/?$/i.test(String(config.url || '').trim()) &&
    String(config.publishableKey || config.anonKey || '').trim().length > 20
  );

  const state = {
    configured,
    client: null,
    user: null,
    profile: null,
    favorites: new Set(),
    recentViews: [],
    initialized: false,
    error: null
  };
  const listeners = new Set();
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  async function ensureSupabaseLibrary() {
    if (window.supabase?.createClient) return window.supabase;
    const libraryUrl = String(
      config.libraryUrl || 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.9'
    ).trim();

    await new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(script => script.src === libraryUrl || /@supabase\/supabase-js@2/.test(script.src));
      if (existing) {
        if (window.supabase?.createClient) return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', () => reject(new Error('Supabase 程式庫載入失敗')), { once: true });
        window.setTimeout(() => {
          if (window.supabase?.createClient) resolve();
        }, 0);
        return;
      }
      const script = document.createElement('script');
      script.src = libraryUrl;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', () => reject(new Error('Supabase 程式庫載入失敗')), { once: true });
      document.head.appendChild(script);
    });

    if (!window.supabase?.createClient) throw new Error('Supabase 程式庫未正確初始化');
    return window.supabase;
  }

  function snapshot() {
    return {
      configured: state.configured,
      user: state.user,
      profile: state.profile,
      favorites: new Set(state.favorites),
      recentViews: state.recentViews.map(item => ({ ...item })),
      initialized: state.initialized,
      error: state.error
    };
  }

  function notify() {
    const value = snapshot();
    listeners.forEach(listener => {
      try { listener(value); } catch (error) { console.error(error); }
    });
    document.dispatchEvent(new CustomEvent('wrg:authchange', { detail: value }));
  }

  function relativeCurrentUrl() {
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

  function safeNickname(user = state.user, profile = state.profile) {
    const nickname = String(profile?.nickname || user?.user_metadata?.nickname || '').trim();
    if (nickname) return nickname;
    const email = String(user?.email || '會員');
    return email.includes('@') ? email.split('@')[0] : email;
  }

  function renderMemberLinks() {
    document.querySelectorAll('[data-member-nav]').forEach(link => {
      link.href = memberUrl();
      link.classList.toggle('is-signed-in', Boolean(state.user));
      if (state.user) {
        const nickname = safeNickname();
        link.textContent = nickname || '我的帳號';
        link.setAttribute('aria-label', `開啟 ${nickname || '我的'}會員資料`);
      } else {
        link.textContent = '登入';
        link.setAttribute('aria-label', '登入或註冊會員');
      }
    });
  }

  async function loadProfile(userId = state.user?.id) {
    if (!state.client || !userId) return null;
    const { data, error } = await state.client
      .from('profiles')
      .select('id,nickname,created_at,updated_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    state.profile = data || null;
    return state.profile;
  }

  async function loadFavorites(userId = state.user?.id) {
    if (!state.client || !userId) {
      state.favorites = new Set();
      return state.favorites;
    }
    const { data, error } = await state.client
      .from('favorite_heroes')
      .select('hero_id')
      .eq('user_id', userId);
    if (error) throw error;
    state.favorites = new Set((data || []).map(row => String(row.hero_id || '')).filter(Boolean));
    return state.favorites;
  }

  async function loadRecentViews(userId = state.user?.id) {
    if (!state.client || !userId) {
      state.recentViews = [];
      return state.recentViews;
    }
    const { data, error } = await state.client
      .from('recent_hero_views')
      .select('guide_id,hero_id,role_id,viewed_at')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(12);
    if (error) throw error;
    state.recentViews = Array.isArray(data) ? data : [];
    return state.recentViews;
  }

  async function syncUser(user) {
    state.user = user || null;
    state.profile = null;
    state.favorites = new Set();
    state.recentViews = [];
    state.error = null;
    if (state.user) {
      const results = await Promise.allSettled([
        loadProfile(state.user.id),
        loadFavorites(state.user.id),
        loadRecentViews(state.user.id)
      ]);
      const rejected = results.find(result => result.status === 'rejected');
      if (rejected) {
        state.error = rejected.reason;
        console.error('會員資料載入失敗', rejected.reason);
      }
    }
    renderMemberLinks();
    notify();
  }

  async function initialize() {
    renderMemberLinks();
    if (!configured) {
      state.initialized = true;
      resolveReady(snapshot());
      notify();
      return;
    }

    try {
      await ensureSupabaseLibrary();
      state.client = window.supabase.createClient(
        String(config.url).trim().replace(/\/$/, ''),
        String(config.publishableKey || config.anonKey).trim(),
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
          }
        }
      );

      state.client.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') return;
        window.setTimeout(() => syncUser(session?.user || null), 0);
      });

      const { data, error } = await state.client.auth.getUser();
      if (error && !/session/i.test(error.message || '')) console.warn(error);
      await syncUser(data?.user || null);
    } catch (error) {
      state.error = error;
      console.error('會員系統初始化失敗', error);
    }

    state.initialized = true;
    resolveReady(snapshot());
    notify();
  }

  async function requireUser() {
    await ready;
    if (!state.configured || !state.user) {
      location.href = memberUrl(relativeCurrentUrl());
      return null;
    }
    return state.user;
  }

  async function toggleFavorite(heroId) {
    const id = String(heroId || '').trim();
    if (!id) throw new Error('英雄 ID 不正確');
    const user = await requireUser();
    if (!user) return null;

    if (state.favorites.has(id)) {
      const { error } = await state.client
        .from('favorite_heroes')
        .delete()
        .eq('user_id', user.id)
        .eq('hero_id', id);
      if (error) throw error;
      state.favorites.delete(id);
    } else {
      const { error } = await state.client
        .from('favorite_heroes')
        .insert({ user_id: user.id, hero_id: id });
      if (error) throw error;
      state.favorites.add(id);
    }
    notify();
    return state.favorites.has(id);
  }

  async function recordHeroView({ guideId, heroId, roleId } = {}) {
    await ready;
    if (!state.client || !state.user) return false;
    const payload = {
      user_id: state.user.id,
      guide_id: String(guideId || '').trim(),
      hero_id: String(heroId || '').trim(),
      role_id: String(roleId || '').trim(),
      viewed_at: new Date().toISOString()
    };
    if (!payload.guide_id || !payload.hero_id || !['baron', 'jungle', 'mid', 'duo', 'support'].includes(payload.role_id)) {
      return false;
    }
    const { error } = await state.client
      .from('recent_hero_views')
      .upsert(payload, { onConflict: 'user_id,guide_id' });
    if (error) throw error;
    state.recentViews = [payload, ...state.recentViews.filter(item => item.guide_id !== payload.guide_id)].slice(0, 12);
    notify();
    return true;
  }

  async function clearRecentViews() {
    const user = await requireUser();
    if (!user) return false;
    const { error } = await state.client
      .from('recent_hero_views')
      .delete()
      .eq('user_id', user.id);
    if (error) throw error;
    state.recentViews = [];
    notify();
    return true;
  }

  window.WRGAuth = Object.freeze({
    ready,
    get client() { return state.client; },
    get configured() { return state.configured; },
    get user() { return state.user; },
    get profile() { return state.profile; },
    get favorites() { return new Set(state.favorites); },
    get recentViews() { return state.recentViews.map(item => ({ ...item })); },
    snapshot,
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      if (state.initialized) listener(snapshot());
      return () => listeners.delete(listener);
    },
    memberUrl,
    callbackUrl,
    relativeCurrentUrl,
    safeNickname,
    isFavorite: heroId => state.favorites.has(String(heroId || '')),
    toggleFavorite,
    recordHeroView,
    clearRecentViews,
    loadProfile,
    loadFavorites,
    loadRecentViews,
    refresh: async () => {
      if (!state.user) return snapshot();
      const results = await Promise.allSettled([loadProfile(), loadFavorites(), loadRecentViews()]);
      const rejected = results.find(result => result.status === 'rejected');
      state.error = rejected?.reason || null;
      renderMemberLinks();
      notify();
      return snapshot();
    }
  });

  initialize();
})();
