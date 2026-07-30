# Supabase｜Wild Rift Guide v79.1

這個資料夾只保存資料庫結構與驗證腳本，不保存任何秘密金鑰。

## 手機執行順序

1. 開啟 Supabase 專案。
2. 進入 **SQL Editor** → **New query**。
3. 開啟 `wild-rift-guide-member.sql`，全選並複製到 SQL Editor。
4. 點 **Run**。
5. 主 SQL 成功後，可再執行 `wild-rift-guide-v79-check.sql` 驗證。

## 檔案

- `wild-rift-guide-member.sql`：正式會員資料庫、Trigger、RLS 與權限。
- `wild-rift-guide-v79-check.sql`：只讀驗證查詢，不會修改資料。

## 安全規則

- 前端只使用 `sb_publishable_...`。
- 不要將 `sb_secret_...`、Secret key 或 `service_role` key 放進 GitHub。
