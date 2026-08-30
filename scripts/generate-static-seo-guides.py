#!/usr/bin/env python3
from pathlib import Path
import json, html, re
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://wild-rift-guide.vercel.app'
ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3703014721072968" crossorigin="anonymous"></script>'

def e(v):
    return html.escape(str(v or ''), quote=True)

def clean(v):
    return re.sub(r'\s+', ' ', str(v or '')).strip()

def asset(src, prefix='../../'):
    s = str(src or '').strip()
    s = re.sub(r'^(?:\.\./)+', '', s)
    s = s.lstrip('/')
    if not s.startswith('assets/'):
        return e(s)
    return e(prefix + s)

def abs_asset(src):
    s = str(src or '').strip()
    s = re.sub(r'^(?:\.\./)+', '', s).lstrip('/')
    return f'{ORIGIN}/{s}' if s else f'{ORIGIN}/assets/images/brand/wild-rift-guide-og.png'

def flatten_runes(data):
    out = {}
    for vals in data.values():
        if isinstance(vals, list):
            for x in vals:
                if isinstance(x, dict) and x.get('id'): out[x['id']] = x
    return out

def mini_card(obj, note=''):
    if not obj:
        return '<li><span class="sg-missing">資料待補</span></li>'
    icon = asset(obj.get('icon'))
    sub = note or obj.get('tag') or obj.get('category') or ''
    return f'''<li class="sg-mini-card">{f'<img src="{icon}" alt="{e(obj.get("name"))}" loading="lazy">' if icon else ''}<div><strong>{e(obj.get('name'))}</strong>{f'<small>{e(sub)}</small>' if sub else ''}</div></li>'''

def page_head(title, desc, canonical, image, structured, extra_css=''):
    return f'''<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#06101c">
<link rel="canonical" href="{e(canonical)}">
<link rel="icon" href="../../assets/images/brand/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../../assets/images/brand/apple-touch-icon.png">
<link rel="stylesheet" href="../../assets/css/style.css?v=92.0.0">
<link rel="stylesheet" href="../../assets/css/static-guide.css?v=92.0.0">{extra_css}
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="{e(canonical)}">
<meta property="og:image" content="{e(image)}">
<meta property="og:site_name" content="激鬥峽谷攻略網">
<meta property="og:locale" content="zh_TW">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(title)}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{e(image)}">
<script type="application/ld+json">{json.dumps(structured,ensure_ascii=False,separators=(',',':'))}</script>
{ADSENSE}
</head>'''

def header(back_href, back_label):
    return f'''<body class="static-guide-page"><header class="topbar"><div class="shell topbar-inner"><a class="brand" href="../../index.html"><span>Wild Rift</span> Guide</a><nav class="sg-topnav" aria-label="攻略導覽"><a href="{e(back_href)}">{e(back_label)}</a><a href="../../pages/patch.html">版本狀態</a><a href="../../pages/about.html">關於本站</a></nav></div></header>'''

def footer():
    return '''<footer><div class="shell">© 2026 Wild Rift Guide｜<a href="../../pages/about.html">關於本站</a>｜<a href="../../pages/privacy.html">隱私權政策</a>｜<a href="../../pages/contact.html">聯絡我們</a>｜<a href="../../pages/disclaimer.html">非官方聲明</a>｜<a href="../../pages/support.html">支持網站</a></div></footer></body></html>'''

