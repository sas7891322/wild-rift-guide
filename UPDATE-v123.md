# Wild Rift Guide 7.3c 全站整合更新（v123）

資料核對截止：2026-10-25。此包以你上傳並已部署的完整網站包為基礎，提供完整網站，不是差分補丁。不需要執行Python或BAT才可上傳。

## 上傳方式

1. 先保留現在的GitHub版本作為回復點。
2. 解壓後進入 `wild-rift-guide-main` 資料夾，把裡面的檔案與資料夾更新到原倉庫同一層，讓 `index.html`、`ads.txt`、`assets`、`pages` 仍在根目錄。不要把ZIP本身或多包一層資料夾上傳成網站。
3. 不需要更改Vercel Build Command，不需要更換AdSense發布商ID。
4. GitHub與部署由站長操作；此交付沒有寫入倉庫、部署或提交AdSense審查。

## 實際完成範圍

| 項目 | 本輪結果 |
|---|---|
| 召喚峽谷 | 142位英雄、203份分路配置逐筆核對及重建閱讀頁 |
| 峽谷Tier／預設出裝 | 保留上一輪有依據的7.3b結果；7.3c沒有新增一般峽谷平衡，這輪不為更新硬改 |
| 標準ARAM | 142位英雄，包含新增赫威完整策略、出裝、符文及閱讀頁 |
| ARAM預設出裝 | 44份變更，含退場裝備替換、同類穿透衝突、暴擊／命中特效配置及好戰者購買時機 |
| ARAM Tier | 6位變更；屬站方策略判斷，不是官方排名或勝率 |
| 符文大亂鬥 | 142位分類／條件式配裝，新增赫威與科加斯基礎策略；沒有憑空製作兩者逐卡S+排名 |
| 既有增幅卡庫 | 151張保留，新增校正8張已能核實的效果；未公開完整效果的新內容獨立列公告 |
| 技能圖片 | 移除3位英雄共6個失效次要圖示引用，保留已存在的主要技能圖示 |
| 標示 | 當前主要入口、資料、互動頁、閱讀頁與metadata統一7.3c；歷史版本公告與數值出處保留原版號 |

標準ARAM六項Tier變更：墨菲特 S+→S、凱特琳 S+→S、星朵拉 S+→S、崔絲塔娜 A→S、弗力貝爾 A→S、夜曲 S→A。逐項原因可在 `pages/review-7-3c.html` 查看。

## 內容品質與技術整合

- 新增 `pages/review-7-3c.html`，展示實際配裝前後差異、Tier理由、來源和限制，而不是只有「已完成」字樣。
- 新增 `pages/build-check.html`，可載入英雄配置，檢查重複成裝、同類百分比物穿、命脈重複、暴擊與好戰者1250額外生命門檻；純前端、不上傳配裝，功能頁noindex且無廣告loader。
- 203份峽谷與142份ARAM閱讀頁由同一份資料產生，包含清楚的版本、來源及條件式解說。保留原本互動式查詢，不強迫使用者轉去另一種介面。
- 移除互動頁誤指攻略總表的初始canonical。載入成功後依英雄與模式設定唯一canonical，靜態閱讀頁使用自己網址，AAA模式保持獨立。
- Sitemap只保留377個實際存在、可索引、自我canonical的閱讀／內容入口；不列參數查詢、會員與工具頁。沒有內容變更的文章保留原lastmod，不批次假裝今天更新。
- 補齊隱私頁對會員、收藏、最近瀏覽、找隊友公開資料、Supabase即時統計、GA4、Google廣告及管理選擇的說明。不宣稱僅更新文字就已符合所有地區法規。
- AdSense仍為 `pub-6785196021794818`。會員、回呼與工具頁不新增廣告；未重新設定Google帳戶或CMP。

## 已執行驗收

- 650套預設／替代路線：五件成裝、裝備引用、同類穿透／命脈組合、符文排列與召喚師技能檢查。
- 345份英雄閱讀頁與資料檔的預設出裝、標題與canonical一致。
- 384個HTML的站內連結及圖片引用，沒有缺少本機目標；另檢查目前使用的資料檔圖片引用。
- 20個JavaScript語法檢查、35個JSON解析檢查（後續加入的驗收JSON另解析）。
- 377個Sitemap網址與實體HTML的canonical／indexability檢查。
- 22項離線Chromium DOM／手機桌面檢查：英雄切換、ARAM搜尋、模式切換、增幅卡庫、裝備／符文／召喚師技能頁、配裝工具、閱讀頁與校正頁。測試0失敗。

瀏覽器環境禁止網址導覽，因此使用實際HTML、CSS、JavaScript與JSON的離線測試，URL、history與fetch由本機測試資料提供。這不是正式站連線測試；外部登入、資料庫寫入、實際廣告、CMP與付款沒有在此交付中操作。

完整機器驗收結果：`reports/v123-validation.json`。

## 必須如實保留的限制

1. 9項原有局部待核實內容仍保留：奈德麗巴龍Tier、維爾戈巴龍Tier、慎打野來源／Tier、亞歷斯塔被動精確自動觸發條件，以及赫威Q/W/E/R未公告完整成長／冷卻表。這不代表整位英雄攻略未處理，也不把待核實項目填成0或假數字。
2. 標準ARAM倍率只更新能對應的官方資料，並標示來源時點；沒有取得10/25完整官方倍率總表，不能宣稱所有倍率均於當天實機重測。赫威未核實的倍率顯示「未核定」，不假定100%。
3. 7.3c五位英雄模式倍率屬符文大亂鬥，不套用到標準ARAM或召喚峽谷。新增增幅／彩蛋公告與既有151張卡庫分開；效果不完整的項目不捏造。
4. Tier與配裝是依機制、模式、既有資料及官方異動的編輯判斷，並非即時勝率或保證最優解。本輪沒有逐英雄手機實測。
5. AdSense「缺乏價值」由Google重新審查決定。部署成功、索引成功或測試通過，都不是核准保證。本包不自行按「要求複查」。

## 後續維護（可選，不影響直接上傳）

現行閱讀頁產生器：

```text
python scripts/generate-rift-readable-v123.py
python scripts/generate-aram-readable-v123.py
python scripts/sync-sitemaps-v123.py
python scripts/audit-indexable-pages.py
python scripts/audit-builds-v123.py
```

`validate-release-v123.py`是額外完整檢查，需Python 3、beautifulsoup4與Node。不要執行舊v92／v120產生器覆蓋本輪閱讀頁；歷史腳本只留存追溯。內容再次變更時應更新content-revisions紀錄，Sitemap腳本不會自動把今天當成所有網址的lastmod。

## 核對來源

- [Riot 7.3官方公告](https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-3/)
- [Riot 7.3a官方公告](https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-3a/)
- [Riot 7.3b官方公告](https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-3b/)
- [Riot 7.3c官方公告](https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-3c/)
- [Google JavaScript SEO與canonical](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google AdSense內容與使用者體驗](https://support.google.com/adsense/answer/10015918)
- [Google發布商隱私揭露要求](https://support.google.com/publisherpolicies/answer/10437794)
