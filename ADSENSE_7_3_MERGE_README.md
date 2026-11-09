# Wild Rift Guide 7.3 × AdSense 第三次送審合併修正

這是「增量覆蓋包」，請把內容覆蓋到目前最新的 7.3 專案後再部署；不要把這個 ZIP 單獨當成完整網站部署。

## 目的
後續 7.3 更新曾把 v93 的首頁內容強化、關於本站與聯絡頁覆蓋回舊版，且目前主 sitemap.xml 沒有列出 articles、editorial、changelog。這包把 AdSense 第三次送審需要的內容品質結構重新合併到 7.3。

## 會更新／補回
- index.html：保留 7.3、赫威、142 位英雄／203 份攻略，同時恢復原創專題與編輯內容區塊
- articles/*：10 篇原創觀念專題與專題首頁
- assets/css/editorial.css
- pages/about.html
- pages/contact.html（含公開 LINE 聯絡入口）
- pages/editorial.html
- pages/changelog.html
- sitemap-editorial.xml：獨立收錄原創專題與透明度頁面
- robots.txt：同時宣告主 sitemap.xml 與 sitemap-editorial.xml

## 不會覆蓋
- 7.3 英雄資料 JSON
- 裝備／符文／召喚師技能資料
- 赫威英雄資料與圖片
- 找隊友功能
- Supabase 設定
- 既有 sitemap.xml

## 部署後檢查
1. 首頁仍顯示 7.3 與赫威
2. 首頁可看到「專題攻略／編輯精選」
3. /articles/ 與 10 篇文章皆可開啟
4. /pages/about.html、contact.html、editorial.html、changelog.html 皆為新版
5. /sitemap-editorial.xml 回傳 200
6. /robots.txt 同時列出兩份 sitemap
7. /ads.txt 保持原本 publisher ID，不需修改

完成這些後，再到 Search Console 提交 sitemap-editorial.xml，確認 Google 能發現核心內容，再進 AdSense 重新提交。
