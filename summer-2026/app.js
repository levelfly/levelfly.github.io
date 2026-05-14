// ============================================================
// 夏令營研究 — main app / router / event handling / tweaks
// ============================================================

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "cream",
  "fontHead": "serif",
  "density": "magazine",
  "tilt": true
}/*EDITMODE-END*/;

const state = {
  route: 'home',
  detailId: null,
  filters: { tier: 'all', flight: 'all', budget: 'all', region: 'all' },
  compareSet: new Set(),
  tweaks: { ...TWEAK_DEFAULTS },
};

const app = () => document.getElementById('app');
const overlay = () => document.getElementById('overlay');

// ---------- Routing ----------
function parseHash() {
  const h = (location.hash || '#/').slice(1); // '/wizard', '/cand/penang-tenby'
  if (h === '' || h === '/') return { route: 'home' };
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'cand' && parts[1]) return { route: 'detail', id: parts[1] };
  return { route: parts[0] };
}

function navigate() {
  const r = parseHash();
  state.route = r.route;
  state.detailId = r.id || null;

  // close overlay first
  closeOverlay();

  // mark active nav
  document.querySelectorAll('.navlinks a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === state.route);
  });

  // render
  if (r.route === 'detail') {
    // detail opens as overlay; underlying page stays as previous
    renderRouteBackground();
    openDetail(r.id);
  } else {
    renderRouteBackground();
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderRouteBackground() {
  let html = '';
  switch (state.route) {
    case 'home':    html = viewHome(state); break;
    case 'wizard':  html = viewWizard(); break;
    case 'compare': html = viewCompare(state); break;
    case 'p0':      html = viewP0(); break;
    case 'library': html = viewLibrary(); break;
    case 'why':     html = viewWhy(); break;
    case 'print':   html = viewPrint(); break;
    default:        html = viewHome(state);
  }
  app().innerHTML = `<div class="fade-up">${html}</div>`;
  updateFilterCount();
  refreshTray();

  // body class for elder-mode print page (CSS 可掛 .elder-mode 字級 +30%)
  document.body.classList.toggle('elder-mode', state.route === 'print');

  if (state.route === 'wizard' && wizardState.step >= WIZARD.length) {
    setTimeout(drawRadar, 80);
  }
  if (state.route === 'why') {
    setTimeout(() => { if (typeof hookWhyAutosave === 'function') hookWhyAutosave(); }, 40);
  }
}

function openDetail(id) {
  const c = CANDIDATES.find(x => x.id === id);
  if (!c) return;
  overlay().innerHTML = viewDetail(c);
  overlay().hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeOverlay() {
  overlay().hidden = true;
  overlay().innerHTML = '';
  document.body.style.overflow = '';
}

// ---------- Cards / corkboard / filters ----------
function updateFilterCount() {
  const el = document.getElementById('filterCount');
  if (!el) return;
  const matched = applyFilters(CANDIDATES, state.filters).length;
  el.innerHTML = `<span>共 ${matched} 個候選 ✦</span>`;
}

function refreshCork() {
  const cork = document.getElementById('cork');
  if (!cork) return;
  cork.innerHTML = renderCards(state);
  updateFilterCount();
}

// ---------- Compare tray ----------
function ensureTray() {
  let tray = document.getElementById('compareTray');
  if (state.compareSet.size === 0) { if (tray) tray.remove(); return; }
  if (!tray) {
    tray = document.createElement('div');
    tray.id = 'compareTray';
    tray.className = 'tray';
    document.body.appendChild(tray);
  }
  const items = Array.from(state.compareSet).map(id => CANDIDATES.find(c => c.id === id)).filter(Boolean);
  tray.innerHTML = `
    <span style="font-family: var(--f-hand-en); color: var(--gold); font-size: 17px;">compare:</span>
    <div class="tray-items">
      ${items.map(c => `<span class="tray-item">${c.flag} ${escapeHtml(c.city)} <button data-uncompare="${c.id}" style="background:none;border:none;color:var(--ink-muted);cursor:pointer;padding:0 0 0 4px;">✕</button></span>`).join('')}
    </div>
    ${items.length >= 2 ? `<button data-go-compare>並排比較 →</button>` : `<span class="muted" style="font-size:12px;">再選 ${2 - items.length} 個</span>`}
  `;
}

function refreshTray() { ensureTray(); }

function toggleCompare(id) {
  if (state.compareSet.has(id)) state.compareSet.delete(id);
  else {
    if (state.compareSet.size >= 4) return alert('最多 4 個並排比較');
    state.compareSet.add(id);
  }
  refreshCork();
  refreshTray();
  // also update detail overlay if open
  const compareBtn = overlay()?.querySelector(`[data-compare="${id}"]`);
  if (compareBtn) compareBtn.classList.toggle('active', state.compareSet.has(id));
}

// ---------- Tweaks panel ----------
function announceTweaks() {
  window.addEventListener('message', (e) => {
    if (e.data?.type === '__activate_edit_mode') openTweaks();
    if (e.data?.type === '__deactivate_edit_mode') closeTweaks();
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch(e) {}
}

function setTweak(key, val) {
  state.tweaks[key] = val;
  applyTweaks();
  renderTweaksBody();
  try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*'); } catch(e) {}
}

function applyTweaks() {
  const t = state.tweaks;
  document.body.classList.remove('theme-cream','theme-navy','theme-mossy');
  document.body.classList.add(`theme-${t.theme}`);
  document.body.style.setProperty('--f-display', t.fontHead === 'serif'
    ? "'DM Serif Display', 'Noto Serif TC', serif"
    : t.fontHead === 'sans'
      ? "'Noto Serif TC', serif"  // hybrid: sans body, serif title still works
      : "'Klee One', 'Noto Serif TC', cursive");
  document.documentElement.style.setProperty('--gutter', t.density === 'tight' ? '20px' : '32px');
  // tilt
  document.body.classList.toggle('no-tilt', !t.tilt);
  if (!t.tilt) {
    document.head.querySelector('#tiltOff')?.remove();
    const s = document.createElement('style'); s.id = 'tiltOff';
    s.textContent = '.candcard, .pol, .stamp, .sticky, .p0-card, .score-block, .wizard-card::before { transform: none !important; }';
    document.head.appendChild(s);
  } else {
    document.head.querySelector('#tiltOff')?.remove();
  }
}

function openTweaks() {
  document.getElementById('tweaks-panel').hidden = false;
  document.getElementById('tweaks-fab').hidden = false;
  renderTweaksBody();
}
function closeTweaks() {
  document.getElementById('tweaks-panel').hidden = true;
  try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch(e) {}
}

function renderTweaksBody() {
  const t = state.tweaks;
  const body = document.getElementById('tweaks-body');
  if (!body) return;
  body.innerHTML = `
    <div class="tweaks-row">
      <label>主題配色</label>
      <div class="swatches">
        ${[
          ['cream','#F5F0E8','#D9A441','米紙'],
          ['navy', '#f0eee6','#3D5067','墨藍'],
          ['mossy','#ECE8DA','#4D5E3C','苔綠'],
        ].map(([id, paper, accent, lbl]) => `
          <button title="${lbl}" aria-pressed="${t.theme === id}" data-tweak="theme" data-val="${id}"
            style="background: linear-gradient(135deg, ${paper} 0 50%, ${accent} 50% 100%); border: 2px solid ${t.theme === id ? '#2A2218' : 'transparent'};"></button>
        `).join('')}
      </div>
    </div>
    <div class="tweaks-row">
      <label>標題字體</label>
      <div class="options">
        ${[['serif','西文襯線'],['sans','中文宋體'],['hand','手寫風']].map(([v,lbl]) => `
          <button data-tweak="fontHead" data-val="${v}" aria-pressed="${t.fontHead === v}">${lbl}</button>
        `).join('')}
      </div>
    </div>
    <div class="tweaks-row">
      <label>畫面密度</label>
      <div class="options">
        ${[['magazine','雜誌留白'],['tight','緊湊資訊']].map(([v,lbl]) => `
          <button data-tweak="density" data-val="${v}" aria-pressed="${t.density === v}">${lbl}</button>
        `).join('')}
      </div>
    </div>
    <div class="tweaks-row">
      <label>拼貼旋轉角度</label>
      <div class="options">
        <button data-tweak="tilt" data-val="true"  aria-pressed="${t.tilt === true}">隨意斜</button>
        <button data-tweak="tilt" data-val="false" aria-pressed="${t.tilt === false}">擺正</button>
      </div>
    </div>
    <div style="margin-top: 20px; padding: 10px 12px; background: var(--paper-deep); font-family: var(--f-hand-cn); font-size: 13px; color: var(--ink-muted); line-height: 1.6;">
      ✦ 變更會即時套用，並提示 host 寫回檔案。
    </div>
  `;
}

// ---------- Wizard helpers ----------
function nextQ() {
  if (wizardState.step < WIZARD.length) {
    wizardState.step += 1;
    renderRouteBackground();
  }
}
function prevQ() {
  if (wizardState.step > 0) {
    wizardState.step -= 1;
    renderRouteBackground();
  }
}
function pickOpt(id) {
  const q = WIZARD[wizardState.step];
  wizardState.answers[q.id] = id;
  // visual update without re-render
  document.querySelectorAll('.wizard-opt').forEach(b => b.classList.toggle('selected', b.dataset.wopt === id));
  document.querySelector('[data-wnext]')?.removeAttribute('disabled');
  document.querySelector('[data-wnext]')?.removeAttribute('style');
}
function resetWizard() {
  wizardState.step = 0;
  wizardState.answers = {};
  if (wizardState.radarChart) { wizardState.radarChart.destroy(); wizardState.radarChart = null; }
  renderRouteBackground();
}
function addTop3ToCompare() {
  const top = computeScores().slice(0, 3);
  state.compareSet.clear();
  top.forEach(t => state.compareSet.add(t.cand.id));
  location.hash = '#/compare';
}

// ---------- Global delegated events ----------
document.addEventListener('click', (e) => {
  // route links
  const routeLink = e.target.closest('[data-route]');
  if (routeLink) { /* default hash nav */ return; }

  // candidate card click → open detail
  const card = e.target.closest('.candcard');
  if (card && !e.target.closest('.compare-btn')) {
    location.hash = `#/cand/${card.dataset.id}`;
    return;
  }

  // compare button on card
  const cmpBtn = e.target.closest('[data-compare]');
  if (cmpBtn) { e.preventDefault(); e.stopPropagation(); toggleCompare(cmpBtn.dataset.compare); return; }

  // uncompare from tray / compare page
  const unc = e.target.closest('[data-uncompare]');
  if (unc) {
    state.compareSet.delete(unc.dataset.uncompare);
    refreshCork(); refreshTray();
    if (state.route === 'compare') renderRouteBackground();
    return;
  }

  // go-compare button on tray
  if (e.target.closest('[data-go-compare]')) {
    location.hash = '#/compare'; return;
  }

  // open detail from wizard result row
  const openCand = e.target.closest('[data-open]');
  if (openCand) { location.hash = `#/cand/${openCand.dataset.open}`; return; }

  // close detail overlay
  if (e.target.id === 'closeDetail' || (e.target.id === 'overlay' && !e.target.closest('.overlay-sheet'))) {
    closeOverlay();
    if (state.route === 'detail') { location.hash = '#/'; }
    return;
  }

  // filter buttons
  const fbtn = e.target.closest('.filter-group .ops button');
  if (fbtn) {
    const group = fbtn.closest('[data-filter]').dataset.filter;
    state.filters[group] = fbtn.dataset.val;
    fbtn.parentElement.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === fbtn));
    refreshCork();
    return;
  }

  // wizard options
  const wopt = e.target.closest('[data-wopt]');
  if (wopt) { pickOpt(wopt.dataset.wopt); return; }
  if (e.target.closest('[data-wnext]')) { nextQ(); return; }
  if (e.target.closest('[data-wprev]')) { prevQ(); return; }
  if (e.target.closest('[data-wreset]')) { resetWizard(); return; }
  if (e.target.closest('[data-add-top3]')) { addTop3ToCompare(); return; }
  if (e.target.closest('[data-download-script]')) { if (typeof downloadKidScript === 'function') downloadKidScript(); return; }

  // tweak buttons
  const tweakBtn = e.target.closest('[data-tweak]');
  if (tweakBtn) {
    const k = tweakBtn.dataset.tweak;
    let v = tweakBtn.dataset.val;
    if (v === 'true') v = true;
    if (v === 'false') v = false;
    setTweak(k, v);
    return;
  }
});

// keyboard: esc to close overlay
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!overlay().hidden) {
      closeOverlay();
      if (state.route === 'detail') location.hash = '#/';
    }
  }
});

