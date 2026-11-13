// Execute the real SEO functions with a small DOM adapter; no npm install needed.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const nodes = [];
function node(tag) {
  return {
    tag, attrs: {}, dataset: {}, textContent: '',
    setAttribute(key, value) { this.attrs[key] = String(value); },
    getAttribute(key) { return this.attrs[key] ?? null; }
  };
}
function querySelector(selector) {
  const match = selector.match(/^(\w+)\[([^=\]]+)(?:="([^"]*)")?\]$/);
  if (!match) return null;
  const [, tag, key, value] = match;
  return nodes.find(n => n.tag === tag && (
    key === 'data-wrg-structured' ? n.dataset.wrgStructured === 'true' :
      (n.attrs[key] ?? n[key]) === value
  )) ?? null;
}
const document = {
  title: '', documentElement: {},
  head: { querySelector, appendChild(n) { nodes.push(n); } },
  querySelector, createElement: node,
  body: { classList: { toggle() {} } }
};
const context = vm.createContext({ window: {}, document, URL, URLSearchParams,
  location: { pathname: '/pages/heroes.html' }, console });
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/seo.js'), 'utf8'), context);
const heroes = fs.readFileSync(path.join(root, 'assets/js/heroes.js'), 'utf8');
const helpers = heroes.slice(0, heroes.indexOf('  async function shareHeroGuide('));
const evidence = heroes.slice(heroes.indexOf('  function tierEvidencePending('), heroes.indexOf('  function editorialChecks('));
vm.runInContext(helpers + evidence + '\nwindow.testSeo={state,setHeroListSeo,setHeroDetailSeo};})();', context);
const { testSeo } = context.window;
function robots() {
  assert.equal(nodes.filter(n => n.tag === 'meta' && n.attrs.name === 'robots').length, 1);
  return querySelector('meta[name="robots"]').attrs.content;
}
testSeo.setHeroListSeo();
assert.equal(robots(), 'index,follow,max-image-preview:large');
testSeo.setHeroDetailSeo({ id: 'sylas-mid', name: '賽勒斯', roleId: 'mid', tier: 'A' });
assert.equal(robots(), 'noindex,follow');
assert.equal(querySelector('link[rel="canonical"]').href, 'https://wild-rift-guide.vercel.app/share/heroes/sylas-mid.html');
testSeo.setHeroListSeo();
assert.equal(robots(), 'index,follow,max-image-preview:large');
testSeo.state.query = 'sylas';
testSeo.setHeroListSeo();
assert.equal(robots(), 'noindex,follow');
testSeo.state.query = '';
testSeo.state.role = 'mid';
testSeo.setHeroListSeo();
assert.equal(robots(), 'index,follow,max-image-preview:large');

const aram = fs.readFileSync(path.join(root, 'assets/js/aram-hero.js'), 'utf8');
const sync = aram.slice(aram.indexOf('    const syncModeUi=()=>{'), aram.indexOf("    root.querySelectorAll('[data-guide-mode]').forEach(button=>button.addEventListener"));
Object.assign(context, {
  currentMode: 'standard', hero: { id: 'sylas', name: '賽勒斯' },
  root: { querySelectorAll() { return []; } }, modeNote: null,
  standardVersion: '7.3f', aaaVersion: '7.3f', contentRoot: {},
  renderHeader() {}, render73f() { return ''; }, render73e() { return ''; },
  render73d() { return ''; }, renderAaa() { return ''; }, renderStandard() { return ''; },
  bindAaaSectionJumps() {}, bindAugmentCompatibility() {}
});
vm.runInContext(sync + '\nwindow.syncModeUi=syncModeUi;', context);
context.window.syncModeUi();
assert.equal(robots(), 'noindex,follow');
assert.equal(querySelector('link[rel="canonical"]').href, 'https://wild-rift-guide.vercel.app/share/aram/sylas.html');
context.currentMode = 'aaa';
context.window.syncModeUi();
assert.equal(robots(), 'noindex,follow');
assert.equal(querySelector('link[rel="canonical"]').href, 'https://wild-rift-guide.vercel.app/aram-hero.html?id=sylas&mode=aaa');
context.currentMode = 'standard';
context.window.syncModeUi();
assert.equal(robots(), 'noindex,follow');
console.log('PASS: actual SEO functions; list/detail/list; filters; ARAM/AAA/ARAM; one robots meta');
