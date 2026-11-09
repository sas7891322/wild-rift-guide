import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const text = (file) => fs.readFileSync(file, 'utf8');
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };

const data = read('assets/data/aram/heroes.json');
const manifest = read('assets/data/calibration-7.2d-aram-v93.json');
const items = read('assets/data/items.json').items;
const runes = Object.values(read('assets/data/runes.json')).flat();
const spells = read('assets/data/spells.json');
const patch = read('assets/data/patch.json');
const itemById = new Map(items.map((item) => [item.id, item]));
const runeById = new Map(runes.map((rune) => [rune.id, rune]));
const spellById = new Map(spells.map((spell) => [spell.id, spell]));
const heroById = new Map(data.heroes.map((hero) => [hero.id, hero]));

expect(data.schemaVersion === 5, `unexpected schema version ${data.schemaVersion}`);
expect(data.gameVersion === '7.2d' && data.standardGameVersion === '7.2d', 'standard ARAM version is not 7.2d');
expect(data.aaaGameVersion === '7.2b', 'AAA ARAM version separation is missing');
expect(data.dataVersion === '7.2d-v93-standard-aram-full-calibration', `unexpected data version ${data.dataVersion}`);
expect(data.updated === '2026-09-01', `unexpected update date ${data.updated}`);
expect(data.heroes.length === 141, `hero count is ${data.heroes.length}, expected 141`);
expect(new Set(data.heroes.map((hero) => hero.id)).size === 141, 'ARAM hero IDs are not unique');
expect(data.standardGuideCount === 141 && data.detailGuideCount === 141, 'standard guide counts are incorrect');
expect(data.aaaGuideCount === 140 && data.heroes.filter((hero) => hero.aaaAram).length === 140, 'AAA guide preservation count is incorrect');

const computedTierCounts = Object.fromEntries(data.tierOrder.map((tier) => [tier, data.heroes.filter((hero) => hero.tier === tier).length]));
expect(JSON.stringify(computedTierCounts) === JSON.stringify({ 'S+': 30, S: 48, A: 53, B: 10 }), `unexpected Tier counts ${JSON.stringify(computedTierCounts)}`);
expect(JSON.stringify(data.tierCounts) === JSON.stringify(computedTierCounts), 'stored Tier counts do not match profiles');

const expectedTiers = { syndra: 'S+', jinx: 'S+', caitlyn: 'S+', mordekaiser: 'S', nilah: 'B', chogath: 'S' };
for (const [id, tier] of Object.entries(expectedTiers)) expect(heroById.get(id)?.tier === tier, `${id}: expected Tier ${tier}`);

const expectedBalances = {
  rakan: ['105%', '90%'],
  nocturne: ['100%', '75%'],
  lissandra: ['100%', '90%'],
  chogath: ['100%', '100%']
};
for (const [id, [dealt, taken]] of Object.entries(expectedBalances)) {
  const balance = heroById.get(id)?.balance;
  expect(balance?.damageDealt === dealt && balance?.damageTaken === taken, `${id}: balance must be ${dealt}/${taken}`);
}

