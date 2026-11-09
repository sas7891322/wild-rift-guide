#!/usr/bin/env python3
"""Publish current Rift data as readable HTML without changing gameplay data.

The interactive UI and these pages use the same JSON. Run after a data update;
never run the historical v92 generator on top of these current guides.
"""
from pathlib import Path
from urllib.parse import quote, urlparse
from collections import Counter
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://wild-rift-guide.vercel.app'
ROLES = {'baron':'巴龍路','jungle':'打野','mid':'中路','duo':'飛龍路','support':'輔助'}
LABELS = {'P':'被動','Q':'1 技','W':'2 技','E':'3 技','R':'4 技','AA':'普攻','FLASH':'閃現','F':'閃現','IGNITE':'點燃','WAIT':'等待','MOVE':'移動'}

def read(name):
    return json.loads((ROOT/'assets/data'/name).read_text())

def e(value):
    return html.escape(str(value if value is not None else ''), quote=True)

def asset(value, prefix='../../'):
    value = re.sub(r'^(?:\.\./)+', '', str(value or '')).lstrip('/')
    return prefix+value if value.startswith('assets/') else value

def absolute_asset(value):
    return ORIGIN+'/'+asset(value,'') if value else ORIGIN+'/assets/images/brand/wild-rift-guide-og.png'

def p(value, cls=''):
    return f'<p{f" class={chr(34)}{cls}{chr(34)}" if cls else ""}>{e(value)}</p>' if value else ''

def source_links(sources):
    urls = []
    for source in sources or []:
        url = source if isinstance(source,str) else source.get('url','')
        if url.startswith('https://') and url not in urls:
            urls.append(url)
    def label(url):
        host=urlparse(url).hostname or ''
        return 'Riot 官方資料' if host=='wildrift.leagueoflegends.com' else 'WildRiftFire 參考攻略' if host in ('www.wildriftfire.com','wildriftfire.com') else host
    return ' · '.join(f'<a href="{e(url)}" target="_blank" rel="noopener noreferrer">{e(label(url))} ↗</a>' for url in urls)

def details(title, body, cls='sg-fold'):
    return f'<details class="{e(cls)}"><summary>{e(title)}</summary><div>{body}</div></details>' if body else ''

def section(title, body, key):
    return f'<section class="sg-section" id="{e(key)}"><div class="sg-section-head"><h2>{e(title)}</h2></div>{body}</section>'

CSS = '''<style>
.sg-main{overflow-wrap:anywhere}.sg-fold{border:1px solid var(--sg-border);border-radius:12px;padding:12px 16px;margin:12px 0;background:rgba(255,255,255,.025)}.sg-fold>summary{cursor:pointer;font-weight:700;color:var(--sg-gold);line-height:1.6}.sg-fold>div{padding-top:8px}.sg-warning{border-left:3px solid #ddb573;padding:10px 14px;background:rgba(221,181,115,.06);color:#eed6ac}.sg-warning p{margin:6px 0}.sg-list{padding-left:22px;line-height:1.8}.sg-section a,.sg-lead a{color:var(--sg-gold)}.sg-table-wrap{overflow-x:auto}.sg-table{width:100%;border-collapse:collapse;line-height:1.6}.sg-table th,.sg-table td{padding:10px;border-bottom:1px solid var(--sg-border);text-align:left;vertical-align:top}.sg-sequence{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;list-style:none;padding:0}.sg-sequence li{padding:9px;background:var(--sg-card2);border-radius:8px;text-align:center}.sg-sequence small{display:block;color:var(--sg-muted)}.sg-note-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.sg-note-grid>article{background:var(--sg-card2);padding:14px;border-radius:12px}.sg-mini-card img,.sg-ability>img{flex-shrink:0}.sg-ability>div{min-width:0}.sg-ability-variants{display:flex;flex-wrap:wrap;gap:6px}.sg-ability-variants img{width:40px;height:40px}.sg-tier-note{color:#eed6ac;font-size:.85rem}.sg-read-nav{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.sg-read-nav a{color:var(--sg-gold)}.sg-hero .sg-en{line-height:1.6}.sgi-main details{margin-top:18px}.sgi-main summary{font-size:1.2rem;font-weight:700;cursor:pointer;padding:12px 0}.sgi-grid{margin-top:12px}.sg-skip{display:block;text-align:center;color:var(--sg-gold);padding:10px}.sg-check{padding:8px 0;border-bottom:1px solid var(--sg-border)}@media(max-width:560px){.sg-note-grid{grid-template-columns:1fr}.sg-title-row{flex-wrap:wrap}.sg-hero{grid-template-columns:60px minmax(0,1fr);gap:12px;padding:14px}.sg-title-row h1{font-size:1.35rem}.sg-section{padding:14px}.sg-ability{display:block}.sg-ability>img{float:left;margin:0 10px 8px 0}.sg-table th,.sg-table td{padding:8px}.sg-mini-card{align-items:flex-start}.sg-mini-card strong{font-size:.95rem}}
</style>'''

