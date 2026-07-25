const DB = window.ESPORTS_DATA;
let state = { league: null, view: 'home', team: null };
const main = document.getElementById('main');
const leagueNav = document.getElementById('leagueNav');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const search = document.getElementById('globalSearch');
const searchResults = document.getElementById('searchResults');
const compareBtn = document.getElementById('compareBtn');
const snapshot = document.querySelector('.snapshot');

const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const pct = (wins, games) => games ? Math.round((wins / games) * 1000) / 10 : 0;
const league = id => DB.leagues.find(x => x.id === id);
const leagueTeams = id => DB.teams.filter(t => t.league === id);
const leagueMatches = id => DB.matches.filter(m => m.league === id);
const team = (id, leagueId = state.league) => DB.teams.find(x => x.id === id && x.league === leagueId);
const champCount = t => t.players.reduce((n,p)=>n+p.champions.length,0);
const playerCount = leagueId => leagueTeams(leagueId).reduce((n,t)=>n+t.players.length,0);
const compPatch = l => l.patch || DB.meta.patch;
const compSeason = l => l.season || DB.meta.season;
const compSplit = l => l.split || DB.meta.split;

function goGlobalHome(){
  state.league = null;
  state.team = null;
  state.view = 'home';
  renderLeagueNav();
  syncSideActions();
  render();
}

function goLeague(id){
  state.league = id;
  state.team = null;
  state.view = 'teams';
  renderLeagueNav();
  syncSideActions();
  render();
}

function renderLeagueNav(){
  leagueNav.innerHTML = `
    <button class="league-btn ${!state.league?'active':''}" data-global-home>
      <span class="league-code">HOME</span><span class="league-region">首頁</span>
    </button>` + DB.leagues.map(l => `
    <button class="league-btn ${state.league===l.id?'active':''}" data-league="${l.id}">
      <span class="league-code">${l.id}</span><span class="league-region">${l.region}</span>${l.status!=='active'?'<span class="league-soon">SOON</span>':''}
    </button>`).join('');
  leagueNav.querySelector('[data-global-home]').addEventListener('click', goGlobalHome);
  leagueNav.querySelectorAll('[data-league]').forEach(btn=>btn.addEventListener('click',()=>goLeague(btn.dataset.league)));
}

function headerHTML(l){
  const patch = compPatch(l), season = compSeason(l), split = compSplit(l);
  return `<section class="hero">
    <div><div class="eyebrow">${esc(l.region)} · ${esc(l.id)} · ${esc(patch)}</div>
      <h1>${esc(l.title || '全球職業賽資料庫')}</h1>
      <p>${l.status==='active'?'以每一局原始比賽為底層，自動聚合戰隊、選手、英雄出場與勝率。英雄名稱統一使用台灣伺服器繁體中文。':'網站架構已預留此賽區；建立名單與比賽資料後即可直接啟用。'}</p>
    </div>
    <div class="filterbar">
      <select class="selectbox"><option>${esc(season)}</option></select>
      <select class="selectbox"><option>${esc(split)}</option></select>
      <select class="selectbox"><option>${esc(patch)}</option></select>
    </div>
  </section>`;
}

