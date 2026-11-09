(() => {
  const SITE_ORIGIN = 'https://wild-rift-guide.vercel.app';
  const DEFAULT_IMAGE = '/assets/images/brand/wild-rift-guide-og.png';
  const SITE_NAME = '激鬥峽谷攻略網';
  const SITE_BRAND = 'Wild Rift Guide';

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
  // V120_READABLE_CANONICALS_START
  const readableHeroIds = new Set(["smolder","miss-fortune","ezreal","varus","zeri","lucian","xayah","jhin","kogmaw","vayne","corki","kalista","sivir","kaisa","draven","ashe","jinx","caitlyn","twitch","tristana","samira","yunara","senna","aatrox-baron","akali-baron","ambessa-baron","aurora-baron","camille-baron","darius-baron","dr-mundo-baron","fiora-baron","garen-baron","gnar-baron","gragas-baron","gwen-baron","irelia-baron","jarvan-iv-baron","jax-baron","jayce-baron","ksante-baron","kayle-baron","kennen-baron","malphite-baron","maokai-baron","mordekaiser-baron","nasus-baron","nautilus-baron","nidalee-baron","olaf-baron","ornn-baron","pantheon-baron","poppy-baron","renekton-baron","riven-baron","rumble-baron","ryze-baron","sett-baron","shen-baron","singed-baron","sion-baron","skarner-baron","swain-baron","teemo-baron","tryndamere-baron","urgot-baron","viego-baron","vladimir-baron","volibear-baron","warwick-baron","wukong-baron","yasuo-baron","yone-baron","aatrox-jungle","ambessa-jungle","amumu-jungle","camille-jungle","darius-jungle","diana-jungle","dr-mundo-jungle","ekko-jungle","evelynn-jungle","fiddlesticks-jungle","fizz-jungle","gragas-jungle","graves-jungle","gwen-jungle","hecarim-jungle","jarvan-iv-jungle","jax-jungle","kayn-jungle","khazix-jungle","kindred-jungle","lee-sin-jungle","lillia-jungle","maokai-jungle","morgana-jungle","nidalee-jungle","nilah-jungle","nocturne-jungle","nunu-and-willump-jungle","olaf-jungle","pantheon-jungle","poppy-jungle","rammus-jungle","rengar-jungle","riven-jungle","shyvana-jungle","skarner-jungle","taliyah-jungle","talon-jungle","tryndamere-jungle","vi-jungle","viego-jungle","volibear-jungle","warwick-jungle","wukong-jungle","xin-zhao-jungle","yone-jungle","zed-jungle","ahri-mid","akali-mid","akshan-mid","annie-mid","aurelion-sol-mid","aurora-mid","brand-mid","diana-mid","ekko-mid","fizz-mid","galio-mid","heimerdinger-mid","irelia-mid","jayce-mid","kassadin-mid","katarina-mid","kayle-mid","kennen-mid","lissandra-mid","lux-mid","mel-mid","morgana-mid","norra-mid","orianna-mid","ryze-mid","swain-mid","syndra-mid","taliyah-mid","teemo-mid","twisted-fate-mid","veigar-mid","velkoz-mid","vex-mid","viktor-mid","vladimir-mid","yasuo-mid","yone-mid","zed-mid","ziggs-mid","zoe-mid","zyra-mid","alistar-support","bard-support","blitzcrank-support","brand-support","braum-support","galio-support","janna-support","karma-support","leona-support","lulu-support","lux-support","malphite-support","maokai-support","milio-support","morgana-support","nami-support","nautilus-support","pyke-support","rakan-support","rell-support","senna-support","seraphine-support","ornn-support","sona-support","soraka-support","swain-support","thresh-support","veigar-support","velkoz-support","yuumi-support","zilean-support","zyra-support","master-yi-jungle","shen-jungle","nautilus-jungle","corki-mid","karma-mid","talon-mid","rumble-mid","seraphine-mid","chogath-baron","chogath-jungle","hwei-mid"]);
  function readableCanonicalPath(path) {
    try {
      const url = new URL(path, SITE_ORIGIN);
      const id = url.searchParams.get("hero");
      if (url.origin === SITE_ORIGIN && url.pathname === "/pages/heroes.html" && readableHeroIds.has(id)) return `/share/heroes/${encodeURIComponent(id)}.html`;
    } catch (_) {}
    return path;
  }
  // V120_READABLE_CANONICALS_END
  function set({ title, description, path = location.pathname, image = DEFAULT_IMAGE, type = 'website', robots = 'index,follow', structuredData = null }) {
    const canonical = absolute(readableCanonicalPath(path));
    const imageUrl = absolute(String(image || DEFAULT_IMAGE).replace(/^\.\.\//, '/'));
    document.documentElement.lang = 'zh-Hant-TW';
    document.title = title;
    upsertMeta('meta[name="description"]', {name:'description'}, description);
    upsertMeta('meta[name="robots"]', {name:'robots'}, robots);
    upsertMeta('meta[property="og:title"]', {property:'og:title'}, title);
    upsertMeta('meta[property="og:description"]', {property:'og:description'}, description);
    upsertMeta('meta[property="og:type"]', {property:'og:type'}, type);
    upsertMeta('meta[property="og:url"]', {property:'og:url'}, canonical);
    upsertMeta('meta[property="og:image"]', {property:'og:image'}, imageUrl);
    upsertMeta('meta[property="og:image:alt"]', {property:'og:image:alt'}, `${SITE_BRAND} 激鬥峽谷繁體中文攻略`);
    upsertMeta('meta[property="og:site_name"]', {property:'og:site_name'}, SITE_NAME);
    upsertMeta('meta[property="og:locale"]', {property:'og:locale'}, 'zh_TW');
    upsertMeta('meta[name="twitter:card"]', {name:'twitter:card'}, 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', {name:'twitter:title'}, title);
    upsertMeta('meta[name="twitter:description"]', {name:'twitter:description'}, description);
    upsertMeta('meta[name="twitter:image"]', {name:'twitter:image'}, imageUrl);
    upsertMeta('meta[name="twitter:image:alt"]', {name:'twitter:image:alt'}, `${SITE_BRAND} 激鬥峽谷繁體中文攻略`);
    upsertLink('canonical', canonical);
    if (structuredData) {
      const originalCanonical = absolute(path);
      const alignedData = canonical === originalCanonical ? structuredData : JSON.parse(JSON.stringify(structuredData, (_key, value) => {
        if (typeof value === 'string' && (value === originalCanonical || value.startsWith(originalCanonical + '#'))) return canonical + value.slice(originalCanonical.length);
        return value;
      }));
      setStructuredData(alignedData);
    }
    return canonical;
  }
  function heroShareUrl(heroId) {
    return absolute(`/share/heroes/${encodeURIComponent(heroId)}.html`);
  }

  window.WRGSeo = Object.freeze({ SITE_ORIGIN, SITE_NAME, SITE_BRAND, absolute, set, heroShareUrl });
})();