def render_summoner(hero, items_map, runes_map, spells_map, site_version):
    role = hero.get('role') or '英雄'
    title = f"{hero.get('name')} {role}攻略｜出裝、符文、技能加點｜Wild Rift Guide"
    desc = clean(f"{hero.get('name')}（{hero.get('enName','')}）激鬥峽谷 {site_version} {role}攻略：{hero.get('summary','')} 推薦出裝、符文、召喚師技能、技能加點、對局與實戰節奏。")[:180]
    canonical = f"{ORIGIN}/share/heroes/{quote(hero['id'])}.html"
    image = abs_asset(hero.get('avatar'))
    modified = hero.get('reviewedAt') or '2026-08-27'
    structured = {'@context':'https://schema.org','@graph':[
        {'@type':'Article','@id':canonical+'#article','headline':f"{hero.get('name')}{role}攻略",'name':title,'description':desc,'url':canonical,'mainEntityOfPage':canonical,'image':image,'inLanguage':'zh-Hant-TW','dateModified':modified,'isAccessibleForFree':True,'author':{'@type':'Organization','name':'Wild Rift Guide'},'publisher':{'@type':'Organization','name':'Wild Rift Guide'},'about':{'@type':'VideoGame','name':'英雄聯盟：激鬥峽谷','alternateName':'League of Legends: Wild Rift'}},
        {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'首頁','item':ORIGIN+'/'},{'@type':'ListItem','position':2,'name':'英雄攻略','item':ORIGIN+'/pages/heroes.html'},{'@type':'ListItem','position':3,'name':f"{hero.get('name')}{role}攻略",'item':canonical}]}
    ]}
    tags = ''.join(f'<span>{e(x)}</span>' for x in hero.get('tags',[]))
    spells = [spells_map.get(x) for x in hero.get('spells',[])]
    runes = [runes_map.get(x) for x in hero.get('runes',[])]
    build_items = [items_map.get(x) for x in hero.get('items',[])]
    boots = [items_map.get(x) for x in hero.get('boots',[])]
    items_html = ''.join(mini_card(x) for x in build_items)
    boots_html = ''.join(mini_card(x, '鞋子') for x in boots)
    runes_html = ''.join(mini_card(x, '關鍵符文' if i==0 else '副符文') for i,x in enumerate(runes))
    spells_html = ''.join(mini_card(x, f"冷卻 {x.get('cooldown')} 秒" if x and x.get('cooldown') else '') for x in spells)

    abilities = hero.get('abilities') or []
    ab_html=''.join(f'''<article class="sg-ability">{f'<img src="{asset(a.get("icon"))}" alt="{e(a.get("title"))}" loading="lazy">' if a.get('icon') else ''}<div><small>{e(a.get('label'))}</small><h3>{e(a.get('title'))}</h3><p>{e(a.get('summary'))}</p></div></article>''' for a in abilities)
    combos = hero.get('combos') or []
    
    def combo_step_label(step):
        if isinstance(step, dict): return step.get('label') or step.get('key') or ''
        return str(step or '')
    combo_html=''.join(f'''<article><h3>{e(c.get('name'))}</h3><p class="sg-combo-steps">{' → '.join(e(combo_step_label(step)) for step in c.get('steps',[]))}</p><p>{e(c.get('note'))}</p></article>''' for c in combos)
    play = hero.get('playstyle') or {}
    play_html=''.join(f'<article><strong>{e(k)}</strong><p>{e(v)}</p></article>' for k,v in play.items())
    match = hero.get('matchups') or {}
    good = ''.join(f'<span>{e(x)}</span>' for x in (match.get('good') or []))
    bad = ''.join(f'<span>{e(x)}</span>' for x in (match.get('bad') or []))
    ban = match.get('ban')
    ban_list = ban if isinstance(ban,list) else ([ban] if ban else [])
    ban_html = ''.join(f'<span>{e(x)}</span>' for x in ban_list)

    adjustments=[]
    adj=(hero.get('matchupAdjustments') or {}).get('situations') or []
    for s in adj:
        changes=s.get('changes') or []
        change_html=''.join(f'''<li><strong>{e(c.get('title') or '調整')}</strong><span>{e(c.get('condition'))}</span><p>{e(c.get('reason'))}</p></li>''' for c in changes)
        if not change_html and (s.get('keepText') or s.get('keepTitle')):
            change_html=f'''<li><strong>{e(s.get('keepTitle') or '維持標準配置')}</strong><p>{e(s.get('keepText'))}</p></li>'''
        adjustments.append(f'''<article><div class="sg-adjust-head"><strong>{e(s.get('label'))}</strong><small>{e(s.get('priority'))}優先</small></div><p><b>觸發：</b>{e(s.get('trigger'))}</p><ul>{change_html}</ul>{f'<p class="sg-warning">提醒：{e(s.get("warning"))}</p>' if s.get('warning') else ''}</article>''')
    adjustments_html=''.join(adjustments)

    rating_html=''.join(f'<div><span>{e(k)}</span><strong>{e(v)}/5</strong></div>' for k,v in (hero.get('ratings') or {}).items())
    source=clean(hero.get('sourceNote'))
    patch_note=(hero.get('patchCalibration') or {})
    calibration=f"本站於 {e(modified)} 依 Patch {e(patch_note.get('patch') or site_version)} 重新檢查此配置。" if modified else ''
    interactive=f"../../pages/heroes.html?hero={quote(hero['id'])}"

    body=f'''{header(interactive,'互動版攻略')}
<main class="shell sg-main">
<nav class="sg-breadcrumb" aria-label="麵包屑"><a href="../../index.html">首頁</a><span>›</span><a href="../../pages/heroes.html">英雄攻略</a><span>›</span><strong>{e(hero.get('name'))} {e(role)}</strong></nav>
<section class="sg-hero"><div class="sg-portrait"><img src="{asset(hero.get('avatar'))}" alt="{e(hero.get('name'))}" loading="eager"></div><div><div class="sg-kicker">PATCH {e(site_version)} · {e(role)} · 最後校正 {e(modified)}</div><div class="sg-title-row"><h1>{e(hero.get('name'))} {e(role)}攻略</h1><span class="sg-tier">{e(hero.get('tier'))}</span></div><p class="sg-en">{e(hero.get('enName'))} · {e(hero.get('position'))}</p><div class="sg-tags">{tags}</div><p class="sg-lead">{e(hero.get('summary'))}</p><div class="sg-actions"><a class="sg-primary" href="{e(interactive)}">開啟互動版完整攻略</a><a href="../../pages/hero-guides.html">查看全部英雄攻略</a></div></div></section>
<section class="sg-section"><div class="sg-section-head"><div><span>BUILD & RUNES</span><h2>推薦配置</h2></div><p>以下為本站 {e(site_version)} 校正後的標準配置；實戰仍需依敵方陣容調整。</p></div><div class="sg-config-grid"><article><h3>核心裝備</h3><ol class="sg-card-list">{items_html}</ol></article><article><h3>鞋子</h3><ol class="sg-card-list">{boots_html}</ol></article><article><h3>符文</h3><ol class="sg-card-list">{runes_html}</ol></article><article><h3>召喚師技能</h3><ol class="sg-card-list">{spells_html}</ol></article></div></section>
<section class="sg-section"><div class="sg-section-head"><div><span>SKILLS</span><h2>技能加點與技能說明</h2></div><p><strong>技能優先：</strong>{e(hero.get('skillOrder'))}</p></div><div class="sg-ability-grid">{ab_html}</div></section>
{f'<section class="sg-section"><div class="sg-section-head"><div><span>COMBOS</span><h2>常用連招</h2></div></div><div class="sg-combo-grid">{combo_html}</div></section>' if combo_html else ''}
<section class="sg-section"><div class="sg-section-head"><div><span>GAME PLAN</span><h2>實戰節奏</h2></div></div><div class="sg-timeline">{play_html}</div></section>
<section class="sg-section"><div class="sg-section-head"><div><span>MATCHUPS</span><h2>對局重點</h2></div><p>對局名單是本站依英雄機制與目前配置整理的參考，不等同固定勝率。</p></div><div class="sg-match-grid"><article class="good"><h3>較好處理</h3><div>{good or '<span>依陣容判斷</span>'}</div></article><article class="bad"><h3>較難處理</h3><div>{bad or '<span>依陣容判斷</span>'}</div></article>{f'<article class="ban"><h3>優先 Ban</h3><div>{ban_html}</div></article>' if ban_html else ''}</div></section>
{f'<section class="sg-section"><div class="sg-section-head"><div><span>ADAPTIVE BUILD</span><h2>依對局調整</h2></div><p>{e((hero.get("matchupAdjustments") or {}).get("intro"))}</p></div><div class="sg-adjust-grid">{adjustments_html}</div></section>' if adjustments_html else ''}
<section class="sg-section sg-method"><div class="sg-section-head"><div><span>EDITORIAL NOTE</span><h2>資料來源與本站判斷</h2></div></div><p>{e(source)}</p><p>{calibration} Tier、出裝、符文與對局屬於 Wild Rift Guide 的整理與分析，不是 Riot Games 官方推薦；版本改動後會再依官方公告與實戰資料校正。</p><div class="sg-rating-grid">{rating_html}</div><p class="sg-more"><a href="../../pages/about.html">閱讀本站內容原則與校正方式 →</a></p></section>
</main>{footer()}'''
    return page_head(title,desc,canonical,image,structured)+body

