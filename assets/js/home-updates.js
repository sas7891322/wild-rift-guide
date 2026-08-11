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

  const reviewToggle=document.querySelector('[data-site-review-toggle]');
  const reviewPanel=document.querySelector('[data-site-review-hero-panel]');
  if(reviewToggle && reviewPanel){
    reviewToggle.addEventListener('click',()=>{
      const expanded=reviewToggle.getAttribute('aria-expanded')==='true';
      reviewToggle.setAttribute('aria-expanded',String(!expanded));
      reviewPanel.hidden=expanded;
    });
  }
})();
