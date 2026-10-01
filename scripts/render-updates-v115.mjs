// Rebuild only the requested update panels; the original history stays intact.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const official=read('assets/data/official-7.3a.json'),audit=read('assets/data/hero-review-v115.json');
const heroes=[...read('assets/data/heroes.json').heroes,read('assets/data/hwei-profile.json')];
const items=read('assets/data/items-7.3.json').items;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const src=x=>esc(x.replace(/^(\.\.\/)+/,''));
const href=h=>'pages/heroes.html?hero='+encodeURIComponent(h.id);
const labels={buff:'增強',nerf:'削弱',adjust:'調整'},arrows={buff:'↑',nerf:'↓',adjust:'↔'};
const rows=rs=>rs.map(r=>`<p class="update-number"><span>${esc(r.label)}：</span><span>${esc(r.before)} <span aria-hidden="true">→</span> <strong>${esc(r.after)}</strong></span></p>`).join('');
const groups=gs=>gs.map(g=>`<div class="update-skill"><h5>${esc(g.title)}</h5>${rows(g.rows)}</div>`).join('');
const officialHeroes=official.heroes.map(c=>{
  const h=heroes.find(h=>h.baseId===c.baseId);
  return `<article class="official-change-card ${c.direction}" data-official-hero="${c.baseId}"><i class="official-change-arrow" aria-hidden="true">${arrows[c.direction]}</i><img class="official-change-avatar" src="${src(h.avatar)}" alt="${esc(c.name)}" width="48" height="48" loading="lazy"><div><a class="update-title-link" href="${href(h)}"><b>${esc(c.name)}</b></a><small>${labels[c.direction]}</small>${groups(c.groups)}${c.note?`<p class="update-note">${esc(c.note)}</p>`:''}</div></article>`;
}).join('\n');
const officialItems=official.items.map(c=>{
  const i=items.find(i=>i.id===c.id);
  return `<article class="official-change-card ${c.direction}" data-official-item="${c.id}"><i class="official-change-arrow" aria-hidden="true">${arrows[c.direction]}</i><img class="official-change-avatar item-avatar" src="${src(i.icon)}" alt="${esc(c.name)}" width="48" height="48" loading="lazy"><div><a class="update-title-link" href="pages/items.html?item=${c.id}"><b>${esc(c.name)}</b></a><small>${labels[c.direction]}</small>${groups(c.groups)}<p class="update-note">${esc(c.note)}</p></div></article>`;
}).join('\n');
const currentOfficial=`<div class="update-v115" id="official-73a">
<div class="home-update-heading"><div><span class="kicker">RIOT GAMES · 2026/09/29</span><h3>官方 7.3a 公告</h3></div><span class="home-update-badge">7.3a</span></div>
<p class="home-update-lead">12 位英雄與 4 件裝備調整。以下列出官方「調整前 → 調整後」數值；Tier 為本站另外判斷，並非官方排名。</p>
<div class="official-change-grid">${officialHeroes}</div>
<h4 class="update-section-title">裝備調整</h4><div class="official-change-grid">${officialItems}</div>
<h4 class="update-section-title">一般符文</h4><p class="update-note">${esc(official.runes.note)}</p>
<h4 class="update-section-title">打野與戰場</h4><div class="site-review-grid">${official.battlefield.map(c=>`<div><strong>${esc(c.name)}</strong>${groups(c.groups)}${c.note?`<p>${esc(c.note)}</p>`:''}</div>`).join('')}</div>
<details class="official-history-item"><summary>符文大亂鬥專屬調整 · 12 項增幅、2 位英雄</summary><div class="official-history-content"><p class="update-note">${esc(official.aaa.scope)}</p><div class="site-review-grid">${[...official.aaa.augments,...official.aaa.heroes].map(c=>`<div><strong>${esc(c.name)}</strong>${rows(c.rows)}${c.note?`<p>${esc(c.note)}</p>`:''}</div>`).join('')}</div></div></details>
<p class="update-source"><a href="${esc(official.source)}" target="_blank" rel="noopener noreferrer">閱讀 Riot 官方 7.3a 完整公告 ↗</a></p>
</div>`;
const tiers=audit.tierChanges.map(c=>{
  const h=heroes.find(h=>h.id===c.id),order=['S+','S','A','B','C','D'];
  const dir=order.indexOf(c.to)<order.indexOf(c.from)?'buff':'nerf';
  return `<a class="tier-change-card ${dir}" href="${href(h)}" data-tier-hero="${h.id}" aria-label="${esc(h.name+' '+h.role+' '+c.from+' 調整為 '+c.to+'，首輪暫定。查看攻略')}"><span class="tier-change-avatar-wrap"><img src="${src(h.avatar)}" alt="${esc(h.name)}" width="70" height="70" loading="lazy"><i class="tier-change-arrow" aria-hidden="true">${arrows[dir]}</i></span><span class="tier-change-name">${esc(h.name)}<small>${esc(h.role)}</small></span><span class="tier-change-ranks"><del>${esc(c.from)}</del><span aria-hidden="true">→</span><strong>${esc(c.to)}</strong></span></a>`;
}).join('\n');
const buildCards=audit.buildChanges.map(c=>`<div><strong><a href="pages/heroes.html?hero=${c.id}">${esc(c.name)}出裝</a></strong><p>${esc(c.reason)}</p><p class="update-build-line">${c.after.map(id=>esc(items.find(i=>i.id===id).name)).join(' → ')}</p></div>`).join('');
const runeList=audit.runeChanges.map(c=>`<li><a href="pages/heroes.html?hero=${c.id}">${esc(c.name)} ${esc(c.role)}</a>：${esc(c.reason)}</li>`).join('');
const currentSite=`<div class="update-v115" id="site-73a">
<div class="home-update-heading"><div><span class="kicker">SITE UPDATE · 7.3a</span><h3>本站 7.3a 英雄校正</h3></div><span class="home-update-badge ready">v115</span></div>
<p class="home-update-lead">完成 142 位英雄、203 份位置攻略的改版差異複核。同步 12 位英雄官方調整（17 份位置攻略）、4 件裝備及重擊燃燒；42 份配置引用了本次變動裝備。</p>
<div class="official-change-section"><div class="official-change-title"><strong>10/1・第一次校正</strong><span>v115</span></div><p class="update-note">8 組分路評級首輪暫定調整；點英雄卡片可直接查看攻略。</p><div class="tier-change-grid">${tiers}</div></div>
<details class="official-history-item"><summary>查看本輪 8 組 Tier 判斷理由</summary><div class="official-history-content"><ul class="update-reasons">${audit.tierChanges.map(c=>`<li><strong>${esc(c.name)}・${esc(c.role)} ${esc(c.from)} → ${esc(c.to)}</strong><p>${esc(c.reason)}</p></li>`).join('')}</ul></div></details>
<div class="site-review-grid">${buildCards}<div><strong>雲陶狂箭／死亡之舞</strong><p>雲陶常駐與觸發攻速25% → 35%，觸發冷卻20 → 25秒；死亡之舞3200 → 3300金幣。引用配置補上節奏與購買時機說明，未無差別換掉整套裝備。</p></div><div><strong>4 份符文搭配調整</strong><ul class="update-reasons">${runeList}</ul><p>一般符文沒有直接數值改動；52 枚符文原值保留。</p></div><div><strong>51 份打野配置</strong><p>重擊野怪燃燒降至每秒22–162；主動600／1000／1400未改。清野時間與斬殺線分開，原技能圖示與配置保留。</p></div></div>
<p class="update-disclaimer">本輪為本站編輯初判，依官方改動與既有配置互動整理；未取得台服7.3a分路勝率樣本，不是官方Tier，也不代表所有技能成長表已重新實測。赫威未確認的完整成長數值保留待核對標示。原版型、ARAM、找隊友與會員功能保留。</p>
</div>`;
let home=execFileSync('git',['show',audit.baseCommit+':summoners-rift.html'],{encoding:'utf8',maxBuffer:10*1024*1024});
function prependPanel(id,nextId,body,title){
  // Match the actual section opening, independently of attribute ordering.
  const tag=[...home.matchAll(/<section\b[^>]*>/g)].find(m=>m[0].includes(`id="${id}"`));
  if(!tag)throw new Error('Missing panel '+id);
  const next=[...home.matchAll(/<section\b[^>]*>/g)].find(m=>m[0].includes(`id="${nextId}"`));
  const end=home.lastIndexOf('</section>',next.index),innerStart=tag.index+tag[0].length;
  const history=home.slice(innerStart,end);
  home=home.slice(0,innerStart)+body+`<details class="official-history-item update-history-v115"><summary>${title}</summary><div class="official-history-content"><p class="update-note">歷史紀錄依當時版本保留，不代表7.3a現行配置。</p>${history}</div></details>`+home.slice(end);
}
prependPanel('homeUpdateSite','homeUpdateChampions',currentSite,'7.3 與更早本站更新（歷史紀錄）');
prependPanel('homeUpdateOfficial','homeUpdateSite',currentOfficial,'7.3 與更早公告（歷史紀錄）');
home=home.replace('</head>','<link rel="stylesheet" href="assets/css/updates-v115.css?v=115.0.0">\n</head>')
 .replace('class="shell home-update-center"','class="shell home-update-center" id="updates"')
 .replace(/<section class="shell" aria-label="7.3 更新進度">[\s\S]*?<\/section>/,'<section class="shell" aria-label="7.3a 更新進度"><p><strong>7.3a 第一次校正：</strong>142位英雄、203份位置攻略完成改版差異複核；<a href="#updates">官方數值與本站升降卡片</a>已更新。Tier首輪暫定，歷史公告收合保留。</p></section>')
 .replaceAll('heroes.json?v=114.0.0','heroes.json?v=115.0.0');
