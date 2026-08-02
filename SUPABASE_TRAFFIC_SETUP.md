# Wild Rift Guide v79.5｜總瀏覽＋目前在線 啟用方式

這個功能沿用現有 Supabase，不需要新的第三方服務。

## 只需要做一次

1. 登入 Supabase Dashboard。
2. 開啟目前 Wild Rift Guide 使用的 Project。
3. 左側選 **SQL Editor**。
4. 按 **New query**。
5. 打開專案內：

   `supabase/wild-rift-guide-v79.5-traffic.sql`

6. 全選 SQL 內容貼到 SQL Editor。
7. 按 **Run**。
8. 看到成功後，再部署 v79.5 網站檔案。

## 顯示規則

- **累積瀏覽**：從這個功能啟用後開始累計全站頁面瀏覽次數，舊流量不會倒推補入。
- **目前在線**：同一瀏覽器使用匿名 session id；最近 2 分鐘內仍有活動就算在線。
- 每 45 秒更新一次在線狀態。
- 不記錄 IP、Email、會員名稱或其他個人資料。

## 安全設計

前端不能直接讀寫統計資料表，只能呼叫兩個受控 RPC：

- `wrg_record_site_visit`
- `wrg_touch_site_presence`

資料表已啟用 RLS，且沒有對 `anon` / `authenticated` 開放直接 CRUD 權限。
