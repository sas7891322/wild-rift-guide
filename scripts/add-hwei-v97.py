from pathlib import Path
import shutil, re, hashlib, json

root = Path(__file__).resolve().parents[1]
uploads = root.parents[1] / 'upload'
dest = root / 'assets/images/heroes/hwei'
dest.mkdir(parents=True, exist_ok=True)
for n in range(8831, 8857):
    shutil.copy2(uploads / f'IMG_{n}.jpeg', dest / f'skill-{n}.jpeg')
for n, name in [(8859,'portrait'),(8858,'q'),(8860,'w'),(8861,'e'),(8862,'r')]:
    shutil.copy2(uploads / f'IMG_{n}.webp', dest / f'{name}.webp')

groups = [
 ('passive','被動・筆仙真跡',None,'對敵方英雄造成傷害時留下標記；再次命中完成落款，短暫延遲後爆炸，對範圍內敵人造成魔法傷害。',[(8831,8833,'被動展示')]),
 ('q','1 技・主題：厄禍筆法','q','切換到傷害主題，再選擇下列三種施法之一。',[(8835,8836,'1 → 1：飛行火球｜命中後爆炸，傷害附近敵人。'),(8837,8838,'1 → 2：遠距雷擊｜對落單或受控敵人有額外傷害效果。'),(8839,8840,'1 → 3：熔岩裂陣｜形成裂隙與岩漿區域，造成傷害並緩速。')]),
 ('w','2 技・主題：靜謐筆法','w','切換到增益主題，依移動、保護或回魔需求選擇。',[(8842,8843,'2 → 1：川流湍急｜創造溪流，提升站在上面的友軍跑速。'),(8844,8844,'2 → 2：明鏡止水｜創造水池，以護盾保護區域內友軍。'),(8845,8845,'2 → 3：迴旋光環｜後續攻擊回復魔力並造成額外傷害。')]),
 ('e','3 技・主題：苦惱筆法','e','切換到控制主題，可用來阻止突進、限制走位或集中敵人。',[(8847,8847,'3 → 1：死神面影｜傷害第一位命中的敵人，施加恐懼與緩速。'),(8848,8849,'3 → 2：深淵凝視｜發射凝視之眼，定身、傷害並取得真視視野。'),(8850,8850,'3 → 3：碎骨大顎｜集中敵人並造成傷害與緩速。')]),
 ('r','大絕・絕望螺旋','r','未啟用主題時，朝指定方向施放絕望幻象。命中後揭露附近視野，持續傷害並累加絕望與緩速，最後爆炸造成範圍魔法傷害。',[(8851,8855,'大絕施放與爆炸展示')]),
 ('cancel','主題切換・清洗毛筆',None,'啟用主題後，大絕按鈕會變成「清洗毛筆」。按下可退出目前主題，回到原本技能選單；不要把這個操作誤認為施放大絕。',[(8856,8856,'清洗毛筆操作')])
]
base='../assets/images/heroes/hwei/'
sections=[]
for key,title,icon,desc,examples in groups:
    heading=(f'<img src="{base}{icon}.webp" width="64" height="64" alt="">' if icon else '')
    cards=[]
    for first,last,caption in examples:
        pics=''.join(f'<a href="{base}skill-{n}.jpeg" target="_blank" rel="noopener"><img src="{base}skill-{n}.jpeg" width="1536" height="709" loading="lazy" alt="{caption}，展示圖 {i+1}"></a>' for i,n in enumerate(dict.fromkeys([first,last])))
        cards.append(f'<article class="hwei-example"><h3>{caption}</h3>{pics}</article>')
    sections.append(f'<section id="{key}" class="hwei-section"><div class="hwei-heading">{heading}<h2>{title}</h2></div><p>{desc}</p><div class="hwei-examples">{"".join(cards)}</div></section>')
