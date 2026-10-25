# Wild Rift Guide｜第五次 AdSense 送審前技術健檢（2026-10-25）

## 本次安全修正

1. `aram-hero.html` 在未執行 JavaScript 前補上標準網址，指向可直接閱讀的 `/pages/aram-guides.html`。JavaScript 載入特定英雄後，仍會按照既有邏輯切換成該英雄靜態攻略網址；符文大亂鬥互動模式保留原本的獨立網址設定。
2. 動態 ARAM 載入畫面增加有意義的文字、標題與靜態閱讀入口，避免只顯示「正在載入」。
3. 新增 `scripts/audit-indexable-pages.py`，檢查兩份 Sitemap 中的網址是否存在、canonical 是否一致、是否誤列 noindex。**不自動修改 Sitemap**。

## 本次保留

- 203 份召喚峽谷英雄靜態攻略及 141 份 ARAM 靜態攻略、原本互動功能。
- 現有 6785 AdSense ID、ads.txt、CMP 與隱私政策。
- 各模式原本版本註記。**標準 ARAM 仍以 7.2e 歷史資料呈現，不假稱完成 7.3c 全量複核**。
- 分享頁的索引設計。Search Console 10/16 的 noindex 報表屬歷史資料，最新 ZIP 的分享頁已使用 index,follow，不能據此推斷仍存在 noindex 問題。

## 部署後建議

1. 打開首頁、召喚峽谷英雄索引、ARAM 靜態攻略索引及任意英雄攻略，確認畫面和資料正常。
2. 於 Search Console 用「網址審查 → 測試線上網址」核對重要靜態頁，不要要求每個動態參數網址都收錄。
3. AdSense「缺乏價值的內容」不是 Search Console 索引狀態的同義詞。這次技術修正**不保證審核通過**；重新送審前應人工評估攻略的原創性、實用性及導覽體驗。

## 驗證指令

`python scripts/audit-indexable-pages.py`
