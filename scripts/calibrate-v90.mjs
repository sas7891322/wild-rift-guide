import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PATCH = '7.2d';
const VERSION = '7.2d-v90-full-profile-calibration';
const REVIEWED_AT = '2026-08-27';

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const writeJson = (relativePath, value) => {
  fs.writeFileSync(path.join(ROOT, relativePath), `${JSON.stringify(value, null, 2)}\n`);
};
const readText = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const writeText = (relativePath, value) => fs.writeFileSync(path.join(ROOT, relativePath), value);

const heroesData = readJson('assets/data/heroes.json');
const itemsData = readJson('assets/data/items.json');
const patchData = readJson('assets/data/patch.json');

const balanceBaseIds = new Set([
  'syndra', 'yuumi', 'vladimir', 'veigar', 'pantheon', 'mordekaiser',
  'twisted-fate', 'fiora', 'gwen', 'yone', 'renekton', 'caitlyn', 'thresh',
]);
const officialLoadoutBaseIds = new Set(['akali', 'vladimir', 'lee-sin']);
const changedItemIds = new Set(['physical-high-29', 'magic-high-09']);

// 7.2d changes that alter the site's recommended five-item build, rune page,
// spells, boots/enchantment slot, or role Tier. Profiles not listed here are
// still stamped as reviewed below; their v89 configuration is intentionally retained.
const profileUpdates = {
  'akali-mid': {
    items: ['magic-high-09', 'magic-high-21', 'magic-high-14', 'magic-high-08', 'magic-high-02'],
    coreItems: ['magic-high-09', 'magic-high-21', 'magic-high-14'],
    boots: ['mana-boots', 'sorcerers-shoes'],
    runes: ['electrocute', 'sudden-impact', 'chain-assault', 'eyeball-collector', 'second-wind'],
  },
  'akali-baron': {
    items: ['magic-high-21', 'magic-high-18', 'magic-high-14', 'magic-high-08', 'magic-high-02'],
    coreItems: ['magic-high-21', 'magic-high-18', 'magic-high-14'],
    boots: ['mana-boots', 'sorcerers-shoes'],
    runes: ['fleet-footwork', 'sudden-impact', 'chain-assault', 'eyeball-collector', 'second-wind'],
  },
  'yuumi-support': {
    items: ['support-high-04', 'support-high-05', 'magic-high-03', 'support-high-06', 'support-high-01'],
    coreItems: ['support-high-04', 'support-high-05', 'magic-high-03'],
    boots: ['ionian-boots', 'blood-mage-boots'],
    runes: ['aery', 'manaflow-band', 'transcendence', 'scorch', 'revitalize'],
    spells: ['ignite', 'heal'],
  },
  'vladimir-baron': {
    items: ['magic-high-22', 'magic-high-23', 'magic-high-14', 'magic-high-08', 'magic-high-02'],
    coreItems: ['magic-high-22', 'magic-high-23', 'magic-high-14'],
    boots: ['mana-boots', 'sorcerers-shoes'],
    runes: ['phase-rush', 'battle-fervor', 'last-stand', 'legend-bloodline', 'transcendence'],
    spells: ['flash', 'ghost'],
  },
  'veigar-mid': {
    items: ['magic-high-09', 'magic-high-14', 'magic-high-21', 'magic-high-08', 'magic-high-02'],
    coreItems: ['magic-high-09', 'magic-high-14', 'magic-high-21'],
    boots: ['mana-boots', 'sorcerers-shoes'],
    runes: ['electrocute', 'botanist', 'transcendence', 'gathering-storm', 'cut-down'],
  },
  'veigar-support': {
    items: ['magic-high-12', 'magic-high-14', 'magic-high-06', 'magic-high-02', 'magic-high-21'],
    coreItems: ['magic-high-12', 'magic-high-14', 'magic-high-06'],
    boots: ['mana-boots', 'sorcerers-shoes'],
    runes: ['electrocute', 'battle-fervor', 'cut-down', 'legend-bloodline', 'bone-plating'],
    spells: ['flash', 'heal'],
  },
  'pantheon-jungle': {
    boots: ['burst-boots', 'physical-high-03'],
    runes: ['empowerment', 'sudden-impact', 'chain-assault', 'eyeball-collector', 'absolute-focus'],
  },
  'pantheon-baron': {
    boots: ['burst-boots', 'physical-high-03'],
  },
  'mordekaiser-baron': {
    items: ['magic-high-23', 'magic-high-01', 'magic-high-16', 'magic-high-07', 'magic-high-14'],
    coreItems: ['magic-high-23', 'magic-high-01', 'magic-high-16'],
    boots: ['mana-boots', 'sorcerers-shoes'],
    runes: ['conqueror', 'demolish', 'second-wind', 'perseverance', 'last-stand'],
  },
  'twisted-fate-mid': {
    items: ['magic-high-12', 'magic-high-20', 'magic-high-04', 'magic-high-14', 'magic-high-08'],
    coreItems: ['magic-high-12', 'magic-high-20', 'magic-high-04'],
    boots: ['mana-boots', 'sorcerers-shoes'],
    runes: ['fleet-footwork', 'botanist', 'absolute-focus', 'nimbus-cloak', 'bone-plating'],
    spells: ['flash', 'ghost'],
  },
  'fiora-baron': {
    items: ['physical-high-12', 'physical-high-21', 'physical-high-41', 'physical-high-42', 'physical-high-10'],
    coreItems: ['physical-high-12', 'physical-high-21', 'physical-high-41'],
    boots: ['gluttonous-greaves', 'physical-high-02'],
    runes: ['grasp', 'demolish', 'second-wind', 'perseverance', 'sudden-impact'],
  },
  'gwen-baron': {
    items: ['magic-high-04', 'magic-high-23', 'magic-high-14', 'magic-high-21', 'magic-high-08'],
    coreItems: ['magic-high-04', 'magic-high-23', 'magic-high-14'],
    boots: ['plated-steelcaps', 'armored-warboots'],
    runes: ['conqueror', 'battle-fervor', 'cut-down', 'legend-alacrity', 'second-wind'],
  },
  'gwen-jungle': {
    tier: 'A',
    items: ['magic-high-04', 'magic-high-20', 'magic-high-14', 'magic-high-21', 'magic-high-08'],
    coreItems: ['magic-high-04', 'magic-high-20', 'magic-high-14'],
    boots: ['gluttonous-greaves', 'immortal-boots'],
    runes: ['conqueror', 'battle-fervor', 'cut-down', 'legend-alacrity', 'nimbus-cloak'],
    spells: ['ghost', 'smite'],
  },
  'yone-mid': {
    items: ['physical-high-12', 'physical-high-26', 'physical-high-18', 'physical-high-17', 'physical-high-10'],
    coreItems: ['physical-high-12', 'physical-high-26', 'physical-high-18'],
    boots: ['berserkers-greaves', 'gunsteel-greaves'],
    runes: ['grasp', 'courage-of-colossus', 'second-wind', 'perseverance', 'legend-alacrity'],
  },
  'yone-jungle': {
    items: ['physical-high-12', 'physical-high-26', 'physical-high-18', 'physical-high-17', 'physical-high-10'],
    coreItems: ['physical-high-12', 'physical-high-26', 'physical-high-18'],
    boots: ['berserkers-greaves', 'gunsteel-greaves'],
    runes: ['conqueror', 'battle-fervor', 'cut-down', 'legend-alacrity', 'absolute-focus'],
  },
  'yone-baron': {
    items: ['physical-high-12', 'physical-high-26', 'physical-high-18', 'physical-high-17', 'physical-high-10'],
    coreItems: ['physical-high-12', 'physical-high-26', 'physical-high-18'],
    boots: ['berserkers-greaves', 'gunsteel-greaves'],
    runes: ['grasp', 'demolish', 'second-wind', 'perseverance', 'legend-alacrity'],
    spells: ['flash', 'barrier'],
  },
  'renekton-baron': {
    items: ['physical-high-12', 'physical-high-41', 'physical-high-18', 'physical-high-21', 'physical-high-10'],
    coreItems: ['physical-high-12', 'physical-high-41', 'physical-high-18'],
    boots: ['plated-steelcaps', 'physical-high-02'],
    runes: ['conqueror', 'demolish', 'second-wind', 'perseverance', 'sudden-impact'],
  },
  'caitlyn': {
    boots: ['berserkers-greaves', 'physical-high-03'],
  },
  'thresh-support': {
    tier: 'S',
    items: ['defense-high-09', 'defense-high-14', 'defense-high-05', 'defense-high-16', 'defense-high-15'],
    coreItems: ['defense-high-09', 'defense-high-14', 'defense-high-05'],
  },

  // Structural corrections found by the all-profile audit. These repair an
  // invalid tier-II/tier-III boot display without changing the five-item build.
  'jayce-baron': { boots: ['burst-boots', 'physical-high-03'] },
  'kayn-jungle': { boots: ['burst-boots', 'physical-high-03'] },
  'talon-jungle': { boots: ['burst-boots', 'physical-high-03'] },
  'zed-jungle': { boots: ['burst-boots', 'physical-high-03'] },
  'brand-support': { boots: ['mana-boots', 'sorcerers-shoes'] },
  'lux-support': { boots: ['mana-boots', 'sorcerers-shoes'] },
  'morgana-support': { boots: ['mana-boots', 'sorcerers-shoes'] },
  'pyke-support': { boots: ['burst-boots', 'armorbreaker-boots'] },
  'velkoz-support': { boots: ['mana-boots', 'sorcerers-shoes'] },
  'zyra-support': { boots: ['mana-boots', 'sorcerers-shoes'] },
  'chogath-baron': { boots: ['mercurys-treads', 'chain-army-boots'] },
  'chogath-jungle': { boots: ['mercurys-treads', 'chain-army-boots'] },
};

