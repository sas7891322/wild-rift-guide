# Wild Rift Guide 7.2b｜v79.5 網站即時人氣

## 新增

- 首頁新增「網站即時人氣」區塊。
- 顯示「累積瀏覽」與「目前在線」。
- 全站 9 個主要頁面納入瀏覽統計（首頁＋8 個主要功能頁）。
- 同一瀏覽器使用匿名 session id，不需要登入會員。
- 在線狀態每 45 秒更新；最近 2 分鐘有活動視為在線。
- 不記錄 IP、Email、會員名稱。

## Supabase

新增：

- `public.wrg_site_stats`
- `public.wrg_site_presence`
- `public.wrg_record_site_visit(text,text)`
- `public.wrg_touch_site_presence(text,text)`

資料表不開放 anon/authenticated 直接 CRUD，只允許執行受控 RPC。

## 版本

- 遊戲版本仍為 7.2b。
- 前端快取版本更新為 v79.5。
- `patch.json` dataVersion：`7.2b-v79.5-live-traffic`。
