import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const text = (file) => fs.readFileSync(file, 'utf8');
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const heroesData = read('assets/data/heroes.json');
const itemsData = read('assets/data/items.json');
const runesData = read('assets/data/runes.json');
const spellsData = read('assets/data/spells.json');
const patchData = read('assets/data/patch.json');
const calibration = read('assets/data/calibration-7.2d-v92.json');
const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };

const itemById = new Map(itemsData.items.map((item) => [item.id, item]));
const itemIds = new Set(itemById.keys());
const runeIds = new Set(Object.values(runesData).flat().map((rune) => rune.id));
const spellIds = new Set(spellsData.map((spell) => spell.id));

const expectIds = (profile, field, ids, length) => {
  const values = profile[field];
  expect(Array.isArray(values) && values.length === length, `${profile.id}: ${field} must contain ${length} entries`);
  if (!Array.isArray(values)) return;
  expect(new Set(values).size === values.length, `${profile.id}: ${field} contains duplicates`);
  for (const id of values) expect(ids.has(id), `${profile.id}: missing ${field} reference ${id}`);
};

for (const profile of heroesData.heroes) {
  expectIds(profile, 'items', itemIds, 5);
  expectIds(profile, 'coreItems', itemIds, 3);
  expectIds(profile, 'boots', itemIds, 2);
  expectIds(profile, 'runes', runeIds, 5);
  expectIds(profile, 'spells', spellIds, 2);
  expect(profile.coreItems.every((id) => profile.items.includes(id)), `${profile.id}: core item is not in standard items`);
  expect(itemById.get(profile.boots?.[0])?.stage === '二級鞋', `${profile.id}: first boot slot is not 二級鞋`);
  expect(['三級鞋', '高階裝備'].includes(itemById.get(profile.boots?.[1])?.stage), `${profile.id}: final boot/active slot is invalid`);
  expect(Array.isArray(profile.matchupAdjustments?.situations) && profile.matchupAdjustments.situations.length === 5, `${profile.id}: matchup situations must equal 5`);

  const standardItems = new Set([...(profile.items || []), ...(profile.boots || [])]);
  const standardRunes = new Set(profile.runes || []);
  const standardSpells = new Set(profile.spells || []);
  for (const situation of profile.matchupAdjustments?.situations || []) {
    for (const change of situation.changes || []) {
      if (change.type === 'item') {
        expect(standardItems.has(change.fromId), `${profile.id}/${situation.id}: item fromId ${change.fromId} is not standard`);
        expect(itemIds.has(change.toId), `${profile.id}/${situation.id}: missing item toId ${change.toId}`);
      } else if (change.type === 'rune') {
        expect(standardRunes.has(change.fromId), `${profile.id}/${situation.id}: rune fromId ${change.fromId} is not standard`);
        expect(runeIds.has(change.toId), `${profile.id}/${situation.id}: missing rune toId ${change.toId}`);
      } else if (change.type === 'spell') {
        expect(standardSpells.has(change.fromId), `${profile.id}/${situation.id}: spell fromId ${change.fromId} is not standard`);
        expect(spellIds.has(change.toId), `${profile.id}/${situation.id}: missing spell toId ${change.toId}`);
      }
    }
  }
}

const profileById = new Map(heroesData.heroes.map((profile) => [profile.id, profile]));
for (const catalogHero of heroesData.heroCatalog) {
  for (const role of catalogHero.roles || []) {
    const profile = profileById.get(role.detailHeroId);
    expect(Boolean(profile), `${catalogHero.id}/${role.roleId}: missing profile ${role.detailHeroId}`);
    if (profile) expect(profile.tier === role.tier, `${role.detailHeroId}: catalog Tier differs from profile Tier`);
  }
}

const expectedTiers = {
  'syndra-mid': 'S+',
  'veigar-mid': 'A',
  'zyra-mid': 'A',
  'veigar-support': 'C',
  'vi-jungle': 'S+',
  'jax-baron': 'S+',
  'volibear-baron': 'S+',
  'ahri-mid': 'S+',
  yunara: 'S+',
};
for (const [id, tier] of Object.entries(expectedTiers)) {
  const profile = profileById.get(id);
  expect(profile?.tier === tier, `${id}: expected Tier ${tier}`);
  expect(profile?.reviewedAt === '2026-08-31', `${id}: v92 review date is missing`);
  expect(profile?.metaCalibrationAudit === 'v92-7.2d-settled-meta-calibration', `${id}: v92 audit marker is missing`);
  expect(profile?.settledMetaCalibration?.outcome === 'updated', `${id}: v92 calibration outcome is missing`);
}

