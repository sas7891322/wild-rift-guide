(() => {
  const root=document.querySelector('.patch73-announcement');
  if(!root)return;
  const input=root.querySelector('#patch73-search');
  const cards=[...root.querySelectorAll('[data-patch73-hero]')];
  const groups=[...root.querySelectorAll('[data-patch73-group]')];
  function filter(){
    const q=input.value.trim();
    cards.forEach(card=>{card.hidden=!card.dataset.patch73Hero.includes(q);if(card.hidden)card.open=false;});
    groups.forEach(group=>{
      group.hidden=![...group.querySelectorAll('[data-patch73-hero]')].some(card=>!card.hidden);
      if(q)group.open=!group.hidden;
    });
    const count=cards.filter(card=>!card.hidden).length;
    root.querySelector('#patch73-result').textContent=count?`顯示 ${count} 筆調整紀錄（同英雄可能出現在兩組）`:'沒有符合的英雄，請改用中文名稱或清除搜尋。';
  }
  input.addEventListener('input',filter);
  root.querySelector('[data-patch73-expand]').onclick=()=>{groups.forEach(g=>{g.open=!g.hidden;});cards.forEach(c=>{c.open=!c.hidden;});};
  root.querySelector('[data-patch73-collapse]').onclick=()=>{cards.forEach(c=>c.open=false);groups.forEach(g=>g.open=false);};
  root.querySelector('[data-patch73-clear]').onclick=()=>{input.value='';filter();cards.forEach(c=>c.open=false);groups.forEach(g=>g.open=false);input.focus();};
  filter();
})();
