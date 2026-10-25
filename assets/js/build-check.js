(async()=>{
'use strict';
const status=document.getElementById('build-tool-status');
const mode=document.getElementById('build-mode'),heroSelect=document.getElementById('build-hero');
const inputs=document.getElementById('build-item-inputs'),result=document.getElementById('build-result');
const extra=document.getElementById('build-extra-hp'),guide=document.getElementById('build-guide-link');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{
 const paths=['items-7.3.json','heroes.json','hwei-profile.json','aram/heroes.json'];
 const [db,rift,hwei,aram]=await Promise.all(paths.map(async path=>{const r=await fetch('../assets/data/'+path+'?v=123.0.0');if(!r.ok)throw new Error('無法讀取資料');return r.json();}));
 const items=db.items.filter(x=>['高階裝備','主動裝備','進化裝備'].includes(x.stage));
 const im=new Map(items.map(x=>[x.id,x]));
 const rh=[...rift.heroes];if(!rh.some(x=>x.id===hwei.id))rh.push(hwei);
 const pool=()=>mode.value==='aram'?aram.heroes:rh;
 const selects=Array.from({length:5},(_,i)=>{const wrap=document.createElement('div');wrap.className='tool-row';const label=document.createElement('label');label.htmlFor='build-item-'+i;label.textContent='第 '+(i+1)+' 件';const select=document.createElement('select');select.id=label.htmlFor;select.innerHTML='<option value="">尚未選擇</option>'+items.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${x.stage==='進化裝備'?'（進化）':''}</option>`).join('');wrap.append(label,select);inputs.append(wrap);select.addEventListener('change',check);return select;});
 function stat(item,label){const line=(item?.stats||[]).find(s=>label==='生命'?/\+\s*[\d,]+\s*最大生命/.test(s):s.includes(label))||'';const m=line.match(/\+\s*([\d,.]+)/);return m?Number(m[1].replaceAll(',','')):0;}
 function check(){
  const chosen=selects.map(s=>im.get(s.value));const ids=chosen.filter(Boolean).map(x=>x.id);const names=chosen.filter(Boolean).map(x=>x.name);const alerts=[];
  if(ids.length!==5)alerts.push('目前選了'+ids.length+'件；本站標準配置為五件成裝加一雙鞋。');
  if(new Set(ids).size!==ids.length)alerts.push('有重複成裝，先確認是否誤選。');
  [['致死宣告','多明尼克的問候','席利妲咒怨'],['不朽盾弓','史特拉克手套','魔提斯深淵']].forEach((group,i)=>{const same=names.filter(n=>group.includes(n));if(same.length>1)alerts.push((i===0?'同類百分比物穿':'同名命脈')+'重疊：'+same.join('、')+'。依重創、打坦或生存用途擇一。');});
  const act=chosen.filter(x=>x?.stage==='主動裝備');if(act.length>1)alerts.push('有多件主動裝備：'+act.map(x=>x.name).join('、')+'。確認主動效果限制，不將它們全部視為可同時施放的保命按鈕。');
  const other=Math.min(20000,Math.max(0,Number(extra.value)||0));const health=chosen.reduce((n,x)=>n+stat(x,'生命'),other);const crit=chosen.reduce((n,x)=>n+stat(x,'暴擊率'),0);
  const warm=chosen.findIndex(x=>x?.name==='好戰者鎧甲');
  if(warm>=0){const atPurchase=chosen.slice(0,warm+1).reduce((n,x)=>n+stat(x,'生命'),other);if(atPurchase<1250)alerts.push('買到好戰者當下只有'+atPurchase+'額外生命，未達1250門檻；先補生命或調整購買順序。');if(health<1250)alerts.push('五件成裝完成後仍未達好戰者門檻，還差'+(1250-health)+'額外生命。');}
  if(crit>100)alerts.push('裝備暴擊合計超過100%；超出部分的用途需依英雄或增幅機制判斷。');
  result.innerHTML=`<h2>組合檢查</h2><p>平面額外生命：<strong>${health}</strong>（含手填${other}） · 裝備暴擊率：<strong>${crit}%</strong></p>`+(alerts.length?alerts.map(t=>'<p class="tool-alert">'+esc(t)+'</p>').join(''):'<p class="tool-good">未發現此工具涵蓋的重複／門檻問題。仍需依敵方陣容與英雄功能決定。</p>');
 }
 function refreshHeroes(){heroSelect.innerHTML=pool().map(h=>`<option value="${esc(h.id)}">${esc(h.name)}${mode.value==='rift'?' · '+esc(h.role):''}</option>`).join('');load();}
 function load(){const hero=pool().find(x=>x.id===heroSelect.value);if(!hero)return;const ids=hero.items.map(x=>typeof x==='string'?x:x.id);selects.forEach((s,i)=>{s.value=ids[i]||'';});const path=(mode.value==='aram'?'aram':'heroes');guide.innerHTML=`<a href="../share/${path}/${encodeURIComponent(hero.id)}.html">閱讀${esc(hero.name)}完整攻略與使用理由 →</a>`;check();}
 mode.addEventListener('change',refreshHeroes);heroSelect.addEventListener('change',load);document.getElementById('build-load').addEventListener('click',load);extra.addEventListener('input',check);refreshHeroes();status.textContent='資料版本7.3c · 2026/10/25校正。此工具不儲存或上傳你的配裝。';
}catch(err){status.textContent='資料載入失敗，請重新整理，或使用下方完整閱讀版攻略。';console.error(err);}
})();