const zyra = profileById.get('zyra-mid');
expect(JSON.stringify(zyra?.runes) === JSON.stringify(['arcane-comet', 'botanist', 'transcendence', 'scorch', 'bone-plating']), 'zyra-mid: default runes are not the v92 set');
const zyraSituations = new Map(zyra.matchupAdjustments.situations.map((entry) => [entry.id, entry]));
expect(!zyraSituations.get('burst').changes.some((change) => change.type === 'rune' && change.toId === 'bone-plating'), 'zyra-mid/burst: redundant Bone Plating replacement remains');
expect(zyraSituations.get('cc').changes.some((change) => change.type === 'rune' && change.fromId === 'bone-plating' && change.toId === 'perseverance'), 'zyra-mid/cc: Perseverance situation is incorrect');
expect(zyraSituations.get('tank').changes.some((change) => change.type === 'rune' && change.fromId === 'bone-plating' && change.toId === 'cut-down'), 'zyra-mid/tank: Cut Down situation is missing');

const uniqueHeroes = new Set(heroesData.heroes.map((profile) => profile.baseId));
expect(heroesData.heroes.length === 202, `profile count is ${heroesData.heroes.length}, expected 202`);
expect(uniqueHeroes.size === 141, `unique hero count is ${uniqueHeroes.size}, expected 141`);
expect(heroesData.version === '7.2d-v92-settled-meta-calibration', `unexpected heroes version ${heroesData.version}`);
expect(itemsData.version === heroesData.version, 'items package version differs from heroes package version');
expect(patchData.version === '7.2d' && patchData.dataVersion === heroesData.version, 'patch.json no longer points to the v92 Summoner’s Rift data package');
expect(['2026-08-31', '2026-09-01'].includes(patchData.updated), `unexpected patch update date ${patchData.updated}`);
expect(calibration.audit?.profiles === 202 && calibration.audit?.updatedProfiles === 9, 'v92 calibration counts are incorrect');
expect(calibration.tierChanges?.length === 9 && calibration.runeChanges?.length === 1, 'v92 calibration change lists are incorrect');

const home = text('summoners-rift.html');
const patchPage = text('pages/patch.html');
const heroesPage = text('pages/heroes.html');
const heroesScript = text('assets/js/heroes.js');
const hasV93Overlay = patchData.siteVersion === 'v93';
expect(hasV93Overlay ? home.includes('本站 7.2d 標準 ARAM 全量校正') && home.includes('v93') : home.includes('本站 7.2d 版本沉澱校正') && home.includes('v92'), 'homepage latest update panel is missing');
expect((home.match(/tier-change-card tier-/g) || []).length === (hasV93Overlay ? 5 : 9), `homepage latest Tier card count is incorrect`);
expect(home.includes('heroes.json?v=92.0.0'), 'homepage heroes cache key is not v92');
expect(patchPage.indexOf('Patch 7.2d｜v92 版本沉澱校正') >= 0, 'patch page v92 entry is missing');
expect(hasV93Overlay ? patchPage.indexOf('Patch 7.2d｜v93 標準 ARAM 全量校正') < patchPage.indexOf('Patch 7.2d｜v92 版本沉澱校正') : patchPage.indexOf('Patch 7.2d｜v92 版本沉澱校正') < patchPage.indexOf('網站功能｜v91 找隊友正式版'), 'patch page release order is incorrect');
expect(heroesPage.includes('PATCH 7.2D') && heroesPage.includes('heroes.js?v=92.0.0'), 'heroes page version/cache marker is not v92');
expect(!heroesScript.includes('7.2c') && heroesScript.includes('7.2d'), 'dynamic hero SEO still contains a stale patch version');
expect(heroesScript.includes('heroes.json?v=92.0.0'), 'hero database fetch is not cache-busted to v92');
expect(text('README.md').startsWith(hasV93Overlay ? '# Wild Rift Guide v93｜7.2d 標準 ARAM 全量校正' : '# Wild Rift Guide v92｜7.2d 版本沉澱校正'), 'README latest instructions are missing');

const playerFinderHashes = {
  'pages/players.html': '8a5f945aac51303d1e27de770a9d2b458695a28ba6d0ad06d29d0bc9baa2c06d',
  'assets/js/players.js': 'c7f8b94bb287d57c657030237f1554155e6716bd7d64dc25322c9e853b10dfc0',
  'supabase/wild-rift-guide-v91-player-finder.sql': '62845806ed270e17fba0c3446b2334ab772d1e1807b6a292f756b3a64a3aa8a8',
  'supabase/wild-rift-guide-v91-player-finder-check.sql': 'a15daf392fca83163a8d908ba1205f0b8d91d28fb083cf26735546c88ab7b2e8',
};
for (const [file, expectedHash] of Object.entries(playerFinderHashes)) {
  expect(sha256(file) === expectedHash, `${file}: v91 player-finder file changed unexpectedly`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  version: heroesData.version,
  profilesReviewed: heroesData.heroes.length,
  uniqueHeroes: uniqueHeroes.size,
  tierChanges: Object.keys(expectedTiers).length,
  runeChanges: 1,
  matchupReferences: 'valid',
  buildShape: '5 items + 2 boot/active slots + 5 runes + 2 spells + 5 situations',
  playerFinderV91: 'preserved',
}, null, 2));
