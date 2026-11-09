from pathlib import Path
import json
from html import escape
root=Path(__file__).resolve().parents[1]
items={x['id']:x for x in json.loads((root/'assets/data/items.json').read_text())['items']}
def flatten(x):
    if isinstance(x,dict):
        if 'id' in x: yield x
        else:
            for v in x.values(): yield from flatten(v)
    elif isinstance(x,list):
        for v in x:yield from flatten(v)
runes={x['id']:x for x in flatten(json.loads((root/'assets/data/runes.json').read_text()))}
spells={x['id']:x for x in json.loads((root/'assets/data/spells.json').read_text())}
def cards(ids,lookup):
    return '<div class="hwei-build-grid">'+''.join(f'<div class="hwei-build-item"><img src="{escape(lookup[i]["icon"])}" width="56" height="56" loading="lazy" alt=""><strong>{escape(lookup[i]["name"])}</strong></div>' for i in ids)+'</div>'
build=['magic-high-10','magic-high-21','magic-high-14','magic-high-08','magic-high-02']
runeids=['arcane-comet','manaflow-band','transcendence','scorch','bone-plating']
content='''<section id="build" class="hwei-section"><p class="eyebrow">MID LANE · 7.3 · 初步配置</p><h2>中路 A・本站暫定</h2><p>本站編輯初評：具備遠距清線、區域控制與團戰輸出，先以 A 級作為起點。缺乏即時位移，技能選擇與命中率要求高，遭到近身時容易失去輸出空間。這是低信心的上市初評，不是官方評級或勝率排行。</p><p class="hwei-note">查核時 WildRiftFire 的 Tier 仍為 TBD，沒有可採用的完整樣本。本頁與列表均標示暫定，後續依同分路實戰表現調整。</p><h3>預設五件成裝</h3>'''+cards(build,items)+'''<p>依序為黑焰火炬 → 無限寶珠 → 死亡之帽 → 虛空之杖 → 中婭沙漏。鞋子獨立計算，不放進五件成裝中。</p><h3>鞋子與召喚師技能</h3>'''+cards(['mana-boots'],items)+cards(['flash','barrier'],spells)+'''<p>魔力之靴可依回城金額穿插購買。預設閃現搭配光盾，先確保能活著完成輸出；中婭沙漏受到突進威脅時可提早完成。</p><h3>符文</h3>'''+cards(runeids,runes)+'''<p>奧術彗星為基石；主系選附魔之帶、卓越、燒灼，副系骨甲。這套以消耗與安全換血為出發點。</p><h3>情境替換（本站建議）</h3><ul><li>敵方高生命前排多：無限寶珠換黎安卓的折磨；魔防已堆起來時，虛空之杖提前。</li><li>敵方護盾多：中婭沙漏可換水仙三叉戟；仍需保命時保留沙漏，改換無限寶珠。</li><li>敵方關鍵控制容易先手命中：中婭沙漏可換女妖面紗；不要把法術護盾當作可靠的解控。</li><li>敵方回復強：無限寶珠換黑魔禁書。</li><li>對方坦克多且對線壓力低：副系骨甲可換斷切；容易被一套帶走時仍保留骨甲。</li></ul><p>以上均為替換，不是加購第六件成裝。裝備數值以遊戲內 7.3 商店為準。</p></section>
<section id="leveling" class="hwei-section"><h2>技能加點與練習方向</h2><p><strong>主一技、副三技、最後二技；大絕可升時優先。</strong>一般開局先學一技；二級需要控制防守時學三技，需要續航清線時可先學二技，再補齊另一個主題。</p><p>加點是提升整個主題，不是替九種子技能各自分配等級。清洗毛筆是取消主題的操作，不是另一個需要加點的大絕。</p><h3>先練三種情境</h3><ul><li>清線：用 1 → 3 處理兵線；推進前先確認敵方打野位置。</li><li>防突進：保留 3 → 1，不要為了消耗提前交掉主要控制。</li><li>接控制：隊友或自己的控制命中後，再接 1 → 2；比盲目遠距預判穩定。</li></ul><p>團戰站在前排後方，先確保技能命中和安全距離；不要為了補普攻走進敵方突進範圍。</p></section>
'''
p=root/'pages/hwei.html';html=p.read_text()
assert 'id="build"' not in html,'Already applied'
html=html.replace('<title>赫威｜技能與主題切換介紹｜Wild Rift Guide</title>','<title>赫威中路攻略｜暫定 A・出裝符文與技能｜Wild Rift Guide</title>')
html=html.replace('技能介紹版｜Tier、出裝及符文待實戰校正。','7.3 初步攻略｜中路 A（本站暫定），出裝與符文已補齊。')
html=html.replace('<nav class="hwei-nav" aria-label="技能快速導覽">','<nav class="hwei-nav" aria-label="攻略快速導覽"><a href="#build">Tier／出裝符文</a><a href="#leveling">技能加點</a>')
html=html.replace('</nav>','</nav>'+content,1)
html=html.replace('<h2>資料說明</h2>','<h2>資料說明</h2><p>配置參考 <a href="https://www.wildriftfire.com/guide/hwei" target="_blank" rel="noopener">WildRiftFire 赫威攻略</a>（頁內標示 7.3；部分技能欄位仍未完成）；版本背景核對 <a href="https://wildrift.leagueoflegends.com/zh-tw/news/game-updates/wild-rift-patch-notes-7-3/" target="_blank" rel="noopener">Riot 7.3 公告</a>。A 級及情境取捨為本站編輯判断，並非來源的 Tier。未採用來源的零值技能數字。</p>')
p.write_text(html)
report={'version':'v98-hwei-initial-build','patch':'7.3','role':'mid','tier':'A','provisional':True,'confidence':'low','tierBasis':'editorial assessment; source tier TBD, no usable sample','items':build,'boots':['mana-boots'],'runes':runeids,'spells':['flash','barrier'],'skillPriority':['R','Q','E','W'],'sources':['https://www.wildriftfire.com/guide/hwei','https://wildrift.leagueoflegends.com/zh-tw/news/game-updates/wild-rift-patch-notes-7-3/']}
(root/'assets/data/hwei-v98.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for filename in ['pages/heroes.html','summoners-rift.html']:
 p=root/filename;s=p.read_text();s=s.replace('赫威暫不提供評級與出裝。','赫威新增中路 A（暫定）、出裝與符文。').replace('Tier／配裝</b>待實戰校正','Tier／配裝</b>A（暫定）・初步配置').replace('赫威完整技能介紹','赫威中路攻略').replace('heroes.js?v=97.1.0','heroes.js?v=98.0.0');p.write_text(s)
print('Hwei initial build and source report added.')
