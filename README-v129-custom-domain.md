# v129：正式網域更新

主網址：https://www.wrguide.com
基準：GitHub commit 1f3a29f524a2c5a137650ffe373cbd1ce53fa5cb。
這是增量更新包，覆蓋原專案使用，不是獨立完整網站。尚未替你提交 GitHub 或部署。

## 已完成

- 更新 HTML canonical、Open Graph、結構化資料及 JavaScript SEO 的正式網址。
- 更新 robots.txt、兩份 sitemap、分享網址及攻略產生腳本。
- 更新 SEO／登入／支持頁腳本引用版本，避免沿用舊快取。
- 保留現有 UI、7.3f 英雄內容、路由、noindex 與 AdSense 發行商 ID。
- 不更改 Vercel 現有 wrguide.com → www.wrguide.com 設定。

## 先設定會員回跳網址

Supabase 專案 → Authentication → URL Configuration：

Site URL 填：
```
https://www.wrguide.com
```

Redirect URLs 新增以下三筆，再儲存：
```
https://www.wrguide.com/pages/auth-callback.html
https://www.wrguide.com/pages/auth-callback.html?flow=signup
https://www.wrguide.com/pages/auth-callback.html?flow=recovery
```

保留舊網域已設定的回跳網址，讓先前寄出的信仍可使用。此包沒有修改 Supabase 後台。
新網域須重新登入；既有 Supabase 帳號不需重新註冊。

## 上傳部署

1. 先備份目前專案。
2. 解壓縮，把包內檔案依原資料夾結構覆蓋到專案根目錄（與 index.html 同層）。
3. 提交到 GitHub 的正式部署分支，等 Vercel 顯示 Ready。
4. 以無痕視窗開啟 https://www.wrguide.com，檢查首頁與手機版。
5. 直接開啟 /privacy，再重新整理；應顯示隱私權內容。
6. 查看原始碼，canonical 應以 https://www.wrguide.com 開頭。
7. 開啟 /robots.txt、/sitemap.xml、/sitemap-editorial.xml，確認內含新網址。
8. 開啟 /ads.txt，確認仍為 pub-6785196021794818。
9. 測試登入、註冊驗證信與忘記密碼；保留舊站直到新站會員流程成功。

## 舊網址的永久轉址

完成上述會員測試後，到 Vercel 專案 Domains，對 wild-rift-guide.vercel.app 點 Edit，將其設成轉址到 https://www.wrguide.com，選永久轉址（308）。保留原路徑與查詢參數，確認英雄連結仍能到對應頁面。不要刪除舊網域；它需要繼續接收舊連結。
這一步是後台設定，本包未自動啟用舊網域轉址。

## 搜尋與廣告

- Google Search Console 新增並驗證新網域資源，提交 sitemap.xml 與 sitemap-editorial.xml。
- 舊站與新站都驗證後，完成永久轉址，再依 Search Console 的地址變更流程處理。
- AdSense 新增 wrguide.com 並完成站點驗證與審核；購買網域本身不代表通過審核。
- 原本 noindex 策略維持；robots.txt 仍允許抓取，以便 Google 讀取 noindex。

## 本地驗證

```
python3 -B scripts/verify-indexing-v128.py
node scripts/verify-seo-v128.cjs
```

已通過 350 頁 noindex、35 筆主 sitemap、動態英雄／列表切換、ARAM 模式 SEO 檢查。線上部署、信件回跳及 Google 後台仍需在部署後確認。

參考：https://supabase.com/docs/guides/auth/redirect-urls
參考：https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting
