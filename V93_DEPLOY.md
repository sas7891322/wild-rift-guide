# v93 AdSense 第三次送審內容品質強化

這是一包「增量覆蓋檔」，不是完整網站母檔。

## 目的
- 保留目前 Production 的 7.2d、141 位標準 ARAM、找隊友與後續資料更新。
- 只覆蓋首頁、關於本站、聯絡頁、Sitemap，並新增專題／編輯透明度頁面。
- 避免用 8/30 舊母檔整包覆蓋造成 9 月更新倒退。

## 需要上傳的內容
直接把 ZIP 內所有檔案保持相同路徑覆蓋到最新專案：
- index.html
- sitemap.xml
- assets/css/editorial.css
- articles/（整個新資料夾）
- pages/about.html
- pages/contact.html
- pages/editorial.html
- pages/changelog.html

## 不會覆蓋
- aram.html / aram-hero.html / aram-augments.html
- summoners-rift.html
- heroes/items/runes/spells 等資料庫頁
- 找隊友 JS / Supabase / 會員功能
- 英雄與 ARAM 資料檔

## 部署後先檢查
1. /
2. /articles/
3. /articles/itemization-by-enemy-comp.html
4. /pages/editorial.html
5. /pages/changelog.html
6. /pages/about.html
7. /pages/contact.html
8. /sitemap.xml

先不要立刻重新送 AdSense；部署後先讓 Search Console 重新讀 Sitemap 與核心新頁面。
