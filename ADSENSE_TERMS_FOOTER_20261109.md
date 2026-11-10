# Wild Rift Guide｜AdSense 設定與 Footer 修正說明（2026-11-09）

母檔：7.3d／v124.2 完整網站 ZIP。未更動 CSS、JavaScript、英雄資料、Tier、出裝或首頁排版。

- ads.txt：保留 `google.com, pub-6785196021794818, DIRECT, f08c47fec0942fa0`。
- 隱私權：保留原本 `pages/privacy.html`，包含 Cookie、GA4、Supabase、AdSense 與同意選項說明。
- 新增 `pages/terms.html`，沿用現有 policy-page / policy-card 樣式。
- 新增根目錄 `terms.html` 相容轉址頁，避免舊連結失效。
- 所有含隱私權政策連結的 Footer，於原位置增加服務條款連結；未改動其他導覽。
- Sitemap 增列服務條款頁。
- 廣告 script 保留原有部署策略，不在會員、登入、noindex、隱私或條款頁強制加載；已存在的 script 不重複插入。

## 上傳與注意事項

將 ZIP 中 `wild-rift-guide-main/` 內的內容同步至 GitHub 專案根目錄，保留既有其他檔案；若本機有未解決的 merge conflict，先解決再同步，避免覆蓋新提交。

本次僅處理政策頁與導覽連結，不保證 AdSense 審核通過。此前實際退件原因為「缺乏價值的內容」，需另以實際內容品質判斷。