fs.writeFileSync('summoners-rift.html',home);
// Only refresh current headings and cache keys, not historical text.
function edit(file,fn){const old=fs.readFileSync(file,'utf8');fs.writeFileSync(file,fn(old));}
edit('assets/js/heroes.js',s=>s.replace(/7\.3 (公開資料(?:與配置)?校正|公開資料已校正|出裝、符文與官方差異校正|已校正|五路公開資料校正|已複核)/g,'7.3a 首輪差異校正')
 .replaceAll('PATCH 7.3 ·','PATCH 7.3a ·').replace('hero.officialReview114?\'7.3a 首輪差異校正／評級暫定\'',"hero.patch73aReview?'7.3a 第一次校正／評級暫定'")
 .replaceAll('heroes.json?v=114.0.0','heroes.json?v=115.0.0').replaceAll('hwei-profile.json?v=114.0.0','hwei-profile.json?v=115.0.0')
 .replaceAll('items-7.3.json?v=108.0.0','items-7.3.json?v=115.0.0').replaceAll('spells.json?v=110.0.0','spells.json?v=115.0.0'));
edit('assets/js/app.js',s=>s.replaceAll('heroes.json?v=114.0.0','heroes.json?v=115.0.0'));
for(const f of ['summoners-rift.html','pages/heroes.html','pages/items.html','pages/runes.html','pages/spells.html','pages/patch.html'])edit(f,s=>s
 .replaceAll('激鬥峽谷7.3：142位英雄、203份位置攻略完成本輪公開資料校正','激鬥峽谷7.3a：142位英雄、203份位置攻略完成第一次改版差異複核')
 .replaceAll('激鬥峽谷 · 7.3 公開資料校正','激鬥峽谷 · 7.3a 第一次校正')
 .replaceAll('7.3 裝備依七類','7.3a 裝備依七類').replaceAll('7.3 裝備資料庫','7.3a 裝備資料庫')
 .replaceAll('7.3 召喚師技能：','7.3a 召喚師技能：')
 .replace('依關鍵符文與四大副系查詢 52 枚現行符文；','7.3a 未直接調整一般符文數值，以下保留已核對的 7.3 數值。依關鍵符文與四大副系查詢 52 枚現行符文；')
 .replace(/(assets\/js\/(?:heroes|app|items-final|spells-v21)\.js)\?v=[\d.]+/g,'$1?v=115.0.0'));
edit('pages/patch.html',s=>s.includes('v115｜')?s:s.replace('<section class="empty"><strong>v114｜',`<section class="empty"><strong>v115｜7.3a 第一次校正｜2026/10/01</strong><p>${esc(audit.scope)} 8組Tier暫定升降、4份預設出裝與4份符文搭配調整；一般符文沒有官方直接改值。恢復頭像數值公告與升降卡片，舊紀錄收合。未重寫ARAM、會員或找隊友功能。</p><a href="../summoners-rift.html#updates">查看本次官方數值與本站更新</a></section><section class="empty"><strong>v114｜`));
console.log('Rendered 12 official hero cards, 4 item cards, 8 tier cards; both histories retained.');
