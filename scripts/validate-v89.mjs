import fs from 'node:fs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const heroesData = read('assets/data/heroes.json');
const itemsData = read('assets/data/items.json');
const runesData = read('assets/data/runes.json');
const spellsData = read('assets/data/spells.json');

const itemIds = new Set(itemsData.items.map((item) => item.id));
const runeIds = new Set(Object.values(runesData).flat().map((rune) => rune.id));
const spellIds = new Set(spellsData.map((spell) => spell.id));
const errors = [];

const expectIds = (profile, field, ids, expectedLength) => {
  const values = profile[field];
  if (!Array.isArray(values) || values.length !== expectedLength) {
    errors.push(`${profile.id}: ${field} length ${values?.length ?? 'missing'} (expected ${expectedLength})`);
    return;
  }
  for (const id of values) if (!ids.has(id)) errors.push(`${profile.id}: missing ${field} reference ${id}`);
};

for (const profile of heroesData.heroes) {
  expectIds(profile, 'items', itemIds, 5);
  expectIds(profile, 'coreItems', itemIds, 3);
  expectIds(profile, 'runes', runeIds, 5);
  expectIds(profile, 'spells', spellIds, 2);
  if (!profile.coreItems.every((id) => profile.items.includes(id))) errors.push(`${profile.id}: core item not present in standard items`);
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
if (heroesData.heroes.length !== 202) errors.push(`profile count ${heroesData.heroes.length} (expected 202)`);
if (uniqueHeroes.size !== 141) errors.push(`unique hero count ${uniqueHeroes.size} (expected 141)`);

for (const file of [
  'assets/images/heroes/portraits/yunara.webp',
  'assets/images/heroes/portraits/darius.webp',
  'assets/images/heroes/portraits/swain.webp',
  'assets/images/heroes/portraits/sona.webp',
  'assets/images/heroes/portraits/braum.webp',
  'assets/images/heroes/portraits/chogath.png',
]) {
  if (!fs.existsSync(file)) errors.push(`missing homepage asset ${file}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(JSON.stringify({
  version: heroesData.version,
  profiles: heroesData.heroes.length,
  uniqueHeroes: uniqueHeroes.size,
  items: itemsData.items.length,
  matchupReferences: 'valid',
  buildShape: '5 items + boots / 5 runes / 2 spells',
}, null, 2));
