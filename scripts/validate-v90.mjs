import fs from 'node:fs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const heroesData = read('assets/data/heroes.json');
const itemsData = read('assets/data/items.json');
const runesData = read('assets/data/runes.json');
const spellsData = read('assets/data/spells.json');
const patchData = read('assets/data/patch.json');
const calibration = read('assets/data/calibration-7.2d.json');

const itemById = new Map(itemsData.items.map((item) => [item.id, item]));
const itemIds = new Set(itemById.keys());
const runeIds = new Set(Object.values(runesData).flat().map((rune) => rune.id));
const spellIds = new Set(spellsData.map((spell) => spell.id));
const errors = [];

const expectIds = (profile, field, ids, expectedLength) => {
  const values = profile[field];
  if (!Array.isArray(values) || values.length !== expectedLength) {
    errors.push(`${profile.id}: ${field} length ${values?.length ?? 'missing'} (expected ${expectedLength})`);
    return;
  }
  if (new Set(values).size !== values.length) errors.push(`${profile.id}: ${field} contains duplicates`);
  for (const id of values) if (!ids.has(id)) errors.push(`${profile.id}: missing ${field} reference ${id}`);
};

for (const profile of heroesData.heroes) {
  expectIds(profile, 'items', itemIds, 5);
  expectIds(profile, 'coreItems', itemIds, 3);
  expectIds(profile, 'boots', itemIds, 2);
  expectIds(profile, 'runes', runeIds, 5);
  expectIds(profile, 'spells', spellIds, 2);
  if (!profile.coreItems.every((id) => profile.items.includes(id))) errors.push(`${profile.id}: core item not present in standard items`);

  const [tierTwoId, finalBootId] = profile.boots || [];
  if (itemById.get(tierTwoId)?.stage !== '二級鞋') errors.push(`${profile.id}: first boot slot must be 二級鞋 (${tierTwoId})`);
  if (!['三級鞋', '高階裝備'].includes(itemById.get(finalBootId)?.stage)) errors.push(`${profile.id}: final boot/active slot has invalid stage (${finalBootId})`);

  if (profile.reviewedAt !== '2026-08-27') errors.push(`${profile.id}: reviewedAt is not 2026-08-27`);
  if (profile.guideContentAudit !== 'v90-7.2d-full-profile-calibration') errors.push(`${profile.id}: missing v90 guide audit marker`);
  if (profile.patchCalibration?.patch !== '7.2d') errors.push(`${profile.id}: missing 7.2d patch calibration`);
  if (!['updated', 'retained-after-review'].includes(profile.patchCalibration?.outcome)) errors.push(`${profile.id}: invalid calibration outcome`);

  if (!Array.isArray(profile.matchupAdjustments?.situations) || profile.matchupAdjustments.situations.length !== 5) {
    errors.push(`${profile.id}: matchup situations must equal 5`);
    continue;
  }
  const standardItems = new Set([...(profile.items || []), ...(profile.boots || [])]);
  const standardRunes = new Set(profile.runes || []);
  const standardSpells = new Set(profile.spells || []);
  for (const entry of profile.matchupAdjustments.situations) {
    for (const change of entry.changes || []) {
      if (change.type === 'item') {
        if (!standardItems.has(change.fromId)) errors.push(`${profile.id}/${entry.id}: item fromId ${change.fromId} is not standard`);
        if (!itemIds.has(change.toId)) errors.push(`${profile.id}/${entry.id}: missing item toId ${change.toId}`);
      } else if (change.type === 'rune') {
        if (!standardRunes.has(change.fromId)) errors.push(`${profile.id}/${entry.id}: rune fromId ${change.fromId} is not standard`);
        if (!runeIds.has(change.toId)) errors.push(`${profile.id}/${entry.id}: missing rune toId ${change.toId}`);
      } else if (change.type === 'spell') {
        if (!standardSpells.has(change.fromId)) errors.push(`${profile.id}/${entry.id}: spell fromId ${change.fromId} is not standard`);
        if (!spellIds.has(change.toId)) errors.push(`${profile.id}/${entry.id}: missing spell toId ${change.toId}`);
      }
    }
  }
}

for (const catalogHero of heroesData.heroCatalog) {
  for (const role of catalogHero.roles || []) {
    const profile = heroesData.heroes.find((entry) => entry.id === role.detailHeroId);
    if (!profile) errors.push(`${catalogHero.id}/${role.roleId}: missing detail profile ${role.detailHeroId}`);
    else if (profile.tier !== role.tier) errors.push(`${role.detailHeroId}: catalog Tier ${role.tier} differs from profile Tier ${profile.tier}`);
  }
}