function renderGlobalHome(){
  const activeLeagues = DB.leagues.filter(l=>l.status==='active');
  const activeTeams = DB.teams.filter(t=>activeLeagues.some(l=>l.id===t.league));
  const totalPlayers = activeTeams.reduce((n,t)=>n+t.players.length,0);
  const totalGames = DB.matches.reduce((n,m)=>n+m.scoreA+m.scoreB,0);
  const leagueCards = DB.leagues.map(l=>{
    const teams = leagueTeams(l.id);
    const matches = leagueMatches(l.id);
    const active = l.status==='active';
    const loaded = teams.filter(t=>champCount(t)>0).length;
    return `<article class="global-league-card ${active?'active':'planned'}" data-league-card="${l.id}" ${active?`data-home-league="${l.id}"`:''}>
      ${l.logo?`<img class="global-league-logo" src="${esc(l.logo)}" alt="" aria-hidden="true" loading="lazy" referrerpolicy="no-referrer">`:''}
      <div class="global-card-top"><span class="global-region">${esc(l.region)}</span></div>
      <div class="global-code">${esc(l.id)}</div>
      <h3>${esc(l.name)}</h3>
      <p>${active?`${esc(compSeason(l))} ${esc(compSplit(l))} · Patch ${esc(compPatch(l))}`:'資料結構已預留，等待建立賽事資料。'}</p>
      <div class="global-card-meta">
        <span><strong>${teams.length || '—'}</strong> 戰隊</span>
        <span><strong>${matches.length}</strong> 系列</span>
        ${active?`<span><strong>${loaded}/${teams.length}</strong> 有英雄資料</span>`:''}
      </div>
      <div class="global-card-arrow">${active?'進入聯賽 →':'COMING SOON'}</div>
    </article>`;
  }).join('');

  main.innerHTML = `
    <section class="global-hero">
      <div class="global-hero-copy">
        <div class="eyebrow">GLOBAL LEAGUE OF LEGENDS ESPORTS DATABASE</div>
        <h1>全球職業賽<br><span>數據資料庫</span></h1>
        <p>從賽區、戰隊、選手一路查到版本英雄池。以完賽資料持續累積出場數、勝敗與勝率，作為賽事分析的底層資料。</p>
      </div>
      <div class="global-visual" aria-hidden="true">
        <div class="rift-orbit orbit-one"></div><div class="rift-orbit orbit-two"></div>
        <div class="rift-core"><strong>RIFT</strong><span>DB</span></div>
        <span class="orbit-label label-lpl">LPL</span><span class="orbit-label label-lec">LEC</span><span class="orbit-label label-lck">LCK</span><span class="orbit-label label-lcp">LCP</span>
      </div>
    </section>

    <section class="stats-grid global-stats">
      <div class="stat-card"><small>已啟用聯賽</small><strong>${activeLeagues.length}/${DB.leagues.length}</strong><span>全球 Tier 1 架構</span></div>
      <div class="stat-card"><small>已建立戰隊</small><strong>${activeTeams.length}</strong><span>目前已建檔戰隊總數</span></div>
      <div class="stat-card"><small>名單選手</small><strong>${totalPlayers}</strong><span>目前資料庫名單</span></div>
      <div class="stat-card"><small>已記錄比賽</small><strong>${DB.matches.length}</strong><span>${totalGames} 個小局</span></div>
    </section>

    <section class="section-head global-section-head"><div><div class="section-kicker">LEAGUES</div><h2>選擇賽區</h2></div><span>已啟用的聯賽可直接進入</span></section>
    <section class="global-league-grid">${leagueCards}</section>
    <div class="source-note">資料庫快照：${esc(DB.meta.updated)} · 所有英雄名稱統一使用台灣伺服器繁體中文。</div>`;

  main.querySelectorAll('[data-home-league]').forEach(el=>el.addEventListener('click',()=>goLeague(el.dataset.homeLeague)));
}

function renderHome(){
  const l = league(state.league);
  if(!l){renderGlobalHome();return;}
  if(l.status!=='active'){
    main.innerHTML = headerHTML(l)+`<div class="empty-state"><div class="big-code">${l.id}</div><h2>${esc(l.name)}</h2><p>${esc(l.region)} 賽區已經放進全球架構，目前尚未建立正式戰隊資料。</p></div>`;
    return;
  }
  const teams = leagueTeams(l.id);
  const matches = leagueMatches(l.id);
  const loadedTeams=teams.filter(t=>t.players.some(p=>p.champions.length)).length;
  const totalGames=matches.reduce((n,m)=>n+m.scoreA+m.scoreB,0);
  main.innerHTML = headerHTML(l)+`
    <section class="stats-grid">
      <div class="stat-card"><small>聯賽戰隊</small><strong>${teams.length}</strong><span>${esc(compSeason(l))} ${esc(compSplit(l))}</span></div>
      <div class="stat-card"><small>已建檔系列</small><strong>${matches.length}</strong><span>完成 BO3 後寫入</span></div>
      <div class="stat-card"><small>已記錄小局</small><strong>${totalGames}</strong><span>Patch ${esc(compPatch(l))}</span></div>
      <div class="stat-card"><small>已有英雄資料</small><strong>${loadedTeams}/${teams.length}</strong><span>${playerCount(l.id)} 名名單選手</span></div>
    </section>
    <section class="section-head"><h2>${l.id} 戰隊</h2><span>點選戰隊查看選手與版本英雄池</span></section>
    <section class="team-grid">${teams.map(t=>teamCard(t,l)).join('')}</section>
    <div class="source-note">資料快照：${DB.meta.updated}${l.note?` · ${esc(l.note)}`:''}</div>`;
  main.querySelectorAll('[data-team]').forEach(card=>card.addEventListener('click',()=>{state.team=card.dataset.team;renderTeam();}));
}

