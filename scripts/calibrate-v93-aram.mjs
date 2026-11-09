import fs from 'node:fs';

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const clone = (value) => structuredClone(value);

const aramPath = 'assets/data/aram/heroes.json';
const manifestPath = 'assets/data/calibration-7.2d-aram-v93.json';
const previousManifest = fs.existsSync(manifestPath) ? read(manifestPath) : null;
const data = read(aramPath);
const itemsData = read('assets/data/items.json');
const runesData = read('assets/data/runes.json');
const spellsData = read('assets/data/spells.json');

const itemById = new Map(itemsData.items.map((item) => [item.id, item]));
const itemByName = new Map(itemsData.items.map((item) => [item.name, item]));
const runes = Object.values(runesData).flat();
const runeById = new Map(runes.map((rune) => [rune.id, rune]));
const runeByName = new Map(runes.map((rune) => [rune.name, rune]));
const spellById = new Map(spellsData.map((spell) => [spell.id, spell]));
const spellByName = new Map(spellsData.map((spell) => [spell.name, spell]));

const officialSources = {
  '7.2d': {
    label: 'Riot Games｜《激鬥峽谷》7.2d 版本更新公告',
    url: 'https://wildrift.leagueoflegends.com/zh-tw/news/game-updates/wild-rift-patch-notes-7-2d/'
  },
  '7.2c': {
    label: 'Riot Games｜《激鬥峽谷》7.2c 版本更新公告',
    url: 'https://wildrift.leagueoflegends.com/zh-tw/news/game-updates/wild-rift-patch-notes-7-2c/'
  },
  '7.2b': {
    label: 'Riot Games｜《激鬥峽谷》7.2b 版本更新公告',
    url: 'https://wildrift.leagueoflegends.com/zh-tw/news/game-updates/wild-rift-patch-notes-7-2b/'
  },
  '7.2a': {
    label: 'Riot Games｜《激鬥峽谷》7.2a 版本更新公告',
    url: 'https://wildrift.leagueoflegends.com/zh-tw/news/game-updates/wild-rift-patch-notes-7-2a/'
  },
  '7.2': {
    label: 'Riot Games｜《激鬥峽谷》7.2 版本更新公告',
    url: 'https://wildrift.leagueoflegends.com/zh-tw/news/game-updates/wild-rift-patch-notes-7-2/'
  },
  '7.1': {
    label: 'Riot Games｜《激鬥峽谷》7.1 版本更新公告',
    url: 'https://wildrift.leagueoflegends.com/zh-tw/news/game-updates/wild-rift-patch-notes-7-1/'
  }
};

const itemAliases = new Map([
  ['不朽護脛', '不朽之靴'],
  ['破甲戰靴', '碎甲者之靴'],
  ['爆裂法靴', '爆發之靴'],
  ['貪婪之靴', '貪婪護脛'],
  ['日炎斗篷', '日炎聖盾']
]);

const counters = {
  standardItemReferences: 0,
  standardRuneReferences: 0,
  standardSpellLabels: 0,
  aaaItemReferences: 0,
  aaaRuneReferences: 0
};

