// ============================================================
// 夏令營研究 — views (home, detail, compare, p0, library)
// vanilla JS. Each fn returns an HTML string.
// State (current view, filters, compareSet) lives in app.js.
// ============================================================

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const tierTone   = (t) => ['t0','t1','t2','t3'][t] || 't3';
const tierName   = (t) => ['排除','首選','亮銀','備援'][t] || '備援';
const tierClassChip = (t) => `tier${t}`;
const ntd        = (n) => '$' + (n||0).toLocaleString('zh-TW');
// Phase 7C-fix-2 helpers
const isLite     = (c) => !!(c && c.phase_7b_lite === true);
const hasNum     = (n) => n !== null && n !== undefined && Number(n) > 0;
const ntdOrTBD   = (n) => hasNum(n) ? ntd(n) : '<span class="muted">待補</span>';
// "Placeholder leak" 字串列表 — 出現任一個改顯統一 fallback
const PLACEHOLDER_LEAK = ['Phase 7B 待補', 'Phase 7B', '待 user 補', '依候選城市自行規劃'];
const cleanPlaceholder = (s) => {
  const str = String(s ?? '');
  if (!str) return '';
  for (const leak of PLACEHOLDER_LEAK) {
    if (str.includes(leak)) return '📝 詳細資料待用戶 email 校方確認';
  }
  return str;
};
const tilts      = ['tilt-1','tilt-2','tilt-3','tilt-4'];
const tapeClasses= ['', 'coral', 'sage', ''];
const pinClasses = ['', 'gold', 'sage', 'navy'];

// hook_tags chip 樣式
const HOOK_TAG_LABELS = {
  'new':     { label: '🆕 新',     cls: 'chip-new'     },
  'warn':    { label: '🚨 警示',   cls: 'chip-warn'    },
  'upgrade': { label: '🆙 升級',   cls: 'chip-upgrade' },
  'reject':  { label: '❌ 排除',   cls: 'chip-reject'  },
};

// ----------------- marker → HTML 轉換 -----------------
// [CHIP:文字]  [QUOTE:文字]  [TABLE:col1|col2|col3]
// TABLE rows 用 ;; 分隔（第一個是 header）
function renderMarkerBody(rawBody) {
  if (!rawBody) return '';
  let body = String(rawBody);

  // 1) 先抽 markers → placeholder，避免 escape 把 < 之類吃掉
  const slots = [];
  const slot = (html) => {
    slots.push(html);
    return `\x00SLOT${slots.length - 1}\x00`;
  };

  // [TABLE:a|b|c] (多個 row 用 ;; 連接)
  body = body.replace(/\[TABLE:([^\]]+)\]/g, (_, content) => {
    const rows = content.split(';;').map(r => r.split('|').map(c => c.trim()));
    if (!rows.length) return '';
    const head = rows[0];
    const rest = rows.slice(1);
    let html = '<table class="lib-table" style="width:100%; border-collapse: collapse; margin: 14px 0; font-size: 14px;">';
    html += '<thead><tr style="border-bottom: 1.5px solid var(--ink);">' +
      head.map(h => `<th style="text-align:left; padding: 8px 6px; font-family: var(--f-display); font-weight: 600;">${escapeHtml(h)}</th>`).join('') +
      '</tr></thead>';
    if (rest.length) {
      html += '<tbody>' + rest.map(r => '<tr style="border-bottom: 1px dashed var(--paper-edge);">' +
        r.map(c => `<td style="padding: 8px 6px; vertical-align: top;">${escapeHtml(c)}</td>`).join('') + '</tr>').join('') + '</tbody>';
    }
    html += '</table>';
    return slot(html);
  });

  // [QUOTE:文字]
  body = body.replace(/\[QUOTE:([^\]]+)\]/g, (_, q) =>
    slot(`<blockquote style="font-family: var(--f-hand-cn); margin: 14px 0; padding: 12px 18px; border-left: 3px solid var(--coral-deep); background: rgba(197,107,90,0.07); font-size: 16px; color: var(--ink);">${escapeHtml(q)}</blockquote>`)
  );

  // [CHIP:文字]
  body = body.replace(/\[CHIP:([^\]]+)\]/g, (_, c) =>
    slot(`<span class="chip" style="display:inline-block; margin: 2px 4px 2px 0;">${escapeHtml(c)}</span>`)
  );

  // 2) escape 剩餘文字
  body = escapeHtml(body);

  // 3) 段落分割：兩個換行 → <p>，單換行 → <br>
  body = body.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

  // 4) 還原 slots
  body = body.replace(/\x00SLOT(\d+)\x00/g, (_, i) => slots[Number(i)]);

  return body;
}

// =========================================================
// HOME — hero + corkboard + filter
// =========================================================
function viewHome(state) {
  // Phase 7C-fix-2 E/G: 動態 counts
  const candCount = (typeof CANDIDATES !== 'undefined') ? CANDIDATES.length : 0;
  const chCount = (typeof CHAPTERS !== 'undefined') ? CHAPTERS.length : 0;
  const wizCount = (typeof WIZARD !== 'undefined') ? WIZARD.length : 0;
  // Phase 7C-fix-1 C: dynamic country count (replaces hardcoded "19 fields each")
  const countryCount = (typeof CANDIDATES !== 'undefined')
    ? (new Set(CANDIDATES.map(c => c.country).filter(Boolean))).size
    : 0;
  return `
    <section class="hero">
      <div class="hero-grid">
        <div class="hero-left">
          <div class="hero-issue">vol. 04 · summer fieldnotes</div>
          <h1 class="hero-h1">
            <span class="em">夏</span>，三週<br>
            一場小冒險
            <small>給女兒上小學前的最後一個暑假</small>
          </h1>
          <p class="hero-dek">
            <span class="dropcap">三</span>個月、${candCount} 個候選地點、${chCount} 章背景研究、${wizCount} 題決策矩陣。
            這份手帳是我所有功課的整理。希望它幫你（和我自己）做出一個不後悔的決定。
          </p>
          <div class="hero-meta">
            <div class="hero-meta-item"><div class="num">${candCount}</div><div class="lbl">candidates</div></div>
            <div class="hero-meta-item"><div class="num">${countryCount}</div><div class="lbl">countries</div></div>
            <div class="hero-meta-item"><div class="num">21</div><div class="lbl">days · 3 weeks</div></div>
            <div class="hero-meta-item"><div class="num">3</div><div class="lbl">months research</div></div>
          </div>
          <div class="hero-actions">
            <a class="btn primary" href="#/wizard" data-route="wizard">開始決策助手 →</a>
            <a class="btn" href="#board">先看候選牆</a>
          </div>
          <div class="hero-stamp"><div class="stamp navy">媽媽研究室<br><span>2026 · 04 月版</span></div></div>
        </div>

        <div class="hero-collage">
          <!-- washi moved into polaroid -->

          <figure class="polaroid pol pol-1">
            <span class="pol-washi pw-gold"></span><span class="pin"></span>
            <img class="polaroid-img" src="${PHOTO.penang}" alt="Penang">
            <figcaption class="polaroid-caption">檳城 · 殖民老街</figcaption>
          </figure>

          <figure class="polaroid pol pol-2">
            <span class="pol-washi pw-coral"></span><span class="pin gold"></span>
            <img class="polaroid-img" src="${PHOTO.singapore}" alt="Singapore">
            <figcaption class="polaroid-caption">新加坡 · 國際校</figcaption>
          </figure>

          <div class="scrap scrap-1">
            <span class="handnote-en">"yes she's ready ✦"</span>
          </div>

          <figure class="polaroid pol pol-3">
            <span class="pol-washi pw-sage"></span><span class="pin sage"></span>
            <img class="polaroid-img" src="${PHOTO.girl}" alt="daughter">
            <figcaption class="polaroid-caption">小米 · 5 歲 11 個月</figcaption>
          </figure>

          <figure class="polaroid pol pol-4">
            <span class="pol-washi pw-navy"></span><span class="pin navy"></span>
            <img class="polaroid-img" src="${PHOTO.bali}" alt="Bali">
            <figcaption class="polaroid-caption">峇里 · Green School</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section class="board" id="board">
      <div class="board-head">
        <div>
          <div class="mag-eyebrow">field index · ${candCount} candidates</div>
          <h2><span class="em">${candCount} 個</span>夏天的可能</h2>
          <p class="lede">圖釘在世界地圖上的這些地方，是 3 個月研究後留下的。從 Tier 1 首選到 Tier 0 已排除——我都列在這裡，因為「為什麼排除」也是答案的一部分。</p>
        </div>
        <div class="right">
          <div class="stamp gold">field<br><span>2026 · 4</span></div>
        </div>
      </div>

      ${renderFilterBar(state)}

      <div class="cork" id="cork">
        ${renderCards(state)}
      </div>
    </section>
  `;
}