def render_aram(hero, data_version):
    title=f"{hero.get('name')} ARAM 攻略｜出裝、符文與模式平衡｜Wild Rift Guide"
    desc=clean(f"{hero.get('name')}（{hero.get('enName','')}）Wild Rift {data_version} ARAM 攻略：{hero.get('summary','')} Tier {hero.get('tier')}、出裝、符文、技能與模式平衡修正。")[:180]
    canonical=f"{ORIGIN}/share/aram/{quote(hero['id'])}.html"
    image=abs_asset(hero.get('avatar'))
    structured={'@context':'https://schema.org','@graph':[
        {'@type':'Article','headline':f"{hero.get('name')} ARAM 攻略",'name':title,'description':desc,'url':canonical,'mainEntityOfPage':canonical,'image':image,'inLanguage':'zh-Hant-TW','dateModified':'2026-08-04','isAccessibleForFree':True,'author':{'@type':'Organization','name':'Wild Rift Guide'},'about':{'@type':'VideoGame','name':'英雄聯盟：激鬥峽谷'}},
        {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'首頁','item':ORIGIN+'/'},{'@type':'ListItem','position':2,'name':'ARAM 攻略','item':ORIGIN+'/aram.html'},{'@type':'ListItem','position':3,'name':f"{hero.get('name')} ARAM 攻略",'item':canonical}]}
    ]}
    def rich_cards(vals, label=''):
        out=[]
        for x in vals or []:
            out.append(f'''<li class="sg-rich-card">{f'<img src="{asset(x.get("icon"))}" alt="{e(x.get("name"))}" loading="lazy">' if x.get('icon') else ''}<div><strong>{e(x.get('name'))}</strong>{f'<small>{e(label)}</small>' if label else ''}<p>{e(x.get('reason'))}</p></div></li>''')
        return ''.join(out)
    balance=hero.get('balance') or {}
    bal_html=''.join(f'<div><span>{e(label)}</span><strong>{e(balance.get(key))}</strong></div>' for key,label in [('damageDealt','造成傷害'),('damageTaken','承受傷害'),('healing','治療效果'),('shielding','護盾效果')])
    play=''.join(f'<article><strong>{e(k)}</strong><p>{e(v)}</p></article>' for k,v in (hero.get('playstyle') or {}).items())
    situ=''.join(f'''<article class="sg-situ"><div>{f'<img src="{asset(x.get("icon"))}" alt="{e(x.get("name"))}" loading="lazy">' if x.get('icon') else ''}<strong>{e(x.get('name'))}</strong></div><small>{e(x.get('when'))}</small><p>{e(x.get('reason'))}</p></article>''' for x in hero.get('situationalItems',[]))
    sources=''.join(f'<li><a href="{e(s.get("url"))}" target="_blank" rel="noopener noreferrer">{e(s.get("label"))} ↗</a></li>' for s in hero.get('sources',[]))
    aaa=hero.get('aaaAram') or {}
    cats=((aaa.get('augmentCategoryDecision') or {}).get('categories') or [])
    cat_html=''.join(f'<article><strong>{e(c.get("tag"))}</strong><span>{e(c.get("level"))} · {e(c.get("hint"))}</span><p>{e(c.get("note"))}</p></article>' for c in cats)
    interactive=f"../../aram-hero.html?id={quote(hero['id'])}"
    body=f'''{header(interactive,'互動版 ARAM')}
<main class="shell sg-main">
<nav class="sg-breadcrumb"><a href="../../index.html">首頁</a><span>›</span><a href="../../aram.html">ARAM</a><span>›</span><strong>{e(hero.get('name'))}</strong></nav>
<section class="sg-hero"><div class="sg-portrait"><img src="{asset(hero.get('avatar'))}" alt="{e(hero.get('name'))}"></div><div><div class="sg-kicker">ARAM · PATCH {e(data_version)}</div><div class="sg-title-row"><h1>{e(hero.get('name'))} ARAM 攻略</h1><span class="sg-tier">{e(hero.get('tier'))}</span></div><p class="sg-en">{e(hero.get('enName'))} · {e(hero.get('position'))}</p><div class="sg-tags">{''.join(f'<span>{e(t)}</span>' for t in hero.get('tags',[]))}</div><p class="sg-lead">{e(hero.get('summary'))}</p><p class="sg-tier-reason"><strong>本站評級理由：</strong>{e(hero.get('tierReason'))}</p><div class="sg-actions"><a class="sg-primary" href="{e(interactive)}">開啟互動版 ARAM 攻略</a><a href="../../pages/aram-guides.html">查看全部 ARAM 英雄</a></div></div></section>
<section class="sg-section"><div class="sg-section-head"><div><span>ARAM BALANCE</span><h2>模式平衡修正</h2></div></div><div class="sg-balance-grid">{bal_html}</div><p>{e(balance.get('note'))}</p></section>
<section class="sg-section"><div class="sg-section-head"><div><span>BUILD</span><h2>推薦出裝與召喚師技能</h2></div></div><div class="sg-config-grid"><article><h3>核心裝備</h3><ol class="sg-card-list rich">{rich_cards(hero.get('items'))}</ol></article><article><h3>鞋子</h3><ol class="sg-card-list rich">{rich_cards(hero.get('boots'))}</ol></article><article><h3>符文</h3><ol class="sg-card-list rich">{rich_cards(hero.get('runes'))}</ol></article><article><h3>召喚師技能</h3><ol class="sg-card-list rich">{rich_cards(hero.get('spells'))}</ol></article></div></section>
<section class="sg-section"><div class="sg-section-head"><div><span>SKILL ORDER</span><h2>技能升級</h2></div><p><strong>{e(hero.get('skillOrder'))}</strong></p></div><p>{e(hero.get('skillNote'))}</p></section>
<section class="sg-section"><div class="sg-section-head"><div><span>GAME PLAN</span><h2>ARAM 實戰節奏</h2></div></div><div class="sg-timeline">{play}</div></section>
{f'<section class="sg-section"><div class="sg-section-head"><div><span>SITUATIONAL</span><h2>情境裝備</h2></div></div><div class="sg-situ-grid">{situ}</div></section>' if situ else ''}
{f'<section class="sg-section"><div class="sg-section-head"><div><span>AAA ARAM</span><h2>符文大亂鬥增幅分類</h2></div><p>{e((aaa.get("augmentCategoryDecision") or {}).get("note"))}</p></div><div class="sg-category-grid">{cat_html}</div></section>' if cat_html else ''}
<section class="sg-section sg-method"><div class="sg-section-head"><div><span>EDITORIAL NOTE</span><h2>資料來源與版本說明</h2></div></div><p>{e(hero.get('sourceNote'))}</p><ul class="sg-source-list">{sources}</ul><p>ARAM 使用獨立於召喚峽谷的資料集；本站會把官方模式平衡、單線 5v5 特性與出裝／符文適配分開判斷，而不是直接複製峽谷配置。</p></section>
</main>{footer()}'''
    return page_head(title,desc,canonical,image,structured)+body