const normalizeIcon = (icon = '') => icon.replace(/^\.\.\/assets\//, 'assets/');

const normalizeItem = (item, scope) => {
  if (!item || typeof item !== 'object') return item;
  const aliasName = itemAliases.get(item.name);
  const canonical = aliasName ? itemByName.get(aliasName) : itemByName.get(item.name) || itemById.get(item.id);
  if (!canonical) return item;
  if (item.id !== canonical.id || item.name !== canonical.name) counters[scope] += 1;
  item.id = canonical.id;
  item.name = canonical.name;
  item.icon = normalizeIcon(item.icon || canonical.icon);
  return item;
};

const normalizeRune = (rune, scope) => {
  if (!rune || typeof rune !== 'object') return rune;
  const canonical = rune.id === 'first-strike' && rune.name === '先發制人'
    ? runeByName.get('先發制人')
    : runeById.get(rune.id) || runeByName.get(rune.name);
  if (!canonical) return rune;
  if (rune.id !== canonical.id || rune.name !== canonical.name) counters[scope] += 1;
  rune.id = canonical.id;
  rune.name = canonical.name;
  rune.icon = normalizeIcon(canonical.icon || rune.icon);
  return rune;
};

const normalizeSpell = (spell) => {
  if (!spell || typeof spell !== 'object') return spell;
  const canonical = spellById.get(spell.id) || spellByName.get(spell.name);
  if (!canonical) return spell;
  if (spell.id !== canonical.id || spell.name !== canonical.name) counters.standardSpellLabels += 1;
  spell.id = canonical.id;
  spell.name = canonical.name;
  spell.icon = normalizeIcon(spell.icon || canonical.icon);
  return spell;
};

for (const hero of data.heroes) {
  for (const field of ['starterItems', 'items', 'boots', 'situationalItems']) {
    for (const item of hero[field] || []) normalizeItem(item, 'standardItemReferences');
  }
  for (const rune of hero.runes || []) normalizeRune(rune, 'standardRuneReferences');
  for (const spell of hero.spells || []) normalizeSpell(spell);

  for (const plan of hero.aaaAram?.buildPlans || []) {
    for (const field of ['starterItems', 'items', 'boots']) {
      for (const item of plan[field] || []) normalizeItem(item, 'aaaItemReferences');
    }
  }
  for (const rune of hero.aaaAram?.runeReuse?.runes || []) normalizeRune(rune, 'aaaRuneReferences');
}

const reportedCounters = Object.values(counters).every((count) => count === 0) && previousManifest?.version === 'v93'
  ? {
      standardItemReferences: previousManifest.normalization.standardItemReferences,
      standardRuneReferences: previousManifest.normalization.standardRuneReferences,
      standardSpellLabels: previousManifest.normalization.standardSpellLabels,
      aaaItemReferences: previousManifest.normalization.aaaItemReferences,
      aaaRuneReferences: previousManifest.normalization.aaaRuneReferences
    }
  : counters;

const findExistingItem = (name) => {
  for (const hero of data.heroes) {
    for (const field of ['starterItems', 'items', 'boots', 'situationalItems']) {
      const found = (hero[field] || []).find((item) => item.name === name);
      if (found) return clone(found);
    }
  }
  const canonical = itemByName.get(name);
  if (!canonical) throw new Error(`Missing item template: ${name}`);
  return { id: canonical.id, name: canonical.name, icon: normalizeIcon(canonical.icon) };
};

const makeItem = (name, reason, extra = {}) => ({ ...findExistingItem(name), ...extra, reason });
const makeRune = (name, reason) => {
  const canonical = runeByName.get(name);
  if (!canonical) throw new Error(`Missing rune template: ${name}`);
  return { id: canonical.id, name: canonical.name, icon: normalizeIcon(canonical.icon), reason };
};
const makeSpell = (name, reason) => {
  const canonical = spellByName.get(name);
  if (!canonical) throw new Error(`Missing spell template: ${name}`);
  return { id: canonical.id, name: canonical.name, icon: normalizeIcon(canonical.icon), reason };
};
const snowballSpell = (reason = '雪球命中後可等待隊友跟上再進場，讓近戰英雄在單線拉扯中擁有穩定的接戰與追擊角度。') => ({
  id: 'snowball-chariot',
  name: '雪球戰車',
  icon: 'assets/images/spells/snowball-chariot.svg',
  reason
});

const heroById = new Map(data.heroes.map((hero) => [hero.id, hero]));
const getHero = (id) => {
  const hero = heroById.get(id);
  if (!hero) throw new Error(`Missing ARAM hero: ${id}`);
  return hero;
};

const chogath = {
  id: 'chogath',
  name: '科加斯',
  enName: 'Cho’Gath',
  tier: 'S',
  tierLabel: '強勢推薦',
  tierReason: '破裂與野性尖嘯能在狹窄單線連續打出擊飛、緩速與沉默，饗宴又能靠士兵與英雄持續堆高生命；缺乏位移是主要限制，但雪球戰車能補上第一段接戰距離。',
  position: '成長坦克／範圍控制型前排',
  tags: ['永久成長', '範圍控制', '真實斬殺'],
  avatar: 'assets/images/heroes/portraits/chogath.png',
  summary: '標準 ARAM 的科加斯先以 Q／W 壓縮走位，再用高生命前排卡住通道。大絕前六層可安全吃士兵累積，團戰則保留給進入斬殺線的英雄；不要為了追後排離開己方輸出。',
  detailReady: true,
  tierListVersion: 'v93',
  reviewStatus: 'aram-v93-7.2d-full-audit',
  reviewedAt: '2026-09-01',
  balance: {
    damageDealt: '100%',
    damageTaken: '100%',
    healing: '100%',
    shielding: '100%',
    note: '截至 7.2d 未見科加斯的一般 ARAM 百分比修正，先以 100%／100% 基準呈現；英雄本體已納入 7.2c 恐懼尖刺與饗宴強化。'
  },
  starterItems: [makeItem('紅水晶', '先補最大生命，能同時提高前排容錯、雄心之鋼成形速度與饗宴的額外生命係數。')],
  items: [
    makeItem('雄心之鋼', '單線五人反覆接觸很容易疊層，最大生命同時放大坦度與饗宴真實傷害。'),
    makeItem('日炎聖盾', '7.2c 後提供更明確的物防與貼身灼燒，補足科加斯站住前排時的持續傷害。'),
    makeItem('好戰者鎧甲', '高額生命與脫戰回復讓科加斯不用死亡也能重新站上前線，並直接放大饗宴係數。'),
    makeItem('雅瑪蘭守護像', '進入長團後疊滿雙抗，讓體型變大的科加斯不會只剩血量卻缺乏抗性。'),
    makeItem('黎明法衣', 'Q 擊飛與 W 沉默能穩定觸發團隊增傷，後期比單純堆傷害更可靠。')
  ],
  boots: [
    makeItem('水星之靴', '預設先補韌性與魔抗，降低被連續控制後無法站到斬殺距離的風險。'),
    makeItem('鎖鏈軍靴', '升級後補足魔防與法術防護；敵方物理普攻為主要威脅時改走鍍板鋼蓋／裝甲戰靴。')
  ],
  runes: [
    makeRune('冰霜霸主', 'Q 擊飛能穩定觸發冰霜與防護，進場後更容易黏住多人。'),
    makeRune('巨像勇氣', '兩個硬控技能都能取得護盾，配合額外生命成長提高第一波容錯。'),
    makeRune('骨甲', '降低進場時吃到的第一輪爆發，避免還沒開出 W／R 就被壓低血量。'),
    makeRune('過度生長', 'ARAM 兵線密集，額外生命能穩定累積並與饗宴形成雙重成長。'),
    makeRune('卓越', '技能加速直接提高 Q／W 控場頻率，長團戰更容易打出第二輪。')
  ],
  spells: [
    makeSpell('閃現', '補足突然接 Q／W／R 的距離，也能在饗宴後安全拉回。'),
    snowballSpell('雪球戰車補上科加斯沒有位移的弱點；命中後先確認隊友能跟，再進場接 W 沉默與 Q 擊飛。')
  ],
  skillOrder: '1 技 > 2 技 > 3 技',
  skillNote: 'ARAM 開局三個基礎技能各點 1 級，之後主升 1 技提高遠距消耗與控場壓力、次升 2 技；大絕能點就點。',
  skillIcons: [
    'assets/images/heroes/skills/chogath_02.webp',
    'assets/images/heroes/skills/chogath_03.webp',
    'assets/images/heroes/skills/chogath_04.webp'
  ],
  playstyle: {
    開局: '先用 Q 探草、卡補包與逼走位，不要為了命中一人連續把 Q／W 全交光。能安全尾兵就利用被動回血回魔，優先保住自己的血線。',
    中期: '五級後先把可由士兵提供的六層饗宴逐步堆起來；團戰前用 Q 分割前後排，雪球命中也不必立刻衝，等敵方關鍵控制交掉再進。',
    後期: '站在己方主力前方卡通道，以 Q 擊飛、W 沉默反制突進。饗宴優先收掉已進斬殺線的核心或前排，不要追到隊友無法輸出的位置。'
  },
  situationalItems: [
    makeItem('凱尼克欺瞞者', '敵方法術傷害很多', { when: '高魔抗與最大生命護盾很適合已疊高生命的科加斯，可替換日炎聖盾。' }),
    makeItem('荊棘之甲', '敵方普攻與治療很多', { when: '補護甲與重創，處理多射手或高吸血陣容。' }),
    makeItem('冰霜之心', '敵方攻速核心很多', { when: '大量護甲與攻速壓制能提高卡住前線的時間。' })
  ],
  sources: [officialSources['7.2c'], officialSources['7.2']],
  sourceNote: '科加斯標準 ARAM 首版：技能數值以 Riot 7.2c 正式調整為基準；Tier、出裝與玩法依狹窄單線的雙範圍控制、饗宴成長與無自由回城環境推導，屬本站綜合評級。｜v93 7.2d 標準 ARAM 全量校正：已複核 Tier、模式修正、出裝、符文、召喚師技能與素材引用。',
  aramPatchImpact: {
    patch: '7.2c',
    direction: 'buff',
    summary: '恐懼尖刺傷害與饗宴成長提高，大絕冷卻縮短；7.2d 未再追加本體調整。'
  }
};

if (!heroById.has('chogath')) {
  data.heroes.push(chogath);
  heroById.set('chogath', chogath);
}

const tierChanges = [
  { id: 'syndra', from: 'S', to: 'S+', reason: '7.2d 全面提高技能傷害與三技頻率，單線遠距控制和爆發穩定性明顯上升。' },
  { id: 'jinx', from: 'S', to: 'S+', reason: '7.2c 基礎物攻與被動攻速強化後，ARAM 最重要的第一個擊殺更容易轉成連續收割。' },
  { id: 'caitlyn', from: 'S', to: 'S+', reason: '7.2d 提高爆頭成長並縮短陷阱充能，長直線消耗、推塔與陣地控制同步提升。' },
  { id: 'mordekaiser', from: 'A', to: 'S', reason: '7.2d 被動魔穿與三技冷卻強化，搭配既有 90% 承傷，正面長團與隔離核心的穩定度提高。' },
  { id: 'nilah', from: 'A', to: 'B', reason: '7.2c 暴擊轉物穿與大絕額外物攻係數大幅降低；單線近戰進場風險高，對陣容與進場時機更依賴。' }
];

for (const change of tierChanges) {
  const hero = getHero(change.id);
  hero.tier = change.to;
  hero.tierLabel = change.to === 'S+' ? '頂級強勢' : change.to === 'S' ? '強勢推薦' : change.to === 'A' ? '穩定可選' : '情境選擇';
  hero.tierReason = change.reason;
}

const patchImpacts = {
  chogath: ['7.2c', 'buff', '恐懼尖刺傷害、饗宴成長與冷卻獲得強化。'],
  jinx: ['7.2c', 'buff', '基礎物攻 54→58，被動攻速 12%→25%。'],
  nilah: ['7.2c', 'nerf', '暴擊轉物穿 35%→28%，大絕額外物攻係數 140%→50%。'],
  leona: ['7.2c', 'adjust', '前期生命與雙防降低，後期生命成長及二技冷卻補強。'],
  rumble: ['7.2c', 'adjust', '基礎傷害轉向更高魔攻係數，出裝更應維持法強核心。'],
  nasus: ['7.2c', 'nerf', '基礎物防降低，大絕冷卻延長；標準 ARAM Q 堆層規則仍保留。'],
  ryze: ['7.2c', 'nerf', '前期生命、物防與二技傷害下修。'],
  warwick: ['7.2c', 'nerf', '大絕冷卻延長且基礎傷害降低。'],
  kogmaw: ['7.2c', 'nerf', '大絕魔耗、射程與基礎傷害下修；預設仍以命中特效流為主。'],
  syndra: ['7.2d', 'buff', '一、二、三技傷害提高，三技冷卻縮短。'],
  yuumi: ['7.2d', 'buff', '附身與護盾能力提高，米凱的祝福也承接 7.2c 強化。'],
  vladimir: ['7.2d', 'buff', '生命／魔攻轉換與一、三技傷害提高。'],
  veigar: ['7.2d', 'buff', '一技施放距離 7.75→9。'],
  pantheon: ['7.2d', 'nerf', '一技暴擊生命門檻 35%→25%。'],
  mordekaiser: ['7.2d', 'buff', '被動魔穿提高，三技冷卻縮短。'],
  'twisted-fate': ['7.2d', 'nerf', '三技魔攻係數 45%→35%。'],
  fiora: ['7.2d', 'buff', '被動破綻真實傷害部分回調。'],
  gwen: ['7.2d', 'nerf', '一技魔攻係數降低。'],
  yone: ['7.2d', 'nerf', '基礎物防 43→37。'],
  renekton: ['7.2d', 'buff', '一、二技傷害提高。'],
  caitlyn: ['7.2d', 'buff', '爆頭成長提高，陷阱充能縮短。'],
  thresh: ['7.2d', 'nerf', '一技命中冷卻返還 3秒→2秒。']
};

for (const [id, [patch, direction, summary]] of Object.entries(patchImpacts)) {
  const hero = getHero(id);
  hero.aramPatchImpact = { patch, direction, summary };
  const source = officialSources[patch];
  hero.sources = [source, ...(hero.sources || []).filter((item) => item.url !== source.url)];
}

const syndra = getHero('syndra');
const syndraInfinity = clone(syndra.items.find((item) => item.name === '無限寶珠') || syndra.situationalItems.find((item) => item.name === '無限寶珠') || findExistingItem('無限寶珠'));
syndra.items[1] = makeItem('雷霆風暴', '7.2d 降價後更快成形；星朵拉一輪爆發容易觸發雷擊與跑速，便於拉開或追擊。');
syndra.situationalItems[0] = { ...syndraInfinity, when: '敵方脆皮多、需要提高低血斬殺', reason: '可替換黑焰火炬，強化大絕後的收尾能力。' };

const vladimir = getHero('vladimir');
vladimir.items = [
  makeItem('海克斯科技火箭腰帶', '補短位移與起手爆發，讓大絕、三技和血池更容易貼到關鍵目標。'),
  makeItem('峽谷製造者', '生命、技能加速與持續作戰增傷符合 ARAM 長團，也是 7.2d 官方配置的核心方向。'),
  makeItem('死亡之帽', '7.2d 提高生命／魔攻互轉後，高魔攻能同時放大傷害、治療與額外生命。'),
  makeItem('虛空之杖', '後期對方補魔抗時維持穿透；本體轉換與技能強化讓它更適合作為第四件。'),
  makeItem('中婭沙漏', '血池交掉後再拖一段無敵，等待下一輪一、三技與隊友跟上。')
];
vladimir.situationalItems[0] = makeItem('雷霆風暴', '敵方偏脆、需要更快第一輪爆發', { when: '7.2d 降價後可替換虛空之杖，打一套後取得額外爆發與跑速。' });

const pantheon = getHero('pantheon');
const pantheonItems = new Map(pantheon.items.map((item) => [item.name, item]));
pantheonItems.get('夜色緣界').reason = '7.2d 固定物穿提高至 12；法術盾能保護第二件成形後的跳入與暈眩。';
pantheon.items = ['巨蛇鋒牙', '夜色緣界', '殞落王者之劍', '席利妲咒怨', '守護天使'].map((name) => pantheonItems.get(name));

const yuumi = getHero('yuumi');
const yuumiItems = new Map(yuumi.items.map((item) => [item.name, item]));
yuumiItems.get('米凱的祝福').reason = '7.2c 將治療護盾量提高至 9%、淨化冷卻降至 75 秒；宿主被關鍵控制時可直接解控。';
yuumi.items = ['熾灼魔器', '和諧回音', '米凱的祝福', '流水之杖', '蘇瑞亞的戰歌'].map((name) => yuumiItems.get(name));

const leona = getHero('leona');
leona.items[1] = makeItem('日炎聖盾', '7.2c 改為更明確的高物防貼身坦裝，清兵與持續灼燒都符合雷歐娜長時間黏人的節奏。');

getHero('rakan').balance = {
  ...getHero('rakan').balance,
  damageDealt: '105%',
  damageTaken: '90%',
  note: '7.2b 官方將銳空造成傷害 100%→105%、承受傷害 95%→90%，並明確標示同時套用一般 ARAM。'
};
getHero('nocturne').balance = {
  ...getHero('nocturne').balance,
  damageTaken: '75%',
  note: '7.2b 官方將夜曲承受傷害 85%→75%，並明確標示同時套用一般 ARAM；造成傷害維持 100%。'
};
getHero('lissandra').balance = {
  ...getHero('lissandra').balance,
  damageTaken: '90%',
  note: '7.2b 官方在一般 ARAM 欄位將麗珊卓承受傷害 100%→90%；AAA ARAM 的 105% 傷害不混入標準模式。'
};
getHero('nasus').balance.note = '7.2b 官方將一技擊殺一般士兵堆層 8→18、砲車／英雄 32→24，並明確同步一般 ARAM；百分比傷害與承傷仍維持 100%／100%。';

const snowballHeroes = new Set([
  'amumu', 'fiddlesticks', 'galio', 'malphite', 'maokai', 'nautilus', 'ornn', 'rell', 'swain',
  'braum', 'diana', 'gragas', 'irelia', 'ksante', 'leona', 'nasus', 'nocturne', 'poppy', 'pyke',
  'rakan', 'samira', 'sett', 'sion', 'skarner', 'dr-mundo', 'thresh', 'wukong', 'aatrox', 'akali',
  'alistar', 'ambessa', 'darius', 'ekko', 'fizz', 'garen', 'gnar', 'gwen', 'hecarim', 'jax',
  'jarvan-iv', 'kassadin', 'katarina', 'kayn', 'lee-sin', 'master-yi', 'mordekaiser', 'nilah',
  'nunu-and-willump', 'olaf', 'pantheon', 'renekton', 'rengar', 'rammus', 'riven', 'singed', 'urgot',
  'vi', 'viego', 'volibear', 'warwick', 'xin-zhao', 'yasuo', 'yone', 'zed', 'camille', 'evelynn',
  'fiora', 'khazix', 'shen', 'shyvana', 'talon', 'tryndamere', 'chogath'
]);

for (const id of snowballHeroes) {
  const hero = getHero(id);
  const flash = makeSpell('閃現', '保留最可靠的進退與關鍵技能銜接；雪球戰車進場後仍可用閃現修正位置。');
  hero.spells = [flash, snowballSpell()];
}

const auditMarker = '｜v93 7.2d 標準 ARAM 全量校正：';
for (const hero of data.heroes) {
  hero.reviewedAt = '2026-09-01';
  hero.tierListVersion = 'v93';
  hero.reviewStatus = 'aram-v93-7.2d-full-audit';
  hero.standardAramAudit = {
    version: 'v93',
    patch: '7.2d',
    reviewed: ['tier', 'balance', 'items', 'boots', 'runes', 'spells', 'skills', 'assets']
  };
  const baseNote = String(hero.sourceNote || '').split(auditMarker)[0];
  hero.sourceNote = `${baseNote}${auditMarker}已複核 Tier、標準 ARAM 模式修正、7.2c／7.2d 英雄與道具、現行符文名稱及雪球戰車；無額外異動者沿用已驗證配置。`;

  const spellCard = hero.aaaAram?.sharedWithStandard?.find((card) => card.title === '召喚師技能');
  if (spellCard) {
    spellCard.value = (hero.spells || []).map((spell) => spell.name).join('＋');
    spellCard.note = '符文大亂鬥先沿用已校正的標準 ARAM 召喚師技能配置。';
  }
}

data.schemaVersion = 5;
data.gameVersion = '7.2d';
data.standardGameVersion = '7.2d';
data.aaaGameVersion = '7.2b';
data.dataVersion = '7.2d-v93-standard-aram-full-calibration';
data.status = '7.2d 標準 ARAM 141 位完整攻略｜符文大亂鬥資料獨立保留';
data.updated = '2026-09-01';
data.detailGuideCount = data.heroes.filter((hero) => hero.detailReady).length;
data.standardGuideCount = data.detailGuideCount;
data.aaaGuideCount = data.heroes.filter((hero) => hero.aaaAram).length;
data.tierCounts = Object.fromEntries(data.tierOrder.map((tier) => [tier, data.heroes.filter((hero) => hero.tier === tier).length]));
data.tierMethodology = {
  ...data.tierMethodology,
  factors: [
    '7.2c／7.2d 英雄、裝備與出戰配置改動',
    '官方一般 ARAM 專屬平衡修正（不混用 AAA ARAM）',
    '單線 5v5 團戰穩定度',
    '範圍傷害與控制',
    '開戰與保排',
    '續航與陣地能力',
    '射程與雪球戰車進場風險',
    '對特定陣容的依賴程度'
  ],
  note: '141 位英雄的 7.2d 標準 ARAM Tier、出裝、符文、召喚師技能、模式平衡與玩法已完成全量複核；符文大亂鬥增幅資料維持獨立版本，不混入標準模式判斷。'
};
data.notes = [
  'v93 標準 ARAM 全量校正：完成 141/141 位英雄複核並新增科加斯；調整 5 位英雄 Tier，修正銳空、夜曲、麗珊卓 3 筆一般 ARAM 模式數值。',
  `v93 資料一致性：校正 ${reportedCounters.standardItemReferences} 筆標準裝備 ID／名稱、${reportedCounters.standardRuneReferences} 筆符文 ID／名稱與 ${reportedCounters.standardSpellLabels} 筆召喚師技能名稱；${snowballHeroes.size} 位近戰／開戰英雄改用 7.1 後的雪球戰車。`,
  'v93 版本隔離：標準 ARAM 更新至 7.2d；符文大亂鬥 151 個增幅與既有 140 位分類攻略維持 7.2b 資料，不以未取得的 7.2d 遊戲內文字硬補。',
  ...data.notes.filter((note) => !String(note).startsWith('v93'))
];
data.sources = [
  officialSources['7.2d'],
  officialSources['7.2c'],
  officialSources['7.2b'],
  officialSources['7.2a'],
  officialSources['7.1'],
  ...(data.sources || []).filter((source) => !Object.values(officialSources).some((official) => official.url === source.url))
];
data.calibration = {
  version: 'v93',
  mode: 'standard-aram',
  profilesReviewed: data.standardGuideCount,
  tierChanges: tierChanges.length,
  balanceCorrections: 3,
  newHeroes: 1,
  snowballRecommendations: snowballHeroes.size,
  normalization: reportedCounters,
  aaaProfilesPreserved: data.aaaGuideCount
};

const manifest = {
  version: 'v93',
  gameVersion: '7.2d',
  mode: 'standard-aram',
  updated: '2026-09-01',
  scope: {
    profilesReviewed: data.standardGuideCount,
    uniqueHeroes: new Set(data.heroes.map((hero) => hero.id)).size,
    newHeroes: ['chogath'],
    aaaProfilesPreserved: data.aaaGuideCount,
    aaaDataVersion: '7.2b'
  },
  tierCounts: data.tierCounts,
  tierChanges,
  balanceCorrections: [
    { id: 'rakan', damageDealt: '105%', damageTaken: '90%', sourcePatch: '7.2b' },
    { id: 'nocturne', damageDealt: '100%', damageTaken: '75%', sourcePatch: '7.2b' },
    { id: 'lissandra', damageDealt: '100%', damageTaken: '90%', sourcePatch: '7.2b' }
  ],
  configurationChanges: [
    '科加斯新增完整標準 ARAM Tier、出裝、符文、召喚師技能、技能順序與玩法。',
    '星朵拉加入 7.2d 降價後的雷霆風暴核心。',
    '弗拉迪米爾依 7.2d 官方出戰配置改為火箭腰帶＋峽谷製造者核心。',
    '潘森將 7.2d 強化後的夜色緣界提前為第二件。',
    '悠咪將 7.2c 強化後的米凱的祝福提前為第三件。',
    '雷歐娜舊版日炎斗篷修正為 7.2c 日炎聖盾。'
  ],
  normalization: {
    ...reportedCounters,
    snowballRecommendations: snowballHeroes.size
  },
  patchAffectedReview: Object.entries(patchImpacts).map(([id, [patch, direction, summary]]) => ({ id, patch, direction, summary })),
  sources: [officialSources['7.2d'], officialSources['7.2c'], officialSources['7.2b'], officialSources['7.1']]
};

write(aramPath, data);
write(manifestPath, manifest);

console.log(JSON.stringify({
  version: data.dataVersion,
  profiles: data.standardGuideCount,
  tierCounts: data.tierCounts,
  tierChanges: tierChanges.length,
  balanceCorrections: manifest.balanceCorrections.length,
  snowballRecommendations: snowballHeroes.size,
  normalization: reportedCounters,
  aaaProfilesPreserved: data.aaaGuideCount
}, null, 2));