for (const hero of data.heroes) {
  expect(hero.detailReady === true, `${hero.id}: detail guide is not ready`);
  expect(hero.reviewedAt === '2026-09-01', `${hero.id}: review date is missing`);
  expect(hero.tierListVersion === 'v93', `${hero.id}: Tier version is not v93`);
  expect(hero.reviewStatus === 'aram-v93-7.2d-full-audit', `${hero.id}: review marker is missing`);
  expect(hero.standardAramAudit?.version === 'v93', `${hero.id}: standard audit object is missing`);
  expect(String(hero.sourceNote).includes('v93 7.2d 標準 ARAM 全量校正'), `${hero.id}: source audit note is missing`);
  expect((hero.starterItems || []).length === 1, `${hero.id}: starter item count must equal 1`);
  expect((hero.items || []).length === 5, `${hero.id}: item count must equal 5`);
  expect((hero.boots || []).length === 2, `${hero.id}: boot count must equal 2`);
  expect((hero.runes || []).length === 5, `${hero.id}: rune count must equal 5`);
  expect((hero.spells || []).length === 2, `${hero.id}: spell count must equal 2`);
  expect((hero.situationalItems || []).length === 3, `${hero.id}: situational item count must equal 3`);
  expect((hero.skillIcons || []).length === 3, `${hero.id}: skill icon count must equal 3`);

  for (const field of ['starterItems', 'items', 'boots', 'situationalItems']) {
    for (const entry of hero[field] || []) {
      const canonical = itemById.get(entry.id);
      expect(Boolean(canonical), `${hero.id}/${field}: unknown item ${entry.id}`);
      expect(canonical?.name === entry.name, `${hero.id}/${field}: ${entry.id} name mismatch (${entry.name})`);
      expect(fs.existsSync(entry.icon), `${hero.id}/${field}: missing icon ${entry.icon}`);
    }
  }
  for (const rune of hero.runes || []) {
    const canonical = runeById.get(rune.id);
    expect(Boolean(canonical), `${hero.id}: unknown rune ${rune.id}`);
    expect(canonical?.name === rune.name, `${hero.id}: ${rune.id} rune name mismatch (${rune.name})`);
    expect(fs.existsSync(rune.icon), `${hero.id}: missing rune icon ${rune.icon}`);
  }
  for (const spell of hero.spells || []) {
    if (spell.id === 'snowball-chariot') {
      expect(spell.name === '雪球戰車', `${hero.id}: snowball spell name is wrong`);
    } else {
      const canonical = spellById.get(spell.id);
      expect(Boolean(canonical), `${hero.id}: unknown spell ${spell.id}`);
      expect(canonical?.name === spell.name, `${hero.id}: ${spell.id} spell name mismatch (${spell.name})`);
    }
    expect(fs.existsSync(spell.icon), `${hero.id}: missing spell icon ${spell.icon}`);
  }
  expect(fs.existsSync(hero.avatar), `${hero.id}: missing portrait ${hero.avatar}`);
  for (const icon of hero.skillIcons || []) expect(fs.existsSync(icon), `${hero.id}: missing skill icon ${icon}`);
}

expect(data.heroes.filter((hero) => hero.spells.some((spell) => spell.id === 'snowball-chariot')).length === 73, 'snowball recommendation count must equal 73');
expect(heroById.get('chogath')?.aaaAram === undefined, 'Cho’Gath must not claim an unreviewed AAA profile');
expect(heroById.get('chogath')?.items.map((item) => item.name).join('|') === '雄心之鋼|日炎聖盾|好戰者鎧甲|雅瑪蘭守護像|黎明法衣', 'Cho’Gath build is incorrect');
expect(heroById.get('syndra')?.items[1]?.name === '雷霆風暴', 'Syndra 7.2d build is missing Stormsurge');
expect(heroById.get('vladimir')?.items.slice(0, 2).map((item) => item.name).join('|') === '海克斯科技火箭腰帶|峽谷製造者', 'Vladimir 7.2d core is incorrect');
expect(heroById.get('pantheon')?.items[1]?.name === '夜色緣界', 'Pantheon must use Edge of Night second');
expect(heroById.get('yuumi')?.items[2]?.name === '米凱的祝福', 'Yuumi must use Mikael third');
expect(heroById.get('leona')?.items[1]?.name === '日炎聖盾', 'Leona still has the legacy Sunfire item');

expect(manifest.scope?.profilesReviewed === 141 && manifest.scope?.aaaProfilesPreserved === 140, 'manifest scope counts are incorrect');
expect(manifest.tierChanges?.length === 5 && manifest.balanceCorrections?.length === 3, 'manifest change counts are incorrect');
expect(manifest.patchAffectedReview?.length === 22, 'patch-affected review must contain 22 heroes');
expect(manifest.normalization?.snowballRecommendations === 73, 'manifest snowball count is incorrect');

expect(patch.version === '7.2d' && patch.updated === '2026-09-01' && patch.siteVersion === 'v93', 'patch.json is not on v93');
expect(patch.dataVersion === '7.2d-v92-settled-meta-calibration', 'Summoner’s Rift v92 data version changed unexpectedly');
expect(patch.aramDataVersion === data.dataVersion, 'patch.json ARAM data version differs');

