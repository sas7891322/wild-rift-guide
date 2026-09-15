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


const aram = read('assets/data/aram/heroes.json');
const report = read('assets/data/calibration-7.2e-v95.json');
expect(patchData.version === '7.2e' && patchData.siteVersion === 'v95', 'Current patch mismatch');
expect(heroesData.heroes.length === 202 && heroesData.heroCatalog.length === 141, 'Rift counts');
expect(aram.heroes.length === 141 && aram.heroes.filter(x => x.aaaAram).length === 140, 'ARAM counts');
expect(aram.standardGameVersion === '7.2e' && aram.aaaGameVersion === '7.2b', 'Mode version separation');
for(const [file, hash] of Object.entries(report.protectedHashes)) expect(sha256(file) === hash, `Protected file changed: ${file}`);
for (const hero of aram.heroes) {
  for(const [field,count] of Object.entries({items:5,boots:2,runes:5,spells:2,starterItems:1,situationalItems:3})) {
    expect(hero[field].length === count, `${hero.id}/${field}: count`);
    expect(new Set(hero[field].map(x=>x.id)).size === count, `${hero.id}/${field}: duplicates`);
    for(const entry of hero[field]) {
      const ids=field==='runes'?runeIds:field==='spells'?new Set([...spellIds,'snowball-chariot']):itemIds;
      expect(ids.has(entry.id), `${hero.id}/${field}: unknown ${entry.id}`);
      expect(fs.existsSync(entry.icon), `${hero.id}/${field}: missing ${entry.icon}`);
      if(itemIds.has(entry.id))expect(itemById.get(entry.id).name === entry.name, `${hero.id}: name mismatch`);
    }
  }
  for(const plan of hero.aaaAram?.buildPlans||[]) for(const entry of plan.items) {
    expect(itemIds.has(entry.id), `${hero.id}/AAA unknown item`);
    expect(fs.existsSync(entry.icon), `${hero.id}/AAA missing icon`);
  }
}
const despair=itemById.get('defense-high-03');
expect(despair.buildFrom.reduce((sum,id)=>sum+itemById.get(id).price,despair.combineCost) === despair.price,'Unending Despair recipe cost');
expect(itemById.get('physical-high-36').price===2900,'Eclipse price');
expect(despair.stats.includes('+10 技能加速'),'Unending Despair haste');
for(const change of report.changes) for(const [field,delta] of Object.entries(change.changes)) {
 expect(JSON.stringify(profileById.get(change.profileId)[field])===JSON.stringify(delta.to), `Audit mismatch ${change.profileId}/${field}`);
}
const runeMeta = new Map(Object.entries(runesData).flatMap(([tree, entries])=>entries.map(x=>[x.id,{tree,row:x.row}])));
function validRunes(ids,label){
 const m=ids.map(id=>runeMeta.get(id));
 expect(m.length===5 && m.every(Boolean),label+' rune IDs');
 if(m.length!==5||!m.every(Boolean))return;
 expect(m[0].tree==='keystone',label+' keystone');
 expect([1,2,3].every(i=>m[i].tree===m[1].tree&&m[i].row===i),label+' main rune rows');
 expect(m[4].tree!==m[1].tree&&m[4].tree!=='keystone',label+' secondary tree');
}
for(const hero of heroesData.heroes){
 validRunes(hero.runes,hero.id);
 for(const scenario of hero.matchupAdjustments.situations){
 const result=hero.runes.map(id=>scenario.changes.find(c=>c.type==='rune'&&c.fromId===id)?.toId||id);
 validRunes(result,hero.id+'/'+scenario.id);
 }
 for(const v of hero.buildVariants||[]){
 validRunes(v.runes,hero.id+'/'+v.id);
 expect(v.items.length===5&&new Set(v.items).size===5&&v.items.every(id=>itemIds.has(id)),hero.id+' variant items');
 expect(v.spells.length===2&&v.spells.every(id=>spellIds.has(id)),hero.id+' variant spells');
 }
}
for(const hero of aram.heroes){
 validRunes(hero.runes.map(x=>x.id),'ARAM '+hero.id);
 for(const v of hero.buildVariants||[]){
 validRunes(v.runes.map(x=>x.id),'ARAM variant '+hero.id);
 expect(v.items.length===5&&v.items.every(x=>itemIds.has(x.id)&&fs.existsSync(x.icon)),'ARAM variant items');
 }
}
expect(aram.heroes.find(x=>x.id==='pyke').aaaAram.unavailableAugments.includes('血償'),'Pyke restriction');
expect(JSON.stringify(aram.tierCounts) === JSON.stringify(Object.fromEntries(aram.tierOrder.map(t=>[t,aram.heroes.filter(x=>x.tier===t).length]))),'ARAM tier counts');
for(const file of ['summoners-rift.html','pages/patch.html'])expect(text(file).includes('7.2e'),'Page version '+file);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(JSON.stringify({version:'v95',riftProfiles:202,aramProfiles:141,aaaProfiles:140,structureAndReferences:'PASS',protectedFiles:'PASS',officialDelta:'PASS'},null,2));
