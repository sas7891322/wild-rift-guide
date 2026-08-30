# Wild Rift Guide — AdSense 第二次送審強化（2026-08-30）

## 這次處理的核心問題

第一次送審時，網站雖然有 202 份召喚峽谷英雄位置攻略與 140 位 ARAM 攻略，但多數主要內容由 JavaScript 在瀏覽器載入；原本 `/share/heroes/*.html` 只是 `noindex` 轉址頁。對不完整執行 JavaScript 的爬蟲／審核流程而言，可能只看到少量靜態文字與資料庫介面，而看不到網站實際擁有的完整攻略內容。

本版把這些既有原創攻略資料轉成可直接讀取、可索引、每頁自帶 canonical 的靜態內容頁，同時保留原本互動版網站。

## 已完成

- 202 份召喚峽谷英雄位置攻略改為完整靜態可索引頁：`/share/heroes/*.html`
- 新增 140 份 ARAM 完整靜態可索引頁：`/share/aram/*.html`
- 新增 `/pages/hero-guides.html`：202 份召喚峽谷攻略索引
- 新增 `/pages/aram-guides.html`：140 位 ARAM 攻略索引
- 動態英雄頁的 canonical 改指向對應靜態攻略頁
- Sitemap 重建為 360 個穩定、可索引 URL；不再把會員／驗證頁放進 sitemap
- `robots.txt` 排除會員中心與登入 callback
- 新增 `ads.txt`
- 會員中心、登入 callback、ARAM 動態 noindex 頁移除 AdSense loader，避免未來自動廣告出現在非主要內容頁
- 英雄、裝備、符文、召喚師技能、ARAM 首頁增加內容方法與使用說明
- 「關於本站」補上：資料來源、版本校正方法、本站原創分析範圍、更新與更正方式、廣告不影響推薦的說明
- 「隱私權政策」補上 Google CMP、會員與找隊友資料說明
- 修正 `assets/images` 中 88 個 `#Uxxxx` 編碼檔名，建立正確 Unicode 檔名別名，避免裝備圖片路徑失效
- 召喚峽谷英雄相關 SEO／顯示版本統一到 Patch 7.2d

## 驗證結果

已通過：

- `node scripts/validate-v90.mjs`
- `node scripts/validate-v91-player-finder.mjs`
- `node scripts/validate-v92-adsense.mjs`

本地靜態檢查：

- HTML：364 頁
- 召喚峽谷可索引完整攻略：202 頁
- ARAM 可索引完整攻略：140 頁
- Sitemap：360 個唯一 URL
- Sitemap 中沒有 noindex 頁
- 342 個靜態攻略 canonical 全部唯一且指向自己
- 全站 HTML 內部連結／圖片／CSS／JS 路徑：0 個本機失效引用

## 部署後再送 AdSense 前

1. 部署本版到 `wild-rift-guide.vercel.app`。
2. 確認下列網址能正常開啟：
   - `/pages/hero-guides.html`
   - `/share/heroes/jinx.html`
   - `/pages/aram-guides.html`
   - `/share/aram/amumu.html`
   - `/ads.txt`
   - `/sitemap.xml`
3. 到 Google Search Console 重新提交 `sitemap.xml`，並檢查新的靜態攻略 URL 是否開始被 Google 發現／檢索。
4. 確認網站首頁、英雄攻略、ARAM、關於本站與隱私權政策都能正常開啟後，再回 AdSense 重新提交。

> 本版是針對「內容可見性、原創價值呈現、導覽與透明度」做的第二次送審強化，不能保證 Google 一定核准；AdSense 最終審核結果仍由 Google 決定。