const patchSourceByBase = {
  syndra: '7.2d：黑暗星體基傷提高；意志之力與虛弱潰散魔攻係數提高，虛弱潰散冷卻縮短。',
  yuumi: '7.2d：飛撲抱抱冷卻縮短並提高摯友治療／護盾強度；蹦蹦衝刺冷卻縮短、護盾後期與魔攻係數提高。',
  vladimir: '7.2d：血色契約雙向轉換提高；鮮血轉換強化傷害與血之潮汐最低傷害提高。',
  veigar: '7.2d：黑暗祭祀施放距離由 7.75 提高至 9。',
  pantheon: '7.2d：彗星戰矛依生命觸發暴擊的門檻由 35% 下調至 25%。',
  mordekaiser: '7.2d：暗崛魔法穿透提高至 3/6/9/12%；死之爪冷卻縮短。',
  'twisted-fate': '7.2d：卡牌騙術魔攻係數由 45% 下調至 35%。',
  fiora: '7.2d：不屈鬥魂破綻傷害提高至 4% 最大生命＋0.055% 額外物攻係數。',
  gwen: '7.2d：剪剪每次命中與最後一擊魔攻係數下調，對野怪傷害加成回到 100%。',
  yone: '7.2d：基礎物防由 43 下調至 37；巴龍路前期換血容錯降低。',
  renekton: '7.2d：弱肉強食額外物攻係數提高；庖丁解牛中後期基礎傷害提高。',
  caitlyn: '7.2d：爆頭等級物攻與暴擊率成長提高；捕獲陷阱充能時間縮短。',
  thresh: '7.2d：死亡宣告命中英雄的冷卻返還由 3 秒下調至 2 秒。',
  akali: '7.2d 官方出戰配置：爆發裝調整為雷霆風暴、無限寶珠、死亡之帽、虛空之杖、中婭沙漏。',
  'lee-sin': '7.2d 官方出戰配置已複查；本站妖夢、三相、席利妲、巨蛇鋒牙、守護天使主配置維持。',
};

