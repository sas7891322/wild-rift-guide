# Wild Rift Guide v79.7.0 — ARAM 吉茵珂絲固定母版

## 本次範圍

- 以 v79.6.0 雙模式入口版為基準。
- 不修改召喚峽谷五路英雄、Tier、出裝、符文與既有頁面資料。
- ARAM 專區建立第一位英雄固定母版：吉茵珂絲。

## 新增

- `aram-hero.html`：ARAM 英雄詳細攻略頁。
- `assets/js/aram.js`：ARAM Tier / 英雄卡片資料載入。
- `assets/js/aram-hero.js`：ARAM 英雄詳細攻略資料載入。
- `assets/images/aram/items/`：ARAM 母版使用的獨立裝備圖示副本，不覆蓋召喚峽谷資產。

## ARAM 吉茵珂絲母版欄位

1. ARAM Tier 與分級理由
2. ARAM 模式平衡修正
3. 開局裝備
4. 核心 5 件出裝
5. 鞋子 / 升級
6. 召喚師技能
7. 推薦符文
8. 技能升級順序
9. 開局 / 中期 / 後期玩法
10. 情境裝備
11. 資料說明與來源

## 7.2b 資料基準

- Riot Games 7.2b：磁性雷射槍物攻 25 → 30；多明尼克的問候物攻 25 → 30。
- 7.2b ARAM / AAA ARAM 平衡名單未新增吉茵珂絲調整。
- ARAM 模式修正依歷次平衡紀錄追溯：吉茵珂絲目前以造成傷害 90%、承受傷害 105% 顯示。
- Tier S 為本站綜合評級：單線 5v5、火箭範圍輸出、重置能力很適合 ARAM，但模式傷害 / 承傷修正限制其上限，因此母版先列 S 而非 S+。

## 隔離原則

以下召喚峽谷核心檔案與 v79.6.0 完全一致：

- `assets/data/heroes.json`
- `assets/data/items.json`
- `assets/data/runes.json`
- `pages/heroes.html`
- `summoners-rift.html`

ARAM 推薦資料只寫入 `assets/data/aram/heroes.json`。
