# Wild Rift Guide｜7.3d 來源與介面一致性校正（v124.2）

**基準檔**：`wild-rift-guide-main(20261104-040655).zip`（v124／v124.1 修正已包含）。
**資料核對日期**：2026-11-04；**官方現行公告**：Riot 台灣 2026-10-28 7.3d。

## 更新範圍

- 將仍誤顯示 7.3c 的目前攻略入口（五路攻略、動態英雄頁、標準ARAM索引、符文與召喚師技能、配裝工具）更正為 7.3d。
- 已是 7.3d 的 203 份召喚峽谷分路、142 份標準ARAM、142份AAA配置保持原先 Tier 與配裝；這輪沒有新版本及可驗證的統計依據，不假裝重測了 345 份英雄文章的即時勝率或技能。
- 7.3d 官方英文來源換成 Riot 台灣繁中官方公告，核對 11 位英雄、6 件裝備及 6 項 AAA 增幅數值與名稱。希瓦娜「每級生命回復成長」9→12 不等於基礎回復。
- 151 張站內既有增幅卡庫中，`augment-085 有福同享` 從 50% 修正至 40%；另外 5 項 7.3d 公告與現行卡庫無可靠對應，僅以官方公告呈現，不憑猜測建立或覆寫卡片。
- 靜態完整攻略頁維持原 HTML、出裝、符文與戰術說明；僅同步 7.3d 官方來源連結及其繁中標籤。
- 歷史 7.3b／7.3c 公告、原出裝引用來源版本、過去編輯紀錄、9 項待確認數值保持可追溯，不做全站關鍵字粗暴替換。
- 保留 AdSense `ca-pub-6785196021794818`、`ads.txt`、會員、找隊友、Supabase、Google CMP 與現有靜態頁路徑。

## 安裝與驗證

1. 解壓 ZIP，將資料夾 `wild-rift-guide-main/` **裡面**的全部檔案（`index.html`、`assets/`、`pages/`、`share/` 等）覆蓋至 GitHub 專案根目錄。不要把外層資料夾或 ZIP 本身上傳成網站內容。
2. Commit / Push 到 `main`。等待 Vercel 的 Production 部署為 Ready。
3. 檢查首頁、`pages/guides.html`、`pages/heroes.html`、`pages/aram-guides.html`、`pages/runes.html`、`pages/build-check.html` 是否顯示 **7.3d**。
4. 開啟 `aram-augments.html`，搜尋「有福同享」應為 **40%**；官方 7.3d 公告應以台灣繁中增幅名稱呈現。
5. `https://wild-rift-guide.vercel.app/ads.txt` 仍應是 `google.com, pub-6785196021794818, DIRECT, f08c47fec0942fa0`。
6. 本機執行 `python scripts/validate-release-v124.py` 與 `python scripts/validate-release-v1242.py`。不要執行較舊的整站重新生成器來覆蓋已校正資料。

## 不能從此推出的結論

本輪核對官方版本與站內資料差異，不代表遊戲內逐級實測或每位英雄 7.3d 最新勝率排名。Google Search Console 的索引狀態與 AdSense 審核互相獨立。這些校正改善內容透明度、時效與一致性，但**不保證 AdSense 核准**；再次提交前應以部署後實際網站及 AdSense 後台提示為準。
