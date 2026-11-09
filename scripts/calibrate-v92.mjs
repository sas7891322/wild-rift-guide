import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PATCH = '7.2d';
const SITE_VERSION = 'v92';
const VERSION = '7.2d-v92-settled-meta-calibration';
const REVIEWED_AT = '2026-08-31';

const readText = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const writeText = (relativePath, content) => fs.writeFileSync(path.join(ROOT, relativePath), content);
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const writeJson = (relativePath, value) => writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`);

const heroesData = readJson('assets/data/heroes.json');
const itemsData = readJson('assets/data/items.json');
const patchData = readJson('assets/data/patch.json');

const tierChanges = [
  { profileId: 'syndra-mid', from: 'A', to: 'S+', name: '星朵拉', role: '中路', avatar: 'syndra.webp', direction: 'up' },
  { profileId: 'veigar-mid', from: 'B', to: 'A', name: '維迦', role: '中路', avatar: 'veigar.webp', direction: 'up' },
  { profileId: 'zyra-mid', from: 'B', to: 'A', name: '枷蘿', role: '中路', avatar: 'zyra.webp', direction: 'up' },
  { profileId: 'veigar-support', from: 'B', to: 'C', name: '維迦', role: '輔助', avatar: 'veigar.webp', direction: 'down' },
  { profileId: 'vi-jungle', from: 'S', to: 'S+', name: '菲艾', role: '打野', avatar: 'vi.webp', direction: 'up' },
  { profileId: 'jax-baron', from: 'S', to: 'S+', name: '賈克斯', role: '巴龍路', avatar: 'jax.webp', direction: 'up' },
  { profileId: 'volibear-baron', from: 'S', to: 'S+', name: '弗力貝爾', role: '巴龍路', avatar: 'volibear.webp', direction: 'up' },
  { profileId: 'ahri-mid', from: 'S', to: 'S+', name: '阿璃', role: '中路', avatar: 'ahri.webp', direction: 'up' },
  { profileId: 'yunara', from: 'S', to: 'S+', name: '尤娜拉', role: '飛龍路', avatar: 'yunara.webp', direction: 'up' },
];

const evidence = {
  'syndra-mid': '官方增強後，中國服鑽石以上勝率與分路評級均進入版本第一梯隊。',
  'veigar-mid': 'Q 射程增強改善對線與疊層安全，分路評級升至 A，但整體數據尚不足以列入 S。',
  'zyra-mid': '中國服中路勝率與分路榜單交叉結果均高於原 B 級。',
  'veigar-support': '版本增強主要改善中路發育，輔助勝率與分路評級仍落在較低區間。',
  'vi-jungle': '中國服打野數據與兩份版本榜單均位於第一梯隊。',
  'jax-baron': '巴龍路數據與分路榜單均位於第一梯隊。',
  'volibear-baron': '巴龍路數據與分路榜單均位於第一梯隊。',
  'ahri-mid': '中路數據與分路榜單均位於第一梯隊。',
  yunara: '飛龍路數據與分路榜單均位於第一梯隊。',
};

const profileById = new Map(heroesData.heroes.map((profile) => [profile.id, profile]));
for (const change of tierChanges) {
  const profile = profileById.get(change.profileId);
  if (!profile) throw new Error(`Missing profile: ${change.profileId}`);
  if (![change.from, change.to].includes(profile.tier)) {
    throw new Error(`${change.profileId}: expected Tier ${change.from} or ${change.to}, got ${profile.tier}`);
  }
  profile.tier = change.to;
  profile.reviewedAt = REVIEWED_AT;
  profile.metaCalibrationAudit = 'v92-7.2d-settled-meta-calibration';
  profile.settledMetaCalibration = {
    patch: PATCH,
    siteVersion: SITE_VERSION,
    reviewedAt: REVIEWED_AT,
    scope: change.profileId === 'zyra-mid' ? ['tier', 'runes', 'matchupAdjustments'] : ['tier'],
    outcome: 'updated',
    evidence: evidence[change.profileId],
  };
  profile.sourceNote = `${String(profile.sourceNote || '').replace(/｜v92：.*$/u, '').replace(/\s+$/u, '')}｜v92：7.2d 上線五日後進行版本沉澱校正，${evidence[change.profileId]} Tier ${change.from}→${change.to}。`;
}

const zyra = profileById.get('zyra-mid');
zyra.runes = zyra.runes.map((id) => id === 'cut-down' ? 'bone-plating' : id);
if (new Set(zyra.runes).size !== 5) throw new Error('zyra-mid: v92 runes must contain five unique entries');
const zyraSituations = new Map(zyra.matchupAdjustments.situations.map((entry) => [entry.id, entry]));
const burst = zyraSituations.get('burst');
const cc = zyraSituations.get('cc');
const tank = zyraSituations.get('tank');
if (!burst || !cc || !tank) throw new Error('zyra-mid: required matchup situations are missing');
burst.changes = burst.changes.filter((change) => !(change.type === 'rune' && change.fromId === 'cut-down' && change.toId === 'bone-plating'));
burst.warning = '標準符文已使用骨甲；面對刺客時不必再額外替換符文。';
for (const change of cc.changes) {
  if (change.type === 'rune' && change.toId === 'perseverance') change.fromId = 'bone-plating';
}
tank.changes = tank.changes.filter((change) => !(change.type === 'rune' && change.fromId === 'bone-plating' && change.toId === 'cut-down'));
tank.changes.push({
  type: 'rune',
  title: '高生命前排處理',
  fromId: 'bone-plating',
  toId: 'cut-down',
  condition: '敵方有兩名以上高生命前排，且你不容易被刺客直接貼近時。',
  reason: '斷切提高對高生命目標的持續傷害；只有生存壓力較低時才換掉骨甲。',
});
tank.keepTitle = '核心裝備維持';
tank.keepText = '黑焰火炬、黎安卓與瑞萊的持續傷害及控場核心不變。';

// heroCatalog is the single source used by every lane list and must match the detail profiles.
for (const catalogHero of heroesData.heroCatalog) {
  for (const role of catalogHero.roles || []) {
    const profile = profileById.get(role.detailHeroId);
    if (profile) role.tier = profile.tier;
  }
}

const note = 'v92：7.2d 版本沉澱校正；上線五日後複查 141 位英雄／202 份位置配置，調整 9 組 Tier；枷蘿中路預設副系改為骨甲，斷切保留為坦克多情境。';
heroesData.notes = [note, ...heroesData.notes.filter((entry) => !String(entry).startsWith('v92：'))];
heroesData.version = VERSION;
heroesData.updated = REVIEWED_AT;
heroesData.roleAudit.status = 'updated-v92';
heroesData.roleAudit.settledMetaCalibration = PATCH;
heroesData.roleAudit.settledMetaCalibrationCheckedAt = REVIEWED_AT;
heroesData.stageLocks.patch72dSettledMetaCalibration = {
  status: 'completed',
  version: SITE_VERSION,
  checkedAt: REVIEWED_AT,
  profilesReviewed: 202,
  profilesUpdated: tierChanges.length,
  tierChanges: tierChanges.length,
  runeChanges: 1,
  scope: ['Tier', '版本沉澱數據', '枷蘿中路符文與五類對局調整'],
};
heroesData.calibration = {
  patch: PATCH,
  version: SITE_VERSION,
  reviewedAt: REVIEWED_AT,
  baseCalibration: { version: 'v90', reviewedAt: '2026-08-27', profilesReviewed: 202 },
  uniqueHeroesReviewed: 141,
  profilesReviewed: 202,
  profilesUpdated: tierChanges.length,
  profilesRetained: 202 - tierChanges.length,
  tierChanges: tierChanges.map(({ profileId, from, to }) => ({ profileId, from, to })),
  runeChanges: [{ profileId: 'zyra-mid', from: 'cut-down', to: 'bone-plating', situational: 'cut-down-vs-high-health-frontline' }],
  watchlist: ['gwen-jungle', 'thresh-support', 'caitlyn', 'vladimir-mid', 'vladimir-baron', 'fiora-baron', 'renekton-baron', 'yuumi-support', 'yone-baron', 'yone-mid', 'yone-jungle'],
  methodology: '以 v90 全英雄配置為基準，於 7.2d 上線五日後交叉比對官方更新、中國服每日排位數據、分路攻略榜與第二份中國服 Meta 榜；來源衝突者維持原 Tier。',
};

itemsData.version = VERSION;
itemsData.notes = `${String(itemsData.notes).replace(/｜v92：.*$/u, '')}｜v92：裝備數值沿用 v90 已完成的 7.2d 官方校正，本次未改動裝備內容。`;

patchData.version = PATCH;
patchData.updated = REVIEWED_AT;
patchData.dataVersion = VERSION;
patchData.notes = [
  'v92 7.2d 版本沉澱校正：上線五日後複查 141 位英雄／202 份位置配置，調整 9 組 Tier；枷蘿中路預設符文改為骨甲，斷切保留為坦克多情境。',
  ...patchData.notes.filter((entry) => !String(entry).startsWith('v92 ')),
];

const calibrationReport = {
  patch: PATCH,
  siteVersion: SITE_VERSION,
  reviewedAt: REVIEWED_AT,
  baseVersion: 'v90-full-profile-calibration',
  audit: {
    uniqueHeroes: 141,
    profiles: 202,
    updatedProfiles: tierChanges.length,
    retainedProfiles: 202 - tierChanges.length,
    tierChanges: tierChanges.length,
    runeChanges: 1,
    requiredShape: '5 items + 2 boot/active slots + 5 runes + 2 spells + 5 matchup situations',
  },
  tierChanges: tierChanges.map(({ profileId, from, to }) => ({ profileId, from, to })),
  runeChanges: [
    {
      profileId: 'zyra-mid',
      from: 'cut-down',
      to: 'bone-plating',
      situation: '坦克多時由骨甲換回斷切；控制多時由骨甲換成堅毅',
    },
  ],
  retainedWatchlist: [
    { profileId: 'gwen-jungle', tier: 'A', reason: '不同來源評級落差大，暫不二次調整' },
    { profileId: 'thresh-support', tier: 'S', reason: '高選取／禁用但勝率未達 S+，維持 v90 校正' },
    { profileId: 'caitlyn', tier: 'B', reason: '7.2d 增強後仍未穩定進入 A' },
    { profileId: 'vladimir-mid', tier: 'B', reason: '增強後數據尚未穩定' },
    { profileId: 'vladimir-baron', tier: 'B', reason: '增強後數據尚未穩定' },
    { profileId: 'fiora-baron', tier: 'A', reason: '高操作與對局依賴，維持 A' },
    { profileId: 'renekton-baron', tier: 'A', reason: '分路評級仍為 A' },
    { profileId: 'yuumi-support', tier: 'B', reason: '高禁用但整體勝率偏低，維持 B' },
  ],
  evidenceSnapshot: {
    sourceScope: 'China ranked, Diamond+, all roles where applicable',
    syndraMidWinRate: 53.05,
    zyraMidWinRate: 52.68,
    viJungleWinRate: 52.25,
    jaxBaronWinRate: 51.92,
    volibearBaronWinRate: 51.5,
    ahriMidWinRate: 51.44,
    yunaraDuoWinRate: 50.98,
    veigarMidWinRate: 48.63,
    veigarSupportWinRate: 48.68,
  },
  sources: [
    'https://wildrift.leagueoflegends.com/zh-tw/news/game-updates/wild-rift-patch-notes-7-2d/',
    'https://www.wildriftfire.com/stats',
    'https://www.wildriftfire.com/tier-list',
    'https://wildlegends.net/tier-list',
  ],
};

writeJson('assets/data/heroes.json', heroesData);
writeJson('assets/data/items.json', itemsData);
writeJson('assets/data/patch.json', patchData);
writeJson('assets/data/calibration-7.2d-v92.json', calibrationReport);

const tierCards = tierChanges.map((change) => {
  const arrow = change.direction === 'up' ? '↑' : '↓';
  return `          <a class="tier-change-card tier-${change.direction}" href="pages/heroes.html?hero=${change.profileId}" aria-label="查看${change.name}${change.role}攻略，Tier 由 ${change.from} 調整為 ${change.to}"><span class="tier-change-avatar-wrap"><img src="assets/images/heroes/portraits/${change.avatar}" alt="${change.name}" loading="lazy"><i class="tier-change-arrow" aria-hidden="true">${arrow}</i></span><span class="tier-change-name">${change.name}<small>${change.role}</small></span><span class="tier-change-ranks"><del>${change.from}</del><em>→</em><strong>${change.to}</strong></span></a>`;
}).join('\n');

let home = readText('summoners-rift.html');
const sitePanelStart = home.indexOf('    <section class="home-update-panel" role="tabpanel" id="homeUpdateSite"');
const championsPanelStart = home.indexOf('    <section class="home-update-panel" role="tabpanel" id="homeUpdateChampions"');
if (sitePanelStart < 0 || championsPanelStart < 0 || championsPanelStart <= sitePanelStart) throw new Error('Unable to locate homepage site update panel');
const sitePanel = `    <section class="home-update-panel" role="tabpanel" id="homeUpdateSite" aria-labelledby="homeUpdateSiteTab" data-home-update-panel="site" hidden>
      <div class="home-update-heading"><div><span class="kicker">WILD RIFT GUIDE · 2026/08/31</span><h3>本站 7.2d 版本沉澱校正</h3></div><span class="home-update-badge ready">v92</span></div>
      <p class="home-update-lead">7.2d 上線五日後再次複查 141 位英雄、202 份位置配置；依官方更新、中國服每日排位數據與兩份分路榜單，完成 9 組 Tier 及 1 組中路符文校正。</p>

      <div class="site-review-grid" data-site-review-accordions>
        <div class="site-review-item">
          <button class="site-review-toggle" type="button" data-site-review-toggle aria-expanded="false" aria-controls="siteReviewV92Audit"><strong>202 份配置再次複查</strong><span>保留 v90 全量校正基準</span></button>
          <div class="site-review-inline-panel site-review-database-panel" id="siteReviewV92Audit" data-site-review-panel hidden><strong>版本沉澱後的第二輪判斷</strong><p>本次不重寫已正確的出裝與技能資料，只調整已有足夠數據支持的 Tier 與枷蘿中路符文；找隊友 v91 功能完整保留。</p></div>
        </div>
        <div class="site-review-item">
          <button class="site-review-toggle" type="button" data-site-review-toggle aria-expanded="false" aria-controls="siteReviewV92Tier"><strong>9 組 Tier 校正</strong><span>8 組上調 · 1 組下調</span></button>
          <div class="site-review-inline-panel" id="siteReviewV92Tier" data-site-review-panel hidden><div class="site-review-hero-links">
            <a href="pages/heroes.html?hero=syndra-mid"><strong>星朵拉</strong><span>中路 · A→S+</span></a>
            <a href="pages/heroes.html?hero=veigar-mid"><strong>維迦</strong><span>中路 · B→A</span></a>
            <a href="pages/heroes.html?hero=zyra-mid"><strong>枷蘿</strong><span>中路 · B→A</span></a>
            <a href="pages/heroes.html?hero=veigar-support"><strong>維迦</strong><span>輔助 · B→C</span></a>
          </div></div>
        </div>
        <div class="site-review-item">
          <button class="site-review-toggle" type="button" data-site-review-toggle aria-expanded="false" aria-controls="siteReviewV92Rune"><strong>枷蘿中路符文校正</strong><span>骨甲預設 · 斷切改為情境</span></button>
          <div class="site-review-inline-panel site-review-database-panel" id="siteReviewV92Rune" data-site-review-panel hidden><strong>提高單排穩定性</strong><p>第五枚預設符文由斷切改為骨甲；敵方坦克多且生存壓力較低時再換回斷切，控制多時可改成堅毅。</p></div>
        </div>
        <div class="site-review-item">
          <button class="site-review-toggle" type="button" data-site-review-toggle aria-expanded="false" aria-controls="siteReviewV92Retained"><strong>其餘配置保留</strong><span>來源衝突者不硬改</span></button>
          <div class="site-review-inline-panel site-review-database-panel" id="siteReviewV92Retained" data-site-review-panel hidden><strong>持續觀察名單</strong><p>關打野 A、瑟雷西輔助 S、凱特琳 B、弗拉迪米爾雙位置 B、菲歐拉 A、雷尼克頓 A 與悠咪 B 目前維持。</p></div>
        </div>
      </div>

      <div class="site-tier-section">
        <div class="official-change-title"><strong>7.2d 第二輪 Tier 變動</strong><span>點英雄可看攻略</span></div>
        <div class="tier-change-grid">
