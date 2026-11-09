"""Update only Hwei skill copy using the supplied in-game screenshots."""
import json
from pathlib import Path
import re
from html import escape

root = Path(__file__).resolve().parents[1]
path = root / 'assets/data/hwei-profile.json'
hero = json.loads(path.read_text())
note = '數值與冷卻依使用者提供的遊戲內截圖（IMG_8876–8880）記錄；截圖未標示完整技能等級與加成條件，並非各級成長表。魔攻指魔法攻擊。'
copy = {
    'P': ('傷害技能命中敵方英雄後，以筆跡標記目標 4 秒。', [
        '再次以傷害技能命中被標記的敵人會消耗標記，片刻後在其下方爆炸，對範圍內敵人造成 33–333（隨等級）＋33% 魔攻的魔法傷害。每項技能只能對同一目標觸發此效果一次。', note]),
    'Q': ('傷害主題：選取主題後，再選擇三種施法之一。截圖顯示冷卻：9.5 秒。', [
        '1 → 1｜飛行火球：朝目標方向發射火球，命中第一位敵人時爆炸，對範圍內敵人造成 50＋75% 魔攻＋4% 目標最大生命的魔法傷害。',
        '1 → 2｜震顫轟雷：短暫延遲後攻擊遠距目標，造成 80＋30% 魔攻的魔法傷害。若目標受到硬控場，或只命中一個目標，會依其已損失生命提高傷害，最多達 200＋75% 魔攻。',
        '1 → 3｜熔岩裂隙：畫出往前爆發的火柱並留下岩漿。每次噴發造成 20＋30% 魔攻的魔法傷害；岩漿區域每秒造成 20＋30% 魔攻的魔法傷害並緩速 30%，每塊岩漿區持續 2.5 秒。']),
    'W': ('增益主題：提供移動、護盾或回魔效果。截圖顯示冷卻：17 秒。', [
        '2 → 1｜川流湍急：畫出直線前進、持續 4 秒的水流，提高自身與友方英雄跑速；截圖顯示加成為 30%（30＋3% 魔攻）。',
        '2 → 2｜明鏡止水：在目標位置創造持續 3 秒的防護水池，提供可吸收 60＋35% 魔攻傷害的護盾。護盾在 1.5 秒內逐漸增強；截圖原文顯示最多可額外吸收 108＋7.1% 魔攻傷害，此數值按截圖記錄，未推算成長公式。除赫威外，其他友方英雄獲得的護盾值減少 15%。',
        '2 → 3｜迴旋光暈：畫出三道光暈圍繞自身，下三次技能或普攻額外造成 30＋15% 魔攻的魔法傷害，命中時回復 45 魔力。']),
    'E': ('控制主題：阻止突進、限制走位或集中敵人。截圖顯示冷卻：13 秒。', [
        '3 → 1｜死神面影：發射鬼面，對第一名命中的敵人造成 70＋70% 魔攻的魔法傷害，並使其恐懼 1 秒。',
        '3 → 2｜深淵凝視：在目標位置畫出提供視野的魔眼，鎖定最近的敵方英雄並發射追蹤導彈。導彈對第一名命中的敵人造成 70＋70% 魔攻的魔法傷害，定身 1.25 秒，並揭露其位置 2.5 秒。',
        '3 → 3｜碎骨大顎：巨顎對命中的敵人造成 70＋70% 魔攻的魔法傷害，將其拉向中心，施加 40% 緩速，在 1.25 秒內衰減至失效。']),
    'R': ('發射絕望幻象，附著在敵方英雄身上 3 秒並逐漸擴大。截圖顯示冷卻：70 秒。', [
        '對敵人施加 10% 緩速，每 0.25 秒累加一次；每秒造成 10＋5% 魔攻的魔法傷害。',
        '幻象擴張至極限後碎裂，造成 250＋75% 魔攻的魔法傷害。'])
}
for ability in hero['abilities']:
    ability['summary'], ability['details'] = copy[ability['key']]
path.write_text(json.dumps(hero, ensure_ascii=False, indent=2) + '\n')

# Keep the existing demonstration images, but replace stale textual captions.
page = root / 'pages/hwei-demonstrations.html'
html = page.read_text()
for key, section_id in [('P','passive'), ('Q','q'), ('W','w'), ('E','e'), ('R','r')]:
    pattern = r'(<section\b[^>]*id="' + section_id + r'"[^>]*>)(.*?)(</section>)'
    match = re.search(pattern, html, re.S)
    assert match, section_id
    section = match.group(2)
    section = re.sub(r'<p>.*?</p>', '<p>' + escape(copy[key][0]) + '</p>', section, count=1, flags=re.S)
    if key in ('Q','W','E'):
        details = iter(copy[key][1])
        section = re.sub(r'<h3>.*?</h3>', lambda _: '<h3>' + escape(next(details)) + '</h3>', section, flags=re.S)
    else:
        section = section.replace('</p>', '</p>' + ''.join('<p>' + escape(d) + '</p>' for d in copy[key][1]), 1)
    html = html[:match.start()] + match.group(1) + section + match.group(3) + html[match.end():]
html = re.sub(r'alt="[^"]*，展示圖 [^"]*"', 'alt="赫威技能實機示範截圖（早期示範；技能文字以更新說明為準）"', html)
page.write_text(html)
for file in ['assets/js/heroes.js', 'pages/heroes.html']:
    target = root / file
    target.write_text(target.read_text().replace('v=99.0.0', 'v=100.0.0'))
print('Updated Hwei abilities, demonstration copy and cache versions.')
