/*
 * Wild Rift Guide v79.1 會員系統設定
 *
 * 只需把 Supabase Dashboard 內的 Publishable key 貼到 publishableKey。
 * Publishable key 可放在瀏覽器前端；資料存取仍由資料表 RLS 規則保護。
 *
 * 絕對不要填入 Secret key、service_role key 或 sb_secret_...。
 */
window.WRG_SUPABASE_CONFIG = Object.freeze({
  url: 'https://occjhtjxzysqnbzaqvao.supabase.co',
  publishableKey: '',
  libraryUrl: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
});
