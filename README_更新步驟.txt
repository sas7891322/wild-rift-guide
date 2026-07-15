Wild Rift Guide｜目前完成資料更新包

【本次完成內容】
物理中階裝備：18 件
魔法中階裝備：18 件
防禦中階裝備：15 件
輔助中階裝備：13 件
分類顯示總數：64 件

【分類規則】
1. 完全依照激鬥峽谷遊戲內分類。
2. 同一件裝備若同時存在於不同分類，就在各分類中都顯示。
3. 不另外建立「共用素材」分類。
4. 輔助分類的 13 件全部是物理、魔法或防禦分類已存在的裝備。

【更新方式｜GitHub Desktop】
1. 先備份你電腦目前的 wild-rift-guide 資料夾。
2. 解壓縮本檔案。
3. 打開「UPDATE_FILES」資料夾。
4. 將 UPDATE_FILES 裡面的 assets、pages 資料夾複製到你的 wild-rift-guide 專案根目錄。
5. Windows 詢問是否合併資料夾時，選擇合併；只有同名的 items.json、items-page.css、items-page.js、items.html 需要取代。
6. 開啟 GitHub Desktop。
7. 左下 Summary 輸入：
   Update current equipment database
8. 按 Commit to main。
9. 按 Push origin。
10. 等 Vercel 自動重新部署。

【裝備頁網址】
部署完成後，裝備頁通常是：
/pages/items.html

【這個更新包不會覆蓋】
- 原本首頁
- 符文頁
- 召喚師技能頁
- 鞋子頁
- 其他既有資料

【注意】
此包依照目前對話中已完成並確認的資料製作。
若你目前網站的資料夾名稱不是 assets / pages，請先不要直接覆蓋，需依現有結構調整路徑。
