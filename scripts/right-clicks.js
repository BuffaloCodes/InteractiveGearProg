// scripts/right-clicks.js
(function () {
  const LONG_PRESS_MS = 500;       // how long to hold for menu on mobile
  const MOVE_TOLERANCE = 10;       // px finger can drift before cancel
  let pressTimer = null;
  let startX = 0, startY = 0;
  let menuOpen = false;
  let suppressNextClick = false;

  // expose a flag so your click-to-toggle code can ignore the next click
  window.__igp_menu_open = () => menuOpen;
  window.__igp_suppress_click = () => suppressNextClick;

  function $(id) { return document.getElementById(id); }
  function ensureBody(cb){ if(document.body) cb(); else document.addEventListener('DOMContentLoaded', cb, {once:true}); }

  function ensureMenu() {
    let m = $('igp-context');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'igp-context';
    Object.assign(m.style, {
      position: 'fixed', minWidth: '220px', maxWidth: '280px',
      background: 'rgba(20,20,22,0.98)', color: '#e6e7eb',
      border: '1px solid rgba(255,255,255,.08)', borderRadius: '10px',
      boxShadow: '0 10px 32px rgba(0,0,0,.45)', padding: '6px',
      fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.25',
      zIndex: 10000, backdropFilter: 'blur(6px)', display: 'none'
    });

    const title = document.createElement('div');
    title.id = 'igp-context-title';
    Object.assign(title.style, {
      fontWeight: '700', padding: '9px 12px', borderRadius: '8px',
      marginBottom: '6px', background: 'rgba(255,255,255,.05)', color: '#fff',
      wordBreak: 'break-word'
    });
    m.appendChild(title);

    const wiki = document.createElement('a');
    wiki.id = 'igp-context-wiki';
    wiki.href = '#'; wiki.target = '_blank'; wiki.rel = 'noopener';
    wiki.textContent = 'Go to Wiki';
    Object.assign(wiki.style, {
      display: 'block', textDecoration: 'none', color: 'inherit',
      padding: '9px 12px', borderRadius: '8px', cursor: 'pointer'
    });
    wiki.addEventListener('mouseover', () => wiki.style.background = 'rgba(255,255,255,.08)');
    wiki.addEventListener('mouseout',  () => wiki.style.background = 'transparent');
    m.appendChild(wiki);

    document.body.appendChild(m);
    return m;
  }

  function placeMenu(menu, x, y) {
    const pad = 8, w = menu.offsetWidth, h = menu.offsetHeight, vw = innerWidth, vh = innerHeight;
    let left = x, top = y;
    if (left + w + pad > vw) left = vw - w - pad;
    if (top + h + pad > vh) top = vh - h - pad;
    if (left < pad) left = pad;
    if (top < pad) top = pad;
    menu.style.left = left + 'px';
    menu.style.top  = top  + 'px';
  }

  function openMenuAt(node, clientX, clientY) {
    const menu = ensureMenu();
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
    // position next frame after measuring
    menu.style.left = '0px'; menu.style.top = '0px';
    requestAnimationFrame(() => placeMenu(menu, clientX + 2, clientY + 2));

    menuOpen = true;
    suppressNextClick = true; // prevent the tap from toggling obtained
    setTimeout(() => (suppressNextClick = false), 400);
  }

  function closeMenu() {
    const m = $('igp-context');
    if (m) m.style.display = 'none';
    menuOpen = false;
  }

  // ---------- Desktop: right-click ----------
  document.addEventListener('contextmenu', (ev) => {
    const node = ev.target.closest('.node');
    const inCharts = ev.target.closest('#chart_gear, #chart_milestones, #chart-container');
    if (!node || !inCharts) return;
    ev.preventDefault();
    ensureBody(() => openMenuAt(node, ev.clientX, ev.clientY));
  });

  // ---------- Mobile: long-press ----------
  function startPress(e) {
    const touch = (e.touches && e.touches[0]) || e;
    const node = e.target.closest && e.target.closest('.node');
    const inCharts = e.target.closest && e.target.closest('#chart_gear, #chart_milestones, #chart-container');
    if (!node || !inCharts) return;

    startX = touch.clientX; startY = touch.clientY;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      ensureBody(() => openMenuAt(node, startX, startY));
    }, LONG_PRESS_MS);
  }
  function movePress(e) {
    if (!pressTimer) return;
    const touch = (e.touches && e.touches[0]) || e;
    const dx = Math.abs(touch.clientX - startX);
    const dy = Math.abs(touch.clientY - startY);
    if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) {
      clearTimeout(pressTimer); pressTimer = null;
    }
  }
  function cancelPress() { clearTimeout(pressTimer); pressTimer = null; }

  // Use pointer events if available; fall back to touch
  const supportsPointer = 'onpointerdown' in window;
  if (supportsPointer) {
    document.addEventListener('pointerdown', startPress, { passive: true });
    document.addEventListener('pointermove', movePress,  { passive: true });
    document.addEventListener('pointerup',   cancelPress, { passive: true });
    document.addEventListener('pointercancel', cancelPress, { passive: true });
  } else {
    document.addEventListener('touchstart', startPress, { passive: true });
    document.addEventListener('touchmove',  movePress,  { passive: true });
    document.addEventListener('touchend',   cancelPress, { passive: true });
    document.addEventListener('touchcancel', cancelPress, { passive: true });
  }

  // ---------- Close menu on outside interactions ----------
  document.addEventListener('click', (e) => { if (!e.target.closest('#igp-context')) closeMenu(); }, { passive: true });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === 'Tab') closeMenu(); });
  addEventListener('blur', closeMenu);
  addEventListener('resize', closeMenu);
  addEventListener('scroll', closeMenu, true);

  // ---------- Optional: ignore the click that follows a long-press ----------
  // If your toggle code runs on container clicks, you can wrap it to skip when menu is open.
  // In your renderer (already in index.html), you can check:
  //   if (window.__igp_menu_open && window.__igp_menu_open()) return; // skip toggle
  // or:
  //   if (window.__igp_suppress_click && window.__igp_suppress_click()) return;
})();