const uniqueHeroes = new Set(heroesData.heroes.map((profile) => profile.baseId));
const updatedProfiles = heroesData.heroes.filter((profile) => profile.patchCalibration?.outcome === 'updated');
if (heroesData.heroes.length !== 202) errors.push(`profile count ${heroesData.heroes.length} (expected 202)`);
if (uniqueHeroes.size !== 141) errors.push(`unique hero count ${uniqueHeroes.size} (expected 141)`);
if (updatedProfiles.length !== 31) errors.push(`updated profile count ${updatedProfiles.length} (expected 31)`);
if (calibration.audit?.profiles !== 202 || calibration.audit?.updatedProfiles !== 31) errors.push('calibration report counts do not match v90');
if (calibration.updatedProfiles?.length !== 31) errors.push('calibration report updatedProfiles list must equal 31');

if (heroesData.version !== '7.2d-v90-full-profile-calibration') errors.push(`unexpected heroes version ${heroesData.version}`);
if (itemsData.version !== heroesData.version) errors.push('items version differs from heroes version');
if (patchData.version !== '7.2d' || patchData.dataVersion !== heroesData.version) errors.push('patch.json is not on v90 / 7.2d');

const edge = itemById.get('physical-high-29');
if (!edge?.stats?.includes('+12 物理穿透')) errors.push('夜色緣界物理穿透 must equal 12');
const stormsurge = itemById.get('magic-high-09');
if (stormsurge?.price !== 2800) errors.push('雷霆風暴 price must equal 2800');

const exactProfiles = {
  'akali-mid': { items: ['magic-high-09', 'magic-high-21', 'magic-high-14', 'magic-high-08', 'magic-high-02'] },
  'yuumi-support': { runes: ['aery', 'manaflow-band', 'transcendence', 'scorch', 'revitalize'], spells: ['ignite', 'heal'] },
  'mordekaiser-baron': { coreItems: ['magic-high-23', 'magic-high-01', 'magic-high-16'] },
  'twisted-fate-mid': { coreItems: ['magic-high-12', 'magic-high-20', 'magic-high-04'], spells: ['flash', 'ghost'] },
  'gwen-jungle': { tier: 'A', coreItems: ['magic-high-04', 'magic-high-20', 'magic-high-14'] },
  'yone-mid': { coreItems: ['physical-high-12', 'physical-high-26', 'physical-high-18'] },
  'thresh-support': { tier: 'S', coreItems: ['defense-high-09', 'defense-high-14', 'defense-high-05'] },
};
for (const [profileId, expected] of Object.entries(exactProfiles)) {
  const profile = heroesData.heroes.find((entry) => entry.id === profileId);
  if (!profile) {
    errors.push(`missing expected profile ${profileId}`);
    continue;
  }
  for (const [field, value] of Object.entries(expected)) {
    if (JSON.stringify(profile[field]) !== JSON.stringify(value)) errors.push(`${profileId}: unexpected ${field}`);
  }
}

const home = fs.readFileSync('summoners-rift.html', 'utf8');
const patchPage = fs.readFileSync('pages/patch.html', 'utf8');
const heroesScript = fs.readFileSync('assets/js/heroes.js', 'utf8');
if (!home.includes('本站 7.2d 全英雄配置校正') || !home.includes('v90')) errors.push('homepage v90 panel missing');
if (!patchPage.includes('Patch 7.2d｜v90 全英雄配置校正')) errors.push('patch history v90 entry missing');
if (!heroesScript.includes('heroes.json?v=90.0.0')) errors.push('heroes data cache version is not v90');

const shareFiles = fs.readdirSync('share/heroes').filter((file) => file.endsWith('.html'));
for (const file of shareFiles) {
  if (fs.readFileSync(`share/heroes/${file}`, 'utf8').includes('7.2c')) errors.push(`${file}: stale 7.2c share metadata`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  version: heroesData.version,
  profilesReviewed: heroesData.heroes.length,
  uniqueHeroes: uniqueHeroes.size,
  profilesUpdated: updatedProfiles.length,
  profilesRetained: heroesData.heroes.length - updatedProfiles.length,
  itemChanges: 2,
  tierChanges: 2,
  matchupReferences: 'valid',
  buildShape: '5 items + 2 boot/active slots + 5 runes + 2 spells + 5 situations',
  sharePages: shareFiles.length,
}, null, 2));
