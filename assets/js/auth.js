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
  const publishableKey = String(config.publishableKey || config.anonKey || '').trim();
  const configured = /^https:\/\/.+\.supabase\.co\/?$/i.test(String(config.url || '').trim()) && publishableKey.length > 20;

  const state = {
    configured,
    client: null,
    user: null,
    profile: null,
    initialized: false,
    error: null
  };
  const listeners = new Set();
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

  function snapshot() {
    return {
      configured: state.configured,
      user: state.user,
      profile: state.profile,
      initialized: state.initialized,
      error: state.error
    };
  }

  function notify() {
    const value = snapshot();
    listeners.forEach((listener) => {
      try { listener(value); } catch (error) { console.error(error); }
    });
    document.dispatchEvent(new CustomEvent('wrg:authchange', { detail: value }));
  }

  async function ensureSupabaseLibrary() {
    if (window.supabase?.createClient) return window.supabase;
    const libraryUrl = String(config.libraryUrl || '').trim();
    if (!libraryUrl) throw new Error('Supabase 程式庫網址未設定');

    await new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((script) => script.src === libraryUrl || /@supabase\/supabase-js@2/.test(script.src));
      if (existing) {
        if (window.supabase?.createClient) return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', () => reject(new Error('Supabase 程式庫載入失敗')), { once: true });
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

  async function syncUser(user) {
    state.user = user || null;
    state.profile = null;
    state.error = null;
    if (state.user) {
      try {
        await loadProfile(state.user.id);
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

  async function signOut() {
    await ready;
    if (!state.client) return;
    const { error } = await state.client.auth.signOut({ scope: 'local' });
    if (error) throw error;
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
      state.client = window.supabase.createClient(
        String(config.url).trim().replace(/\/$/, ''),
        publishableKey,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        }
      );

      state.client.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') return;
        window.setTimeout(() => syncUser(session?.user || null), 0);
      });

      const { data, error } = await state.client.auth.getUser();
      if (error && !/session/i.test(String(error.message || ''))) throw error;
      await syncUser(data?.user || null);
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
    displayName,
    avatarLetter,
    loadProfile,
    openAccountSheet,
    closeAccountSheet,
    signOut,
    refresh: async () => {
      if (state.user) await loadProfile();
      renderMemberLinks();
      renderAccountSheet();
      notify();
      return snapshot();
    }
  });

  initialize();
})();