function renderFilterBar(state) {
  const f = state.filters;
  return `
    <div class="filterbar">
      <div class="filter-group">
        <label>Tier</label>
        <div class="ops" data-filter="tier">
          ${['all','1','2','3','0'].map(v => `
            <button data-val="${v}" aria-pressed="${f.tier === v}">${v === 'all' ? '全部' : `Tier ${v}`}</button>
          `).join('')}
        </div>
      </div>
      <div class="filter-group">
        <label>飛行時數</label>
        <div class="ops" data-filter="flight">
          ${[['all','全部'],['short','≤5h'],['mid','5–8h'],['long','>8h']].map(([v,t]) => `
            <button data-val="${v}" aria-pressed="${f.flight === v}">${t}</button>
          `).join('')}
        </div>
      </div>
      <div class="filter-group">
        <label>3 週預算</label>
        <div class="ops" data-filter="budget">
          ${[['all','全部'],['lo','<150k'],['mid','150–200k'],['hi','>200k']].map(([v,t]) => `
            <button data-val="${v}" aria-pressed="${f.budget === v}">${t}</button>
          `).join('')}
        </div>
      </div>
      <div class="filter-group">
        <label>地區</label>
        <div class="ops" data-filter="region">
          ${[['all','全部'],['sea','東南亞'],['ea','東北亞'],['anz','大洋洲'],['west','歐美']].map(([v,t]) => `
            <button data-val="${v}" aria-pressed="${f.region === v}">${t}</button>
          `).join('')}
        </div>
      </div>
      <div class="filter-spacer"></div>
      <div class="filter-results" id="filterCount"></div>
    </div>
  `;
}

function regionOf(c) {
  const sea = ['penang-tenby','singapore-bintan','kl-alicesmith','bali-ubud','chiangmai','hanoi'];
  const ea  = ['okinawa','tokyo','seoul','hkmac'];
  const anz = ['sydney','melbourne'];
  if (sea.includes(c.id)) return 'sea';
  if (ea.includes(c.id))  return 'ea';
  if (anz.includes(c.id)) return 'anz';
  return 'west';
}

function applyFilters(cards, f) {
  return cards.filter(c => {
    if (f.tier !== 'all' && String(c.tier) !== f.tier) return false;
    if (f.flight !== 'all') {
      const h = c.flight?.hours ?? 99;
      if (f.flight === 'short' && h > 5) return false;
      if (f.flight === 'mid'   && (h <= 5 || h > 8)) return false;
      if (f.flight === 'long'  && h <= 8) return false;
    }
    if (f.budget !== 'all') {
      const b = c.budget?.total ?? 999999;
      if (f.budget === 'lo'  && b >= 150000) return false;
      if (f.budget === 'mid' && (b < 150000 || b > 200000)) return false;
      if (f.budget === 'hi'  && b <= 200000) return false;
    }
    if (f.region !== 'all' && regionOf(c) !== f.region) return false;
    return true;
  });
}

function renderCards(state) {
  const cards = applyFilters(CANDIDATES, state.filters);
  if (!cards.length) {
    return `<div style="grid-column: 1 / -1; text-align:center; padding: 80px 20px; color: var(--ink-muted); font-family: var(--f-hand-cn); font-size: 20px;">這個組合沒有符合的候選 — 試試放寬一個篩選 ✦</div>`;
  }
  return cards.map((c, i) => renderCard(c, i, state)).join('');
}

function renderCard(c, i, state) {
  const tilt = tilts[i % tilts.length];
  const tape = tapeClasses[i % tapeClasses.length];
  const pin  = pinClasses[i % pinClasses.length];
  const inCompare = state.compareSet.has(c.id);
  const lite = isLite(c);
  // Phase 7C-fix-2 A: lite chip 左上 (跟 hook_tags 同位)
  const liteChip = lite
    ? `<span class="chip chip-new" style="font-size: 11px; padding: 2px 6px;">✨ 新發現 · 待詳查</span>`
    : '';
  const tagChips = (lite || (c.hook_tags && c.hook_tags.length))
    ? `<div class="hook-tags" style="position: absolute; top: 8px; left: 8px; display: flex; flex-direction: column; gap: 3px; z-index: 5;">${
        liteChip +
        ((c.hook_tags || []).map(t => {
          const info = HOOK_TAG_LABELS[t] || { label: t, cls: 'chip-new' };
          return `<span class="chip ${info.cls}" data-tag="${t}" style="font-size: 11px; padding: 2px 6px;">${info.label}</span>`;
        }).join(''))
      }</div>` : '';
  // Phase 7C-fix-2 A: flight / budget 缺值改顯「資料待補」
  const flightHours = hasNum(c.flight?.hours);
  const budgetTotal = hasNum(c.budget?.total);
  const flightCell = flightHours
    ? `<strong>${c.flight.hours}h</strong> 飛行 · <span class="muted">${c.flight.direct ? '直飛' : '轉機'}</span>`
    : `<span class="muted" style="font-family: var(--f-hand-cn);">飛行資料待補</span>`;
  const budgetCell = budgetTotal
    ? `<strong>${Math.round(c.budget.total/1000)}k</strong> 三週預算`
    : `<span class="muted" style="font-family: var(--f-hand-cn);">預算資料待補</span>`;
  // Phase 7C-fix-2 A: score 0 改顯「分數待補」
  const showScore = hasNum(c.totalScore);
  const scoreBlock = showScore
    ? `<div class="score">${c.totalScore}<span style="font-size:11px;opacity:.5;">/40</span></div>`
    : (lite
        ? `<div class="score" style="font-size: 13px; font-family: var(--f-hand-cn); color: var(--ink-muted); text-align: right; line-height: 1.2;">分數<br>待補</div>`
        : '');
  // Phase 7C-fix-2 A: hook 完整顯示（cleanPlaceholder + 不截斷）
  const hookText = cleanPlaceholder(c.hook);
  return `
    <article class="candcard ${tilt} ${c.tier === 0 ? 't0' : ''} ${inCompare ? 'in-compare' : ''}" data-id="${c.id}">
      <div class="tape-corner ${tape}"></div>
      ${tagChips}
      ${c.tier === 1 ? `<div class="card-stamp"><div class="stamp gold round">TIER<br>ONE</div></div>` : ''}
      ${c.tier === 0 ? `<div class="card-stamp"><div class="stamp">REJECTED</div></div>` : ''}
      <div class="card-frame">
        <img class="card-photo" src="${c.photo}" alt="${escapeHtml(c.city)}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-tier ${c.tier === 2 ? 't2' : c.tier === 3 ? 't3' : c.tier === 0 ? 't0' : ''}">
          ${c.tier === 0 ? '✕' : c.tier}
        </div>
        <div class="card-country"><span class="card-flag">${c.flag}</span> ${escapeHtml(c.country)}</div>
        <h3 class="card-place">${escapeHtml(c.city)}</h3>
        <p class="card-hook card-hook-full">${escapeHtml(hookText)}</p>
        <div class="card-meta">
          <div>
            ${flightCell}<br>
            ${budgetCell}
          </div>
          ${scoreBlock}
        </div>
      </div>
      <button class="compare-btn ${inCompare ? 'active' : ''}" data-compare="${c.id}" title="加入比較">${inCompare ? '✓' : '+'}</button>
    </article>
  `;
}

