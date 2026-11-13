from pathlib import Path
from bs4 import BeautifulSoup
from collections import Counter
import json,re,html,copy,zipfile
R=Path(__file__).resolve().parents[1];D=R/'assets/data';DATE='2026-11-13';e=lambda x:html.escape(str(x),quote=True)
load=lambda f:json.loads((D/f).read_text())
def save(f,x):(D/f).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
report=load('logic-review-7.3f-v127.json');H=load('heroes.json');W=load('hwei-profile.json');A=load('aram/heroes.json');hs=H['heroes']+[W]
for role,meta in H['laneMeta'].items():
 count=sum(h['roleId']==role for h in hs);meta.update(verification=f'{count}份分路攻略完成7.3f本站獨立邏輯複核，逐份提供評級與配置理由。',detailVersion='v127-7.3f-logic',guideAuditVersion='v127',guideAuditStatus='logic-reviewed')
save('heroes.json',H)
for mode in ['rift','aram']:
 p=R/f'scripts/generate-{mode}-readable-v127.py';s=(R/f'scripts/generate-{mode}-readable-v126.py').read_text().replace('v126','v127').replace('126.0.0','127.0.0')
 s=s.replace('7.3f 初步校驗','7.3f 本站邏輯複核').replace('· 初檢','· 複核')
 if mode=='rift':
  s=s.replace('既有Tier保留，新英雄待評。完整成長數值與環境排名仍需後續核實。','本輪逐份獨立評估Tier與配置，不採外站排行；賽勒斯為保守暫定。未核實的完整成長數值保留註記。')
  s=s.replace(" · 本站評級{(\" · 評級依據待補\" if limited else \"\")}"," · {e(hero.get('tierLabel','本站評級'))}{(\" · 評級依據待補\" if limited else \"\")}")
  s=s.replace("'confirmed':'已核對','resolved':'已修正'","'confirmed':'已核對','resolved':'已修正','editorial':'本站判斷'")
 else:
  s=s.replace("body+='<ul class=\"sg-list\">'", "body+=p(hero.get('logicReview127',{}).get('method'))+''.join(p(t) for t in rev.get('logicNotes',[]))\n    body+='<ul class=\"sg-list\">'")
  s=s.replace("content=p(aaa['summary'])", "content=p(aaa.get('logicReview127',{}).get('scope'))+p(aaa['summary'])")
  s=s.replace("<strong>本站評級理由：</strong>","<strong>{e(hero.get('tierLabel','本站評級'))}：</strong>")
 p.write_text(s)
