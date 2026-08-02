# Wild Rift Guide v79.1｜手機啟用會員前端

## 1. 填入 Publishable key

編輯：

```text
assets/js/supabase-config.js
```

把 Supabase Dashboard → API Keys → `default` 的 `sb_publishable_...` 貼入：

```js
publishableKey: 'sb_publishable_你的完整金鑰'
```

Project URL 已填入：

```text
https://occjhtjxzysqnbzaqvao.supabase.co
```

不要填入 Secret key、service_role key 或 `sb_secret_...`。

## 2. Supabase URL Configuration

Authentication → URL Configuration：

Site URL：

```text
https://wild-rift-guide.vercel.app
```

Redirect URLs 建議加入精確網址：

```text
https://wild-rift-guide.vercel.app/pages/auth-callback.html?flow=signup
https://wild-rift-guide.vercel.app/pages/auth-callback.html?flow=recovery
```

也可另外加入：

```text
https://wild-rift-guide.vercel.app/**
```

## 3. 部署後測試順序

1. 開啟 `/pages/member.html`。
2. 建立測試帳號。
3. 到信箱完成驗證。
4. 返回網站登入。
5. 修改顯示名稱。
6. 重新整理其他頁面，確認導覽列顯示會員名稱。
7. 點擊會員名稱，確認手機底部會員選單可開啟與登出。

## 4. v79.1 範圍

本版只完成會員登入基礎、帳號設定與全站登入狀態。收藏英雄、最近瀏覽與首頁個人化會在 v79.2 接續完成。

## v79.5：網站即時人氣

如果要啟用導覽列的「累積瀏覽／目前在線」，請再執行：

```text
supabase/wild-rift-guide-v79.5-traffic.sql
```

詳細步驟見 `SUPABASE_TRAFFIC_SETUP.md`。