const abilityPatchText = {
  syndra: {
    Q: '黑暗星體基礎傷害提高至 80/130/180/230。',
    W: '意志之力傷害的魔攻係數提高至 60%。',
    E: '虛弱潰散冷卻統一為 15 秒，傷害魔攻係數提高至 50%。',
  },
  yuumi: {
    W: '飛撲抱抱冷卻調整為 8/4/0 秒，摯友提供的治療與護盾強度提高至 8/9/10/11%。',
    E: '蹦蹦衝刺冷卻調整為 9 秒；護盾為 80/110/140/170＋40% 魔攻。',
  },
  vladimir: {
    P: '額外生命轉魔攻提高至 5%，魔攻轉生命提高至 150%。',
    Q: '腥紅脈搏額外傷害加成提高至 85%。',
    E: '最低傷害提高至 30/50/70/90＋35% 魔攻＋3% 最大生命。',
  },
  veigar: { Q: '黑暗祭祀施放距離提高至 9。' },
  pantheon: { Q: '依生命觸發暴擊的門檻下調至 25%。' },
  mordekaiser: {
    P: '暗崛提供的魔法穿透提高至 3/6/9/12%。',
    E: '死之爪冷卻縮短至 15/13/11/9 秒。',
  },
  'twisted-fate': { E: '卡牌騙術魔攻係數下調至 35%。' },
  fiora: { P: '破綻傷害提高至 4% 最大生命＋0.055% 額外物攻係數。' },
  gwen: { Q: '每次命中魔攻係數下調至 6%，最後一擊下調至 30%，對野怪傷害加成為 100%。' },
  renekton: {
    Q: '一般傷害的額外物攻係數提高至 100%。',
    W: '基礎傷害調整為 20/60/100/140，怒氣強化為 30/90/150/210。',
  },
  caitlyn: {
    P: '爆頭成長提高至 60%～110% 物攻＋200×暴擊率。',
    W: '陷阱充能時間縮短至 25/20/15/10 秒。',
  },
  thresh: { Q: '命中英雄時的冷卻返還下調至 2 秒。' },
};