const aramPage = text('aram.html');
const aramHeroPage = text('aram-hero.html');
const aramScript = text('assets/js/aram.js');
const aramHeroScript = text('assets/js/aram-hero.js');
const home = text('summoners-rift.html');
const modeHome = text('index.html');
const patchPage = text('pages/patch.html');
expect(aramPage.includes('標準 ARAM 7.2d｜141 位完整攻略') && aramPage.includes('aram.js?v=93.0.0'), 'ARAM landing page v93 markers are missing');
expect(aramHeroPage.includes('141 位') && aramHeroPage.includes('aram-hero.js?v=93.0.0'), 'ARAM hero page v93 markers are missing');
expect(aramScript.includes('heroes.json?v=93.0.0'), 'ARAM list cache key is not v93');
expect(aramHeroScript.includes('heroes.json?v=93.0.0') && aramHeroScript.includes('standardVersion') && aramHeroScript.includes('aaaVersion'), 'ARAM hero version separation is missing');
expect(!aramHeroScript.includes('7.2b 基準'), 'hardcoded standard ARAM 7.2b balance label remains');
expect(home.includes('本站 7.2d 標準 ARAM 全量校正') && home.includes('v93'), 'homepage v93 site update panel is missing');
expect(patchPage.indexOf('Patch 7.2d｜v93 標準 ARAM 全量校正') >= 0, 'patch page v93 entry is missing');
expect(patchPage.indexOf('Patch 7.2d｜v93 標準 ARAM 全量校正') < patchPage.indexOf('Patch 7.2d｜v92 版本沉澱校正'), 'v93 patch entry is not newest');

for (const [file, html] of [['index.html', modeHome], ['summoners-rift.html', home]]) {
  const banner = html.match(/<section class="site-announcement"[\s\S]*?<\/section>/)?.[0] || '';
  expect(banner.includes('href="pages/players.html"'), `${file}: player-finder banner link is missing`);
  expect(banner.includes('找固定隊友，不再只能靠單排'), `${file}: player-finder banner copy is missing`);
  expect(!banner.includes('科加斯'), `${file}: Cho’Gath announcement remains in the top banner`);
}

const preservedHashes = {
  'assets/data/heroes.json': '831dfcad761c9d312a9fc9e3c202fdb13ccd3cd9bb097e8ec56a87e0d21030e5',
  'assets/data/items.json': '6c67076942b5c1f3952a2fa428cd38af70b1c81e0a50408eb617b3a6385ee147',
  'assets/data/runes.json': 'c7c663f5e28e82f2099d2ffcf0ae6634a4f8353c2654fc0f563ec0a6e4393598',
  'assets/data/spells.json': '6ac2b96ee1c28328d8473a5f07dd6f4f651a5c537ffef6cdb55f4fda68b07535',
  'pages/players.html': '8a5f945aac51303d1e27de770a9d2b458695a28ba6d0ad06d29d0bc9baa2c06d',
  'assets/js/players.js': 'c7f8b94bb287d57c657030237f1554155e6716bd7d64dc25322c9e853b10dfc0',
  'supabase/wild-rift-guide-v91-player-finder.sql': '62845806ed270e17fba0c3446b2334ab772d1e1807b6a292f756b3a64a3aa8a8',
  'supabase/wild-rift-guide-v91-player-finder-check.sql': 'a15daf392fca83163a8d908ba1205f0b8d91d28fb083cf26735546c88ab7b2e8'
};
for (const [file, expected] of Object.entries(preservedHashes)) expect(sha256(file) === expected, `${file}: preserved v91/v92 file changed unexpectedly`);

expect(text('README.md').startsWith('# Wild Rift Guide v93｜7.2d 標準 ARAM 全量校正'), 'README v93 instructions are missing');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  version: data.dataVersion,
  profilesReviewed: data.standardGuideCount,
  tierCounts: data.tierCounts,
  tierChanges: manifest.tierChanges.length,
  balanceCorrections: manifest.balanceCorrections.length,
  snowballRecommendations: manifest.normalization.snowballRecommendations,
  dataReferences: 'valid',
  aaaProfiles: '140 preserved on independent 7.2b data',
  summonersRiftV92: 'preserved',
  playerFinderV91: 'preserved',
  playerFinderBanner: 'active'
}, null, 2));