# Active interactive review, with uncertainty next to the actual judgement.
p=R/'assets/js/heroes.js';s=p.read_text();start=s.index('  function renderPatch73fReview(hero){');end=s.index('  function renderPatch73eReview(hero){',start)
s=s[:start]+'''  function renderPatch73fReview(hero){
    const r=hero.patch73fReview,l=hero.logicReview127;if(!r)return '';
    const groups=(hero.patch73fNumbers||[]).map(g=>`<h4>${safeText(g.title)}</h4>${g.rows.map(x=>`<p>${safeText(x.label)}：${safeText(x.before)} → <strong>${safeText(x.after)}</strong></p>`).join('')}`).join('');
    const fields=l?[['roleTask','位置任務'],['build','配裝取捨'],['runes','符文觸發'],['spells','召喚師技能'],['skills','技能加點'],['matchups','對局條件']].map(([k,label])=>`<h4>${label}</h4><p>${safeText(l[k])}</p>`).join(''):'';
    const pending=editorialChecks(hero).filter(c=>c.status==='pending').map(c=>`<aside class="editorial-pending" data-review-field="${safeText(c.field)}" data-review-status="pending"><strong>待確認｜${safeText(c.title)}</strong><p>${safeText(c.detail)}</p></aside>`).join('');
    return `<details class="hero-section" open><summary><strong>7.3f 本站邏輯複核${l?.confidence==='low'?' · 保守暫定':''}</strong></summary><p>${safeText(r.tierReason)}</p>${fields}${groups}${(r.itemNotes||[]).map(t=>`<p>${safeText(t)}</p>`).join('')}${pending}<p>${safeText(r.scope)}</p><a href="../pages/review-7-3f.html">全英雄複核紀錄</a></details>`;
  }
'''+s[end:]
s=s.replace("if(r?.version==='v126')return '';","if(['v126','v127'].includes(r?.version))return '';")
s=s.replace('7.3f 初步校驗 · 評級保留待觀察','7.3f 本站獨立邏輯評級').replace('7.3f 初步校驗','7.3f 邏輯複核').replace('PATCH 7.3f · 初步校驗','PATCH 7.3f · 邏輯複核')
s=s.replace("hero.tier==='待評'?'<p>新英雄資料仍在累積，綜合評分暫不評定。</p>'", "!Object.keys(hero.ratings||{}).length?'<p>目前提供保守暫定Tier與理由，細分星等尚未評定。</p>'")
s=s.replace('${hero.tier}</span>${tierEvidencePending(hero)?','${hero.tier}</span>${hero.logicReview127?.confidence===\'low\'?\'<span class="tier-evidence-note">保守暫定</span>\':\'\'}${tierEvidencePending(hero)?')
s=s.replace('126.0.0','127.0.0');p.write_text(s)
p=R/'assets/js/aram-hero.js';s=p.read_text().replace('126.0.0','127.0.0').replace('7.3f 初步校驗','7.3f 本站邏輯複核')
s=s.replace("${(r.buildNotes||[]).map(t=>", "${(r.logicNotes||[]).map(t=>`<p>${esc(t)}</p>`).join('')}${(r.buildNotes||[]).map(t=>")
s=s.replace('2026/11/11核對。分類、條件式出裝','2026/11/13複核英雄路線；單卡分級保留原版本。分類、條件式出裝')
s=s.replace("const badgeMain=isAaa?'正式':hero.tier;","const badgeMain=isAaa?(hero.id==='sylas'?'暫定':'條件式'):hero.tier;")
p.write_text(s)
p=R/'assets/js/aram.js';p.write_text(p.read_text().replace('126.0.0','127.0.0'))
# Build the new update section and a searchable per-record audit page.
summary=f'<section class="update-v115 patch126" id="site-73f"><div class="home-update-heading"><div><span class="kicker">SITE UPDATE · v127 · 2026/11/13</span><h3>7.3f 全英雄邏輯複核</h3></div><span class="home-update-badge">7.3f</span></div><p>143位英雄、204份峽谷分路與143份標準ARAM完成本輪策略複核；另檢查143位英雄的符文大亂鬥路線條件。</p><p>本輪不採外站評級與推薦配置，以技能、位置任務、裝備符文觸發、陣容與操作成本判斷。37筆評級調整，4組符文與5組加點修正。</p><p><strong>賽勒斯：中路 A／標準ARAM B，保守暫定。</strong>符文大亂鬥依實際增幅決定打法，不套用固定總Tier。</p><details class="official-history-item"><summary>本輪範圍與仍待確認的內容</summary><div class="patch126-content"><p>{e(report["scope"])}</p><p>保留官方7.3f英雄、裝備、重擊與增幅更新；標準ARAM倍率及單卡相容表維持各自來源版本。6項技能資料仍待遊戲內確認，另有符文資料本身的數值差異註記。</p></div></details><p><a href="pages/review-7-3f.html">逐英雄理由與變更清單 →</a> · <a href="share/heroes/sylas-mid.html">賽勒斯中路 →</a> · <a href="share/aram/sylas.html">賽勒斯ARAM →</a></p></section>'
p=R/'summoners-rift.html';s=p.read_text();so=BeautifulSoup(s,'html.parser');old=str(so.select_one('#site-73f'));s=s.replace(old,summary)
s=s.replace('7.3f官方差異與初步校驗：','7.3f全英雄邏輯複核：').replace('技能截圖整理、中路與ARAM初步攻略。','中路A／ARAM B保守暫定，完整技能與攻略。')
s=s.replace('<p class="sylas-release-type">英雄類型：近戰魔攻鬥士</p>','<p class="sylas-release-type">英雄類型：近戰魔攻鬥士</p><p class="sylas-release-tier">本站保守暫定：中路 A · ARAM B</p>')
s=re.sub(r'激鬥峽谷7\.3[de]：142位英雄、203份分路攻略提供本站評級與出裝、符文、技能建議。已知疑點在對應項目標示，來源版本如實列出；非官方或即時勝率排名。','激鬥峽谷7.3f：143位英雄、204份分路攻略完成本站獨立邏輯複核。提供評級、出裝、符文與技能建議，賽勒斯中路A、標準ARAM B保守暫定；非官方勝率排名。',s)
p.write_text(s)
# Full records grouped by role, each with its own reason and configuration decisions.
body='<h1>7.3f 全英雄邏輯複核</h1><p>2026/11/13 · v127｜143位英雄 · 204份峽谷分路 · 143份標準ARAM</p>'
body+='<div class="patch126-status"><strong>以本站邏輯評估，不採外站Tier、勝率或推薦配置。</strong><p>'+e(report['method'])+'</p><p>'+e(report['scope'])+'</p></div>'
body+='<h2>評級怎麼判斷</h2><p>以熟悉基本操作的一般玩家，在正常發育與常見陣容下完成位置任務的穩定性評估。評級不是勝率換算；操作上限、完整神裝或理想陣容不當作每場保證。峽谷與ARAM分開比較。</p><ul>'+''.join('<li><strong>'+e(k)+'</strong>：'+e(v)+'</li>' for k,v in report['criteria'].items())+'</ul>'
body+='<h2>賽勒斯保守暫定</h2><p>中路 A：換血、續戰與偷大絕有完整用途，但怕手長壓制、斷招與重創。標準ARAM B：近戰進場及回血條件較難，模式倍率尚未核實。符文大亂鬥只提供條件式路線；不把合適增幅的上限當固定Tier。</p>'
body+='<details class="official-history-item"><summary>37筆評級變更（含賽勒斯兩模式初評）</summary><div class="patch126-review-grid">'+''.join(f'<article><h3>{e(x["name"])} · {e(x["id"])} · {e(x["before"])} → {e(x["after"])}</h3><p>{e(x["reason"])}</p></article>' for x in report['tierChanges'])+'</div></details>'
body+='<details class="official-history-item"><summary>9組配置修正</summary><div class="patch126-review-grid">'+''.join(f'<article><h3>{e(x["id"])} · {e(x["mode"])}</h3><p>{e(x["before"])} → {e(x["after"])}</p><p>{e(x["reason"])}</p></article>' for x in report['configurationChanges'])+'</div></details>'
body+='<p><label for="review-search">搜尋英雄、位置或配置關鍵字</label><input id="review-search" type="search" placeholder="例如：賽勒斯、中路、彗星" style="display:block;width:100%;max-width:520px;margin:12px 0;padding:12px;border-radius:8px"></p><p id="review-count" aria-live="polite">347份紀錄</p>'
for role in ['巴龍路','打野','中路','飛龍路','輔助','標準ARAM']:
 rows=[x for x in report['records'] if x['role']==role]
 body+=f'<details class="official-history-item review127-group"><summary>{role} · {len(rows)}份</summary><div class="patch126-review-grid">'
 for x in rows:
  mode='heroes' if x['mode']=='rift' else 'aram';body+=f'<article class="review127-record"><h3><a href="../share/{mode}/{e(x["id"])}.html">{e(x["name"])} · {role} · {e(x["tierAfter"])}</a></h3>'
  body+=''.join(f'<p><strong>{label}：</strong>{e(x[k])}</p>' for k,label in [('tierReason','評級'),('roleTask','任務'),('build','配裝'),('runes','符文'),('spells','召喚師技能'),('skills','加點')])+'</article>'
 body+='</div></details>'