const changedProfileIds = new Set(Object.keys(profileUpdates));
const configFields = ['items', 'coreItems', 'boots', 'runes', 'spells'];

const repairMatchupFromIds = (profile, before) => {
  const mappings = { item: new Map(), rune: new Map(), spell: new Map() };
  const addPositionMap = (type, oldValues = [], newValues = []) => {
    oldValues.forEach((oldId, index) => {
      if (newValues[index] && oldId !== newValues[index]) mappings[type].set(oldId, newValues[index]);
    });
  };
  addPositionMap('item', before.items, profile.items);
  addPositionMap('item', before.boots, profile.boots);
  addPositionMap('rune', before.runes, profile.runes);
  addPositionMap('spell', before.spells, profile.spells);

  const standards = {
    item: new Set([...(profile.items || []), ...(profile.boots || [])]),
    rune: new Set(profile.runes || []),
    spell: new Set(profile.spells || []),
  };
  for (const situation of profile.matchupAdjustments?.situations || []) {
    for (const change of situation.changes || []) {
      if (!standards[change.type] || standards[change.type].has(change.fromId)) continue;
      const replacement = mappings[change.type].get(change.fromId);
      if (replacement) change.fromId = replacement;
    }
  }
};

for (const profile of heroesData.heroes) {
  const before = Object.fromEntries(configFields.map((field) => [field, [...(profile[field] || [])]]));
  const update = profileUpdates[profile.id];
  if (update) {
    for (const [field, value] of Object.entries(update)) {
      profile[field] = Array.isArray(value) ? [...value] : value;
    }
    repairMatchupFromIds(profile, before);
  }

  if (profile.baseId === 'yuumi') {
    const zoomies = profile.abilities?.find((ability) => ability.key === 'E');
    if (zoomies) zoomies.summary = zoomies.summary.replace(/7\.2a 已降低魔力消耗，使持續支援更穩定。/g, '').trim();
  }
  if (profile.baseId === 'mordekaiser') {
    const claw = profile.abilities?.find((ability) => ability.key === 'E');
    if (claw) claw.summary = claw.summary.replace(/^被動提供魔法穿透；/, '');
  }

  const abilityChanges = abilityPatchText[profile.baseId];
  if (abilityChanges) {
    for (const ability of profile.abilities || []) {
      const patchText = abilityChanges[ability.key];
      if (!patchText) continue;
      ability.summary = `${ability.summary.replace(/｜7\.2d：.*$/u, '').replace(/\s+$/u, '')}｜7.2d：${patchText}`;
    }
  }

  const sourcePatch = patchSourceByBase[profile.baseId];
  if (sourcePatch) {
    profile.sourceNote = `${(profile.sourceNote || '').replace(/｜v90：.*$/u, '').replace(/\s+$/u, '')}｜v90：${sourcePatch}`;
  }

  const serialized = JSON.stringify(profile);
  const impactTypes = [];
  if (balanceBaseIds.has(profile.baseId)) impactTypes.push('hero-balance');
  if (officialLoadoutBaseIds.has(profile.baseId)) impactTypes.push('official-loadout');
  if ([...changedItemIds].some((id) => serialized.includes(id))) impactTypes.push('item-delta');
  if (changedProfileIds.has(profile.id) && !impactTypes.length) impactTypes.push('structural-correction');

  profile.reviewedAt = REVIEWED_AT;
  profile.guideContentAudit = 'v90-7.2d-full-profile-calibration';
  profile.patchCalibration = {
    patch: PATCH,
    reviewedAt: REVIEWED_AT,
    scope: ['items', 'coreItems', 'boots', 'runes', 'spells', 'tier', 'matchupAdjustments'],
    impactTypes,
    outcome: changedProfileIds.has(profile.id) ? 'updated' : 'retained-after-review',
  };
}