// tweaks fab/close wiring
document.getElementById('tweaks-toggle')?.addEventListener('click', () => {
  const p = document.getElementById('tweaks-panel');
  p.hidden = !p.hidden;
});
document.getElementById('tweaks-close')?.addEventListener('click', closeTweaks);

window.addEventListener('hashchange', navigate);

// ---------- Boot ----------
function boot() {
  applyTweaks();
  announceTweaks();
  // graceful image fallback for any unloaded photos
  document.addEventListener('error', (e) => {
    if (e.target?.tagName === 'IMG' && !e.target.dataset.fallback) {
      e.target.dataset.fallback = '1';
      e.target.src = "data:image/svg+xml;utf8," + encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' preserveAspectRatio='xMidYMid slice'>
          <defs><pattern id='p' width='12' height='12' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
            <line x1='0' y1='0' x2='0' y2='12' stroke='#C9B894' stroke-width='6'/></pattern></defs>
          <rect width='400' height='300' fill='#ECE2CF'/>
          <rect width='400' height='300' fill='url(%23p)' opacity='0.45'/>
          <text x='200' y='150' text-anchor='middle' font-family='monospace' font-size='14' fill='#7d6b54'>photo placeholder</text>
          <text x='200' y='172' text-anchor='middle' font-family='monospace' font-size='10' fill='#9B7E68'>${(e.target.alt || 'travel image').slice(0,30)}</text>
        </svg>`.replace(/\s+/g, ' ')
      );
    }
  }, true);
  // overlay click outside sheet
  overlay().addEventListener('click', (e) => {
    if (e.target.id === 'overlay') {
      closeOverlay();
      if (state.route === 'detail') location.hash = '#/';
    }
  });
  navigate();
}
boot();
