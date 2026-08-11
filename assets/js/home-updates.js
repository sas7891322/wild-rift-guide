(() => {
  const tabs=[...document.querySelectorAll('[data-home-update-tab]')];
  const panels=[...document.querySelectorAll('[data-home-update-panel]')];
  if(tabs.length && panels.length){
    function select(key){
      tabs.forEach(tab=>{
        const active=tab.dataset.homeUpdateTab===key;
        tab.classList.toggle('active',active);
        tab.setAttribute('aria-selected',String(active));
        tab.tabIndex=active?0:-1;
      });
      panels.forEach(panel=>{
        const active=panel.dataset.homeUpdatePanel===key;
        panel.classList.toggle('active',active);
        panel.hidden=!active;
      });
    }
    tabs.forEach((tab,index)=>{
      tab.addEventListener('click',()=>select(tab.dataset.homeUpdateTab));
      tab.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const next=(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
        tabs[next].focus(); select(tabs[next].dataset.homeUpdateTab);
      });
    });
  }

  const reviewRoot=document.querySelector('[data-site-review-accordions]');
  if(reviewRoot){
    const toggles=[...reviewRoot.querySelectorAll('[data-site-review-toggle]')];
    const closeToggle=toggle=>{
      const panelId=toggle.getAttribute('aria-controls');
      const panel=panelId?document.getElementById(panelId):null;
      toggle.setAttribute('aria-expanded','false');
      if(panel) panel.hidden=true;
    };
    toggles.forEach(toggle=>{
      toggle.addEventListener('click',()=>{
        const panelId=toggle.getAttribute('aria-controls');
        const panel=panelId?document.getElementById(panelId):null;
        if(!panel) return;
        const opening=toggle.getAttribute('aria-expanded')!=='true';
        toggles.forEach(other=>{ if(other!==toggle) closeToggle(other); });
        toggle.setAttribute('aria-expanded',String(opening));
        panel.hidden=!opening;
      });
    });
  }
})();