// Keep the role catalog and detail profiles on the same Tier source of truth.
const profileById = new Map(heroesData.heroes.map((profile) => [profile.id, profile]));
for (const catalogHero of heroesData.heroCatalog) {
  for (const role of catalogHero.roles || []) {
    const profile = profileById.get(role.detailHeroId);
    if (profile) role.tier = profile.tier;
  }
}

heroesData.version = VERSION;
heroesData.updated = REVIEWED_AT;
heroesData.roleAudit.status = 'updated-v90';
heroesData.roleAudit.configurationProfilesReviewed = heroesData.heroes.length;
heroesData.roleAudit.patchCalibration = PATCH;
heroesData.roleAudit.patchCalibrationCheckedAt = REVIEWED_AT;
heroesData.stageLocks.patch72dCalibration = {
  status: 'completed',
  version: 'v90',
  checkedAt: REVIEWED_AT,
  profilesReviewed: heroesData.heroes.length,
  uniqueHeroesReviewed: new Set(heroesData.heroes.map((profile) => profile.baseId)).size,
  scope: ['出裝', '核心三件', '鞋子／主動裝', '符文', '召喚師技能', 'Tier', '五類對局調整'],
};
heroesData.calibration = {
  patch: PATCH,
  version: 'v90',
  reviewedAt: REVIEWED_AT,
  uniqueHeroesReviewed: new Set(heroesData.heroes.map((profile) => profile.baseId)).size,
  profilesReviewed: heroesData.heroes.length,
  profilesUpdated: changedProfileIds.size,
  profilesRetained: heroesData.heroes.length - changedProfileIds.size,
  officialHeroAdjustments: balanceBaseIds.size,
  officialItemAdjustments: changedItemIds.size,
  tierChanges: [
    { profileId: 'gwen-jungle', from: 'S', to: 'A' },
    { profileId: 'thresh-support', from: 'S+', to: 'S' },
  ],
  methodology: '以 v89 的 7.2c 全量校正為母檔，逐筆套用 Riot 7.2d 差分，再以當日 7.2d 角色指南交叉檢查；新版本樣本不足者保留原 Tier。',
};
heroesData.notes.unshift(
  `v90：${PATCH} 全英雄配置校正；複查 141 位英雄／202 份位置配置，更新 ${changedProfileIds.size} 份出裝、符文、召喚師技能或鞋子結構；同步 13 位英雄與 2 件道具官方異動，Tier 僅調整關打野 S→A、瑟雷西輔助 S+→S。`,
);