function teamCard(t,l){
  const hasData=champCount(t)>0;
  const hasSeries=(t.series.w+t.series.l)>0;
  const logoStyle = t.logo ? `style="--team-logo: url('${esc(t.logo)}')"` : '';
  const statusText = hasData
    ? `${t.players.length} 名選手 · ${champCount(t)} 筆英雄紀錄`
    : hasSeries
      ? `${esc(compPatch(l))} 系列已建檔 · 英雄資料待補`
      : `${esc(compPatch(l))} 尚未完成系列`;
  return `<article class="team-card ${(!hasData&&!hasSeries)?'empty':''}" data-team="${t.id}" ${logoStyle}>
    <div class="team-card-bg" aria-hidden="true"></div>
    <h3>${esc(t.name)}</h3><p>${statusText}</p>
    <div class="team-record"><span><strong>${t.series.w}-${t.series.l}</strong>系列</span><span><strong>${t.games.w}-${t.games.l}</strong>小局</span></div>
    <span class="group-chip">${esc(t.group)}</span></article>`;
}

function renderTeam(){
  const l=league(state.league);
  const t=team(state.team); if(!t){renderHome();return}
  const patch=compPatch(l);
  const logoBlock=t.logo?`<div class="team-logo-lg"><img src="${esc(t.logo)}" alt="${esc(t.name)} logo"></div>`:`<div class="team-logo-lg">${t.id}</div>`;
  main.innerHTML=`
    <div class="backline"><button class="back-btn" id="backBtn">← 返回 ${l.id}</button><span class="pill">${esc(patch)} · ${esc(t.group)}</span></div>
    <section class="team-hero">${logoBlock}<div><div class="eyebrow">${l.id} · ${esc(compSeason(l))} ${esc(compSplit(l))}</div><h1>${esc(t.name)}</h1><p>${t.players.length} 名名單選手 · ${champCount(t)} 筆英雄紀錄</p></div><div class="record-big"><strong>${t.series.w}-${t.series.l}</strong><small>系列戰績 · 小局 ${t.games.w}-${t.games.l}</small></div></section>
    <section class="section-head"><h2>選手英雄池</h2><span>點選選手查看完整英雄勝率</span></section>
    <section class="roster-grid">${t.players.map(p=>playerCard(t,p,l)).join('')}</section>
    <div class="accent-line"></div>
    <section class="section-head"><h2>版本資料摘要</h2><span>Patch ${esc(patch)}</span></section>
    <section class="stats-grid">
      <div class="stat-card"><small>系列勝率</small><strong>${pct(t.series.w,t.series.w+t.series.l)}%</strong><span>${t.series.w+t.series.l || 0} 個系列</span></div>
      <div class="stat-card"><small>小局勝率</small><strong>${pct(t.games.w,t.games.w+t.games.l)}%</strong><span>${t.games.w+t.games.l || 0} 局</span></div>
      <div class="stat-card"><small>英雄紀錄</small><strong>${champCount(t)}</strong><span>選手 × 英雄</span></div>
      <div class="stat-card"><small>資料狀態</small><strong>${champCount(t)?'LIVE':'WAIT'}</strong><span>${champCount(t)?`已接入 ${esc(patch)}`:'等待首個完賽系列'}</span></div>
    </section>`;
  document.getElementById('backBtn').addEventListener('click',()=>{state.team=null;renderHome()});
  main.querySelectorAll('[data-player]').forEach(el=>el.addEventListener('click',()=>openPlayer(t.id,el.dataset.player)));
}