// =========================================================
// DETAIL — journal spread (19 fields)
// =========================================================
function viewDetail(c) {
  if (!c) return '<div class="page"><p>找不到這個候選。</p></div>';
  const score = c.totalScore || 0;
  // Phase 7C-fix-2 B: lite 候選的 score block 也視同 "excluded-style" 隱藏 score
  // 但 isExcluded === true 仍只給 tier 0 真正排除用，lite 走自己的 fallback block
  const isExcluded = c.scoresMissing === true && !isLite(c);
  const lite = isLite(c);
  const scoresMissing = c.scoresMissing === true;
  // 飛行/簽證/預算 缺值 fallback
  const flightHasHours = hasNum(c.flight?.hours);
  const flightHasPrice = hasNum(c.flight?.price);
  const tbd = (v) => hasNum(v) ? null : '<span class="muted" style="font-family: var(--f-hand-cn);">待補 · 詳見官網</span>';
  // 信心等級 chip
  const confCamp = c.confidence?.camp || null;
  const confChip = confCamp ? (
    confCamp === 'verified' ? '<span class="chip" style="background:rgba(122,142,102,0.18); border-color: var(--sage-deep); color: var(--sage-deep);">✓ 已驗證</span>' :
    confCamp === 'third'    ? '<span class="chip" style="background:rgba(217,164,65,0.18); border-color: var(--gold-deep); color: var(--gold-deep);">⚠ 第三方資料</span>' :
                              '<span class="chip" style="background:rgba(197,107,90,0.18); border-color: var(--coral-deep); color: var(--coral-deep);">⚠ AI 推測，請自行核實</span>'
  ) : '';
  // polaroid photo + city caption
  const polaroidHead = c.photo ? `
    <figure class="polaroid pol pol-detail spread-head-photo tilt-1">
      <span class="pol-washi pw-gold"></span>
      <img class="polaroid-img" src="${c.photo}" alt="${escapeHtml(c.city)}">
      <figcaption class="polaroid-caption">${escapeHtml(c.city)} · ${escapeHtml(c.country)}</figcaption>
    </figure>
  ` : '';
  return `
    <div class="overlay-sheet">
      <button class="overlay-close" id="closeDetail" aria-label="關閉">✕</button>

      <div class="spread">
        <header class="spread-head spread-head-flex">
          ${polaroidHead}
          <div class="spread-head-body">
            <div class="spread-eyebrow">field ${c.rank.toString().padStart(2,'0')} · ${c.country} · ${c.flag}</div>
            <h1 class="spread-place">${escapeHtml(c.city)}</h1>
            <p class="spread-hook">${escapeHtml(c.hook)}</p>
            <div class="flex wrap mt-16">
              <span class="chip ${tierClassChip(c.tier)}">Tier ${c.tier === 0 ? '排除' : c.tier} · ${tierName(c.tier)}</span>
              ${lite ? '<span class="chip chip-new">✨ 新發現 · 待詳查</span>' : ''}
              <span class="chip">${flightHasHours ? `飛行 ${c.flight.hours}h ${c.flight.direct ? '· 直飛' : '· 轉機'}` : '飛行 · 待補'}</span>
              <span class="chip">${c.visa?.type && c.visa.type !== '—' ? c.visa.type : '簽證 · 待補'}</span>
              <span class="chip warn">3 週預算 ${hasNum(c.budget?.total) ? Math.round(c.budget.total/1000)+'k' : '待補'}</span>
              ${confChip}
            </div>
            ${c.confidence?.deadline_source_url ? `
              <div style="margin-top: 10px; font-family: var(--f-hand-en); font-size: 12px; color: var(--ink-muted); overflow-wrap: anywhere;">
                source · <a href="${escapeHtml(c.confidence.deadline_source_url)}" target="_blank" rel="noopener" style="color: var(--ink-soft); text-decoration: underline;">${escapeHtml(c.confidence.deadline_source_url)}</a>
                ${c.confidence.verified_date ? `<span style="margin-left: 8px;">· verified ${escapeHtml(c.confidence.verified_date)}</span>` : ''}
              </div>
            ` : ''}
          </div>
          ${isExcluded
            ? `<div class="stamp large" style="background: var(--ink); color: var(--paper);">EXCLUDED</div>`
            : (lite && scoresMissing)
              ? `<div class="stamp large" style="background: var(--paper-deep); color: var(--ink-soft); border-style: dashed;">LITE<br><span style="font-size: 11px;">待詳查</span></div>`
              : `<div class="stamp large gold">${score}<br><span>/ 40</span></div>`}
        </header>

        <div class="spread-body">

          <!-- LEFT COLUMN -->
          <div class="spread-col">
            <p style="font-family: var(--f-serif); font-size: 17px; line-height: 1.9; font-style: italic; color: var(--ink); margin-top: 24px;">${escapeHtml(c.pitch || '')}</p>

            <h3><span class="num">i.</span>夏令營 / 女兒</h3>
            ${c.camp ? `
              <div class="field">
                <span class="lbl">營隊名稱</span>
                <strong>${escapeHtml(c.camp.name)}</strong>
              </div>
              <dl class="kv">
                <dt>年齡</dt><dd>${escapeHtml(c.camp.age || '待補')}</dd>
                <dt>日期</dt><dd>${escapeHtml(c.camp.dates || '待補')}</dd>
                <dt>費用</dt><dd>${hasNum(c.camp.cost) ? `${ntd(c.camp.cost)} ／ 3 週` : '<span class="muted">待補 · 詳見官網</span>'}</dd>
                <dt>教學語言</dt><dd>${escapeHtml(c.camp.lang || '待補')}</dd>
              </dl>
              ${(c.camp.highlights && c.camp.highlights.length) ? `<div class="flex wrap mt-8">${c.camp.highlights.map(h => `<span class="chip">${escapeHtml(h)}</span>`).join('')}</div>` : ''}
            ` : '<p class="muted">營隊資訊待補。</p>'}

            <h3><span class="num">ii.</span>飛行 + 簽證</h3>
            <dl class="kv">
              <dt>飛行</dt><dd>${flightHasHours ? `${c.flight.hours}h ${c.flight.direct ? '直飛' : '轉機'} · ${escapeHtml(c.flight.airline || '—')}` : (tbd(c.flight?.hours) || '—')}</dd>
              <dt>機票</dt><dd>${flightHasPrice ? `${ntd(c.flight.price)} ／ 來回` : (tbd(c.flight?.price) || '—')}</dd>
              <dt>班次</dt><dd>${c.flight?.frequency || '<span class="muted">待補</span>'}</dd>
              <dt>簽證</dt><dd>${c.visa?.type && c.visa.type !== '—' ? escapeHtml(c.visa.type) : '<span class="muted">待補</span>'}</dd>
              <dt>父親文件</dt><dd>${c.visa?.deposit ?? '無特別需求'}</dd>
            </dl>

            ${(c.stays && c.stays.length) ? `
              <h3><span class="num">iii.</span>住宿（${c.stays.length} 種選項）</h3>
              ${c.stays.map(s => `
                <div class="field">
                  <span class="lbl">${escapeHtml(s.type)} · ${escapeHtml(s.area)}</span>
                  <strong>${hasNum(s.price) ? `${ntd(s.price)} / 晚` : '<span class="muted">待補</span>'}</strong>
                  <p class="mb-0" style="font-size:13px; color: var(--ink-muted); margin-top: 4px;">${escapeHtml(s.note || '')}</p>
                </div>
              `).join('')}
            ` : `
              <h3><span class="num">iii.</span>住宿</h3>
              <p class="muted" style="font-family: var(--f-hand-cn);">📝 住宿選項待用戶 email 校方確認後規劃</p>
            `}

            ${(() => {
              const cleanMe = (c.metime || []).filter(x => !PLACEHOLDER_LEAK.some(p => String(x).includes(p)));
              const cleanCls = (c.classes || []).filter(x => !PLACEHOLDER_LEAK.some(p => String(x).includes(p)));
              if (!cleanMe.length && !cleanCls.length) {
                return `<h3><span class="num">iv.</span>媽媽 me-time / 課程</h3>
                  <p class="muted" style="font-family: var(--f-hand-cn);">📝 詳細資料待用戶 email 校方確認後規劃</p>`;
              }
              return `<h3><span class="num">iv.</span>媽媽 me-time / 課程</h3>
                <p style="font-size:14px; color: var(--ink-soft);">日落酒吧、市集、咖啡店 + 8 類進修課（語言/烹飪/瑜伽/藝術/文化/商業/社交/志工）</p>
                <div class="flex wrap">
                  ${cleanMe.slice(0,4).map(x => `<span class="chip">${escapeHtml(x)}</span>`).join('')}
                  ${cleanCls.slice(0,8).map(x => `<span class="chip" style="background:rgba(122,142,102,.18);border-color:var(--sage-deep);color:var(--sage-deep);">${escapeHtml(x)}</span>`).join('')}
                </div>`;
            })()}

            <h3><span class="num">v.</span>適合誰 / 不適合誰</h3>
            <div class="sticky green" style="margin: 12px 0;">
              <strong style="display:block; font-family: var(--f-display); font-size: 18px; margin-bottom: 4px;">適合 ✓</strong>
              ${escapeHtml(c.goodFor || '—')}
            </div>
            <div class="sticky pink">
              <strong style="display:block; font-family: var(--f-display); font-size: 18px; margin-bottom: 4px;">不適合 ✕</strong>
              ${escapeHtml(c.notFor || '—')}
            </div>

            ${c.voices?.length ? `
              <h3><span class="num">vi.</span>多語論壇引用</h3>
              ${c.voices.map(v => `
                <blockquote style="font-family: var(--f-hand-cn); margin: 12px 0; padding: 12px 16px; border-left: 3px solid var(--coral-deep); background: rgba(197,107,90,0.06);">
                  ${escapeHtml(v.text)}
                  <footer style="font-family: var(--f-hand-en); font-size: 13px; color: var(--brown); margin-top: 4px;">— ${escapeHtml(v.src)}</footer>
                </blockquote>
              `).join('')}
            ` : ''}
          </div>

          <!-- RIGHT COLUMN -->
          <div class="spread-col">
            ${isExcluded ? `
              <!-- EXCLUDED block 取代 score -->
              <div class="score-block excluded-block">
                <div class="stamp large excluded-stamp">EXCLUDED</div>
                <h3 class="excluded-h">為什麼排除？</h3>
                <p class="excluded-reason">${escapeHtml(c.excludeReason || '').replace(/\n/g, '<br>')}</p>
                ${c.tier === 0 && Object.keys(c.scores || {}).length ? `
                  <details style="margin-top: 16px;">
                    <summary style="cursor: pointer; font-family: var(--f-hand-en); color: var(--coral-deep);">仍想看分數（partial）</summary>
                    <div class="score-rows" style="margin-top: 8px;">
                      ${Object.entries(c.scores || {}).filter(([k,v]) => v > 0).map(([k,v]) => `
                        <div class="score-row">
                          <span style="font-family: var(--f-hand-en); font-size: 14px; opacity: 0.9;">${k}</span>
                          <span class="bar"><i style="width: ${v*10}%"></i></span>
                          <span class="val">${v}</span>
                        </div>
                      `).join('')}
                    </div>
                  </details>
                ` : ''}
              </div>
            ` : (lite && scoresMissing) ? `
              <!-- Phase 7C-fix-2 B: Lite 候選 score block placeholder -->
              <div class="score-block lite-block" style="border-style: dashed;">
                <div class="total-lbl">lite candidate · 待詳查</div>
                <div class="total" style="font-size: 28px; line-height: 1.3; font-family: var(--f-hand-cn); color: var(--ink-soft);">
                  ✨ 分數待 user 親自 verify
                </div>
                <p style="font-family: var(--f-hand-cn); font-size: 13px; color: var(--ink-muted); margin-top: 12px; line-height: 1.7;">
                  此候選是 Phase 7B fork-extension 的「新發現」，營隊基本資料已抓到，但 8 維評分需 user 拍板後再回填。
                </p>
              </div>
            ` : `
              <!-- Score block -->
              <div class="score-block">
                <div class="total-lbl">total score · 8 dimensions</div>
                <div class="total">${score}<small> / 40</small></div>
                <div class="score-rows">
                  ${Object.entries(c.scores || {}).map(([k,v]) => `
                    <div class="score-row">
                      <span style="font-family: var(--f-hand-en); font-size: 14px; opacity: 0.9;">${k}</span>
                      <span class="bar"><i style="width: ${v*10}%"></i></span>
                      <span class="val">${v}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `}

            <h3><span class="num">vii.</span>3 週預算</h3>
            <div class="budget">
              ${[
                ['機票', c.budget?.flight],
                ['夏令營', c.budget?.camp],
                ['住宿', c.budget?.stay],
                ['飲食', c.budget?.food],
                ['活動', c.budget?.activity],
              ].map(([k,v]) => v ? `
                <div class="bud-row">
                  <span>${k}</span>
                  <span class="bar"><i style="width:${Math.min(100, v / ((c.budget.total||1)/100))}%"></i></span>
                  <span class="amt">${ntd(v)}</span>
                </div>` : '').join('')}
              <div class="bud-row" style="margin-top: 6px; padding-top: 10px; border-top: 1.5px solid var(--ink); font-weight: 700;">
                <span>表面合計</span>
                <span class="bar"><i style="width:100%; background: var(--ink);"></i></span>
                <span class="amt" style="color: var(--ink); font-size: 20px;">${ntd(c.budget?.total)}</span>
              </div>
              ${c.budget?.realTotal && c.budget.realTotal !== c.budget.total ? `
                <div class="bud-row" style="margin-top: 4px; padding-top: 8px; border-top: 1px dashed var(--ink); font-weight: 700; background: rgba(217,164,65,0.10); padding: 8px 6px; margin-left: -6px; margin-right: -6px;">
                  <span style="font-family: var(--f-hand-cn); color: var(--gold-deep);">實際全包（含雜支 buffer）</span>
                  <span class="bar"><i style="width:100%; background: var(--gold-deep);"></i></span>
                  <span class="amt" style="color: var(--gold-deep); font-size: 22px;">${ntd(c.budget.realTotal)}</span>
                </div>
                <p style="font-family: var(--f-hand-cn); font-size: 13px; color: var(--ink-muted); margin-top: 6px;">
                  ✦ 「表面」= camp + 機票 + 住宿 ／ 「實際全包」= 加上飲食 / SIM / 簽證 / 雜支 15% / 緊急 buffer 10%
                </p>
              ` : ''}
              <div class="bud-row" style="margin-top: 12px; opacity: 0.7;">
                <span style="font-family: var(--f-hand-en); color: var(--coral-deep);">vs 補習班一年</span>
                <span class="bar cram"><i style="width: ${Math.min(100, (c.budget?.vsCram || 240000) / 2400)}%"></i></span>
                <span class="amt">${ntd(c.budget?.vsCram || 240000)}</span>
              </div>
              <p style="font-family: var(--f-hand-cn); color: var(--coral-deep); margin-top: 12px;">
                ${(c.budget?.realTotal || c.budget?.total || 0) < (c.budget?.vsCram || 240000)
                  ? `→ 比補習班便宜 ${ntd((c.budget?.vsCram || 240000) - (c.budget?.realTotal || c.budget?.total || 0))}，還換來一段女兒不會忘的夏天。`
                  : `→ 比補習班貴 ${ntd((c.budget?.realTotal || c.budget?.total || 0) - (c.budget?.vsCram || 240000))}，但 ROI 在英文 immersion 和文化深度。`}
              </p>
            </div>

            ${c.itinerary ? renderItinerary(c.itinerary) : `
              <h3><span class="num">viii.</span>21 天行程</h3>
              <p class="muted">完整 21 天行程已在 Tier 1 首選頁；此候選為簡化版本。</p>
            `}

            <h3><span class="num">ix.</span>醫療 / 後勤 / 在地</h3>
            <dl class="kv">
              <dt>華語醫師</dt><dd>${c.medical?.mandarin || '—'}</dd>
              <dt>24h 急診</dt><dd>${c.medical?.emergency || '—'}</dd>
              <dt>交通</dt><dd>${c.logistics?.transport || '—'}</dd>
              <dt>採購</dt><dd>${c.logistics?.shopping || '—'}</dd>
              <dt>銀行</dt><dd>${c.logistics?.bank || '—'}</dd>
            </dl>

            ${((c.tier === 1 || c.tier === 2) || lite) && c.emergency ? renderEmergencyCard(c.emergency, lite) : ''}

            ${c.support ? renderSupportBlock(c.support) : ''}

            ${(c.risks && c.risks.length) ? `
              <h3><span class="num">x.</span>風險登錄</h3>
              <div>
                <div class="risk-row" style="font-family: var(--f-hand-en); color: var(--brown); border-bottom: 1.5px solid var(--ink);">
                  <span>嚴重度</span><span>風險項目</span><span>緩解策略</span>
                </div>
                ${c.risks.map(r => `
                  <div class="risk-row">
                    <span><span class="dot ${r.level}"></span> ${r.level === 'high' ? '高' : r.level === 'med' ? '中' : '低'}</span>
                    <span>${escapeHtml(r.item)}</span>
                    <span style="color: var(--ink-soft);">${escapeHtml(r.mitigation)}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${(c.p0 && c.p0.length) ? `
              <h3><span class="num">xi.</span>P0 立即行動</h3>
              ${c.p0.map((p,i) => {
                const dl = p.deadline ? `<strong style="font-family: var(--f-display); font-size: 16px;">截止 ${escapeHtml(p.deadline.slice(5))}</strong>`
                                       : `<span class="chip chip-warn-soft" style="font-family: var(--f-hand-cn);">⏳ 未定</span>`;
                return `<div class="sticky ${['','pink','green','blue'][i%4]}" style="margin: 12px 0;">
                  ${dl} · ${escapeHtml(p.task)}
                </div>`;
              }).join('')}
            ` : ''}

            ${(c.picks && ((c.picks.food && c.picks.food.length) || (c.picks.spa && c.picks.spa.length))) ? `
              <h3><span class="num">xii.</span>餐廳 / SPA 推薦</h3>
              ${(c.picks.food && c.picks.food.length) ? `
                <div class="flex wrap" style="gap: 6px;">
                  ${c.picks.food.map(f => `<span class="chip" style="background:rgba(197,107,90,0.12);border-color:var(--coral-deep);color:var(--coral-deep);">🍽 ${escapeHtml(f)}</span>`).join('')}
                </div>
              ` : ''}
              ${(c.picks.spa && c.picks.spa.length) ? `
                <div class="flex wrap mt-8" style="gap: 6px;">
                  ${c.picks.spa.map(s => `<span class="chip" style="background:rgba(122,142,102,0.12);border-color:var(--sage-deep);color:var(--sage-deep);">✦ ${escapeHtml(s)}</span>`).join('')}
                </div>
              ` : ''}
            ` : ''}

            ${c.sources?.length ? `
              <h3><span class="num">xiii.</span>主要來源</h3>
              <ul style="padding-left: 18px; font-size: 13px; color: var(--ink-muted); line-height: 1.8;">
                ${c.sources.map(s => `<li><a href="${escapeHtml(s)}" target="_blank" rel="noopener" style="color: var(--ink-soft);">${escapeHtml(s)}</a></li>`).join('')}
              </ul>
            ` : ''}

          </div>
        </div>

        ${c.tier === 0 && !isExcluded ? `
          <div style="margin-top: 48px; padding: 24px 32px; background: rgba(60,40,30,0.05); border-left: 4px solid var(--ink-muted);">
            <div class="stamp large" style="display: inline-block; margin-bottom: 12px;">EXCLUDED</div>
            <p style="font-family: var(--f-serif); font-size: 16px; color: var(--ink-soft);">已排除理由：${escapeHtml(c.excludeReason || '')}</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ---------- Emergency Card (Tier 1/2 + lite) ----------
function renderEmergencyCard(em, lite) {
  if (!em) return '';
  const hospitals = em.hospitals || [];
  const pharmacies = em.pharmacy || [];
  // Phase 7C-fix-2 B: lite + 醫院列表為空 → placeholder
  const hospitalsBlock = hospitals.length ? `
        <strong style="font-family: var(--f-display); font-size: 16px;">🏥 醫院（按優先順序）</strong>
        <div style="margin-top: 6px;">
          ${hospitals.map((h, i) => `
            <div style="padding: 8px 0; border-bottom: 1px dashed var(--paper-edge);">
              <strong>${i+1}. ${escapeHtml(h.name)}</strong>
              ${h.chinese && h.chinese !== '—' ? `<span class="chip" style="margin-left: 6px; font-size: 11px; background: rgba(122,142,102,0.18); border-color: var(--sage-deep); color: var(--sage-deep);">中文 OK</span>` : ''}
              ${h.addr ? `<div style="font-size: 13px; color: var(--ink-soft);">📍 ${escapeHtml(h.addr)}</div>` : ''}
              ${h.phone ? `<div style="font-size: 14px;">📞 <a href="tel:${escapeHtml((h.phone||'').replace(/\s/g,''))}" style="color: var(--coral-deep); font-family: var(--f-display);">${escapeHtml(h.phone)}</a></div>` : ''}
              ${h.note ? `<div style="font-size: 12px; color: var(--ink-muted); margin-top: 2px;">${escapeHtml(h.note)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : (lite ? `
        <strong style="font-family: var(--f-display); font-size: 16px;">🏥 醫院（按優先順序）</strong>
        <div style="margin-top: 6px; padding: 10px 12px; background: rgba(255,255,255,0.4); border: 1px dashed var(--coral-deep);">
          <span class="muted" style="font-family: var(--f-hand-cn); font-size: 13px;">📝 出發前 user email 校方索取在地醫院名單（中文友善 / 24h 急診優先）</span>
        </div>
      ` : '');
  return `
    <h3><span class="num">ix-b.</span>萬一 · Emergency Card</h3>
    <div class="emergency-card" style="background: rgba(197,107,90,0.07); border: 2px dashed var(--coral-deep); padding: 16px 18px; margin: 12px 0;">
      <div style="font-family: var(--f-hand-en); color: var(--coral-deep); font-size: 13px; margin-bottom: 8px;">single-mom safety net · keep this offline</div>

      ${hospitalsBlock}

      ${pharmacies.length ? `
        <strong style="display: block; margin-top: 14px; font-family: var(--f-display); font-size: 16px;">💊 24h 藥局</strong>
        <div style="margin-top: 4px; font-size: 13px;">
          ${pharmacies.map(p => `<div>· ${escapeHtml(p.name)}${p.addr ? ` <span class="muted" style="font-size: 12px;">— ${escapeHtml(p.addr)}</span>` : ''}</div>`).join('')}
        </div>
      ` : ''}

      ${em.insurance_sop ? `
        <strong style="display: block; margin-top: 14px; font-family: var(--f-display); font-size: 16px;">📋 保險 SOP</strong>
        <p style="font-size: 13px; line-height: 1.7; margin-top: 4px;">${escapeHtml(em.insurance_sop)}</p>
      ` : ''}

      ${em.camp_notify_sop ? `
        <strong style="display: block; margin-top: 14px; font-family: var(--f-display); font-size: 16px;">📣 Camp 通知 SOP</strong>
        <p style="font-size: 13px; line-height: 1.7; margin-top: 4px;">${escapeHtml(em.camp_notify_sop)}</p>
      ` : ''}

      <div style="margin-top: 14px; padding: 10px 12px; background: rgba(255,255,255,0.5); border: 1px solid var(--coral-deep); border-style: dashed;">
        <strong style="font-family: var(--f-display); display: block; margin-bottom: 4px; color: var(--coral-deep);">🇹🇼 台灣 24h 緊急聯絡人（必填）</strong>
        <input type="text" placeholder="姓名 / 關係 / 電話 1" data-em-contact="1" style="width: 100%; padding: 6px 8px; margin: 2px 0; border: 1px solid var(--paper-edge); background: rgba(255,255,255,0.7); font-family: var(--f-hand-cn);">
        <input type="text" placeholder="姓名 / 關係 / 電話 2（備援）" data-em-contact="2" style="width: 100%; padding: 6px 8px; margin: 2px 0; border: 1px solid var(--paper-edge); background: rgba(255,255,255,0.7); font-family: var(--f-hand-cn);">
        <p style="font-size: 11px; color: var(--ink-muted); margin-top: 4px;">${escapeHtml(em.taiwan_contact_placeholder || '出發前務必填妥兩個獨立聯絡人（不同地區更佳）')}</p>
      </div>
    </div>
  `;
}

// ---------- Support block (community / known families / family relay) ----------
function renderSupportBlock(s) {
  if (!s) return '';
  return `
    <h3><span class="num">ix-c.</span>同行支持 · 21 天不孤單</h3>
    <div style="display: grid; gap: 10px; margin: 12px 0;">
      <div class="field">
        <span class="lbl">在地華人 / 台僑社群</span>
        <strong>${escapeHtml(s.chinese_community || '—')}</strong>
      </div>
      <div class="field">
        <span class="lbl">同期已知台灣家庭</span>
        <strong>${escapeHtml(s.taiwan_families_known || '—')}</strong>
      </div>
      <div class="field">
        <span class="lbl">家人接力陪伴</span>
        <strong style="color: ${s.family_relay_friendly ? 'var(--sage-deep)' : 'var(--coral-deep)'};">
          ${s.family_relay_friendly ? '✓ 友善（航線可接力，住宿可加床）' : '✕ 較困難（飛行 / 簽證 / 住宿難加床）'}
        </strong>
      </div>
    </div>
  `;
}

function renderItinerary(its) {
  const weeks = [
    { label: 'Week 1', sub: 'arrival & rhythm', range: [1, 7] },
    { label: 'Week 2', sub: 'deepening', range: [8, 14] },
    { label: 'Week 3', sub: 'closing & memory', range: [15, 21] },
  ];
  return `
    <h3><span class="num">viii.</span>21 天行程（Top 3 完整版）</h3>
    <div class="itin">
      ${weeks.map(w => `
        <div class="itin-week">
          <h4>${w.label} <small>${w.sub}</small></h4>
          <div class="itin-grid">
            <div class="itin-cell head">日</div>
            <div class="itin-cell head">上午</div>
            <div class="itin-cell head">女兒營隊</div>
            <div class="itin-cell head">媽媽 me-time</div>
            <div class="itin-cell head">晚上</div>
            ${its.filter(d => d.day >= w.range[0] && d.day <= w.range[1]).map(d => `
              <div class="itin-cell day ${d.date.includes('(六)') || d.date.includes('(日)') ? 'weekend' : ''}">${d.day}<small>${d.date.replace(/^\d+\//, '').replace(/\(.+\)/, '')}</small></div>
              <div class="itin-cell">${escapeHtml(d.morning)}</div>
              <div class="itin-cell">${escapeHtml(d.camp)}</div>
              <div class="itin-cell">${escapeHtml(d.mama)}</div>
              <div class="itin-cell">${escapeHtml(d.evening)}</div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// =========================================================
// COMPARE — ticket stubs side by side
// =========================================================
function viewCompare(state) {
  const ids = Array.from(state.compareSet);
  const items = ids.map(id => CANDIDATES.find(c => c.id === id)).filter(Boolean);
  if (items.length < 2) {
    return `
      <div class="page">
        <h2 class="mag-h"><span class="em">並排</span>比較 · Compare</h2>
        <p class="mag-eyebrow">side-by-side</p>
        <hr class="mag-rule">
        <div style="background: var(--paper-deep); padding: 48px; text-align: center; font-family: var(--f-hand-cn); font-size: 18px; color: var(--ink-soft);">
          先到 <a href="#/" style="color:var(--coral-deep);">候選牆</a> 點 + 加入 2–4 個候選，才能並排比較。
        </div>
      </div>
    `;
  }
  // Phase 7C-fix-2 D: 缺值改顯「—」非 "$0" / "0h 轉機"
  const dash = '<span class="muted">—</span>';
  const rows = [
    { label: '一句話 hook', val: c => escapeHtml(cleanPlaceholder(c.hook)) },
    { label: '總分', val: c => hasNum(c.totalScore)
        ? `<span style="font-family: var(--f-display); font-size: 28px; color: var(--gold-deep);">${c.totalScore}</span><span class="muted"> / 40</span>`
        : (isLite(c) ? `<span class="muted" style="font-family: var(--f-hand-cn); font-size: 13px;">分數待補</span>` : dash) },
    { label: '飛行', val: c => hasNum(c.flight?.hours)
        ? `${c.flight.hours}h ${c.flight.direct ? '直飛' : '轉機'}<br><span class="muted">${escapeHtml(c.flight.airline || '')}</span>`
        : dash },
    { label: '機票', val: c => hasNum(c.flight?.price) ? ntd(c.flight.price) : dash },
    { label: '簽證', val: c => (c.visa?.type && c.visa.type !== '—') ? escapeHtml(c.visa.type) : dash },
    { label: '夏令營', val: c => c.camp?.name
        ? `<strong>${escapeHtml(c.camp.name)}</strong><br>${escapeHtml(c.camp.lang || '')}`
        : dash },
    { label: '營隊 3 週', val: c => hasNum(c.camp?.cost) ? ntd(c.camp.cost) : dash },
    { label: '住宿首選', val: c => (c.stays?.[0] && hasNum(c.stays[0].price))
        ? `${escapeHtml(c.stays[0].type)} · ${ntd(c.stays[0].price)}／晚`
        : dash },
    { label: '預算合計', val: c => hasNum(c.budget?.total)
        ? `<strong style="font-family: var(--f-display); font-size: 22px;">${ntd(c.budget.total)}</strong>`
        : dash },
    { label: 'vs 補習班', val: c => {
      // 只在 budget.total > 0 才算
      if (!hasNum(c.budget?.total)) return dash;
      const diff = (c.budget?.vsCram || 240000) - c.budget.total;
      return diff > 0
        ? `<span style="color: var(--sage-deep);">省 ${ntd(diff)}</span>`
        : `<span style="color: var(--coral-deep);">超 ${ntd(-diff)}</span>`;
    }},
    { label: '適合誰', val: c => `<span style="font-family: var(--f-hand-cn);">${escapeHtml(c.goodFor || '—')}</span>` },
    { label: '不適合誰', val: c => `<span style="font-family: var(--f-hand-cn); color: var(--coral-deep);">${escapeHtml(c.notFor || '—')}</span>` },
    { label: '主要風險', val: c => (c.risks || []).slice(0,2).map(r => `<div><span class="dot ${r.level}"></span>${escapeHtml(r.item)}</div>`).join('') || '—' },
    { label: 'P0 截止日', val: c => (c.p0 || []).map(p => {
      const dl = p.deadline ? p.deadline.slice(5) : '⏳ 未定';
      return `<div>${escapeHtml(dl)} · ${escapeHtml((p.task || '').slice(0,18))}…</div>`;
    }).join('') || '—' },
  ];
  return `
    <div class="page">
      <h2 class="mag-h"><span class="em">並排</span>比較</h2>
      <p class="mag-eyebrow">side-by-side · ${items.length} candidates</p>
      <hr class="mag-rule">

      <div class="compare-grid" style="--cols:${items.length};">
        <div class="compare-row head">
          <div class="rlbl"></div>
          ${items.map((c,i) => `
            <div class="compare-head-cell">
              <div class="ticket" style="padding: 16px;">
                <div style="font-family: var(--f-hand-en); color: var(--coral-deep); font-size: 15px;">candidate ${(i+1).toString().padStart(2,'0')}</div>
                <div style="font-family: var(--f-display); font-size: 28px; line-height: 1.1;">${c.flag} ${escapeHtml(c.city)}</div>
                <div style="font-family: var(--f-hand-en); font-size: 14px; color: var(--brown); margin-top: 2px;">${escapeHtml(c.country)}</div>
                <div class="flex" style="margin-top: 10px;">
                  <span class="chip ${tierClassChip(c.tier)}">Tier ${c.tier}</span>
                  <button class="btn ghost" data-uncompare="${c.id}" style="margin-left: auto; font-size: 12px; color: var(--coral-deep);">移除</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        ${rows.map(r => `
          <div class="compare-row">
            <div class="rlbl">${r.label}</div>
            ${items.map(c => `<div class="compare-cell">${r.val(c)}</div>`).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// =========================================================
// P0 — sticky note board
// =========================================================
function viewP0() {
  // gather all P0 items across candidates
  const all = [];
  CANDIDATES.forEach(c => (c.p0 || []).forEach(p => all.push({...p, city: c.city, id: c.id, tier: c.tier})));
  // Phase 7C-fix-2 C: null deadline 排到最後
  all.sort((a,b) => {
    const da = a.deadline || '9999';
    const db = b.deadline || '9999';
    return da.localeCompare(db);
  });

  const palettes = ['', 'pink', 'green', 'blue'];

  return `
    <div class="page">
      <h2 class="mag-h"><span class="em">P0</span> · 立即行動</h2>
      <p class="mag-eyebrow">deadlines · don't miss</p>
      <hr class="mag-rule">
      <p class="hero-dek mt-16" style="margin-top: 16px;">
        每個 Top 3 候選都有報名 / 簽證 / 訂房的截止日。把它們釘在這面牆上，每天經過提醒自己。
      </p>

      <div class="p0-wall">
        <div class="washi washi-coral p0-washi-left"></div>
        <div class="washi washi-sage p0-washi-right"></div>

        <div class="p0-grid">
          ${all.map((p,i) => {
            const due = p.deadline
              ? `<div class="due">${escapeHtml(p.deadline.slice(5))}</div>`
              : `<div class="due"><span class="chip chip-warn-soft" style="font-family: var(--f-hand-cn); font-size: 13px;">⏳ 未定</span></div>`;
            return `<div class="sticky ${palettes[i % palettes.length]} p0-card">
              <span class="pin ${pinClasses[i % pinClasses.length]}"></span>
              ${due}
              <div class="task">${escapeHtml(p.task)}</div>
              <div class="meta">→ ${p.tier === 0 ? '已排除' : `Tier ${p.tier}`} · ${escapeHtml(p.city)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// =========================================================
// LIBRARY — chapters drawer
// =========================================================
function getSourceCount() {
  // 從 CANDIDATES 算總和 sources 數量
  if (typeof CANDIDATES === 'undefined') return 0;
  return CANDIDATES.reduce((acc, c) => acc + ((c.sources && c.sources.length) || 0), 0);
}

function viewLibrary() {
  const chCount = (typeof CHAPTERS !== 'undefined') ? CHAPTERS.length : 0;
  const srcCount = getSourceCount();
  return `
    <div class="page">
      <h2 class="mag-h"><span class="em">研究檔案</span> · the library</h2>
      <p class="mag-eyebrow">${chCount} chapters · ${srcCount} sources · 3 months</p>
      <hr class="mag-rule">

      <div class="library">
        <aside class="library-toc">
          <h3>目次</h3>
          <div class="library-toc-sub">table of contents</div>
          <ol class="library-toc-list">
            ${CHAPTERS.map(ch => {
              const isNoGo = String(ch.n) === 'no-go';
              return `
              <li class="library-toc-item${isNoGo ? ' is-nogo' : ''}">
                <a href="#ch-${ch.n}" class="library-toc-link">
                  <span class="library-toc-num">${isNoGo ? 'side B' : ch.n}</span>
                  <span class="library-toc-title">${escapeHtml(ch.title.split(' · ')[0])}</span>
                </a>
              </li>
              `;
            }).join('')}
          </ol>
        </aside>

        <div class="library-content">
          ${CHAPTERS.map((ch, i) => {
            const palettes = [
              { bg: 'rgba(217,164,65,0.16)',  border: 'var(--gold-deep)',  tape: 'washi-cream' },
              { bg: 'rgba(197,107,90,0.13)',  border: 'var(--coral-deep)', tape: 'washi-coral' },
              { bg: 'rgba(122,142,102,0.15)', border: 'var(--sage-deep)',  tape: 'washi-sage'  },
              { bg: 'rgba(61,80,103,0.12)',   border: 'var(--navy)',       tape: 'washi-navy'  },
              { bg: 'rgba(155,126,104,0.18)', border: 'var(--brown)',      tape: 'washi-gold'  },
            ];
            const isNoGo = String(ch.n) === 'no-go';
            const p = isNoGo
              ? { bg: 'rgba(60,40,30,0.08)', border: 'var(--ink)', tape: 'washi-navy' }
              : palettes[i % palettes.length];
            const tilt = (i % 2 === 0) ? -0.4 : 0.4;
            const chNoLabel = isNoGo ? 'side-B · no-go' : `chapter ${ch.n}`;
            return `
              <section id="ch-${ch.n}" class="lib-section" style="--lib-bg: ${p.bg}; --lib-border: ${p.border}; --lib-tilt: ${tilt}deg;">
                <div class="washi ${p.tape} lib-washi" style="--lib-washi-tilt: ${tilt * 6 - 4}deg;"></div>
                <span class="ch-no">${chNoLabel}</span>
                <h3>${escapeHtml(ch.title)}</h3>
                <div class="ch-body">${renderMarkerBody(ch.body)}</div>
              </section>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// =========================================================
// WHY — 為什麼是這個夏天（5 行手寫填空 + localStorage）
// =========================================================
function viewWhy() {
  const questions = [
    { key: 'why_q1', q: '我希望女兒從這 21 天帶回什麼？' },
    { key: 'why_q2', q: '我希望自己從這 21 天帶回什麼？' },
    { key: 'why_q3', q: '如果這次不去，我會錯過什麼？' },
    { key: 'why_q4', q: '如果這次不去，我會得到什麼？' },
    { key: 'why_q5', q: '3 年後回看，我會慶幸做了哪個決定？' },
  ];
  return `
    <div class="page why-page page-why">
      <h2 class="mag-h why-title" style="text-align: center; font-family: var(--f-hand-cn);"><span class="em">為什麼</span>是這個夏天？</h2>
      <p class="mag-eyebrow" style="text-align: center;">handwritten · ${questions.length} prompts · private</p>
      <hr class="mag-rule">

      <p style="font-family: var(--f-hand-cn); font-size: 17px; line-height: 1.9; color: var(--ink-soft); margin: 24px auto 36px; max-width: 640px; text-align: center;">
        所有的決策矩陣、雷達圖、預算表，都比不上你在這 5 行寫下的真話。<br>
        慢慢寫。沒人會看到。
      </p>

      <div class="why-stack" style="max-width: 720px; margin: 0 auto; display: grid; gap: 36px;">
        ${questions.map((it, i) => `
          <div class="why-row">
            <div style="display: flex; align-items: baseline; gap: 14px; margin-bottom: 6px;">
              <span style="font-family: var(--f-hand-en); color: var(--coral-deep); font-size: 22px;">0${i+1}</span>
              <strong style="font-family: var(--f-display); font-size: 19px; color: var(--ink);">${escapeHtml(it.q)}</strong>
            </div>
            <textarea
              data-why-key="${it.key}"
              rows="3"
              placeholder="（在這裡寫下你的真話 — 自動儲存在你瀏覽器，沒人看得到）"
              style="width: 100%; min-height: 90px; padding: 14px 16px;
                     border: 0; border-bottom: 1.5px dashed var(--paper-edge);
                     background: transparent;
                     font-family: var(--f-hand-cn); font-size: 17px; line-height: 1.9;
                     color: var(--ink); resize: vertical; outline: none;"
              oninput="this.style.borderBottomColor='var(--coral-deep)';"
              onblur="this.style.borderBottomColor='var(--paper-edge)';"
            ></textarea>
          </div>
        `).join('')}
      </div>

      <div style="max-width: 720px; margin: 56px auto 0; padding-top: 24px; border-top: 1px dashed var(--paper-edge); text-align: center;">
        <p style="font-family: var(--f-hand-cn); color: var(--ink-muted); font-size: 14px;">
          ✦ 寫完不必馬上決定。把這頁關掉，明天再回來重看一次。
        </p>
        <div class="flex" style="justify-content: center; margin-top: 16px;">
          <a class="btn" href="#/">← 回首頁</a>
          <a class="btn primary" href="#/wizard">開始決策助手 →</a>
        </div>
      </div>
    </div>
  `;
}

// localStorage 自動載入/儲存 — 在 mount 後呼叫
function hookWhyAutosave() {
  document.querySelectorAll('textarea[data-why-key]').forEach(ta => {
    const k = ta.dataset.whyKey;
    try {
      const saved = localStorage.getItem(k);
      if (saved !== null) ta.value = saved;
    } catch(e) {}
    ta.addEventListener('input', () => {
      try { localStorage.setItem(k, ta.value); } catch(e) {}
    });
  });
}

// =========================================================
// PRINT — 列印給長輩看（純文字大字無裝飾）
// =========================================================
function viewPrint() {
  const tier1 = CANDIDATES.filter(c => c.tier === 1);
  return `
    <div class="page elder-page">
      <h2 class="mag-h"><span class="em">給長輩</span>的隨身卡</h2>
      <p class="mag-eyebrow">single page · large print · A4 friendly</p>
      <hr class="mag-rule">

      <p style="margin: 18px 0; font-size: 15px; color: var(--ink-soft);">
        按 <strong>Cmd/Ctrl + P</strong> 列印。建議 A4、無邊距、純黑白。
        把這頁印出來貼冰箱、放女兒書包、給接力陪伴的家人一份。
      </p>

      ${tier1.map(c => `
        <section class="elder-card" style="page-break-after: always; padding: 24px 28px; margin: 24px 0; border: 2px solid var(--ink); background: white;">
          <h2 style="font-size: 28px; margin: 0 0 8px; font-family: var(--f-display);">${c.flag} ${escapeHtml(c.city)} · ${escapeHtml(c.country)}</h2>
          <p style="font-size: 16px; margin: 0 0 18px; color: #555;">夏令營 21 天 · 2026 暑假 · Tier ${c.tier}</p>

          <h3 style="font-size: 20px; margin: 16px 0 6px;">🏕️ 夏令營</h3>
          <p style="font-size: 17px; line-height: 1.7; margin: 0;">
            <strong>${escapeHtml(c.camp?.name || '—')}</strong><br>
            年齡：${escapeHtml(c.camp?.age || '—')}　日期：${escapeHtml(c.camp?.dates || '—')}<br>
            費用：${ntd(c.camp?.cost)}　語言：${escapeHtml(c.camp?.lang || '—')}
          </p>

          <h3 style="font-size: 20px; margin: 16px 0 6px;">✈️ 飛行</h3>
          <p style="font-size: 17px; line-height: 1.7; margin: 0;">
            ${c.flight?.hours}h ${c.flight?.direct ? '直飛' : '轉機'}　航空：${escapeHtml(c.flight?.airline || '—')}<br>
            機票：${ntd(c.flight?.price)}
          </p>

          <h3 style="font-size: 20px; margin: 16px 0 6px;">🏥 緊急醫院（重要！）</h3>
          ${(c.emergency?.hospitals || []).slice(0, 3).map((h, i) => `
            <p style="font-size: 17px; line-height: 1.7; margin: 4px 0;">
              <strong>${i+1}. ${escapeHtml(h.name)}</strong>　電話：<strong style="font-size: 19px;">${escapeHtml(h.phone || '—')}</strong><br>
              ${h.addr ? `<span style="font-size: 15px;">地址：${escapeHtml(h.addr)}</span>` : ''}
            </p>
          `).join('')}

          ${c.emergency?.camp_notify_sop ? `
            <h3 style="font-size: 20px; margin: 16px 0 6px;">📣 萬一發生事情 SOP</h3>
            <p style="font-size: 17px; line-height: 1.8; margin: 0;">${escapeHtml(c.emergency.camp_notify_sop)}</p>
          ` : ''}

          <h3 style="font-size: 20px; margin: 16px 0 6px;">📞 台灣聯絡人</h3>
          <p style="font-size: 17px; line-height: 1.9; margin: 0;">
            1. 媽媽（女兒監護人）：________________________<br>
            2. 緊急備援：______________________________<br>
            3. 保險公司 24h 中文線：__________________
          </p>
        </section>
      `).join('')}

      <div style="text-align: center; margin-top: 32px;">
        <button class="btn primary" onclick="window.print()">🖨️ 立即列印</button>
        <a class="btn" href="#/" style="margin-left: 12px;">← 回首頁</a>
      </div>
    </div>
  `;
}

window.viewHome = viewHome;
window.viewDetail = viewDetail;
window.viewCompare = viewCompare;
window.viewP0 = viewP0;
window.viewLibrary = viewLibrary;
window.viewWhy = viewWhy;
window.viewPrint = viewPrint;
window.hookWhyAutosave = hookWhyAutosave;
window.applyFilters = applyFilters;
window.renderCards = renderCards;
