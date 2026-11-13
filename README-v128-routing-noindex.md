# Wild Rift Guide v128：Vercel 路由與攻略索引控制

適用專案：sas7891322/wild-rift-guide。以本次讀取的 GitHub HEAD `34a1f5df584f6d0c8c6a7f5091d89556d141f39b` 為基底。
這是「更新包」：解壓後把檔案依相同路徑覆蓋到現有專案，不是可獨立部署的完整網站。每個收錄的檔案都是完整檔案，沒有省略內容。這次未推送 GitHub，也未部署 Vercel。

## 先釐清兩件事

1. 目前儲存庫是靜態 HTML＋原生 JavaScript，沒有 React/Vue 專案或前端路由器。英雄互動頁使用 History API，不代表首頁可以渲染 `/privacy`。正確做法是把 `/privacy` 永久轉址到現有 `/pages/privacy.html`，該頁在不執行 JavaScript 時也有完整內容。將所有未知路徑導向首頁，無法讓首頁變成隱私權政策，且會掩蓋真正的 404。
2. `robots.txt` 的 Disallow 控制「抓取」；`noindex` 控制「索引」。Google 必須能抓取頁面，才能讀到 meta 或 HTTP 的 noindex。如果同時封鎖抓取，已收錄頁面可能留在搜尋中，未抓取的網址也可能因外部連結而被索引。本包預設採用可抓取＋noindex，另附你要求的禁止抓取版本。

AdSense 與 Google 搜尋索引不是同一套判定。AdSense 可能檢查整個網站；這份更新不會讓攻略免於 AdSense 審查，也不保證通過。相同版型本身不足以確認退件原因，內容價值仍需改善。啟用 noindex 後，這些攻略將不再具備 Google 搜尋曝光資格；移除不是即時完成。

## 檔案位置

| 檔案 | 放置位置／用途 |
| --- | --- |
| `vercel.json` | 專案根目錄，與 `index.html` 同層。修正短網址、設定攻略 HTTP noindex。 |
| `robots.txt` | 專案根目錄。預設允許抓取，讓 noindex 能被讀到。 |
| `assets/js/heroes.js` | 完整替換原檔：英雄詳細頁 noindex；回列表時依原有篩選規則恢復。 |
| `assets/js/aram-hero.js` | 完整替換原檔：標準 ARAM 與符文大亂鬥都 noindex。 |
| `pages/heroes.html` | 完整替換原檔：更新上述 JS 的快取版本；列表本身不全面 noindex。 |
| `aram-hero.html` | 完整替換原檔：原始 HTML 先帶 noindex，並更新 JS 快取版本。 |
| `share/heroes/*.html` | 204 份完整檔案：原始 HTML 加入 noindex。 |
| `share/aram/*.html` | 143 份完整檔案：原始 HTML 加入 noindex。 |
| `pages/hwei.html`、`pages/hwei-demonstrations.html` | 舊英雄入口與獨立英雄示範也納入 noindex。 |
| `sitemap.xml` | 完整替換原檔：移除個別攻略，保留 35 個既有可索引內容網址。 |
| `scripts/generate-rift-readable-v127.py` | 完整替換原檔：兩個現行攻略產生器共用此檔，防止重建攻略時還原為 index。 |
| `scripts/verify-indexing-v128.py`、`scripts/verify-seo-v128.cjs` | 可選的本機檢查腳本；不需要第三方套件。 |
| `examples/adsense-routing/robots.block-guides.txt` | 可選的禁止抓取版本；不會自動生效，詳見下方。 |
| `examples/adsense-routing/vercel.spa-only.json` | 只有未來真的改成 SPA 才使用的 fallback 範例；目前不要覆蓋主設定。 |

目前不是 Vite／React／Vue 專案，因此這些設定不要放進 `src/` 或 `public/`。Vercel 的 Root Directory 要指向包含 `index.html` 與 `vercel.json` 的資料夾。此純靜態專案可使用 Other 預設、空白 Build Command、Output Directory `.`；既有靜態部署正常時不必額外更動其他設定。

更新包保留英雄資料、Tier、圖示、版面、會員功能及廣告帳號設定；只修改索引、路由與相關快取版本。`sitemap-editorial.xml` 經重新檢查，內容沒有變動，因此不重複收錄。

