#!/usr/bin/env python3
"""Publish the existing, independently versioned ARAM dataset as readable pages.

This changes presentation only. It never recalibrates heroes or joins the newer
Summoner's Rift item/rune dataset into the historical ARAM recommendations.
"""
from pathlib import Path
import importlib.util
import json
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('static_guide_helpers', ROOT / 'scripts/generate-static-seo-guides.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)
helpers.ADSENSE = ''
e, asset = helpers.e, helpers.asset
ORIGIN = helpers.ORIGIN
PRESENTATION_DATE = '2026-10-16'


def rich_cards(values):
    cards = []
    for value in values or []:
        icon = f'<img src="{asset(value["icon"])}" alt="{e(value.get("name"))}" loading="lazy">' if value.get('icon') else ''
        description = value.get('description')
        reason = value.get('reason')
        text = ''.join(f'<p>{e(part)}</p>' for part in dict.fromkeys([description, reason]) if part)
        cards.append(f'<li class="sg-rich-card">{icon}<div><strong>{e(value.get("name"))}</strong>{text}</div></li>')
    return ''.join(cards)


def sources_html(sources):
    return ''.join(f'<li><a href="{e(s.get("url"))}" target="_blank" rel="noopener noreferrer">{e(s.get("label"))} ↗</a></li>' for s in sources or [])


def version_note(data, hero=None):
    reviewed = (hero or {}).get('reviewedAt') or data['updated']
    return (f'<aside class="sg-section sg-method" aria-label="資料適用版本"><h2>資料適用版本</h2>'
            f'<p><strong>標準 ARAM {e(data["standardGameVersion"])} 資料；最後校正 {e(reviewed)}。</strong>'
            '這份配置保留當時的模式評級、出裝與機制說明，尚未完成 7.3b 的 ARAM 全量複核；不可視為目前版本已確認的完整推薦。</p>'
            '<p>召喚峽谷 7.3b 校正不代表 ARAM 同步完成。符文大亂鬥使用獨立資料，請分開查看。'
            f'本頁閱讀版整理：{PRESENTATION_DATE}，沒有因此變更遊戲數據或評級。</p></aside>')


def section(key, title, body):
    return f'<section class="sg-section" id="{key}"><div class="sg-section-head"><div><h2>{e(title)}</h2></div></div>{body}</section>'


def render_aram(hero, data):
    version = data['standardGameVersion']
    canonical = f'{ORIGIN}/share/aram/{quote(hero["id"])}.html'
    title = f'{hero["name"]} ARAM 攻略｜{version} 資料・出裝與玩法｜Wild Rift Guide'
    desc = f'{hero["name"]} ARAM {version} 歷史配置：本站評級、模式平衡、出裝、符文、加點與單線團戰玩法；資料最後校正 {hero.get("reviewedAt") or data["updated"]}，尚未完成 7.3b 全量複核。'
    structured = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'Article', 'headline': title, 'description': desc, 'url': canonical,
         'mainEntityOfPage': canonical, 'image': helpers.abs_asset(hero.get('avatar')),
         'inLanguage': 'zh-Hant-TW', 'dateModified': PRESENTATION_DATE,
         'isAccessibleForFree': True,
         'author': {'@type': 'Organization', 'name': 'Wild Rift Guide', 'url': ORIGIN + '/pages/editorial.html'}},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': '首頁', 'item': ORIGIN + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'ARAM 攻略', 'item': ORIGIN + '/pages/aram-guides.html'},
            {'@type': 'ListItem', 'position': 3, 'name': hero['name'] + ' ARAM', 'item': canonical}]}]}
    interactive = '../../aram-hero.html?id=' + quote(hero['id'])
    body = [helpers.header(interactive, '互動版 ARAM'), '<main class="shell sg-main">',
            '<nav class="sg-breadcrumb" aria-label="麵包屑"><a href="../../index.html">首頁</a><span>›</span><a href="../../pages/aram-guides.html">ARAM 攻略</a><span>›</span>' + e(hero['name']) + '</nav>',
            f'<section class="sg-hero"><div class="sg-portrait"><img src="{asset(hero.get("avatar"))}" alt="{e(hero["name"])}"></div><div>'
            f'<div class="sg-kicker">標準 ARAM · {e(version)} 資料</div><div class="sg-title-row"><h1>{e(hero["name"])} ARAM 攻略</h1><span class="sg-tier">{e(hero.get("tier"))}</span></div>'
            f'<p class="sg-en">{e(hero.get("enName"))} · {e(hero.get("position"))}</p><div class="sg-tags">' + ''.join(f'<span>{e(tag)}</span>' for tag in hero.get('tags', [])) + '</div>'
            f'<p class="sg-lead">{e(hero.get("summary"))}</p><p class="sg-tier-reason"><strong>本站當時評級理由：</strong>{e(hero.get("tierReason"))}</p>'
            f'<div class="sg-actions"><a class="sg-primary" href="{interactive}">開啟互動版 ARAM</a><a href="../../pages/aram-guides.html">查看全部 ARAM 英雄</a></div></div></section>',
            version_note(data, hero),
            '<nav class="sg-actions" aria-label="本頁內容"><a href="#balance">模式平衡</a><a href="#build">出裝與符文</a><a href="#skills">技能升級</a><a href="#playstyle">實戰節奏</a><a href="#sources">資料來源</a></nav>']
    balance = hero.get('balance') or {}
    balance_cards = ''.join(f'<div><span>{label}</span><strong>{e(balance.get(key))}</strong></div>' for key, label in [('damageDealt', '造成傷害'), ('damageTaken', '承受傷害'), ('healing', '治療效果'), ('shielding', '護盾效果')])
    body.append(section('balance', f'{version} 模式平衡記錄', f'<div class="sg-balance-grid">{balance_cards}</div><p>{e(balance.get("note"))}</p>'))
    config = ''.join(f'<article><h3>{label}</h3><ol class="sg-card-list rich">{rich_cards(hero.get(key))}</ol></article>' for key, label in [('starterItems', '起手裝備'), ('items', '核心裝備'), ('boots', '鞋子與升級'), ('runes', '符文'), ('spells', '召喚師技能')])
    body.append(section('build', f'{version} 推薦配置與使用理由', f'<div class="sg-config-grid">{config}</div>'))
    body.append(section('skills', '技能升級', f'<p><strong>{e(hero.get("skillOrder"))}</strong></p><p>{e(hero.get("skillNote"))}</p>'))
    play = ''.join(f'<article><strong>{e(phase)}</strong><p>{e(text)}</p></article>' for phase, text in (hero.get('playstyle') or {}).items())
    body.append(section('playstyle', 'ARAM 實戰節奏', f'<div class="sg-timeline">{play}</div>'))
    situ_cards = []
    for item in hero.get('situationalItems', []):
        icon = f'<img src="{asset(item.get("icon"))}" alt="{e(item.get("name"))}" loading="lazy">' if item.get('icon') else ''
        situ_cards.append(f'<article class="sg-situ"><div>{icon}<strong>{e(item.get("name"))}</strong></div><small>{e(item.get("when"))}</small><p>{e(item.get("reason"))}</p></article>')
    situ = ''.join(situ_cards)
    if situ:
        body.append(section('situational', '依陣容調整', f'<div class="sg-situ-grid">{situ}</div>'))
    aaa = hero.get('aaaAram') or {}
    if aaa:
        cats = (aaa.get('augmentCategoryDecision') or {}).get('categories') or []
        cat_html = ''.join(f'<article><strong>{e(c.get("tag"))}</strong><span>{e(c.get("level"))} · {e(c.get("hint"))}</span><p>{e(c.get("note"))}</p></article>' for c in cats)
        aaa_body = ('<p><strong>獨立歷史資料：7.2b 分類評級。</strong>7.3a 僅有部分增幅公告欄位校正，英雄分類適配與出裝未因此全面重評；不套用到標準 ARAM。</p>'
                    f'<p>{e((aaa.get("augmentCategoryDecision") or {}).get("note"))}</p><div class="sg-category-grid">{cat_html}</div>'
                    f'<div class="sg-actions"><a href="{interactive}&amp;mode=aaa">查看此英雄的符文大亂鬥獨立攻略</a><a href="../../aram-augments.html">增幅資料與 7.3a 部分校正</a></div>')
        body.append(f'<section class="sg-section" id="aaa"><details><summary><strong>符文大亂鬥分類參考（7.2b 歷史資料）</strong></summary>{aaa_body}</details></section>')
    body.append(section('sources', '資料來源與校正範圍', f'<p>{e(hero.get("sourceNote"))}</p><ul class="sg-source-list">{sources_html(hero.get("sources"))}</ul><p>來源所列版本保留原紀錄；本站評級與配置理由屬編輯判斷，並非官方排名。<a href="../../pages/editorial.html">查看編輯原則</a>，或<a href="../../pages/contact.html">回報內容問題</a>。</p>'))
    body.append('</main>' + helpers.footer())
    return helpers.page_head(title, desc, canonical, helpers.abs_asset(hero.get('avatar')), structured) + '\n'.join(body)