page='''<!DOCTYPE html>
<html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>赫威｜技能與主題切換介紹｜Wild Rift Guide</title>
<meta name="description" content="赫威技能介紹：筆仙真跡、三種主題與九種子技能、絕望螺旋及清洗毛筆，搭配激鬥峽谷實機示範。">
<link rel="canonical" href="https://wild-rift-guide.vercel.app/pages/hwei.html">
<link rel="icon" href="../assets/images/brand/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../assets/css/style.css?v=95.1.0">
<link rel="stylesheet" href="../assets/css/hwei.css?v=97.0.0"></head><body>
<header class="mode-entry-topbar"><div class="shell mode-entry-topbar-inner"><a class="brand" href="../index.html"><span>Wild Rift</span> Guide</a><a href="../summoners-rift.html">返回召喚峽谷</a></div></header>
<main class="shell hwei-page"><section class="hwei-section hwei-intro"><img class="hwei-portrait" src="../assets/images/heroes/hwei/portrait.webp" width="162" height="162" alt="赫威"><div><p class="eyebrow">NEW CHAMPION · HWEI</p><h1>新英雄赫威登場</h1><p>三種主題、九種施法，用畫筆在傷害、保護與控制之間切換。</p><p class="hwei-note">技能介紹版｜Tier、出裝及符文待實戰校正。本頁不代表全站已完成 7.3 更新；既有攻略仍保留 7.2e 基準。</p></div></section>
<nav class="hwei-nav" aria-label="技能快速導覽"><a href="#passive">被動</a><a href="#q">傷害主題</a><a href="#w">增益主題</a><a href="#e">控制主題</a><a href="#r">大絕</a><a href="#cancel">清洗毛筆</a></nav>
<section class="hwei-section"><h2>先選主題，再選技能</h2><p>例如「1 → 2」代表先按一技進入厄禍筆法，再按二技施放該主題的第二種技能；不是連續施放兩個不同主題。下方截圖可點開放大。</p><p>練習時先熟悉每種主題的三個選項，再練習切換與取消。技能數值、冷卻與魔力消耗以目前遊戲內說明為準。</p></section>
'''+''.join(sections)+'''
<section class="hwei-section"><h2>資料說明</h2><p>依提供的繁體中文激鬥峽谷技能介紹截圖整理，更新日期：2026/09/22。未確認的數值不填入，未以電腦版數值替代。</p><p><a href="https://wildrift.leagueoflegends.com/zh-tw/news/" target="_blank" rel="noopener">Riot 官方最新消息</a> · <a href="heroes.html">原有英雄攻略</a> · <a href="players.html">找隊友</a></p></section></main>
<footer><div class="shell">Wild Rift Guide｜非官方玩家攻略｜<a href="disclaimer.html">非官方聲明</a></div></footer></body></html>
'''
(root/'pages/hwei.html').write_text(page)

for filename in ['index.html','summoners-rift.html']:
    p=root/filename
    html=p.read_text()
    start=html.index('<section class="site-announcement"')
    end=html.index('</section>',start)+len('</section>')
    html=html[:start]+'''<section class="site-announcement" aria-label="新英雄赫威登場">
  <a class="site-announcement-inner shell" href="pages/hwei.html">
    <span class="site-announcement-avatar" aria-hidden="true"><img src="assets/images/heroes/hwei/portrait.webp" alt=""></span>
    <span class="site-announcement-badge">新英雄</span>
    <span class="site-announcement-copy"><strong>新英雄赫威登場</strong><small>三種主題、九種施法，查看技能與操作介紹。</small></span>
    <span class="site-announcement-action">認識赫威 <b aria-hidden="true">→</b></span>
  </a>
</section>'''+html[end:]
    if filename=='summoners-rift.html':
        start=html.index('      <div class="home-update-heading">',html.index('id="homeUpdateChampions"'))
        end=html.index('    </section>',start)
        html=html[:start]+'''<div class="home-update-heading"><div><span class="kicker">NEW CHAMPION · HWEI</span><h3>新英雄赫威登場</h3></div><span class="home-update-badge ready">技能介紹</span></div>
<div class="new-champion-card"><div class="new-champion-portrait"><img src="assets/images/heroes/hwei/portrait.webp" alt="赫威" loading="lazy"></div><div class="new-champion-info"><div class="new-champion-title"><strong>赫威</strong><span>Hwei</span></div><p>從厄禍筆法的傷害、靜謐筆法的增益，到苦惱筆法的控制，依戰況選擇九種子技能。技能頁附有實機示範與清洗毛筆操作說明。</p><div class="new-champion-status"><span><b>資料狀態</b>技能介紹已整理</span><span><b>Tier／配裝</b>待實戰校正</span></div><a class="home-update-more" href="pages/hwei.html">查看赫威完整技能介紹 →</a><p><a href="pages/heroes.html?hero=chogath-baron">科加斯攻略 →</a> · <a href="pages/players.html">找隊友 →</a></p></div></div>
'''+html[end:]
    p.write_text(html)

p=root/'pages/heroes.html'
html=p.read_text().replace('<main class="shell hero-page">','<main class="shell hero-page">\n<aside class="home-update-list"><a href="hwei.html"><strong>新英雄赫威登場</strong>｜查看技能介紹（Tier 與配裝待校正） →</a></aside>',1)
p.write_text(html)
p=root/'sitemap.xml'
p.write_text(p.read_text().replace('</urlset>','<url><loc>https://wild-rift-guide.vercel.app/pages/hwei.html</loc><lastmod>2026-09-22</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n</urlset>'))
print('v97 Hwei page, 31 assets, two banners and new champion panel created.')
