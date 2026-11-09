#!/usr/bin/env python3
"""Generate standard ARAM reading pages from the same reviewed JSON as the UI.
This renderer never changes gameplay data or historical official patch archives.
"""
from pathlib import Path
from urllib.parse import quote
from collections import Counter
import importlib.util, json
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('rift_read',ROOT/'scripts/generate-rift-readable-v124.py')
h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
e, p, section=h.e,h.p,h.section
O=h.ORIGIN

def cards(values,group):
    return '<ol class="sg-card-list">'+''.join(f'<li class="sg-mini-card" data-config-group="{e(group)}" data-config-id="{e(x.get("id"))}"><img src="{e(h.asset(x.get("icon")))}" alt="{e(x.get("name"))}" loading="lazy"><div><strong>{e(x.get("name"))}</strong>{p(x.get("when"))}{p(x.get("reason") or x.get("description"))}</div></li>' for x in values or [])+'</ol>'
def sources(items):
    return '<ul class="sg-source-list">'+''.join(f'<li><a href="{e(x["url"])}" target="_blank" rel="noopener noreferrer">{e(x.get("label") or "來源")} ↗</a></li>' for x in items if x.get('url','').startswith('https://'))+'</ul>'
def review_note(hero):
    rev=hero.get('review73d',hero.get('review73c',{}))
    body=p(f'校正至 7.3d · {hero.get("reviewedAt","2026-10-25")}。Tier與配置是本站的模式策略判斷，不是官方勝率排名。')
    if rev.get('tierBefore') and rev['tierBefore']!=hero['tier']:
        body+=p(f'Tier調整：{rev["tierBefore"]} → {hero["tier"]}。'+hero['tierReason'])
    body+='<ul class="sg-list">'+''.join('<li>'+e(t)+'</li>' for t in rev.get('buildNotes',[]))+'</ul>'
    body+='<p><a href="../../pages/review-7-3d.html">查看完整校正紀錄與資料限制</a> · <a href="../../pages/build-check.html">檢查五件成裝的組合</a></p>'
    return section('本輪校正與使用前提',body,'review')