## 目前專案使用的完整 vercel.json

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": false,
  "redirects": [
    {
      "source": "/privacy",
      "destination": "/pages/privacy.html",
      "permanent": true
    },
    {
      "source": "/terms",
      "destination": "/pages/terms.html",
      "permanent": true
    },
    {
      "source": "/about",
      "destination": "/pages/about.html",
      "permanent": true
    },
    {
      "source": "/contact",
      "destination": "/pages/contact.html",
      "permanent": true
    },
    {
      "source": "/disclaimer",
      "destination": "/pages/disclaimer.html",
      "permanent": true
    },
    {
      "source": "/editorial",
      "destination": "/pages/editorial.html",
      "permanent": true
    },
    {
      "source": "/privacy.html",
      "destination": "/pages/privacy.html",
      "permanent": true
    },
    {
      "source": "/terms.html",
      "destination": "/pages/terms.html",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/share/heroes/:path*",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, follow"
        }
      ]
    },
    {
      "source": "/share/aram/:path*",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, follow"
        }
      ]
    },
    {
      "source": "/aram-hero.html",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, follow"
        }
      ]
    },
    {
      "source": "/pages/hwei.html",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, follow"
        }
      ]
    },
    {
      "source": "/pages/hwei-demonstrations.html",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, follow"
        }
      ]
    },
    {
      "source": "/pages/heroes.html",
      "has": [
        {
          "type": "query",
          "key": "hero"
        }
      ],
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, follow"
        }
      ]
    }
  ]
}
```

`permanent: true` 在 Vercel 會產生永久轉址。轉到真實的 `/pages/privacy.html` 也能維持頁面內相對連結正確。未定義且不存在的網址仍應回傳 404。

`has` 的 query 條件只在有 `hero` 參數時送出 HTTP noindex；`/pages/heroes.html` 或單純 `?role=mid` 不受影響。HTTP `X-Robots-Tag` 在 JavaScript 執行前即可讀取，補足動態 meta 的限制。

## 建議使用的完整 robots.txt（本包已啟用）

```text
# Keep guides crawlable so Google can read their noindex directives.
User-agent: *
Allow: /

# Preserve access for the AdSense crawler.
User-agent: Mediapartners-Google
Allow: /

Sitemap: https://wild-rift-guide.vercel.app/sitemap.xml
Sitemap: https://wild-rift-guide.vercel.app/sitemap-editorial.xml
```

首頁、專題、privacy 與靜態資源都可抓取。攻略頁也可抓取，但透過回應標頭和 meta 要求不建立索引。

以上 Sitemap 沿用現有專案的正式網址。如果你已正式改用自訂網域，應一併統一 sitemap 裡的網址、HTML canonical 與 `assets/js/seo.js` 的 SITE_ORIGIN；不要只替換這兩行導致來源網域不一致。本包沒有猜測你的新網域。

## 你要求的「禁止抓取攻略」版本（可選）

只有確定目的是限制一般爬蟲抓取、並接受 Google 讀不到 noindex 時，才把下列檔案內容取代根目錄 `robots.txt`。它不是可靠的移除索引流程，即使先移除再封鎖，也不能保證網址永遠不被再次索引。

```text
# Optional crawl restriction. This is NOT a reliable de-indexing method.
# Do not use this to hide pages from AdSense review.
# If used, copy this file to /robots.txt (replace the recommended version).
User-agent: *
Allow: /
Disallow: /share/heroes/
Disallow: /share/aram/
Disallow: /aram-hero.html
Disallow: /pages/heroes.html?hero=
Disallow: /pages/heroes.html?*&hero=
Disallow: /pages/hwei.html
Disallow: /pages/hwei-demonstrations.html

# AdSense still needs to be able to review all content.
User-agent: Mediapartners-Google
Allow: /