def generate_indexes(summoners, aram):
    role_order=['baron','jungle','mid','duo','support']
    role_names={'baron':'巴龍路','jungle':'打野','mid':'中路','duo':'飛龍路','support':'輔助'}
    groups=[]
    for role in role_order:
        hs=[h for h in summoners if h.get('roleId')==role]
        links=''.join(f'<a href="../share/heroes/{e(h["id"])}.html"><strong>{e(h.get("name"))}</strong><span>{e(h.get("tier"))} · {e(h.get("enName"))}</span><p>{e(h.get("summary"))}</p></a>' for h in hs)
        groups.append(f'<section class="sgi-group"><h2>{role_names[role]} <small>{len(hs)} 份</small></h2><div class="sgi-grid">{links}</div></section>')
    hero_index=f'''<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>激鬥峽谷完整英雄攻略索引｜Wild Rift Guide</title><meta name="description" content="Wild Rift Guide 7.2d 完整英雄攻略索引，依巴龍路、打野、中路、飛龍路與輔助整理 202 份可直接閱讀的出裝、符文、技能與對局攻略。"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="{ORIGIN}/pages/hero-guides.html"><link rel="stylesheet" href="../assets/css/style.css?v=92.0.0"><link rel="stylesheet" href="../assets/css/static-guide.css?v=92.0.0">{ADSENSE}</head><body class="static-index-page"><header class="topbar"><div class="shell topbar-inner"><a class="brand" href="../index.html"><span>Wild Rift</span> Guide</a><nav class="sg-topnav"><a href="heroes.html">互動英雄資料庫</a><a href="guides.html">攻略專區</a></nav></div></header><main class="shell sgi-main"><div class="sgi-head"><span>CRAWLABLE GUIDE INDEX · PATCH 7.2D</span><h1>完整英雄攻略索引</h1><p>這裡列出本站目前 202 份召喚峽谷位置攻略。每一頁都有獨立的出裝、符文、技能、對局與實戰內容，也可從頁面返回互動式英雄資料庫。</p></div>{''.join(groups)}</main><footer><div class="shell">© 2026 Wild Rift Guide｜<a href="about.html">關於本站</a>｜<a href="privacy.html">隱私權政策</a>｜<a href="disclaimer.html">非官方聲明</a></div></footer></body></html>'''
    (ROOT/'pages/hero-guides.html').write_text(hero_index,encoding='utf-8')

    tiers=['S+','S','A','B','C','D']
    groups=[]
    for tier in tiers:
        hs=[h for h in aram if h.get('tier')==tier]
        if not hs: continue
        links=''.join(f'<a href="../share/aram/{e(h["id"])}.html"><strong>{e(h.get("name"))}</strong><span>{e(h.get("tier"))} · {e(h.get("enName"))}</span><p>{e(h.get("summary"))}</p></a>' for h in hs)
        groups.append(f'<section class="sgi-group"><h2>ARAM {tier} <small>{len(hs)} 位</small></h2><div class="sgi-grid">{links}</div></section>')
    aram_index=f'''<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARAM 英雄攻略完整索引｜Wild Rift Guide</title><meta name="description" content="Wild Rift Guide ARAM 英雄攻略完整索引，依 S+ 至 D 評級整理 140 位英雄的模式平衡、出裝、符文、技能與實戰玩法。"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="{ORIGIN}/pages/aram-guides.html"><link rel="stylesheet" href="../assets/css/style.css?v=92.0.0"><link rel="stylesheet" href="../assets/css/static-guide.css?v=92.0.0">{ADSENSE}</head><body class="static-index-page"><header class="topbar"><div class="shell topbar-inner"><a class="brand" href="../index.html"><span>Wild Rift</span> Guide</a><nav class="sg-topnav"><a href="../aram.html">ARAM 專區</a><a href="hero-guides.html">召喚峽谷攻略</a></nav></div></header><main class="shell sgi-main"><div class="sgi-head"><span>ARAM GUIDE INDEX</span><h1>ARAM 英雄攻略完整索引</h1><p>140 位英雄使用獨立 ARAM 資料，不直接沿用召喚峽谷配置。每頁包含本站 Tier 理由、模式平衡修正、出裝、符文與單線 5v5 玩法。</p></div>{''.join(groups)}</main><footer><div class="shell">© 2026 Wild Rift Guide｜<a href="about.html">關於本站</a>｜<a href="privacy.html">隱私權政策</a>｜<a href="disclaimer.html">非官方聲明</a></div></footer></body></html>'''
    (ROOT/'pages/aram-guides.html').write_text(aram_index,encoding='utf-8')

