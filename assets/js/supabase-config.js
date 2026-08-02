/*
 * Wild Rift Guide v79.5 Supabase 前端設定
 *
 * 只把 Supabase Dashboard 的 Publishable key 貼到 publishableKey。
 * 絕對不要填入 Secret key、service_role key 或 sb_secret_...。
 */
window.WRG_SUPABASE_CONFIG = Object.freeze({
  url: 'https://occjhtjxzysqnbzaqvao.supabase.co',
  publishableKey: 'sb_publishable_rwLExG9fofQ5U62L365ivQ_K3c-fwTI',
  libraryUrl: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
});
