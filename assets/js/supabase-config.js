/*
 * Wild Rift Guide v79.1 正式會員系統設定
 *
 * Project URL 已填入。請只將 Supabase 的 Publishable key 貼到下方。
 * Publishable key 通常以 sb_publishable_ 開頭，可安全用於瀏覽器前端；
 * 真正資料權限由 supabase/wild-rift-guide-member.sql 的 RLS 規則保護。
 *
 * 絕對不要把 Secret key、service_role key 或 sb_secret_... 放進此檔案。
 */
window.WRG_SUPABASE_CONFIG = Object.freeze({
  url: 'https://occjhtjxzysqnbzaqvao.supabase.co',
  publishableKey: '',
  libraryUrl: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.9'
});