${tierCards}
        </div>
      </div>

      <p class="site-tier-note">關打野目前不同來源落差仍大，因此維持 A；凱特琳、弗拉迪米爾、悠咪等受 7.2d 增強英雄也不因單一數據直接升級。</p>
      <a class="home-update-more" href="pages/patch.html">查看本站版本紀錄 →</a>
    </section>

`;
home = `${home.slice(0, sitePanelStart)}${sitePanel}${home.slice(championsPanelStart)}`;
home = home.replaceAll('assets/data/heroes.json?v=90.0.0', 'assets/data/heroes.json?v=92.0.0');
home = home.replace('assets/css/style.css?v=87.3.1', 'assets/css/style.css?v=92.0.0');
home = home.replace('assets/js/app.js?v=79.5.1', 'assets/js/app.js?v=92.0.0');
writeText('summoners-rift.html', home);

let patchPage = readText('pages/patch.html');
if (!patchPage.includes('Patch 7.2d｜v92 版本沉澱校正')) {
  const firstHistory = patchPage.indexOf('<section class="empty">');
  if (firstHistory < 0) throw new Error('Unable to locate patch history insertion point');
  const v92Section = `<section class="empty"><strong>Patch 7.2d｜v92 版本沉澱校正｜2026/08/31</strong><br/><br/>
