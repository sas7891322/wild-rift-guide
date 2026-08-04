(() => {
  const menus = document.querySelectorAll('[data-rift-menu]');
  if (!menus.length) return;

  const closeMenu = (menu) => {
    const button = menu.querySelector('.rift-menu-toggle');
    const panel = menu.querySelector('.rift-menu-panel');
    if (!button || !panel) return;
    menu.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', '開啟導覽選單');
    panel.hidden = true;
  };

  const openMenu = (menu) => {
    document.querySelectorAll('[data-rift-menu].is-open').forEach(other => {
      if (other !== menu) closeMenu(other);
    });
    const button = menu.querySelector('.rift-menu-toggle');
    const panel = menu.querySelector('.rift-menu-panel');
    if (!button || !panel) return;
    panel.hidden = false;
    menu.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', '關閉導覽選單');
  };

  menus.forEach(menu => {
    const button = menu.querySelector('.rift-menu-toggle');
    const panel = menu.querySelector('.rift-menu-panel');
    if (!button || !panel) return;

    button.addEventListener('click', event => {
      event.stopPropagation();
      menu.classList.contains('is-open') ? closeMenu(menu) : openMenu(menu);
    });

    panel.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (link) closeMenu(menu);
    });
  });

  document.addEventListener('click', event => {
    document.querySelectorAll('[data-rift-menu].is-open').forEach(menu => {
      if (!menu.contains(event.target)) closeMenu(menu);
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('[data-rift-menu].is-open').forEach(menu => {
      const button = menu.querySelector('.rift-menu-toggle');
      closeMenu(menu);
      button?.focus();
    });
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('[data-rift-menu].is-open').forEach(closeMenu);
  }, {passive:true});
})();