body+='<h2>已知資料界線</h2><ul>'+''.join(f'<li>{e(x["id"])}：{e(x["detail"])}</li>' for x in report['pendingMechanics'])+'</ul><p>一般符文仍保留遊戲截圖與官方公告的數值差異註記；此輪判斷觸發方式與打法，不自行補未核實的精確數字。標準ARAM既有倍率與符文大亂鬥逐卡表維持各自來源版本，143位英雄路線複核不等於全部卡片交叉組合重評。</p><p>歷史版本的來源紀錄保留作追溯；本輪獨立評級與配置判斷不取用外站排行。<a href="../summoners-rift.html#updates">官方公告與本站更新</a> · <a href="../assets/data/logic-review-7.3f-v127.json">完整JSON紀錄</a></p>'
p=R/'pages/review-7-3f.html';so=BeautifulSoup(p.read_text(),'html.parser');so.main.clear();so.main.append(BeautifulSoup(body,'html.parser'));so.title.string='7.3f 全英雄邏輯複核｜Wild Rift Guide'
for m in so.select('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]'):m['content']='143位英雄的7.3f本站獨立邏輯評級與配置複核；逐份理由、37筆評級變更、9組配置修正。賽勒斯中路A、標準ARAM B保守暫定。'
t=so.new_tag('script',src='../assets/js/review127.js?v=127.0.0');so.body.append(t);p.write_text(str(so))
(R/'assets/js/review127.js').write_text('''(()=>{const input=document.getElementById('review-search'),groups=[...document.querySelectorAll('.review127-group')],count=document.getElementById('review-count');if(!input)return;input.addEventListener('input',()=>{const q=input.value.trim().toLocaleLowerCase();let total=0;for(const group of groups){let visible=0;for(const row of group.querySelectorAll('.review127-record')){const match=!q||row.textContent.toLocaleLowerCase().includes(q);row.hidden=!match;if(match)visible++;}group.hidden=visible===0;if(q)group.open=visible>0;total+=visible;}count.textContent=total+'份紀錄';});})();\n''')
# Cache-bust only active entry points and loaders; preserve legal/ad configuration files.
for rel in ['index.html','summoners-rift.html','aram.html','aram-hero.html','pages/heroes.html','pages/review-7-3f.html']:
 p=R/rel;s=p.read_text().replace('126.0.0','127.0.0');s=s.replace('7.3f 初步校驗','7.3f 邏輯複核').replace('7.3f官方差異與初步校驗','7.3f全英雄邏輯複核');p.write_text(s)
# Preserve the tiny upload note present in the remote v126.1 tree.
z=R.parent/'wild-rift-guide-v126.1-sylas-panel.zip'
if z.exists():
 with zipfile.ZipFile(z) as f:
  for name in f.namelist():
   if name.endswith('UPLOAD-v126.1.txt'):(R/'UPLOAD-v126.1.txt').write_bytes(f.read(name))
print('Published interactive renderers, update panel and 347 searchable audit records.')
