# Wild Rift Guide v79.1｜正式會員系統手機設定

會員前端與正式 SQL 已完成。你目前的 Supabase Project URL 已填入網站設定檔；接下來只需要執行 SQL、設定驗證網址，再貼上 Publishable key。

## 一、手機執行正式 SQL

1. 在 Supabase 專案打開 **SQL Editor**。
2. 點 **New query**。
3. 從更新包打開：`supabase/wild-rift-guide-member.sql`。
4. 全選 SQL 內容並複製。
5. 回到 SQL Editor 貼上，點右上角 **Run**。
6. 下方 Results 顯示 **Success** 或 **No rows returned** 即完成。

這份 SQL 會建立：

- `profiles`：會員暱稱與加入時間。
- `favorite_heroes`：會員收藏英雄。
- `recent_hero_views`：最近查看的英雄位置攻略。
- 新會員自動建立 Profile 的 Trigger。
- 暱稱更新時間 Trigger。
- 每位會員只能存取自己資料的 RLS Policy。

主 SQL 成功後，可再執行 `supabase/wild-rift-guide-v79-check.sql`。正常會列出 3 張資料表、9 條 Policy 與 2 個 Trigger。

## 二、設定網站與驗證回傳網址

Supabase：**Authentication → URL Configuration**

### Site URL

```text
https://wild-rift-guide.vercel.app
```

### Redirect URLs

正式站建議加入下面兩條完整網址：

```text
https://wild-rift-guide.vercel.app/pages/auth-callback.html?flow=signup
https://wild-rift-guide.vercel.app/pages/auth-callback.html?flow=recovery
```

Vercel Preview 網址需要另外依你的 Vercel 帳號／團隊 slug 設定萬用字元；目前先完成正式站即可。

## 三、貼入 Publishable key

你目前的 Project URL 已寫入：

`assets/js/supabase-config.js`

打開檔案，找到：

```js
publishableKey: ''
```

把 Supabase **Settings → API Keys → Publishable key** 貼入單引號中：

```js
publishableKey: 'sb_publishable_你的完整金鑰'
```

可以上傳到 GitHub 的只有 Publishable key。

### 絕對不要上傳

- Secret key
- `sb_secret_...`
- `service_role`

## 四、上傳 GitHub

將更新包內檔案覆蓋到 Repository 根目錄，Commit 後等待 Vercel 部署。

建議 Commit：

```text
feat: 完成 v79 正式會員與收藏系統
```

## 五、正式測試順序

1. 打開 `/pages/member.html`。
2. 註冊測試帳號。
3. 到信箱點驗證連結。
4. 回網站登入。
5. 修改暱稱。
6. 到英雄列表收藏一位英雄。
7. 打開一份英雄攻略。
8. 回會員中心，確認「收藏英雄」與「最近瀏覽」都有資料。
9. 登出再登入，確認資料仍保留。
10. 用另一個帳號登入，確認看不到第一個帳號的收藏與紀錄。

## v79.1 正式功能

- Email 註冊與信箱驗證
- Email／密碼登入與登出
- 忘記密碼與設定新密碼
- 修改會員暱稱
- 全站登入狀態
- 收藏／取消收藏英雄
- 圓形收藏英雄頭像
- 最近瀏覽攻略同步與清除
- Supabase RLS 個人資料隔離

首頁 App 化、公開個人頁與找隊友正式資料庫保留到後續版本。