def head(title, desc, canonical, image='', structured=None, prefix='../../'):
    return f'''<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(title)}</title><meta name="description" content="{e(desc)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#06101c"><link rel="canonical" href="{e(canonical)}"><link rel="icon" href="{prefix}assets/images/brand/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="{prefix}assets/css/style.css?v=118.0.0"><link rel="stylesheet" href="{prefix}assets/css/static-guide.css?v=92.0.0"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:type" content="article"><meta property="og:url" content="{e(canonical)}"><meta property="og:image" content="{e(image or ORIGIN+'/assets/images/brand/wild-rift-guide-og.png')}"><meta property="og:locale" content="zh_TW"><meta name="twitter:card" content="summary_large_image">{f'<script type="application/ld+json">{json.dumps(structured,ensure_ascii=False,separators=(",",":"))}</script>' if structured else ''}{CSS}</head>'''

def header(prefix='../../'):
    return f'<body class="static-guide-page"><header class="topbar"><div class="shell topbar-inner"><a class="brand" href="{prefix}index.html"><span>Wild Rift</span> Guide</a><nav class="sg-topnav" aria-label="攻略導覽"><a href="{prefix}pages/hero-guides.html">英雄攻略索引</a><a href="{prefix}summoners-rift.html">召喚峽谷</a><a href="{prefix}articles/index.html">專題攻略</a></nav></div></header>'

def footer(prefix='../../'):
    return '<footer><div class="shell">© 2026 Wild Rift Guide｜'+'｜'.join(f'<a href="{prefix}pages/{file}.html">{name}</a>' for file,name in [('about','關於本站'),('editorial','編輯原則'),('privacy','隱私權政策'),('contact','內容回報'),('disclaimer','非官方聲明')])+'</div></footer></body></html>'

HEROES = read('heroes.json')['heroes']
HWEI = read('hwei-profile.json')
if not any(h['id']==HWEI['id'] for h in HEROES):
    HEROES.append(HWEI)
ITEMS = {}
for item in read('items.json')['items']+read('items-7.3.json')['items']:
    ITEMS.setdefault(item['id'],item)
RUNES = {x['id']:x for values in read('runes.json').values() if isinstance(values,list) for x in values}
SPELLS = {x['id']:x for x in read('spells.json')}
MAPS = {'item':ITEMS,'rune':RUNES,'spell':SPELLS}

def card_list(ids, kind='item', group='', labels=None):
    cards=[]
    for i,id in enumerate(ids or []):
        obj=MAPS[kind][id]
        label=(labels[i] if labels else '') or obj.get('tag','')
        cards.append(f'<li class="sg-mini-card" data-config-group="{e(group)}" data-config-id="{e(id)}"><img src="{e(asset(obj.get("icon")))}" alt="{e(obj["name"])}" loading="lazy"><div><strong>{e(obj["name"])}</strong>{f"<small>{e(label)}</small>" if label else ""}</div></li>')
    return '<ol class="sg-card-list">'+''.join(cards)+'</ol>'

def warnings(hero, field):
    return ''.join(f'<aside class="sg-warning" data-review-field="{e(field)}" data-review-status="pending"><strong>待確認｜{e(c["title"])}</strong>{p(c["detail"])}<p>{source_links(c.get("sources"))}</p></aside>' for c in hero['editorialReview'].get('checks',[]) if c['status']=='pending' and c['field']==field)

def reason(hero,field):
    return p(hero['editorialReview'].get(field,{}).get('reason'))+warnings(hero,field)

