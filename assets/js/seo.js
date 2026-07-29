(() => {
  const SITE_ORIGIN = 'https://wild-rift-guide.vercel.app';
  const DEFAULT_IMAGE = '/assets/images/brand/wild-rift-guide-og.png';
  const SITE_NAME = 'Wild Rift Guide';

  function absolute(path = '/') {
    try { return new URL(path, SITE_ORIGIN + '/').href; } catch (_) { return SITE_ORIGIN + '/'; }
  }
  function upsertMeta(selector, attrs, value) {
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement('meta');
      Object.entries(attrs).forEach(([key, val]) => node.setAttribute(key, val));
      document.head.appendChild(node);
    }
    node.setAttribute('content', value || '');
    return node;
  }
  function upsertLink(rel, href) {
    let node = document.head.querySelector(`link[rel="${rel}"]`);
    if (!node) {
      node = document.createElement('link');
      node.rel = rel;
      document.head.appendChild(node);
    }
    node.href = href;
    return node;
  }
  function setStructuredData(data) {
    let node = document.head.querySelector('script[data-wrg-structured]');
    if (!node) {
      node = document.createElement('script');
      node.type = 'application/ld+json';
      node.dataset.wrgStructured = 'true';
      document.head.appendChild(node);
    }
    node.textContent = JSON.stringify(data);
  }
  function set({ title, description, path = location.pathname, image = DEFAULT_IMAGE, type = 'website', robots = 'index,follow', structuredData = null }) {
    const canonical = absolute(path);
    const imageUrl = absolute(String(image || DEFAULT_IMAGE).replace(/^\.\.\//, '/'));
    document.title = title;
    upsertMeta('meta[name="description"]', {name:'description'}, description);
    upsertMeta('meta[name="robots"]', {name:'robots'}, robots);
    upsertMeta('meta[property="og:title"]', {property:'og:title'}, title);
    upsertMeta('meta[property="og:description"]', {property:'og:description'}, description);
    upsertMeta('meta[property="og:type"]', {property:'og:type'}, type);
    upsertMeta('meta[property="og:url"]', {property:'og:url'}, canonical);
    upsertMeta('meta[property="og:image"]', {property:'og:image'}, imageUrl);
    upsertMeta('meta[property="og:site_name"]', {property:'og:site_name'}, SITE_NAME);
    upsertMeta('meta[property="og:locale"]', {property:'og:locale'}, 'zh_TW');
    upsertMeta('meta[name="twitter:card"]', {name:'twitter:card'}, 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', {name:'twitter:title'}, title);
    upsertMeta('meta[name="twitter:description"]', {name:'twitter:description'}, description);
    upsertMeta('meta[name="twitter:image"]', {name:'twitter:image'}, imageUrl);
    upsertLink('canonical', canonical);
    if (structuredData) setStructuredData(structuredData);
    return canonical;
  }
  function heroShareUrl(heroId) {
    return absolute(`/share/heroes/${encodeURIComponent(heroId)}.html`);
  }

  window.WRGSeo = Object.freeze({ SITE_ORIGIN, SITE_NAME, absolute, set, heroShareUrl });
})();
