# Wild Rift Guide v79.0 會員系統設定

會員前端、註冊、登入、登出、重設密碼、個人暱稱與收藏英雄功能都已經放進網站。要讓它正式運作，需連接一個 Supabase 專案。

## 1. 建立 Supabase 專案

前往 Supabase 建立新專案。專案地區可選離台灣較近的區域。

## 2. 建立會員資料表與權限

在 Supabase Dashboard 開啟：

`SQL Editor` → `New query`

將 `supabase/wild-rift-guide-member.sql` 的完整內容貼上並執行。

這會建立：

- `profiles`：會員暱稱
- `favorite_heroes`：會員收藏英雄
- 新會員自動建立 profile 的 Trigger
- 只允許會員存取自己資料的 RLS 規則

## 3. 設定網站網址

到：

`Authentication` → `URL Configuration`

設定：

- Site URL：`https://wild-rift-guide.vercel.app`
- Redirect URLs：`https://wild-rift-guide.vercel.app/pages/auth-callback.html*`

若未來更換正式網域，需再加入新網域的 callback 網址。

## 4. 填入公開連線設定

到：

`Project Settings` → `API`

複製：

- Project URL
- Publishable key（舊介面可能顯示 anon public key）

開啟 `assets/js/supabase-config.js`：

```js
window.WRG_SUPABASE_CONFIG = Object.freeze({
  url: 'https://你的專案.supabase.co',
  publishableKey: '你的 publishable key'
});
```

Publishable／anon key 原本就會由瀏覽器使用，真正的資料安全由 SQL 裡的 RLS 規則負責。

**不可把 service_role key 放進 GitHub 或網站前端。**

## 5. Email 驗證設定

到：

`Authentication` → `Providers` → `Email`

建議保留 Email confirmation。新會員註冊後會收到驗證信，點擊後回到網站會員中心。

正式大量使用前，建議再設定自有 SMTP，避免共用寄信額度或寄信速度限制。

## 6. 上線測試

1. 打開 `/pages/member.html`
2. 建立測試帳號
3. 到信箱點驗證連結
4. 登入會員
5. 前往英雄頁點擊星號
6. 回會員中心確認收藏英雄出現
7. 登出再登入，確認收藏仍存在

## 功能範圍

v79.0 已完成：

- Email 註冊與驗證
- Email／密碼登入
- 登出
- 忘記密碼與重設密碼
- 修改顯示暱稱
- 收藏／取消收藏英雄
- 會員中心收藏英雄圓形頭像
- 全站導覽登入狀態
- Supabase RLS 個人資料隔離

本版未包含：

- Google／Discord 社群登入
- 公開玩家個人頁
- 找隊友正式資料庫
- 首頁 App 化