const edgeOfNight = itemsData.items.find((item) => item.id === 'physical-high-29');
if (!edgeOfNight) throw new Error('Missing physical-high-29');
edgeOfNight.stats = edgeOfNight.stats.map((stat) => stat === '+8 物理穿透' ? '+12 物理穿透' : stat);
const stormsurge = itemsData.items.find((item) => item.id === 'magic-high-09');
if (!stormsurge) throw new Error('Missing magic-high-09');
stormsurge.price = 2800;
itemsData.version = VERSION;
itemsData.notes = `${itemsData.notes.replace(/｜v90：.*$/u, '')}｜v90：同步官方 7.2d 夜色緣界物理穿透 8→12、雷霆風暴價格 2900→2800。`;

patchData.version = PATCH;
patchData.updated = REVIEWED_AT;
patchData.dataVersion = VERSION;
patchData.notes.unshift(
  `v90 7.2d 全英雄配置校正：複查 141 位英雄／202 份位置配置，更新 ${changedProfileIds.size} 份配置；同步 13 位英雄、2 件道具與官方出戰配置，Tier 僅調整關打野與瑟雷西輔助。`,
);

const calibrationReport = {
  patch: PATCH,
  siteVersion: 'v90',
  reviewedAt: REVIEWED_AT,
  audit: {
    uniqueHeroes: 141,
    profiles: 202,
    updatedProfiles: changedProfileIds.size,
    retainedProfiles: 202 - changedProfileIds.size,
    requiredShape: '5 items + 2 boot/active slots + 5 runes + 2 spells + 5 matchup situations',
  },
  officialDelta: {
    heroes: [...balanceBaseIds],
    items: [
      { id: 'physical-high-29', name: '夜色緣界', change: '物理穿透 8 → 12' },
      { id: 'magic-high-09', name: '雷霆風暴', change: '價格 2900 → 2800' },
    ],
    recommendedLoadouts: [...officialLoadoutBaseIds],
  },
  updatedProfiles: [...changedProfileIds].sort(),
  tierChanges: heroesData.calibration.tierChanges,
  sources: [
    'https://wildrift.leagueoflegends.com/zh-tw/news/game-updates/wild-rift-patch-notes-7-2d/',
    'https://www.wildriftfire.com/tier-list',
    'https://www.wildriftfire.com/item-list',
    'https://www.wildriftfire.com/rune-list',
  ],
};

writeJson('assets/data/heroes.json', heroesData);
writeJson('assets/data/items.json', itemsData);
writeJson('assets/data/patch.json', patchData);
writeJson('assets/data/calibration-7.2d.json', calibrationReport);

// Current SEO/share text moves to 7.2d. Historical patch entries are excluded.
for (const file of fs.readdirSync(path.join(ROOT, 'share/heroes')).filter((name) => name.endsWith('.html'))) {
  const relativePath = `share/heroes/${file}`;
  writeText(relativePath, readText(relativePath).replaceAll('7.2c', '7.2d'));
}
for (const relativePath of ['index.html', 'pages/heroes.html', 'pages/items.html', 'pages/runes.html', 'pages/guides.html']) {
  let text = readText(relativePath).replaceAll('7.2c', '7.2d');
  text = text.replaceAll('200 份完整位置攻略', '202 份英雄位置配置');
  writeText(relativePath, text);
}

