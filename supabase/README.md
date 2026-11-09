# Supabase 資料庫

- `wild-rift-guide-member.sql`：v79 會員資料表、Trigger、RLS 與 API 權限。
- `wild-rift-guide-v91-player-finder.sql`：v91 正式找隊友貼文、檢舉、14 天效期、RLS 與 API 權限。
- `wild-rift-guide-v91-player-finder-check.sql`：v91 安裝完成後的結構與權限驗證。
- 此 SQL 已在目前 Supabase 專案執行成功。
- 網站前端只使用 Publishable key。
- 不得把 Secret key 或 service_role key 上傳到 GitHub。

## v91 找隊友啟用順序

1. 在 Supabase SQL Editor 執行 `wild-rift-guide-v91-player-finder.sql`。
2. 再執行 `wild-rift-guide-v91-player-finder-check.sql`，確認兩張資料表的 `rowsecurity` 都是 `true`。
3. 部署網站後登入測試帳號，發布一篇找隊友刊登。
4. 使用未登入視窗確認能看見貼文，再測試篩選、複製 ID、編輯、刪除與檢舉。

檢舉紀錄會保存在 `player_reports`。網站管理者可在 Supabase Table Editor 檢查內容，必要時將 `player_posts.status` 改為 `hidden`；前台會立即停止公開該篇貼文。