def render_index(data):
    groups = []
    tiers = list(dict.fromkeys(data.get('tierOrder', []) + [h['tier'] for h in data['heroes']]))
    for tier in tiers:
        heroes = [h for h in data['heroes'] if h['tier'] == tier]
        if not heroes:
            continue
        cards = ''.join(f'<a href="../share/aram/{e(h["id"])}.html"><strong>{e(h["name"])}</strong><span>{e(h["tier"])} · {e(h.get("enName"))}</span><p>{e(h.get("summary"))}</p></a>' for h in heroes)
        groups.append(f'<details class="sgi-group"><summary><strong>ARAM {e(tier)}</strong> · {len(heroes)} 位英雄</summary><div class="sgi-grid">{cards}</div></details>')
    return f'''<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARAM 英雄攻略索引｜{data['standardGameVersion']} 資料｜Wild Rift Guide</title><meta name="description" content="141 位英雄的標準 ARAM 歷史攻略：7.2e 資料、模式平衡、出裝、符文與實戰玩法。尚未完成 7.3b 全量複核；符文大亂鬥獨立呈現。"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="{ORIGIN}/pages/aram-guides.html"><link rel="stylesheet" href="../assets/css/style.css?v=92.0.0"><link rel="stylesheet" href="../assets/css/static-guide.css?v=92.0.0"></head><body class="static-index-page"><header class="topbar"><div class="shell topbar-inner"><a class="brand" href="../index.html"><span>Wild Rift</span> Guide</a><nav class="sg-topnav" aria-label="攻略導覽"><a href="../aram.html">互動 ARAM 專區</a><a href="hero-guides.html">召喚峽谷攻略</a></nav></div></header><main class="shell sgi-main"><div class="sgi-head"><span>ARAM · {data['standardGameVersion']} 資料</span><h1>ARAM 英雄攻略完整索引</h1><p>{len(data['heroes'])} 位英雄使用獨立 ARAM 資料，每頁可直接閱讀模式平衡、起手與核心裝備、符文、技能升級、情境調整及單線團戰玩法。</p></div>{version_note(data)}{''.join(groups)}</main><footer><div class="shell">© 2026 Wild Rift Guide｜<a href="about.html">關於本站</a>｜<a href="editorial.html">編輯原則</a>｜<a href="contact.html">內容回報</a>｜<a href="privacy.html">隱私權政策</a></div></footer></body></html>'''


def main():
    data = json.loads((ROOT / 'assets/data/aram/heroes.json').read_text())
    target = ROOT / 'share/aram'
    target.mkdir(parents=True, exist_ok=True)
    for hero in data['heroes']:
        (target / f'{hero["id"]}.html').write_text(render_aram(hero, data), encoding='utf-8')
    (ROOT / 'pages/aram-guides.html').write_text(render_index(data), encoding='utf-8')
    print(f'Rendered {len(data["heroes"])} standard ARAM pages from unchanged {data["standardGameVersion"]} data; AAA remains independently versioned.')


if __name__ == '__main__':
    main()