let home = readText('summoners-rift.html');
const homeHeadEnd = home.indexOf('</head>');
home = `${home.slice(0, homeHeadEnd).replaceAll('7.2c', '7.2d').replaceAll('200 份完整位置攻略', '202 份英雄位置配置')}${home.slice(homeHeadEnd)}`;
home = home.replaceAll('assets/data/heroes.json?v=89.0.0', 'assets/data/heroes.json?v=90.0.0');
const sitePanelStart = home.indexOf('    <section class="home-update-panel" role="tabpanel" id="homeUpdateSite"');
const championsPanelStart = home.indexOf('    <section class="home-update-panel" role="tabpanel" id="homeUpdateChampions"');
if (sitePanelStart < 0 || championsPanelStart < 0 || championsPanelStart <= sitePanelStart) {
  throw new Error('Unable to locate homepage site update panel');
}
const sitePanel = `    <section class="home-update-panel" role="tabpanel" id="homeUpdateSite" aria-labelledby="homeUpdateSiteTab" data-home-update-panel="site" hidden>
      <div class="home-update-heading"><div><span class="kicker">WILD RIFT GUIDE · 2026/08/27</span><h3>本站 7.2d 全英雄配置校正</h3></div><span class="home-update-badge ready">v90</span></div>
      <p class="home-update-lead">8/27 完成 141 位英雄、202 份位置配置的 7.2d 差分複查：同步 13 位英雄與 2 件道具官方異動，更新 ${changedProfileIds.size} 份出裝／符文／召喚師技能或鞋子結構；其餘配置驗證後保留。</p>

      <div class="site-review-grid" data-site-review-accordions>
        <div class="site-review-item">
          <button class="site-review-toggle" type="button" data-site-review-toggle aria-expanded="false" aria-controls="siteReviewV90Audit"><strong>202 份配置逐筆驗證</strong><span>141 位英雄 · 五路完整覆蓋</span></button>
          <div class="site-review-inline-panel site-review-database-panel" id="siteReviewV90Audit" data-site-review-panel hidden><strong>全部通過結構與引用檢查</strong><p>每份配置維持五件成裝、兩格鞋子／主動裝、五枚符文、兩個召喚師技能與五類情境調整；未受 7.2d 影響者不做無依據改動。</p></div>
        </div>
        <div class="site-review-item">
          <button class="site-review-toggle" type="button" data-site-review-toggle aria-expanded="false" aria-controls="siteReviewV90Guide"><strong>${changedProfileIds.size} 份配置更新</strong><span>角色流派與錯誤鞋線同步修正</span></button>
          <div class="site-review-inline-panel" id="siteReviewV90Guide" data-site-review-panel hidden><div class="site-review-hero-links">
            <a href="pages/heroes.html?hero=yuumi-support"><strong>悠咪</strong><span>魔器／和諧／贖罪核心</span></a>
            <a href="pages/heroes.html?hero=mordekaiser-baron"><strong>魔鬥凱薩</strong><span>峽谷／火箭腰帶／黎安卓</span></a>
            <a href="pages/heroes.html?hero=twisted-fate-mid"><strong>逆命</strong><span>盧登／納什／暮夜與黎明</span></a>
            <a href="pages/heroes.html?hero=yone-mid"><strong>犽凝</strong><span>三路奪魄之鐮核心</span></a>
          </div></div>
        </div>
        <div class="site-review-item">
          <button class="site-review-toggle" type="button" data-site-review-toggle aria-expanded="false" aria-controls="siteReviewV90Items"><strong>2 件道具同步</strong><span>官方 7.2d 精確數值</span></button>
          <div class="site-review-inline-panel site-review-database-panel" id="siteReviewV90Items" data-site-review-panel hidden><strong>夜色緣界／雷霆風暴</strong><p>夜色緣界物理穿透 8→12；雷霆風暴價格 2900→2800。所有採用這兩件裝備的英雄配置會直接套用新數值。</p></div>
        </div>
        <div class="site-review-item">
          <button class="site-review-toggle" type="button" data-site-review-toggle aria-expanded="false" aria-controls="siteReviewV90Tier"><strong>2 組 Tier 校正</strong><span>僅調整目前證據一致的方向</span></button>
          <div class="site-review-inline-panel" id="siteReviewV90Tier" data-site-review-panel hidden><div class="site-review-hero-links">
            <a href="pages/heroes.html?hero=gwen-jungle"><strong>關</strong><span>打野 · S→A</span></a>
            <a href="pages/heroes.html?hero=thresh-support"><strong>瑟雷西</strong><span>輔助 · S+→S</span></a>
          </div></div>
        </div>
      </div>

      <div class="site-tier-section">
        <div class="official-change-title"><strong>7.2d Tier 變動</strong><span>點英雄可看攻略</span></div>
        <div class="tier-change-grid">
          <a class="tier-change-card tier-down" href="pages/heroes.html?hero=gwen-jungle" aria-label="查看關打野攻略，Tier 由 S 降至 A"><span class="tier-change-avatar-wrap"><img src="assets/images/heroes/portraits/gwen.webp" alt="關" loading="lazy"><i class="tier-change-arrow" aria-hidden="true">↓</i></span><span class="tier-change-name">關<small>打野</small></span><span class="tier-change-ranks"><del>S</del><em>→</em><strong>A</strong></span></a>
          <a class="tier-change-card tier-down" href="pages/heroes.html?hero=thresh-support" aria-label="查看瑟雷西輔助攻略，Tier 由 S+ 降至 S"><span class="tier-change-avatar-wrap"><img src="assets/images/heroes/portraits/thresh.webp" alt="瑟雷西" loading="lazy"><i class="tier-change-arrow" aria-hidden="true">↓</i></span><span class="tier-change-name">瑟雷西<small>輔助</small></span><span class="tier-change-ranks"><del>S+</del><em>→</em><strong>S</strong></span></a>
        </div>
      </div>

      <p class="site-tier-note">7.2d 上線時間仍短；星朵拉、悠咪、弗拉迪米爾、維迦、菲歐拉、雷尼克頓與凱特琳等受增強英雄先維持既有 Tier，避免用首日樣本過度升級。</p>
      <a class="home-update-more" href="pages/patch.html">查看本站版本紀錄 →</a>
    </section>

`;
home = `${home.slice(0, sitePanelStart)}${sitePanel}${home.slice(championsPanelStart)}`;
writeText('summoners-rift.html', home);