<strong>第二輪複查：</strong>7.2d 上線五日後再次檢查 141 位英雄、202 份位置配置；以 v90 全量校正為基準，交叉比對官方調整、中國服每日排位數據與分路榜單。<br/><br/>
<strong>Tier 校正：</strong>星朵拉中路 A→S+；維迦中路 B→A、輔助 B→C；枷蘿中路 B→A；菲艾打野、賈克斯巴龍路、弗力貝爾巴龍路、阿璃中路及尤娜拉飛龍路 S→S+。<br/><br/>
<strong>符文校正：</strong>枷蘿中路第五枚預設符文由斷切改為骨甲；坦克多且生存壓力較低時換回斷切，控制多時可改成堅毅。<br/><br/>
<strong>保守保留：</strong>關打野 A、瑟雷西輔助 S、凱特琳 B、弗拉迪米爾雙位置 B、菲歐拉 A、雷尼克頓 A 與悠咪 B 暫不調整；找隊友 v91 功能與資料庫設定完整保留。</section>
`;
  patchPage = `${patchPage.slice(0, firstHistory)}${v92Section}${patchPage.slice(firstHistory)}`;
}
writeText('pages/patch.html', patchPage);

let heroesScript = readText('assets/js/heroes.js');
heroesScript = heroesScript.replaceAll('7.2c', '7.2d').replaceAll('7.2C', '7.2D');
heroesScript = heroesScript.replaceAll('200 份完整位置攻略', '202 份英雄位置配置');
heroesScript = heroesScript.replaceAll('2026-08-21', REVIEWED_AT).replaceAll('90.0.0', '92.0.0');
writeText('assets/js/heroes.js', heroesScript);

let heroesPage = readText('pages/heroes.html');
heroesPage = heroesPage.replaceAll('PATCH 7.2C', 'PATCH 7.2D').replaceAll('heroes.js?v=90.0.0', 'heroes.js?v=92.0.0');
writeText('pages/heroes.html', heroesPage);

writeText('assets/js/app.js', readText('assets/js/app.js').replace("assets/data/heroes.json?v=79.5.1", "assets/data/heroes.json?v=92.0.0"));
writeText('assets/js/member.js', readText('assets/js/member.js').replace("../assets/data/heroes.json?v=79.5.1", "../assets/data/heroes.json?v=92.0.0"));
writeText('pages/member.html', readText('pages/member.html').replace('member.js?v=79.5.1', 'member.js?v=92.0.0'));

let css = readText('assets/css/style.css');
if (!css.includes('/* v92 tier direction colors */')) {
  css += `\n/* v92 tier direction colors */\n.tier-change-card.tier-up .tier-change-arrow{background:#42ad70;box-shadow:0 4px 12px rgba(66,173,112,.3)}\n.tier-change-card.tier-up .tier-change-ranks strong{color:#72d89a}\n.tier-change-card.tier-up .tier-change-ranks del{text-decoration-color:#72d89a}\n`;
}
writeText('assets/css/style.css', css);

