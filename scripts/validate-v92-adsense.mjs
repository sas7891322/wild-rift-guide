import fs from 'node:fs';
import path from 'node:path';

const errors=[];
const read=(file)=>fs.readFileSync(file,'utf8');
const heroData=JSON.parse(read('assets/data/heroes.json'));
const aramData=JSON.parse(read('assets/data/aram/heroes.json'));
const heroFiles=fs.readdirSync('share/heroes').filter(x=>x.endsWith('.html'));
const aramFiles=fs.readdirSync('share/aram').filter(x=>x.endsWith('.html'));

if(heroFiles.length!==heroData.heroes.length) errors.push(`Summoner static guide count ${heroFiles.length}/${heroData.heroes.length}`);
if(aramFiles.length!==aramData.heroes.length) errors.push(`ARAM static guide count ${aramFiles.length}/${aramData.heroes.length}`);

for(const file of heroFiles){
  const html=read(path.join('share/heroes',file));
  if(!html.includes('name="robots" content="index,follow')) errors.push(`${file}: not indexable`);
  if(!html.includes(`rel="canonical" href="https://wild-rift-guide.vercel.app/share/heroes/${file}"`)) errors.push(`${file}: bad canonical`);
  if(!html.includes('資料來源與本站判斷')) errors.push(`${file}: editorial section missing`);
}
for(const file of aramFiles){
  const html=read(path.join('share/aram',file));
  if(!html.includes('name="robots" content="index,follow')) errors.push(`ARAM ${file}: not indexable`);
  if(!html.includes(`rel="canonical" href="https://wild-rift-guide.vercel.app/share/aram/${file}"`)) errors.push(`ARAM ${file}: bad canonical`);
  if(!html.includes('資料來源與版本說明')) errors.push(`ARAM ${file}: source section missing`);
}

const sitemap=read('sitemap.xml');
if((sitemap.match(/<url>/g)||[]).length!==360) errors.push('sitemap URL count should be 360');
if(!sitemap.includes('/share/heroes/jinx.html')||!sitemap.includes('/share/aram/amumu.html')) errors.push('static guide URLs missing from sitemap');
if(sitemap.includes('/pages/member.html')||sitemap.includes('/pages/auth-callback.html')) errors.push('private pages must not be in sitemap');

const heroScript=read('assets/js/heroes.js');
if(!heroScript.includes('return `/share/heroes/${encodeURIComponent(hero.id)}.html`;')) errors.push('dynamic hero canonical is not pointed at static guide');
if(!heroScript.includes('7.2d')) errors.push('hero UI 7.2d metadata missing');

for(const file of ['pages/member.html','pages/auth-callback.html','aram-hero.html']){
  if(read(file).includes('pagead2.googlesyndication.com')) errors.push(`${file}: AdSense loader should be excluded`);
}
for(const file of ['index.html','pages/heroes.html','pages/about.html','share/heroes/jinx.html']){
  if(!read(file).includes('pagead2.googlesyndication.com')) errors.push(`${file}: AdSense review loader missing`);
}

if(read('ads.txt').trim()!=='google.com, pub-3703014721072968, DIRECT, f08c47fec0942fa0') errors.push('ads.txt invalid');
if(!read('pages/about.html').includes('內容怎麼校正')||!read('pages/about.html').includes('原創內容與外部來源')) errors.push('About editorial transparency missing');
if(!read('pages/privacy.html').includes('Google 同意聲明管理平台')) errors.push('CMP privacy disclosure missing');

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(JSON.stringify({
  version:'v92-adsense-second-review',
  crawlableSummonerGuides:heroFiles.length,
  crawlableAramGuides:aramFiles.length,
  sitemapUrls:360,
  adsTxt:true,
  privatePagesExcludedFromAds:true,
  editorialTransparency:true
},null,2));