def main():
    heroes_data=json.loads((ROOT/'assets/data/heroes.json').read_text(encoding='utf-8'))
    items_data=json.loads((ROOT/'assets/data/items.json').read_text(encoding='utf-8'))
    runes_data=json.loads((ROOT/'assets/data/runes.json').read_text(encoding='utf-8'))
    spells_data=json.loads((ROOT/'assets/data/spells.json').read_text(encoding='utf-8'))
    aram_data=json.loads((ROOT/'assets/data/aram/heroes.json').read_text(encoding='utf-8'))
    items_map={x['id']:x for x in items_data['items']}
    runes_map=flatten_runes(runes_data)
    spells_map={x['id']:x for x in spells_data}
    out=ROOT/'share/heroes'; out.mkdir(parents=True,exist_ok=True)
    for h in heroes_data['heroes']:
        (out/f"{h['id']}.html").write_text(render_summoner(h,items_map,runes_map,spells_map,'7.2d'),encoding='utf-8')
    aout=ROOT/'share/aram'; aout.mkdir(parents=True,exist_ok=True)
    for h in aram_data['heroes']:
        (aout/f"{h['id']}.html").write_text(render_aram(h,aram_data.get('gameVersion','7.2b')),encoding='utf-8')
    generate_indexes(heroes_data['heroes'],aram_data['heroes'])
    print(f"Generated {len(heroes_data['heroes'])} Summoner's Rift guides and {len(aram_data['heroes'])} ARAM guides.")

if __name__=='__main__': main()
