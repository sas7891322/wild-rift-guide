import fs from 'node:fs';
import path from 'node:path';
const errors=[];
const read=(f)=>fs.readFileSync(f,'utf8');
const exists=(f)=>fs.existsSync(f);
const articleDir='articles';
const articleFiles=exists(articleDir)?fs.readdirSync(articleDir).filter(x=>x.endsWith('.html')&&x!=='index.html'):[];
if(articleFiles.length!==10) errors.push(`editorial article count ${articleFiles.length}/10`);
for(const f of articleFiles){
  const html=read(path.join(articleDir,f));
  const text=html.replace(/<script[\s\S]*?<\/script>/g,' ').replace(/<style[\s\S]*?<\/style>/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  if(text.length<1200) errors.push(`${f}: article text too thin (${text.length})`);
  if(!html.includes('Wild Rift Guide 編輯室')) errors.push(`${f}: author block missing`);
  if(!html.includes('type="application/ld+json"')) errors.push(`${f}: Article schema missing`);
  if(!html.includes('name="robots" content="index,follow')) errors.push(`${f}: not indexable`);
}
for(const f of ['index.html','articles/index.html','pages/about.html','pages/contact.html','pages/editorial.html','pages/changelog.html','assets/css/editorial.css']){
  if(!exists(f)) errors.push(`${f}: missing`);
}
const home=read('index.html');
for(const phrase of ['先學會判斷，再看單一英雄','本站不是只給一套答案','最近校正與內容更新','查看編輯原則']) if(!home.includes(phrase)) errors.push(`home missing: ${phrase}`);
const about=read('pages/about.html');
for(const phrase of ['內容怎麼校正','原創內容與外部來源','程式與工具如何參與內容','廣告與編輯獨立']) if(!about.includes(phrase)) errors.push(`about missing: ${phrase}`);
const editorial=read('pages/editorial.html');
for(const phrase of ['官方資料優先處理客觀異動','Tier 與推薦配置是站方判斷','廣告與支持不參與編輯','更正流程']) if(!editorial.includes(phrase)) errors.push(`editorial missing: ${phrase}`);
const sitemap=read('sitemap.xml');
const count=(sitemap.match(/<url>/g)||[]).length;
if(count<373) errors.push(`sitemap URL count ${count}, expected >=373`);
for(const url of ['/articles/','/articles/itemization-by-enemy-comp.html','/pages/editorial.html','/pages/changelog.html']) if(!sitemap.includes(url)) errors.push(`sitemap missing ${url}`);
if(sitemap.includes('/pages/member.html')||sitemap.includes('/pages/auth-callback.html')) errors.push('private pages must not be in sitemap');
if(read('ads.txt').trim()!=='google.com, pub-3703014721072968, DIRECT, f08c47fec0942fa0') errors.push('ads.txt invalid');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(JSON.stringify({version:'v93-adsense-quality',originalEditorialArticles:10,sitemapUrls:count,homePublisherContent:true,editorialPolicy:true,publicChangelog:true,trustPagesEnhanced:true},null,2));