Sitemap: https://wild-rift-guide.vercel.app/sitemap.xml
Sitemap: https://wild-rift-guide.vercel.app/sitemap-editorial.xml
```

兩條 `heroes.html` 規則涵蓋 hero 位於第一個參數及後續參數的情形。`/pages/heroes.html` 列表、各分路列表、`/aram.html` 專區、`/pages/aram-guides.html` 索引、`/articles/`、`/pages/privacy.html` 和資源檔仍允許抓取。`Mediapartners-Google` 使用其專屬 Allow 規則，因此這個版本也不會阻擋 AdSense 爬蟲。

## 動態 meta：依現有框架修改的位置

本網站已有 `assets/js/seo.js` 的 `WRGSeo.set()`。它會尋找 `<meta name="robots">`，存在時更新，不存在時建立，因此不需要再加入 React Helmet、Vue 套件或另一個重複的 meta。

`assets/js/heroes.js` 的 `setHeroDetailSeo(hero)` 現在傳入：

```javascript
robots: 'noindex,follow'
```

`setHeroListSeo()` 保留原有規則，返回列表時還原：

```javascript
robots: limited ? 'noindex,follow' : 'index,follow,max-image-preview:large'
```

`assets/js/aram-hero.js` 的 `syncModeUi()` 也傳入：

```javascript
robots: 'noindex,follow'
```

上面是欄位說明，不是要單獨貼入檔案的程式。ZIP 中這兩支 JS 已是可直接覆蓋的完整修改檔。

靜態攻略與 ARAM 初始 HTML 使用：

```html
<meta name="robots" content="noindex,follow">
```

不要把這行放進全站共用首頁，也不要在 `pages/heroes.html` 的靜態 head 全面加上 noindex；該檔同時負責可索引的英雄列表。Google 看到初始 noindex 可能不再執行 JavaScript，因此不能依賴後續 JavaScript 把它改回 index。本包透過 query 條件的 HTTP 標頭區分兩種情況。

## 只有真正 SPA 才用的完整 fallback 設定

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

這是 Vercel 官方支援的 SPA fallback 寫法，檔案同樣放在專案根目錄。只有當 React Router／Vue Router 等真的能處理 `/privacy` 及其他子路由時才適用。HTTP 回傳 200 並不代表爬蟲取得了該路由的內容；重要頁面仍應具備可渲染內容，視需要預先渲染或伺服器渲染。這個範例不是現有靜態站的替代設定，也沒有包含目前站台的 noindex 規則。

## 部署與驗證

1. 將 ZIP 中的檔案照相同路徑覆蓋現有專案。不要把整個 ZIP 或外層解壓資料夾直接當成網站。
2. 提交到連接 Vercel 的部署分支，等待正式部署完成。
3. 在瀏覽器直接輸入 `/privacy`，確認轉到隱私權政策，而且重新整理正常。
4. 用以下指令確認實際回應。請把 `YOUR-DOMAIN` 改為你的部署網域：

```bash
curl -I https://YOUR-DOMAIN/privacy
curl -I https://YOUR-DOMAIN/pages/privacy.html
curl -I https://YOUR-DOMAIN/share/heroes/sylas-mid.html
curl -I 'https://YOUR-DOMAIN/pages/heroes.html?hero=sylas-mid'
curl -I 'https://YOUR-DOMAIN/pages/heroes.html?role=mid&hero=sylas-mid'
curl -I https://YOUR-DOMAIN/pages/heroes.html
curl -I 'https://YOUR-DOMAIN/aram-hero.html?id=sylas&mode=aaa'
curl -I https://YOUR-DOMAIN/this-page-does-not-exist-v128
```

預期：privacy 短網址永久轉址；正式政策頁回 200；攻略回 200 並有 `X-Robots-Tag: noindex, follow`；英雄列表不含該 noindex 標頭；不存在的頁面回 404。若 Vercel Dashboard 另有 Redirects、Rewrites、Deployment Protection 或不同的 Output Directory，也要確認沒有覆蓋這份設定或阻擋公眾訪問。

再於 Search Console 重新提交 `sitemap.xml`，以網址檢查／即時測試抽查一篇攻略與 privacy。這是協助核對 Google 是否能讀到設定，不表示會立即移除索引，也不保證 AdSense 通過。不要把 noindex 當作規避內容審查的方法。

本機已執行：

```bash
python3 -B scripts/verify-indexing-v128.py
node scripts/verify-seo-v128.cjs
node --check assets/js/heroes.js
node --check assets/js/aram-hero.js
```

結果：350 個靜態 HTML 的 noindex 檢查通過；204 份英雄攻略與 143 份 ARAM 攻略正文逐位元比對不變；英雄列表→詳細頁→列表的 meta 切換通過；ARAM→符文大亂鬥→ARAM 通過；query 參數順序、robots 兩種策略、產生器與 sitemap 檢查通過。這些是本機檢查，不是已部署的 HTTP 實測。

往後更新資料後，可沿用目前版本的兩個攻略產生器，再執行 `python3 scripts/sync-sitemaps-v127.py` 與上方檢查腳本；不要使用舊版產生器覆蓋現行檔案。

## 官方說明

- Vercel 設定與 SPA rewrites：https://vercel.com/docs/project-configuration/vercel-json
- Google noindex 與 robots.txt 衝突：https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Google JavaScript SEO：https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- AdSense 爬蟲存取：https://support.google.com/adsense/answer/10532?hl=en
- AdSense 可能檢查所有頁面：https://support.google.com/adsense/answer/81904?hl=en
