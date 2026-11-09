from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
p=root/'assets/data/hwei-profile.json';h=json.loads(p.read_text())
for title,old,new,note in [('坦克多','magic-high-21','magic-high-16','以黎安卓的折磨替換無限寶珠；魔防高時虛空之杖提前。'),('護盾多','magic-high-02','magic-high-24','需要保命時保留沙漏，改換無限寶珠。'),('先手控制多','magic-high-02','magic-high-05','女妖面紗防先手，不等同解控。'),('回復多','magic-high-21','magic-high-13','無限寶珠替換黑魔禁書。')]:
 h['buildVariants'].append({'title':title,'when':title,'items':[new if x==old else x for x in h['items']],'runes':h['runes'],'spells':h['spells'],'boots':h['boots'],'note':note})
p.write_text(json.dumps(h,ensure_ascii=False,indent=2)+'\n')
for name in ['pages/heroes.html','assets/js/heroes.js']:
 p=root/name;s=p.read_text().replace('202 份英雄位置配置','203 份英雄位置配置').replace('（含赫威技能介紹）與 202 份 7.2e 英雄位置配置','與 203 份位置攻略（原有 7.2e 配置＋赫威 7.3 初步配置）');p.write_text(s)
p=root/'sitemap.xml';s=p.read_text().replace('https://wild-rift-guide.vercel.app/pages/hwei.html','https://wild-rift-guide.vercel.app/pages/heroes.html?hero=hwei-mid');p.write_text(s)
