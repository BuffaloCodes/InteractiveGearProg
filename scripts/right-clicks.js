// scripts/right-clicks.js
(function () {
  // --- utilities ---
  function $(id) { return document.getElementById(id); }

  function placeMenu(menu, x, y) {
    const pad = 8, w = menu.offsetWidth, h = menu.offsetHeight, vw = innerWidth, vh = innerHeight;
    let left = x, top = y;
    if (left + w + pad > vw) left = vw - w - pad;
    if (top + h + pad > vh) top = vh - h - pad;
    if (left < pad) left = pad;
    if (top < pad) top = pad;
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  }

  function closeMenu() {
    const m = $('igp-context');
    if (m) m.style.display = 'none';
  }

  // --- create the menu only when the body exists ---
  function buildMenu() {
    if (!document.body) return null;           // body not ready yet
    let m = $('igp-context');
    if (m) return m;

    m = document.createElement('div');
    m.id = 'igp-context';
    Object.assign(m.style, {
      position: 'fixed',
      minWidth: '220px',
      maxWidth: '280px',
      background: 'rgba(20,20,22,0.98)',
      color: '#e6e7eb',
      border: '1px solid rgba(255,255,255,.08)',
      borderRadius: '10px',
      boxShadow: '0 10px 32px rgba(0,0,0,.45)',
      padding: '6px',
      fontFamily: 'inherit',
      fontSize: '14px',
      lineHeight: '1.25',
      zIndex: 10000,
      backdropFilter: 'blur(6px)',
      display: 'none'
    });

    const title = document.createElement('div');
    title.id = 'igp-context-title';
    Object.assign(title.style, {
      fontWeight: '700',
      padding: '9px 12px',
      borderRadius: '8px',
      marginBottom: '6px',
      background: 'rgba(255,255,255,.05)',
      color: '#fff',
      wordBreak: 'break-word'
    });
    m.appendChild(title);

    const wiki = document.createElement('a');
    wiki.id = 'igp-context-wiki';
    wiki.href = '#';
    wiki.target = '_blank';
    wiki.rel = 'noopener';
    wiki.textContent = 'Go to Wiki';
    Object.assign(wiki.style, {
      display: 'block',
      textDecoration: 'none',
      color: 'inherit',
      padding: '9px 12px',
      borderRadius: '8px',
      cursor: 'pointer'
    });
    wiki.addEventListener('mouseover', () => (wiki.style.background = 'rgba(255,255,255,.08)'));
    wiki.addEventListener('mouseout', () => (wiki.style.background = 'transparent'));
    m.appendChild(wiki);

    document.body.appendChild(m);
    return m;
  }

  // get or (later) build the menu. returns null if body not ready yet.
  function ensureMenu() {
    return $('igp-context') || buildMenu();
  }

  // ------- event delegation: works for both charts -------
  document.addEventListener('contextmenu', (ev) => {
    const node = ev.target.closest('.node');
    const inCharts = ev.target.closest('#chart_gear, #chart_milestones, #chart-container');
    if (!node || !inCharts) return; // let the browser show its menu elsewhere

    ev.preventDefault();

    // lazily ensure the menu (safe even if <body> wasn't ready earlier)
    const menu = ensureMenu();
    if (!menu) {
      // body still not available (extremely rare). try after DOM is ready.
      document.addEventListener('DOMContentLoaded', () => {
        const m2 = ensureMenu(); if (!m2) return;
        // re-dispatch the same event coordinates
        m2.style.display = 'block';
        requestAnimationFrame(() => placeMenu(m2, ev.clientX + 2, ev.clientY + 2));
      }, { once: true });
      return;
    }

    const titleEl = $('igp-context-title');
    const wikiEl  = $('igp-context-wiki');

    const name = node.title || node.getAttribute('data-name') || 'Unknown item';
    const wiki = node.dataset.wikiLink || '#';

    titleEl.textContent = name;
    wikiEl.href = wiki;
    const hasWiki = wiki && wiki !== '#';
    wikiEl.style.pointerEvents = hasWiki ? 'auto' : 'none';
    wikiEl.style.opacity = hasWiki ? '1' : '.55';

    menu.style.display = 'block';
    // temporarily position, then clamp to viewport next frame
    menu.style.left = '0px';
    menu.style.top = '0px';
    requestAnimationFrame(() => placeMenu(menu, ev.clientX + 2, ev.clientY + 2));
  });

  // Close menu on click-away / Esc / resize / scroll
  document.addEventListener('click', (e) => { if (!e.target.closest('#igp-context')) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === 'Tab') closeMenu(); });
  addEventListener('blur', closeMenu);
  addEventListener('resize', closeMenu);
  addEventListener('scroll', closeMenu, true);

  // Optional: if the script loaded very early, make sure the menu exists once DOM is ready
  document.addEventListener('DOMContentLoaded', ensureMenu, { once: true });
})();