def numeric_groups(groups):
    out=[]
    for group in groups or []:
        rows=''.join(f'<tr><th scope="row">{e(row.get("label"))}</th><td>{e(row.get("before"))}</td><td>{e(row.get("after"))}</td></tr>' for row in group.get('rows',[]))
        out.append(f'<h3>{e(group.get("title"))}</h3><div class="sg-table-wrap"><table class="sg-table"><thead><tr><th>項目</th><th>調整前</th><th>調整後</th></tr></thead><tbody>{rows}</tbody></table></div>')
    return ''.join(out)

def render(hero):
    role=ROLES[hero['roleId']];review=hero['editorialReview'];canonical=ORIGIN+'/share/heroes/'+quote(hero['id'])+'.html'
    title=f'{hero["name"]}{role}攻略｜7.3d 出裝、符文與技能｜Wild Rift Guide'
    desc=f'{hero["name"]} {role} 7.3d 攻略：{hero["summary"]} 提供本站評級、出裝理由、符文、加點、手機連招與情境替換。'[:180]
    structured={'@context':'https://schema.org','@type':'Article','headline':title,'description':desc,'url':canonical,'mainEntityOfPage':canonical,'image':absolute_asset(hero.get('avatar')),'dateModified':review['date'],'inLanguage':'zh-Hant-TW','author':{'@type':'Organization','name':'Wild Rift Guide','url':ORIGIN+'/pages/about.html'},'isAccessibleForFree':True}
    out=[head(title,desc,canonical,absolute_asset(hero.get('avatar')),structured),header(),'<main class="shell sg-main">']
    out.append(f'<nav class="sg-breadcrumb" aria-label="麵包屑"><a href="../../index.html">首頁</a> › <a href="../../pages/hero-guides.html">英雄攻略索引</a> › {e(hero["name"])} {role}</nav>')
    limited=review.get('tier',{}).get('status')=='limited-evidence'
    out.append(f'<section class="sg-hero"><div class="sg-portrait"><img src="{e(asset(hero["avatar"]))}" alt="{e(hero["name"])}"></div><div><div class="sg-kicker">PATCH {e(hero["patch"])} · {role} · 校正 {e(review["date"])}</div><div class="sg-title-row"><h1>{e(hero["name"])} {role}攻略</h1><span class="sg-tier">{e(hero["tier"])}</span></div><p class="sg-en">{e(hero["enName"])} · 本站評級{(" · 評級依據待補" if limited else "")}</p>{p(hero["summary"],"sg-lead")}{warnings(hero,"tier")}<div class="sg-actions"><a class="sg-primary" href="../../pages/heroes.html?hero={e(hero["id"])}">開啟互動版攻略</a><a href="../../pages/hero-guides.html">全部英雄</a></div></div></section>')
    out.append('<nav class="sg-read-nav" aria-label="本頁內容">'+''.join(f'<a href="#{id}">{label}</a>' for id,label in [('build','出裝'),('runes','符文與召喚師技能'),('skills','技能與加點'),('combos','連招'),('matchups','對局'),('situations','情境調整'),('sources','來源與校正')])+'</nav>')
    delta = hero.get('patch73dNumbers', [])
    if delta:
        table = ''.join('<h3>'+e(g['title'])+'</h3>'+''.join(p(r['label']+'：'+r['before']+' → '+r['after']) for r in g['rows']) for g in delta)
        out.append(section('7.3d 官方數值校正', details('查看調整前後數值', table), 'patch-73d'))
    build=reason(hero,'build')+'<div class="sg-config-grid">'
    for field,label in [('starterItems','起手裝備'),('coreItems','三件核心裝備'),('items','五件成裝'),('boots','鞋子升級路線')]:
        build+=f'<article><h3>{label}</h3>'+card_list(hero.get(field,[]),'item',field)+'</article>'
    build+='</div><p>五件成裝與鞋子分開列示；起手與核心是購買路線，不是額外佔用的成裝欄位。鞋子完成時機仍依對線壓力與回城金錢調整。</p>'
    out.append(section('出裝順序與取捨',build,'build'))
    out.append(section('符文與召喚師技能','<div class="sg-config-grid"><article><h3>符文配置</h3>'+card_list(hero['runes'],'rune','runes')+reason(hero,'runes')+'</article><article><h3>召喚師技能</h3>'+card_list(hero['spells'],'spell','spells')+reason(hero,'spells')+'</article></div>','runes'))
    skills='<p><strong>加點優先：</strong>'+e(hero['skillOrder'])+'</p>'+reason(hero,'skills')
    skills+='<ol class="sg-sequence" aria-label="一至十五級技能分配">'+''.join(f'<li data-skill-level="{i+1}" data-skill-key="{e(key)}"><small>{i+1} 級</small><strong>{e(LABELS.get(key,key))}</strong></li>' for i,key in enumerate(hero.get('skillSequence',[])))+'</ol>'+p(hero.get('skillSequenceNote'))
    if hero.get('skillRankRules'):
        rules=hero['skillRankRules'];skills+=p('初始自帶技能點：'+'、'.join(f'{LABELS.get(k,k)} {v} 點' for k,v in rules.get('freeRanks',{}).items()))+p('手動分配：'+'、'.join(f'{LABELS.get(k,k)} {v} 點' for k,v in rules.get('allocatedRanks',{}).items()))
    skills+=''.join(p(x,'sg-warning') for x in hero.get('skillDataCaveats',[]))+'<div class="sg-ability-grid">'
    for ability in hero.get('abilities',[]):
        body=f'<small>{e(ability["label"])}</small><h3>{e(ability["title"])}</h3>'+p(ability['summary'])+''.join(p(x) for x in ability.get('details',[]))+warnings(hero,'ability:'+ability['key'])
        variants=[src for src in ability.get('variantIcons',[]) if (ROOT/asset(src,'')).is_file()]
        if variants:
            body+='<div class="sg-ability-variants">'+''.join(f'<img src="{e(asset(src))}" alt="{e(ability["title"])} 形態 {i+1}" loading="lazy">' for i,src in enumerate(variants))+'</div>'
        for field,version in [('patch73dValues','7.3d'),('patch73bValues','7.3b'),('patch73aValues','7.3a'),('patch73Values','7.3')]:
            values=ability.get(field,[])
            if values:
                body+=details(version+(' 最新調整數值' if version=='7.3b' else ' 歷史數值'),'<dl>'+''.join(f'<dt>{e(v["label"])}</dt><dd>{e(v["value"])}</dd>' for v in values)+'</dl>'+p('有後續版本調整的項目以較新數值為準；未列出者不代表完整技能成長表。'))
        skills+=f'<article class="sg-ability" data-ability-key="{e(ability["key"])}"><img src="{e(asset(ability.get("icon")))}" alt="{e(ability["title"])}" loading="lazy"><div>{body}</div></article>'
    out.append(section('技能說明與逐級加點',skills+'</div>','skills'))
    combo=reason(hero,'mechanics')
    for c in hero.get('combos',[]):
        steps=[]
        for step in c.get('steps',[]):
            key=step.get('key','') if isinstance(step,dict) else step
            label=step.get('label') if isinstance(step,dict) else None
            steps.append(label or LABELS.get(key,key))
        combo+=details(c['name'],p(' → '.join(steps),'sg-combo-steps')+p(c.get('note')))
    if hero.get('comboCorrection'):combo+=p(hero['comboCorrection'].get('note'),'sg-warning')
    for m in hero.get('mechanics',[]):
        combo+=details(m.get('title') or '技能機制',p(m.get('text'))+p(f'層數：{m["stacks"]}' if 'stacks' in m else ''))
    out.append(section('手機版連招與機制',combo,'combos'))
    play='<div class="sg-timeline">'+''.join(f'<article><strong>{e(k)}</strong>{p(v)}</article>' for k,v in hero.get('playstyle',{}).items())+'</div>'
    out.append(section('實戰節奏',play,'game-plan'))
    match=reason(hero,'matchups')+'<div class="sg-match-grid">'
    for key,label in [('good','較好處理'),('bad','較難處理')]+([] if hero.get('hideBan') else [('ban','優先 Ban 參考')]):
        names=hero.get('matchups',{}).get(key,[]);names=names if isinstance(names,list) else [names]
        match+=f'<article class="{key}"><h3>{label}</h3><div>'+''.join(f'<span>{e(n)}</span>' for n in names if n)+'</div></article>'
    match+='</div><p>對局名單是機制與分路判斷，不代表固定勝率；需同時看雙方熟練度、兵線與陣容。</p>'
    match+='<div class="sg-note-grid">'+''.join(f'<article><h3>{e(n.get("title"))}</h3>{p(n.get("text"))}</article>' for n in hero.get('matchupNotes',[]))+'</div>'
    if hero.get('suitableSupports'):
        match+=details('輔助配合', ''.join(f'<h3>{e(s["name"])}</h3>{p(s["reason"])}' for s in hero['suitableSupports']))
    out.append(section('對局與隊伍配合',match,'matchups'))
    adjustments=hero.get('matchupAdjustments',{});situ=p(adjustments.get('intro'))
    for s in adjustments.get('situations',[]):
        body=p(s.get('priority'))+p('觸發：'+s.get('trigger',''))
        for c in s.get('changes',[]):
            mapping=MAPS[c['type']];old=mapping[c['fromId']]['name'];new=mapping[c['toId']]['name']
            body+=f'<article data-change-from="{e(c["fromId"])}" data-change-to="{e(c["toId"])}"><h3>{e(c["title"])}</h3><p><strong>{e(old)} → {e(new)}</strong></p>{p(c.get("condition"))}{p(c.get("reason"))}</article>'
        if not s.get('changes'):body+=f'<h3>{e(s.get("keepTitle"))}</h3>'+p(s.get('keepText'))
        body+=p(s.get('warning'),'sg-warning');situ+=details(s['label'],body)
    for v in hero.get('buildVariants',[]):
        body=p(v.get('when'))
        for field,label,kind in [('items','五件成裝','item'),('boots','鞋子','item'),('runes','符文','rune'),('spells','召喚師技能','spell')]:
            body+=f'<h3>{label}</h3>'+card_list(v.get(field,hero.get(field,[])),kind,'variant-'+field)
        situ+=details(v['title']+'｜整套情境配置',body+p(v.get('note')))
    out.append(section('依陣容調整配置',situ,'situations'))
    sources=p(f'本頁校正版本：{hero["patch"]}；校正日期：{review["date"]}。')+p('參考來源標示版本：'+review.get('sourcePatch','未標示'))+p(review.get('limitation'))+p('評級理由：'+review.get('tier',{}).get('reason',''))+warnings(hero,'source')+f'<p>{source_links(review.get("sources"))}</p>'
    status={'pending':'待確認','confirmed':'已核對','resolved':'已修正'}
    checks=''.join(f'<article class="sg-check" data-review-field="{e(c["field"])}" data-review-status="{e(c["status"])}"><h3>{status.get(c["status"],"校正")}｜{e(c["title"])}</h3>{p(c["detail"])}<p>{source_links(c.get("sources"))}</p></article>' for c in review.get('checks',[]))
    sources+=details('逐項核對紀錄',checks)
    for key,version in [('patch73bNumbers','7.3b'),('patch73aNumbers','7.3a'),('patch73Numbers','7.3')]:
        if hero.get(key):sources+=details('官方 '+version+(' 調整前後數值' if version=='7.3b' else ' 歷史數值'),p('歷史資料有後續調整時，以較新版本數值為準。')+numeric_groups(hero[key]))
    if hero.get('sourceCorrections'):
        sources+=details('來源差異與更正說明',''.join(p(x.get('previousIssue'))+p(x.get('resolution'))+f'<p>{source_links(x.get("sources"))}</p>' for x in hero['sourceCorrections']))
    sources+='<p><a href="../../pages/editorial.html">編輯與來源原則</a> · <a href="../../pages/contact.html">回報內容問題</a> · <a href="../../summoners-rift.html#updates">全站版本更新</a></p>'
    sources = '<p><strong>7.3d差異核對：</strong>本頁核對官方英雄／裝備差異與現行配置參照；未列的技能不表示已完成逐級實測。<a href="../../pages/review-7-3d.html">查看校正範圍</a>。</p>' + sources
    out.append(section('資料來源與本站判斷',sources,'sources'))
    out.append('</main>'+footer())
    return '\n'.join(out)