let patchPage = readText('pages/patch.html');
const patchHeadEnd = patchPage.indexOf('</head>');
patchPage = `${patchPage.slice(0, patchHeadEnd).replaceAll('200 份完整位置攻略', '202 份英雄位置配置')}${patchPage.slice(patchHeadEnd)}`;
const firstHistory = patchPage.indexOf('<section class="empty">');
if (firstHistory < 0) throw new Error('Unable to locate patch history insertion point');
const v90Section = `<section class="empty"><strong>Patch 7.2d｜v90 全英雄配置校正｜2026/08/27</strong><br/><br/>
<strong>完整複查：</strong>以 v89 的 7.2c 母檔逐筆驗證 141 位英雄、202 份位置配置；每份維持五件成裝、兩格鞋子／主動裝、五枚符文、兩個召喚師技能與五類情境調整。<br/><br/>
<strong>官方差分：</strong>同步 13 位英雄平衡、夜色緣界物理穿透 8→12、雷霆風暴價格 2900→2800，以及阿卡莉、弗拉迪米爾、李星官方出戰配置。<br/><br/>
<strong>攻略配置：</strong>更新 ${changedProfileIds.size} 份出裝、符文、召喚師技能或鞋子結構；重點包含悠咪、魔鬥凱薩、逆命、菲歐拉、關雙位置、犽凝三位置、雷尼克頓與維迦雙位置。<br/><br/>
<strong>Tier 校正：</strong>關打野 S→A、瑟雷西輔助 S+→S；其餘受 7.2d 影響英雄因版本首日樣本有限，先保留原 Tier。</section>
`;
patchPage = `${patchPage.slice(0, firstHistory)}${v90Section}${patchPage.slice(firstHistory)}`;
writeText('pages/patch.html', patchPage);

// Cache-bust only the data-bearing files; historical visible “v89” text remains intact.
for (const relativePath of ['pages/heroes.html', 'pages/items.html', 'assets/js/heroes.js', 'assets/js/items-final.js']) {
  writeText(relativePath, readText(relativePath).replaceAll('89.0.0', '90.0.0'));
}

console.log(JSON.stringify({
  patch: PATCH,
  version: VERSION,
  profilesReviewed: heroesData.heroes.length,
  profilesUpdated: changedProfileIds.size,
  tierChanges: heroesData.calibration.tierChanges.length,
  itemChanges: changedItemIds.size,
}, null, 2));
