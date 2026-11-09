#!/usr/bin/env python3
from pathlib import Path
import subprocess,json,hashlib,zipfile,collections
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT.parent/'deliverables-v120';OUT.mkdir(exist_ok=True)
ZIP=OUT/'wild-rift-guide-v120-content-quality.zip'
report=json.loads((ROOT/'verification-quality-v120.json').read_text())
assert not report['failures']
changed=subprocess.check_output(['git','diff','--name-only'],cwd=ROOT,text=True).splitlines()
added=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines()
files=sorted(set(p for p in changed+added if p.endswith(('.html','.js','.json','.xml','.css')) and not p.startswith('scripts/') and not p.startswith('verification-')))
assert len([f for f in files if f.startswith('share/heroes/')])==203
assert len([f for f in files if f.startswith('share/aram/')])==141
assert not any(f in files for f in ['summoners-rift.html','pages/patch.html'])
groups=collections.defaultdict(list)
for p in files:groups[str(Path(p).parent)].append(p)
order=['.','assets/data','assets/js','pages','articles','share/heroes','share/aram']
batches=[]
for folder in order:
 for n in range(0,len(groups[folder]),100):
  batch=groups[folder][n:n+100];name=f'{len(batches)+1:02d}-'+('root' if folder=='.' else folder.replace('/','-'))+f'-{n//100+1}'
  batches.append((name,folder,batch))