function playerCard(t,p,l){
  const games=p.champions.reduce((n,c)=>n+c.games,0); const wins=p.champions.reduce((n,c)=>n+c.wins,0);
  return `<article class="player-card" data-player="${esc(p.id)}"><span class="role">${p.role}</span><h3>${esc(p.id)}</h3><p>${p.champions.length?`${p.champions.length} 隻英雄 · ${games} 次選用 · ${pct(wins,games)}% 勝率`:`${esc(compPatch(l))} 尚未有出賽資料`}</p><div class="mini-champs">${p.champions.slice(0,4).map(c=>`<span class="mini-champ">${esc(c.name)}</span>`).join('')}${p.champions.length>4?`<span class="mini-champ">+${p.champions.length-4}</span>`:''}</div></article>`;
}

function openPlayer(teamId,playerId){
  const t=team(teamId); if(!t)return;
  const l=league(t.league); const patch=compPatch(l);
  const p=t.players.find(x=>x.id===playerId); if(!p)return;
  const sorted=[...p.champions].sort((a,b)=>b.games-a.games||b.wins-a.wins);
  modalBody.innerHTML=`<div class="modal-kicker">${t.id} · ${p.role} · PATCH ${esc(patch)}</div><h2>${esc(p.id)}</h2><div class="modal-sub">${esc(t.name)} · 台灣伺服器英雄名稱</div>
    ${sorted.length?`<table class="champ-table"><thead><tr><th>英雄</th><th>出場</th><th>勝敗</th><th>勝率</th></tr></thead><tbody>${sorted.map(c=>{const rate=pct(c.wins,c.games);return `<tr><td><span class="champ-name"><span class="champ-dot">${esc(c.name.slice(0,1))}</span>${esc(c.name)}</span></td><td>${c.games}</td><td>${c.wins}-${c.games-c.wins}</td><td class="winrate ${rate>=60?'good':rate<=40?'bad':''}">${rate}%</td></tr>`}).join('')}</tbody></table>`:`<div class="empty-state" style="padding:32px"><h2>尚未有 ${esc(patch)} 英雄資料</h2><p>完成第一個 BO3 後再寫入，不使用舊版本資料補值。</p></div>`}`;
  showModal();
}

function renderMatches(){
  const l=league(state.league);
  if(!l){renderGlobalHome();return;}
  if(l.status!=='active'){renderHome();return}
  const matches=leagueMatches(l.id);
  const rows=matches.length?matches.map(m=>`<div class="match-row"><span class="match-date">${m.date}</span><span class="match-team">${m.a}</span><span class="score">${m.scoreA} : ${m.scoreB}</span><span class="match-team right">${m.b}</span><span class="patch">${m.patch}</span></div>`).join(''):`<div class="empty-state" style="padding:42px"><h2>尚未有完賽系列</h2><p>${l.id} ${esc(compSeason(l))} ${esc(compSplit(l))} 的第一個 BO3 完賽後，會從這裡開始累積。</p></div>`;
  main.innerHTML=headerHTML(l)+`<section class="section-head"><h2>原始系列賽</h2><span>聚合統計的底層來源</span></section><div class="match-list">${rows}</div><div class="source-note">正式版會把每一局 Game 的 10 名選手、英雄、勝負、藍紅方與版本拆成原始紀錄。</div>`;
}