def index():
    body=head('7.3d 完整英雄攻略索引｜Wild Rift Guide','142 位英雄、203 份分路攻略：可直接閱讀目前出裝、符文、逐級加點、手機連招與對局說明。',ORIGIN+'/pages/hero-guides.html',prefix='../')+header('../')+'<main class="shell sgi-main"><div class="sgi-head"><span>PATCH 7.3d</span><h1>完整英雄攻略索引</h1><p>142 位英雄、203 份分路攻略。每頁可直接閱讀出裝理由、符文、逐級加點、手機版連招、對局與情境替換，也能切換到原本的互動版。評級屬本站編輯建議，資料來源版本與待確認項目分別標示。</p><p><a href="heroes.html">開啟互動英雄資料庫 →</a></p></div>'
    for role,label in ROLES.items():
        hs=[h for h in HEROES if h['roleId']==role]
        cards=''.join(f'<a href="../share/heroes/{e(h["id"])}.html"><strong>{e(h["name"])}</strong><span>{e(h["tier"])} · {e(h["enName"])} · 本站評級{("／評級依據待補" if h["editorialReview"].get("tier",{}).get("status")=="limited-evidence" else "")}</span>{p(h["summary"])}</a>' for h in hs)
        body+=f'<details id="{role}" open><summary>{label} · {len(hs)} 份攻略</summary><div class="sgi-grid">{cards}</div></details>'
    return body+'</main>'+footer('../')