manifest={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in files}
readme='''Wild Rift Guide v120｜網站內容與閱讀頁修正
基準：GitHub main 2f8a68868560fdf18cdbe24b0838019e0fc725c9（v119）
製作日期：2026/10/16（台灣時間）

這是網站內容與結構修正，不是新遊戲版本。
已完成更新包，尚未代你上傳 GitHub、部署或送出 AdSense 複審。
Google 的審查結果不能以程式檢查保證。

更新內容
1. 203 份召喚峽谷完整閱讀頁：現有 7.3b 配置、加點、連招、情境替換與來源可直接閱讀，不再只是自動跳轉。
2. 141 份 ARAM 完整閱讀頁與既有資料對齊，補上科加斯；清楚標示 7.2e 歷史資料，未宣稱完成 7.3b 校正。
3. 首頁、攻略導覽、關於本站與更新紀錄同步；保留既有外觀與統整後的 7.3b 公告。
4. 兩篇專題補入回城購物、三種射手配置與雙人線情境，未大量新增相似文章。
5. 支持、聯絡、隱私權、聲明、找隊友五個功能頁移除廣告載入；既有廣告帳號與 ads.txt 保留。
6. 修正「全部人工實測」說法；加里歐中路一段舊文案誤寫荊棘降價，改為官方 2700→2850 漲價，評級／出裝／符文均不變。
7. 更新 canonical 與 sitemap，完整閱讀版與互動版仍可互相使用。

手機上傳方式（Safari / GitHub）
1. 在 iPhone「檔案」點 ZIP 解壓縮。
2. 開啟 https://github.com/sas7891322/wild-rift-guide ，必要時在 Safari 選「要求電腦版網站」。
3. 依下表進入 GitHub 的目標資料夾，選 Add file → Upload files。
4. 只選 mobile-upload 對應批次資料夾內的檔案。每批最多 100 個，同名檔案覆蓋更新。
5. 每一批選 Commit changes。所有批次都傳完才算完成，請勿只傳第一批。
6. 等最後一次 Vercel 部署完成後，打開下方檢查網址。再傳訊息「都傳完了」讓我驗證。

批次 → GitHub 目標資料夾 → 檔案數
'''
for name,folder,batch in batches:readme+=f'{name} → '+('專案最外層' if folder=='.' else folder)+f' → {len(batch)} 個\n'
readme+='''
注意：不要把 ZIP 本身上傳，不要把 mobile-upload、website 或 rollback 當作新網站資料夾上傳。
website 是同一組更新檔的原始路徑版，供電腦操作；手機只用 mobile-upload 即可，不必重複上傳。
rollback 留有原本檔案備份，正常更新不需上傳。
maintenance 為日後維護腳本，不屬於此次必傳網站檔。

更新後檢查
https://wild-rift-guide.vercel.app/
首頁應顯示 7.3b，並提供完整攻略閱讀入口。
https://wild-rift-guide.vercel.app/share/heroes/galio-mid.html
應停留在完整攻略，可直接看到配置與先閃現再二技說明；不會自動跳走。
https://wild-rift-guide.vercel.app/share/heroes/hwei-mid.html
赫威技能與尚待確認欄位保留。
https://wild-rift-guide.vercel.app/share/aram/chogath.html
可開啟完整 ARAM 攻略，且清楚顯示 7.2e 資料界線。
https://wild-rift-guide.vercel.app/articles/itemization-by-enemy-comp.html#purchase-order
應看到首件成裝與鞋子的購物情境。

AdSense 下一步
先完成上傳並確認實際上線，再處理後台複審。
確認這輪修正已上線且沒有其他未處理政策事項後，回到 AdSense 網站頁，
勾選「我確定已修正問題」→「要求複查」。不要在更新還沒上線時勾選。
沒有保證通過的文章數、字數或固定等待天數；Google 仍會審查全站的實用性、原創性與體驗。
若仍遭拒，保留新的理由與畫面，再針對該理由改善；不要僅反覆按送審。

驗證範圍
已核對 344 份閱讀頁的資料一致性、配置順序、來源提示、內部連結、圖片路徑、canonical、sitemap 與 JavaScript 語法。
已確認原本官方公告與統整後的 7.3b 本站更新頁未修改。
尚未做實際 iPhone / 瀏覽器視覺與觸控測試，也尚未驗證你的新部署。
召喚峽谷既有 9 項來源／數值待確認提示保留；ARAM 舊版本內容不視為本次遊戲資料校正。

政策參考
https://support.google.com/adsense/answer/81904?hl=zh-Hant
https://support.google.com/adsense/answer/10015918?hl=zh-Hant
https://support.google.com/adsense/answer/10502938?hl=zh-Hant
'''
report.update({'runtimeFiles':len(files),'phoneBatches':len(batches),'riftDataChecks':11746,'aramDataChecks':14346,'manifestSHA256':manifest,'addedRuntimeFiles':[p for p in files if p in added]})
with zipfile.ZipFile(ZIP,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 z.writestr('手機更新說明.txt',readme)
 z.writestr('verification.json',json.dumps(report,ensure_ascii=False,indent=2))
 for p in files:
  z.write(ROOT/p,'website/'+p)
  if p in changed:z.writestr('rollback/'+p,subprocess.check_output(['git','show','HEAD:'+p],cwd=ROOT))
 for name,folder,batch in batches:
  for p in batch:z.write(ROOT/p,'mobile-upload/'+name+'/'+Path(p).name)
 for p in sorted((ROOT/'scripts').glob('*v120*')):
  if p.is_file():z.write(p,'maintenance/scripts/'+p.name)
 z.write(ROOT/'scripts/README-readable-guides.md','maintenance/scripts/README-readable-guides.md')
with zipfile.ZipFile(ZIP) as z:
 assert z.testzip() is None
 for p,digest in manifest.items():assert hashlib.sha256(z.read('website/'+p)).hexdigest()==digest
 phone=[p for p in z.namelist() if p.startswith('mobile-upload/')];assert len(phone)==len(files)
print(json.dumps({'zip':str(ZIP),'bytes':ZIP.stat().st_size,'runtimeFiles':len(files),'phoneBatches':[(n,f,len(b)) for n,f,b in batches],'sha256':hashlib.sha256(ZIP.read_bytes()).hexdigest()},ensure_ascii=False,indent=2))