let readme = readText('README.md');
if (!readme.startsWith('# Wild Rift Guide v92')) {
  const v92Readme = `# Wild Rift Guide v92｜7.2d 版本沉澱校正

本版更新：
- 7.2d 上線五日後再次複查 141 位英雄、202 份位置配置。
- 完成 9 組 Tier 校正：星朵拉、維迦雙位置、枷蘿、菲艾、賈克斯、弗力貝爾、阿璃、尤娜拉。
- 枷蘿中路預設第五枚符文由斷切改為骨甲；坦克多時保留斷切情境切換。
- 保留 v90 的全英雄出裝／符文資料基準與 v91 找隊友全部功能、SQL 及安全權限。

部署方式：
1. 解壓縮。
2. 將資料夾內所有檔案覆蓋到原本 GitHub Repository。
3. Commit / Push 後等待 Vercel 完成部署。
4. 本次沒有新增 SQL，不需要回到 Supabase 執行資料庫指令。

---

`;
  readme = `${v92Readme}${readme}`;
}
writeText('README.md', readme);

console.log(JSON.stringify({
  patch: PATCH,
  version: VERSION,
  profilesReviewed: 202,
  profilesUpdated: tierChanges.length,
  tierChanges: tierChanges.length,
  runeChanges: 1,
  playerFinderPreserved: true,
}, null, 2));