function openCompare(){
  if(!state.league)return;
  const teams=leagueTeams(state.league);
  if(!teams.length)return;
  const opts=teams.map(t=>`<option value="${t.id}">${t.id} · ${esc(t.name)}</option>`).join('');
  const patch=compPatch(league(state.league));
  modalBody.innerHTML=`<div class="modal-kicker">MATCHUP LAB · ${state.league}</div><h2>戰隊比較</h2><div class="modal-sub">比較 ${esc(patch)} 系列、小局與英雄資料量。</div><div class="compare-grid"><div class="compare-side"><select class="selectbox" id="cmpA">${opts}</select><div id="cmpAData"></div></div><div class="compare-vs">VS</div><div class="compare-side"><select class="selectbox" id="cmpB">${opts}</select><div id="cmpBData"></div></div></div>`;
  showModal(); const a=document.getElementById('cmpA'),b=document.getElementById('cmpB'); b.selectedIndex=Math.min(1,teams.length-1);
  const update=()=>{document.getElementById('cmpAData').innerHTML=compareSide(team(a.value));document.getElementById('cmpBData').innerHTML=compareSide(team(b.value));};
  a.addEventListener('change',update);b.addEventListener('change',update);update();
}
function compareSide(t){return `<h3>${t.id}</h3><p style="color:var(--muted);font-size:11px;margin-top:0">${esc(t.name)}</p><div class="compare-metric"><span>系列</span><strong>${t.series.w}-${t.series.l}</strong></div><div class="compare-metric"><span>小局</span><strong>${t.games.w}-${t.games.l}</strong></div><div class="compare-metric"><span>小局勝率</span><strong>${pct(t.games.w,t.games.w+t.games.l)}%</strong></div><div class="compare-metric"><span>英雄紀錄</span><strong>${champCount(t)}</strong></div>`}

function setupSearch(){
  const all=[]; DB.teams.forEach(t=>{all.push({type:'戰隊',label:t.id,sub:`${t.league} · ${t.name}`,action:()=>{state.league=t.league;state.team=t.id;state.view='teams';renderLeagueNav();syncSideActions();renderTeam();}});t.players.forEach(p=>{all.push({type:p.role,label:p.id,sub:`${t.id} · ${t.name}`,action:()=>{state.league=t.league;state.team=t.id;state.view='teams';renderLeagueNav();syncSideActions();renderTeam();openPlayer(t.id,p.id);}});p.champions.forEach(c=>all.push({type:'英雄',label:c.name,sub:`${p.id} · ${t.id}`,action:()=>{state.league=t.league;state.team=t.id;state.view='teams';renderLeagueNav();syncSideActions();renderTeam();openPlayer(t.id,p.id);}}));});});
  search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase(); if(!q){searchResults.classList.add('hidden');return}const found=all.filter(x=>(x.label+' '+x.sub).toLowerCase().includes(q)).slice(0,12);searchResults.innerHTML=found.length?found.map((x,i)=>`<div class="search-result" data-r="${i}"><div><strong>${esc(x.label)}</strong><small>${esc(x.sub)}</small></div><span class="search-tag">${x.type}</span></div>`).join(''):'<div class="search-result"><small>找不到符合資料</small></div>';searchResults.classList.remove('hidden');searchResults.querySelectorAll('[data-r]').forEach(el=>el.addEventListener('click',()=>{found[+el.dataset.r].action();searchResults.classList.add('hidden');search.value='';syncTopActions();}));});
  document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap'))searchResults.classList.add('hidden')});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();search.focus()}if(e.key==='Escape'){closeModal();searchResults.classList.add('hidden')}});
}
function showModal(){modal.classList.remove('hidden');document.body.style.overflow='hidden'} function closeModal(){modal.classList.add('hidden');document.body.style.overflow=''}
function syncSideActions(){
  document.querySelectorAll('.side-action').forEach(x=>{
    x.classList.toggle('active',!!state.league && x.dataset.view===state.view);
    x.disabled=!state.league;
  });
  syncTopActions();
}
function syncTopActions(){
  const usable=!!state.league && leagueTeams(state.league).length>1;
  compareBtn.disabled=!usable;
  compareBtn.classList.toggle('disabled',!usable);
  snapshot.textContent=state.league?`${compPatch(league(state.league))} Snapshot`:'Global Database';
}
function render(){
  if(!state.league){renderGlobalHome();syncTopActions();return;}
  state.team?renderTeam():state.view==='matches'?renderMatches():renderHome();
  syncTopActions();
}

renderLeagueNav();render();setupSearch();syncSideActions();
document.querySelectorAll('.side-action').forEach(btn=>btn.addEventListener('click',()=>{if(!state.league)return;state.view=btn.dataset.view;state.team=null;syncSideActions();render()}));
document.querySelector('[data-nav-home]').addEventListener('click',goGlobalHome);
compareBtn.addEventListener('click',openCompare);document.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',closeModal));