def main():
    assert len(HEROES)==203 and len({h['id'] for h in HEROES})==203
    for hero in HEROES:
        (ROOT/'share/heroes'/f'{hero["id"]}.html').write_text(render(hero))
    (ROOT/'pages/hero-guides.html').write_text(index())
    # Only known IDs resolve to published static canonicals. Unknown IDs retain
    # their original path and are handled by the interactive application's UI.
    seo=ROOT/'assets/js/seo.js';text=seo.read_text()
    block='  // V120_READABLE_CANONICALS_START\n  const readableHeroIds = new Set('+json.dumps([h['id'] for h in HEROES],separators=(',',':'))+');\n  function readableCanonicalPath(path) {\n    try {\n      const url = new URL(path, SITE_ORIGIN);\n      const id = url.searchParams.get("hero");\n      if (url.origin === SITE_ORIGIN && url.pathname === "/pages/heroes.html" && readableHeroIds.has(id)) return `/share/heroes/${encodeURIComponent(id)}.html`;\n    } catch (_) {}\n    return path;\n  }\n  // V120_READABLE_CANONICALS_END\n'
    if '// V120_READABLE_CANONICALS_START' in text:
        text=re.sub(r'  // V120_READABLE_CANONICALS_START.*?  // V120_READABLE_CANONICALS_END\n',lambda _:block,text,flags=re.S)
    else:text=text.replace('  function set({',block+'  function set({',1)
    text=text.replace('const canonical = absolute(path);','const canonical = absolute(readableCanonicalPath(path));')
    old='    if (structuredData) setStructuredData(structuredData);'
    new='''    if (structuredData) {
      const originalCanonical = absolute(path);
      const alignedData = canonical === originalCanonical ? structuredData : JSON.parse(JSON.stringify(structuredData, (_key, value) => {
        if (typeof value === 'string' && (value === originalCanonical || value.startsWith(originalCanonical + '#'))) return canonical + value.slice(originalCanonical.length);
        return value;
      }));
      setStructuredData(alignedData);
    }'''
    text=text.replace(old,new)
    seo.write_text(text)
    page=ROOT/'pages/heroes.html';text=page.read_text()
    fallback='<noscript><section class="shell content-quality-note"><h2>直接閱讀完整英雄攻略</h2><p>互動篩選需要 JavaScript；所有 203 份分路攻略也提供可直接閱讀的版本，包含目前出裝、符文、加點與情境調整。</p><p><a href="hero-guides.html">開啟完整英雄攻略索引 →</a></p></section></noscript>'
    if '直接閱讀完整英雄攻略' not in text:text=text.replace('</main>',fallback+'</main>',1)
    if 'id="readableHeroGuideLink"' not in text:
        text=re.sub(r'(<p id="heroPageDescription">.*?</p>)',r'\1<p id="readableHeroGuideLink"><a href="hero-guides.html">直接閱讀完整攻略 →</a></p>',text,count=1,flags=re.S)
    text=re.sub(r'(assets/js/seo\.js\?v=)[^"\']+',r'\g<1>123.0.0',text)
    page.write_text(text)
    print(json.dumps({'guides':len(HEROES),'roles':dict(Counter(h['roleId'] for h in HEROES)),'pendingChecks':sum(c['status']=='pending' for h in HEROES for c in h['editorialReview']['checks']),'canonical':'self; interactive canonical maps known IDs','adsOnNewPages':False},ensure_ascii=False))

if __name__=='__main__':main()