def render(hero,data):
    version=data['standardGameVersion'];name=hero['name'];canonical=f'{O}/share/aram/{quote(hero["id"])}.html';interactive='../../aram-hero.html?id='+quote(hero['id'])
    title=f'{name} ARAM攻略｜{version} 出裝、符文與團戰決策｜Wild Rift Guide'
    desc=f'{name} ARAM {version}：{hero["summary"]} 本站評級、五件成裝、鞋子、符文、情境替換與單線團戰判斷。'[:180]
    structured={'@context':'https://schema.org','@graph':[{'@type':'Article','headline':title,'description':desc,'url':canonical,'mainEntityOfPage':canonical,'image':h.absolute_asset(hero.get('avatar')),'dateModified':hero['reviewedAt'],'inLanguage':'zh-Hant-TW','isAccessibleForFree':True,'author':{'@type':'Organization','name':'Wild Rift Guide','url':O+'/pages/about.html'}},{'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'首頁','item':O+'/'},{'@type':'ListItem','position':2,'name':'ARAM攻略','item':O+'/pages/aram-guides.html'},{'@type':'ListItem','position':3,'name':name,'item':canonical}]}]}
    out=[h.head(title,desc,canonical,h.absolute_asset(hero.get('avatar')),structured),h.header(),'<main class="shell sg-main">',f'<nav class="sg-breadcrumb"><a href="../../index.html">首頁</a> › <a href="../../pages/aram-guides.html">ARAM攻略</a> › {e(name)}</nav>']
    out.append(f'<section class="sg-hero"><div class="sg-portrait"><img src="{e(h.asset(hero["avatar"]))}" alt="{e(name)}"></div><div><div class="sg-kicker">標準 ARAM · PATCH {e(version)}</div><div class="sg-title-row"><h1>{e(name)} ARAM攻略</h1><span class="sg-tier">{e(hero["tier"])}</span></div><p class="sg-en">{e(hero.get("enName"))} · {e(hero.get("position"))}</p>{p(hero["summary"],"sg-lead")}<p><strong>本站評級理由：</strong>{e(hero["tierReason"])}</p><div class="sg-actions"><a class="sg-primary" href="{interactive}">互動版與模式切換</a><a href="../../pages/aram-guides.html">全部ARAM英雄</a></div></div></section>')
    out.append('<nav class="sg-read-nav" aria-label="本頁內容">'+''.join(f'<a href="#{k}">{t}</a>' for k,t in [('review','本輪校正'),('build','出裝順序'),('runes','符文'),('skills','技能'),('playstyle','團戰決策'),('situational','情境換裝'),('balance','模式倍率'),('aaa','符文大亂鬥'),('sources','資料來源')])+'</nav>')
    out.append(review_note(hero))
    rev=hero.get('review73d',{})
    content='<ul>'+''.join('<li>'+e(x)+'</li>' for x in rev.get('changes',[]))+'</ul>'+p(rev.get('excludedDeltaReason'))
    content+=''.join('<h3>'+e(g.get('title','官方調整'))+'</h3>'+''.join(p(r['label']+'：'+r['before']+' → '+r['after']) for r in g.get('rows',[])) for g in rev.get('officialDeltas',[]))
    out.append(section('7.3d數值與攻略差異','<details><summary>點開查看完整變動</summary>'+content+'</details>','patch-73d'))

    cfg='<p>'+e(hero.get('buildOrderNote'))+'</p><div class="sg-config-grid">'+''.join('<article><h3>'+label+'</h3>'+cards(hero.get(key),key)+'</article>' for key,label in [('starterItems','起手組件'),('items','五件核心／後續成裝'),('boots','鞋子升級路線'),('spells','召喚師技能')])+'</div>'
    out.append(section('推薦出裝與購買順序',cfg,'build'))
    out.append(section('一般符文',cards(hero['runes'],'runes'),'runes'))
    out.append(section('技能升級','<p><strong>'+e(hero['skillOrder'])+'</strong></p>'+p(hero.get('skillNote')),'skills'))
    out.append(section('單線團戰決策','<div class="sg-timeline">'+''.join('<article><strong>'+e(k)+'</strong>'+p(v)+'</article>' for k,v in hero.get('playstyle',{}).items())+'</div>','playstyle'))
    if hero.get('situationalItems'):out.append(section('何時換裝，而不是每局都換',cards(hero['situationalItems'],'situational'),'situational'))
    for i,v in enumerate(hero.get('buildVariants',[])):
        out.append(section('情境完整配置：'+v.get('title','替代方案'),p(v.get('when'))+cards(v['items'],'variant')+cards(v.get('runes'),'variant-runes')+p(v.get('note')),f'variant-{i}'))
    b=hero['balance'];out.append(section('標準ARAM模式倍率與來源界線','<div class="sg-balance-grid">'+''.join(f'<div><span>{label}</span><strong>{e(b.get(k))}</strong></div>' for k,label in [('damageDealt','造成傷害'),('damageTaken','承受傷害'),('healing','治療效果'),('shielding','護盾效果')])+'</div>'+p(b.get('note')),'balance'))
    aaa=hero.get('aaaAram')
    if aaa:
        content=p(aaa['summary'])+p(aaa.get('pilotNote'))
        update=aaa.get('officialBalanceUpdate')
        if update:content+='<h3>最近官方模式調整（版本依原公告），僅限符文大亂鬥</h3>'+''.join(p(r['label']+'：'+r['before']+' → '+r['after']) for r in update['rows'])
        content+='<h3>增幅改變什麼，才需要換裝？</h3><div class="sg-note-grid">'+''.join('<article><strong>'+e(x['tag'])+'</strong>'+p(x.get('level'))+p(x.get('note'))+'</article>' for x in aaa.get('augmentCategoryDecision',{}).get('categories',[]))+'</div>'
        for i,plan in enumerate(aaa.get('buildPlans',[])):
            content+=h.details(plan.get('title','情境配裝'),p(plan.get('trigger'))+p(plan.get('description'))+cards(plan.get('items'),'aaa-'+str(i))+cards(plan.get('boots'),'aaa-boots'))
        content+=p('分類與單卡評級是本站條件式建議。新卡完整效果未核實時不補造數值；當局抽到的卡片會改變優先順序。')+f'<p><a href="{interactive}&amp;mode=aaa">開啟符文大亂鬥分類篩選</a> · <a href="../../aram-augments.html">查看增幅卡庫與官方異動</a></p>'
        out.append(section('符文大亂鬥 7.3c獨立策略',h.details('展開分類與條件式配裝（不套用到標準ARAM）',content),'aaa'))
    out.append(section('資料來源與編輯範圍',p(hero.get('sourceNote'))+sources(hero.get('sources',[]))+'<p>攻略與原始資料有不同性質：Tier、出裝順序與團戰取捨由本站整理；官方公告只用於確認改動。<a href="../../pages/editorial.html">編輯原則</a> · <a href="../../pages/contact.html">回報錯誤</a></p>','sources'))
    return '\n'.join(out)+ '</main>'+h.footer()

def index(data):
    title='7.3c ARAM完整英雄攻略｜Wild Rift Guide';desc='142位英雄的7.3c標準ARAM出裝、符文、模式倍率來源與團戰判斷；符文大亂鬥分類與條件式配裝另列。'
    out=h.head(title,desc,O+'/pages/aram-guides.html',prefix='../')+h.header('../')+'<main class="shell sgi-main"><div class="sgi-head"><span>PATCH 7.3c · REVIEW 2026/10/25</span><h1>ARAM完整英雄攻略</h1><p>'+desc+'</p><p>本站Tier不是官方勝率榜。已核對7.3～7.3c改動、退場裝備及配置相容性，模式倍率保留各自來源；不以符文大亂鬥改動代替標準ARAM數值。</p><p><a href="../aram.html">互動篩選</a> · <a href="review-7-3d.html">本輪變更明細</a> · <a href="build-check.html">出裝組合檢查</a></p></div>'
    for tier in data['tierOrder']:
        hs=[x for x in data['heroes'] if x['tier']==tier]
        if not hs:continue
        out+=f'<details open class="sgi-group"><summary>{e(tier)} · {len(hs)}位</summary><div class="sgi-grid">'+''.join(f'<a href="../share/aram/{e(x["id"])}.html"><strong>{e(x["name"])}</strong><span>{e(x["enName"])} · {e(x["position"])}</span>{p(x["summary"])}</a>' for x in hs)+'</div></details>'
    return out+'</main>'+h.footer('../')

def main():
    data=json.loads((ROOT/'assets/data/aram/heroes.json').read_text());target=ROOT/'share/aram';target.mkdir(exist_ok=True)
    for hero in data['heroes']:(target/f'{hero["id"]}.html').write_text(render(hero,data),encoding='utf-8')
    (ROOT/'pages/aram-guides.html').write_text(index(data),encoding='utf-8')
    print(f'Rendered {len(data["heroes"])} ARAM reading pages, independent AAA sections, one data source.')
if __name__=='__main__':main()
