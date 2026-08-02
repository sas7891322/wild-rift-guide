# Wild Rift Guide 7.2b v79.6.0 — 雙模式入口／ARAM 空框架測試版

## 本次只做結構擴充
- 原 `index.html` 完整召喚峽谷首頁保留為 `summoners-rift.html`。
- 新 `index.html` 改為首次進站的模式選擇：召喚峽谷／隨機單中 ARAM。
- 新增 `aram.html` 空框架，尚未放入任何英雄 Tier、出裝或符文。
- 新增 `assets/data/aram/heroes.json`，目前 heroes 為空陣列，與既有 `assets/data/heroes.json` 完全分離。
- 原本五路英雄資料、裝備、符文、英雄頁與會員資料均未改動。

## 安全原則
ARAM 只能新增獨立資料，不覆蓋召喚峽谷既有資料。
