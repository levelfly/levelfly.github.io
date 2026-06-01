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
// 2026-06-01 防禦：href 只取第一個乾淨 http URL（資料可能含多 URL/中文註記，點了會錯）
const cleanUrl   = (s) => { const m = String(s||'').match(/https?:\/\/[^\s；;，,（）()"'、]+/); return m ? m[0] : ''; };
// 預算用「萬」不用 k（台灣慣例）：100000 → 10 萬、175000 → 17.5 萬
const wan        = (n) => (Math.round((n||0) / 1000) / 10) + ' 萬';
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
            <a class="btn primary" href="#board">自己挑 · 開始比較 →</a>
            <a class="btn" href="#/wizard" data-route="wizard">想要提示？決策助手</a>
          </div>
          <div class="hero-stamp"><div class="stamp navy">媽媽研究室<br><span>2026 · 04 月版</span></div></div>
        </div>

        <div class="hero-collage">
          <!-- washi moved into polaroid -->

          <figure class="polaroid pol pol-1">
            <span class="pol-washi pw-gold"></span><span class="pin"></span>
            <img class="polaroid-img" src="img/penang_tenby/penang-hero-v1.webp" alt="Penang">
            <figcaption class="polaroid-caption">檳城 · 海邊老城</figcaption>
          </figure>

          <figure class="polaroid pol pol-2">
            <span class="pol-washi pw-coral"></span><span class="pin gold"></span>
            <img class="polaroid-img" src="img/okinawa/okinawa-hero-v1.webp" alt="Okinawa">
            <figcaption class="polaroid-caption">沖繩 · 最短直飛</figcaption>
          </figure>

          <div class="scrap scrap-1">
            <span class="handnote-en">"yes she's ready ✦"</span>
          </div>

          <figure class="polaroid pol pol-3">
            <span class="pol-washi pw-sage"></span><span class="pin sage"></span>
            <img class="polaroid-img" src="img/penang_tenby/penang-morning-dropoff-v1.webp" alt="mother and daughter">
            <figcaption class="polaroid-caption">和女兒的那 21 天</figcaption>
          </figure>

          <figure class="polaroid pol pol-4">
            <span class="pol-washi pw-navy"></span><span class="pin navy"></span>
            <img class="polaroid-img" src="img/bali_ayana/bali_ayana-hero-v1.webp" alt="Bali">
            <figcaption class="polaroid-caption">峇里 · 海島度假</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section class="board" id="board">
      <div class="board-head">
        <div>
          <div class="mag-eyebrow">field index · ${candCount} candidates</div>
          <h2><span class="em">${candCount} 個</span>夏天的可能</h2>
          <p class="lede">這些是查證過、值得自己比的選項。用上面的條件篩成你在意的樣子——飛多遠、多少錢、要不要中文——挑你想深看的，點進去看那 21 天會怎麼過。要不要去、選哪個，你自己決定。</p>
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
          ${[['all','全部'],['lo','<15萬'],['mid','15–20萬'],['hi','>20萬']].map(([v,t]) => `
            <button data-val="${v}" aria-pressed="${f.budget === v}">${t}</button>
          `).join('')}
        </div>
      </div>
      <div class="filter-group">
        <label>中文支援</label>
        <div class="ops" data-filter="zh">
          ${[['all','全部'],['yes','要中文']].map(([v,t]) => `
            <button data-val="${v}" aria-pressed="${f.zh === v}">${t}</button>
          `).join('')}
        </div>
      </div>
      <div class="filter-group">
        <label>資料可信</label>
        <div class="ops" data-filter="conf">
          ${[['all','全部'],['verified','只看已查證']].map(([v,t]) => `
            <button data-val="${v}" aria-pressed="${f.conf === v}">${t}</button>
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
      <div class="filter-group">
        <label>排序</label>
        <div class="ops" data-filter="sort">
          ${[['none','預設'],['flight','飛行最短'],['cost','最便宜']].map(([v,t]) => `
            <button data-val="${v}" aria-pressed="${f.sort === v}">${t}</button>
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
    if (f.zh === 'yes' && !(c.chooser && c.chooser.zh)) return false;
    if (f.conf === 'verified' && !['verified', 'third'].includes(c.confidence?.camp)) return false;
    if (f.region !== 'all' && regionOf(c) !== f.region) return false;
    return true;
  });
}

function renderCards(state) {
  // 比較台：客觀排除已淘汰（tier 0 = 查無/矛盾/年齡不符），其餘全留給使用者自己篩
  let cards = applyFilters(CANDIDATES.filter(c => c.tier !== 0), state.filters);
  const s = state.filters.sort;
  if (s === 'flight') cards = [...cards].sort((a, b) => (a.flight?.hours ?? 99) - (b.flight?.hours ?? 99));
  else if (s === 'cost') cards = [...cards].sort((a, b) => (a.chooser?.cost_wk ?? 9e9) - (b.chooser?.cost_wk ?? 9e9));
  if (!cards.length) {
    return `<div style="grid-column: 1 / -1; text-align:center; padding: 80px 20px; color: var(--ink-muted); font-family: var(--f-hand-cn); font-size: 20px;">這個組合沒有符合的候選 — 試試放寬一個篩選 ✦</div>`;
  }
  return cards.map((c, i) => renderCard(c, i, state)).join('');
}

const CARD_CONF = {
  verified:     ['✓ 已查證',      'var(--sage-deep)'],
  third:        ['🔵 第三方',      '#3a6a96'],
  stale:        ['⚠ 2026 待確認',  'var(--gold-deep)'],
  contradicted: ['🔴 與官網矛盾',  '#b03020'],
  not_found:    ['🔴 查無此營',    '#b03020'],
  ai_guess:     ['⚠ 待核實',       'var(--coral-deep)'],
};

function renderCard(c, i, state) {
  const tilt = tilts[i % tilts.length];
  const tape = tapeClasses[i % tapeClasses.length];
  const inCompare = state.compareSet.has(c.id);
  const ch = c.chooser || {};
  const cc = CARD_CONF[c.confidence?.camp] || CARD_CONF.ai_guess;
  const fh = hasNum(c.flight?.hours)
    ? `${c.flight.hours}h ${c.flight.direct ? '直飛' : '轉機'}`
    : '飛行待補';
  const b2 = c.budget2;
  const cw = (b2 && b2.camp_per_week)
    ? `營 ${wan(b2.camp_per_week)}/週`
    : (b2 && b2.total)
    ? `約 ${wan(b2.total)}/${b2.weeks}週`
    : (hasNum(ch.cost_wk) ? `營 ${wan(ch.cost_wk)}/週` : '費用待詢');
  const zh = ch.zh ? '中文 ✓' : '英語為主';
  const photo = (c.expImg && c.expImg.hero) || c.photo;
  return `
    <article class="candcard ${tilt} ${inCompare ? 'in-compare' : ''}" data-id="${c.id}">
      <div class="tape-corner ${tape}"></div>
      <div class="card-frame">
        <img class="card-photo" src="${photo}" alt="${escapeHtml(c.city)}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-country"><span class="card-flag">${c.flag}</span> ${escapeHtml(c.country)}</div>
        <h3 class="card-place">${escapeHtml(c.city)}</h3>
        <div style="margin: 2px 0 8px;">
          <span class="chip" style="font-size: 11px; padding: 1px 7px; color: ${cc[1]}; border-color: ${cc[1]}; background: transparent;">${cc[0]}</span>
        </div>
        <div style="font-size: 12.5px; color: var(--ink-soft); line-height: 1.55; margin-bottom: 9px;">
          ${fh} &nbsp;·&nbsp; ${cw} &nbsp;·&nbsp; ${zh}
        </div>
        ${ch.feel ? `<div style="font-size: 13px; color: var(--ink); line-height: 1.55; margin-bottom: 5px;"><span style="color: var(--sage-deep); font-family: var(--f-hand-cn);">夏天感</span> ${escapeHtml(ch.feel)}</div>` : ''}
        ${ch.friction ? `<div style="font-size: 12.5px; color: var(--coral-deep); line-height: 1.5;"><span style="opacity: .7; font-family: var(--f-hand-cn);">要忍</span> ${escapeHtml(ch.friction)}</div>` : ''}
      </div>
      <button class="compare-btn ${inCompare ? 'active' : ''}" data-compare="${c.id}" title="加入比較">${inCompare ? '✓' : '+'}</button>
    </article>
  `;
}

// =========================================================
// BLOGGER — 部落客式、真相標記、照片優先（2026-06-01 改版）
// 讀 c.rich2（workflow 重寫）；無則回 null，viewDetail fallback 舊 rich
// =========================================================
const TRUST_UI = {
  '官方查證':       ['#2f7d5b', 'rgba(47,125,91,0.10)', '✓ 官方查證'],
  '第三方':         ['#8a6d1f', 'rgba(138,109,31,0.12)', '◐ 第三方來源'],
  '未查到官方確認': ['#b06a30', 'rgba(176,106,48,0.10)', '⚠ 未查到官方確認'],
  '存疑':           ['#b03020', 'rgba(176,48,32,0.10)', '✕ 存疑'],
};
function renderBudget2(c) {
  const b = c.budget2;
  if (!b || !b.total) return '';
  const cc = b.camp_confidence === 'verified'
    ? '<span style="font-size:11px; color:#2f7d5b; background:rgba(47,125,91,0.12); border-radius:10px; padding:1px 7px;">✓ 查證</span>'
    : b.camp_confidence === 'unknown'
    ? '<span style="font-size:11px; color:var(--coral-deep); background:rgba(197,107,90,0.12); border-radius:10px; padding:1px 7px;">待詢價</span>'
    : '<span style="font-size:11px; color:var(--ink-muted); background:rgba(60,40,30,0.06); border-radius:10px; padding:1px 7px;">估算</span>';
  const est = '<span style="font-size:10.5px; color:var(--ink-muted);">估</span>';
  const row = (lbl, val, tag, calc) => `
    <div style="display:flex; align-items:baseline; gap:8px; padding:5px 0; border-bottom:1px dotted var(--paper-edge);">
      <span style="flex:1; font-size:13.5px; color:var(--ink-soft);">${lbl}${calc ? ` <span style="font-size:11.5px; color:var(--ink-muted);">${calc}</span>` : ''}</span>
      <span style="font-size:14px; color:var(--ink);">${wan(val)}</span>
      <span style="width:42px; text-align:right;">${tag}</span>
    </div>`;
  const campCalc = b.camp_per_week ? `${wan(b.camp_per_week)}/週 × ${b.weeks} 週` : '';
  return `
    <section style="margin: 4px 0 22px; padding: 16px 18px; background: var(--paper); border: 1px solid var(--paper-edge); border-radius: 8px;">
      <div style="font-family: var(--f-hand-cn); font-weight: 700; font-size: 16px; color: var(--ink); margin-bottom: 4px;">💰 這趟大概多少錢（21 天）</div>
      <div style="font-size: 11.5px; color: var(--ink-muted); margin-bottom: 10px;">營費以查證為準，其餘是合理估值。母女 2 人、住宿與餐食按 21 天行程計、女兒上 ${b.weeks} 週營。</div>
      ${b.camp_per_week ? row('夏令營', b.camp_total, cc, campCalc) : `<div style="padding:5px 0; border-bottom:1px dotted var(--paper-edge); font-size:13.5px; color:var(--coral-deep);">夏令營 — ${escapeHtml(b.cost_notes ? '套裝/按日計，需詢價' : '待詢價')} ${cc}</div>`}
      ${row('機票（2 人來回）', b.flight, est)}
      ${row('住宿', b.accommodation, est, b.accommodation_per_night ? `${wan(b.accommodation_per_night)}/晚 × 21` : '')}
      ${row('餐食', b.food, est, b.food_per_day ? `${wan(b.food_per_day)}/天 × 21` : '')}
      ${row('當地交通', b.local_transport, est)}
      ${row('簽證 / 保險 / 雜支', b.misc, est)}
      <div style="display:flex; align-items:baseline; gap:8px; padding:9px 0 2px; margin-top:2px; border-top:2px solid var(--ink);">
        <span style="flex:1; font-family:var(--f-hand-cn); font-weight:700; font-size:15px; color:var(--ink);">總計</span>
        <span style="font-family:var(--f-display); font-size:22px; color:var(--gold-deep);">${wan(b.total)}</span>
        <span style="width:42px;"></span>
      </div>
      ${b.fx_note ? `<div style="margin-top:8px; font-size:11px; color:var(--ink-muted);">匯率：${escapeHtml(b.fx_note)}</div>` : ''}
      ${b.cost_notes ? `<details style="margin-top:6px;"><summary style="cursor:pointer; font-size:11.5px; color:var(--ink-muted); font-family:var(--f-hand-cn);">費用細節與提醒 ▾</summary><div style="margin-top:6px; font-size:12px; line-height:1.7; color:var(--ink-soft);">${escapeHtml(b.cost_notes)}</div></details>` : ''}
    </section>`;
}

function renderBlogger(c) {
  const r = c.rich2;
  if (!r || !r.hook) return null;
  const vf = r.verified_facts || {};
  const tl = vf.trust_label || '未查到官方確認';
  const tc = TRUST_UI[tl] || TRUST_UI['未查到官方確認'];
  const sceneImg = (i) => `img/${c.id}/b${i}-v1.webp`;
  const tagChip = (tag) => tag === 'verified'
    ? `<span style="font-size:11px; font-family:var(--f-hand-cn); color:#2f7d5b; background:rgba(47,125,91,0.12); border-radius:10px; padding:1px 8px; margin-left:6px; vertical-align:middle;">✓ 查證</span>`
    : `<span style="font-size:11px; font-family:var(--f-hand-cn); color:var(--ink-muted); background:rgba(60,40,30,0.06); border-radius:10px; padding:1px 8px; margin-left:6px; vertical-align:middle;">印象</span>`;
  const vfRow = (lbl, val) => val ? `<div style="display:flex; gap:10px; margin:3px 0;"><span style="min-width:46px; color:var(--ink-muted); font-size:13px;">${lbl}</span><span style="font-size:14px; color:var(--ink);">${escapeHtml(val)}</span></div>` : '';
  const scenes = (r.scenes || []).slice(0, 6);
  const g = r.grounded;
  const groundedHtml = (t) => escapeHtml(t || '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\s*\*\s+/gm, '· ')
    .replace(/\n/g, '<br>');
  return `
    <section style="margin: 10px 0 4px;">
      <div style="font-family: var(--f-display); font-size: 26px; line-height: 1.35; color: var(--ink); margin-bottom: 10px;">${escapeHtml(r.hook)}</div>
      <p style="font-family: var(--f-serif); font-size: 16px; line-height: 1.95; color: var(--ink-soft); margin: 0 0 18px;">${escapeHtml(r.intro)}</p>

      <!-- 查得到的事實（帶可信徽章 + 可點官方連結） -->
      <div style="border-left: 4px solid ${tc[0]}; background: ${tc[1]}; border-radius: 6px; padding: 13px 16px; margin-bottom: 22px;">
        <div style="font-family: var(--f-hand-cn); font-weight: 700; font-size: 13px; color: ${tc[0]}; margin-bottom: 8px;">${tc[2]}</div>
        ${vf.camp_name ? `<div style="font-family: var(--f-display); font-size: 17px; color: var(--ink); margin-bottom: 8px;">${escapeHtml(vf.camp_name)}</div>` : ''}
        ${vfRow('年齡', vf.age)}
        ${vfRow('日期', vf.dates)}
        ${vfRow('費用', vf.cost)}
        ${vf.status ? `<div style="margin-top:8px; font-size:13.5px; font-family:var(--f-hand-cn); color:${tc[0]};">📍 ${escapeHtml(vf.status)}</div>` : ''}
        <div style="margin-top:10px;">
          ${cleanUrl(vf.source_url) ? `<a href="${escapeHtml(cleanUrl(vf.source_url))}" target="_blank" rel="noopener" style="font-size:13px; color:${tc[0]}; text-decoration:underline; overflow-wrap:anywhere;">官方頁面 ↗</a>` : `<span style="font-size:12.5px; color:var(--ink-muted); font-family:var(--f-hand-cn);">（沒查到官方連結，報名前請自己跟校方確認）</span>`}
        </div>
      </div>

      ${g && g.answer ? `
      <details style="margin: -8px 0 22px; border: 1px solid rgba(47,125,91,0.25); border-radius: 6px; background: rgba(47,125,91,0.04);">
        <summary style="cursor: pointer; list-style: none; padding: 11px 15px; font-family: var(--f-hand-cn); font-size: 13.5px; color: #2f7d5b; font-weight: 700; user-select: none;">📖 NotebookLM 從官方頁面逐項查證${g.n_refs ? ` · ${g.n_refs} 處出處` : ''}（展開看原文佐證）▾</summary>
        <div style="padding: 2px 16px 14px; font-size: 13.5px; line-height: 1.85; color: var(--ink);">
          ${groundedHtml(g.answer)}
          ${cleanUrl(g.url) ? `<div style="margin-top: 10px;"><a href="${escapeHtml(cleanUrl(g.url))}" target="_blank" rel="noopener" style="font-size: 12.5px; color: #2f7d5b; text-decoration: underline; overflow-wrap: anywhere;">官方頁面原文 ↗</a></div>` : ''}
          <div style="margin-top: 8px; font-size: 11.5px; color: var(--ink-muted); font-family: var(--f-hand-cn);">[數字] 是 NotebookLM 對應官方頁面的原文出處標記。AI 查證、非人工核對，報名前仍請自行向校方確認。</div>
        </div>
      </details>` : ''}

      <!-- 部落客式照片段落 -->
      ${scenes.map((s, i) => `
        <figure class="bscene" style="margin: 0 0 24px;">
          <img src="${sceneImg(i)}" alt="" loading="lazy"
               onerror="this.style.display='none'"
               style="width:100%; aspect-ratio: 3/2; object-fit: cover; border-radius: 8px; border: 6px solid #fff; box-shadow: 0 5px 18px rgba(0,0,0,0.13);">
          <figcaption style="margin-top: 10px;">
            <div style="font-family: var(--f-hand-cn); font-weight: 700; font-size: 16px; color: var(--ink); margin-bottom: 3px;">${escapeHtml(s.title || '')}${tagChip(s.tag)}</div>
            <div style="font-family: var(--f-serif); font-size: 15px; line-height: 1.85; color: var(--ink-soft);">${escapeHtml(s.blurb || '')}</div>
          </figcaption>
        </figure>`).join('')}

      ${renderBudget2(c)}

      ${r.mom_time ? `<div style="background: rgba(217,164,65,0.10); border-radius: 6px; padding: 12px 15px; margin-bottom: 16px;">
        <span style="font-family: var(--f-hand-cn); font-weight:700; color: var(--gold-deep);">💆 你的白天</span>
        <span style="font-size:14px; color:var(--ink-soft); line-height:1.8;"> ${escapeHtml(r.mom_time)}</span>
        <span style="font-size:11px; font-family:var(--f-hand-cn); color:var(--ink-muted); background:rgba(60,40,30,0.06); border-radius:10px; padding:1px 8px; margin-left:4px;">印象</span>
      </div>` : ''}

      ${(r.honest_notes && r.honest_notes.length) ? `<div style="border-left: 3px solid var(--coral-deep); background: rgba(197,107,90,0.06); border-radius: 4px; padding: 12px 15px; margin-bottom: 16px;">
        <div style="font-family: var(--f-hand-cn); font-weight: 700; color: var(--coral-deep); margin-bottom: 6px;">誠實說，要注意：</div>
        <ul style="margin:0; padding-left:18px; font-size:13.5px; line-height:1.8; color:var(--ink-soft);">
          ${r.honest_notes.map(n => `<li style="margin-bottom:3px;">${escapeHtml(n)}</li>`).join('')}
        </ul>
      </div>` : ''}

      ${((c.budget2 && c.budget2.age_note) || (r.caveats && r.caveats.length)) ? `<div style="border-left: 3px solid var(--gold-deep); background: rgba(217,164,65,0.08); border-radius: 4px; padding: 12px 15px; margin-bottom: 16px;">
        <div style="font-family: var(--f-hand-cn); font-weight: 700; color: var(--gold-deep); margin-bottom: 6px;">🔎 報名前要確認（取決於你的情況）</div>
        <ul style="margin:0; padding-left:18px; font-size:13px; line-height:1.8; color:var(--ink-soft);">
          ${c.budget2 && c.budget2.age_note ? `<li style="margin-bottom:3px;">${escapeHtml(c.budget2.age_note)}</li>` : ''}
          ${(r.caveats || []).map(n => `<li style="margin-bottom:3px;">${escapeHtml(n)}</li>`).join('')}
        </ul>
      </div>` : ''}

      <div style="font-family: var(--f-hand-cn); font-size: 12.5px; color: var(--ink-muted); border-top: 1px dashed var(--paper-edge); padding-top: 12px;">— 標「✓ 查證」的是查得到出處的事實，標「印象」的是一般認識。本頁經多輪交叉比對清理過原本的編造與矛盾。去不去、選哪個，你自己決定。</div>
    </section>`;
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
  // 信心等級 chip（2026-05-31 Workflow 對抗查證 6 級）
  const confCamp = c.confidence?.camp || null;
  const CONF_STYLE = {
    verified:     ['rgba(122,142,102,0.18)', 'var(--sage-deep)', '✓ 官網已驗證'],
    third:        ['rgba(74,124,168,0.18)',  '#3a6a96',          '🔵 第三方查證'],
    stale:        ['rgba(217,164,65,0.18)',  'var(--gold-deep)', '⚠ 機構真實 · 2026 細節待確認'],
    contradicted: ['rgba(197,60,50,0.20)',   '#b03020',          '🔴 與官網矛盾 · 見下方差異'],
    not_found:    ['rgba(197,60,50,0.20)',   '#b03020',          '🔴 查無此營 · 疑誤植'],
    ai_guess:     ['rgba(197,107,90,0.18)',  'var(--coral-deep)','⚠ AI 推測，請自行核實'],
  };
  const cs = CONF_STYLE[confCamp] || CONF_STYLE.ai_guess;
  const confChip = confCamp ? `<span class="chip" style="background:${cs[0]}; border-color:${cs[1]}; color:${cs[1]};">${cs[2]}</span>` : '';
  // polaroid photo + city caption
  const heroImg = (c.expImg && c.expImg.hero) || c.photo;
  const polaroidHead = heroImg ? `
    <figure class="polaroid pol pol-detail spread-head-photo tilt-1">
      <span class="pol-washi pw-gold"></span>
      <img class="polaroid-img" src="${heroImg}" alt="${escapeHtml(c.city)}">
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
            <div class="spread-eyebrow">${c.flag} ${escapeHtml(c.country || '')}</div>
            <h1 class="spread-place">${escapeHtml(c.city)}</h1>
            <div class="flex wrap mt-16">
              <span class="chip">${flightHasHours ? `飛行 ${c.flight.hours}h ${c.flight.direct ? '· 直飛' : '· 轉機'}` : '飛行 · 待補'}</span>
              <span class="chip">${c.visa?.type && c.visa.type !== '—' ? c.visa.type : '簽證 · 待補'}</span>
              <span class="chip warn">${c.budget2?.total ? `21 天約 ${wan(c.budget2.total)}` : (hasNum(c.budget?.total) ? '約 ' + wan(c.budget.total) : '預算待補')}</span>
              ${confChip}
            </div>
            ${cleanUrl(c.confidence?.deadline_source_url) ? `
              <div style="margin-top: 10px; font-family: var(--f-hand-en); font-size: 12px; color: var(--ink-muted); overflow-wrap: anywhere;">
                source · <a href="${escapeHtml(cleanUrl(c.confidence.deadline_source_url))}" target="_blank" rel="noopener" style="color: var(--ink-soft); text-decoration: underline;">${escapeHtml(cleanUrl(c.confidence.deadline_source_url))}</a>
                ${c.confidence.verified_date ? `<span style="margin-left: 8px;">· verified ${escapeHtml(c.confidence.verified_date)}</span>` : ''}
              </div>
            ` : ''}
          </div>
          ${isExcluded
            ? `<div class="stamp large" style="background: var(--ink); color: var(--paper);">EXCLUDED</div>`
            : ''}
        </header>

        ${(() => {
          const blog = renderBlogger(c);
          if (blog) return blog;
          const r = c.rich;
          const para = (t) => (t || '').split(/\n\n+/).map(p => `<p style="margin: 0 0 13px;">${escapeHtml(p.trim())}</p>`).join('');
          const scenes = (c.expImg && c.expImg.scenes && c.expImg.scenes.length) ? c.expImg.scenes : [];
          // 單張「分隔帶圖」——插在段落之間斷開文字牆，水彩手帳調
          const band = (i, cap) => scenes[i] ? `
            <figure style="margin: 20px -2px 22px; transform: rotate(${i % 2 ? 0.5 : -0.5}deg);">
              <img src="${scenes[i]}" alt="" loading="lazy" style="width: 100%; aspect-ratio: 16/7; object-fit: cover; border-radius: 6px; border: 6px solid #fff; box-shadow: 0 5px 18px rgba(0,0,0,0.13);">
              ${cap ? `<figcaption style="font-family: var(--f-hand-cn); font-size: 12px; color: var(--ink-muted); text-align: right; margin: 6px 6px 0;">${escapeHtml(cap)}</figcaption>` : ''}
            </figure>` : '';
          // 後備：仍有圖但沒走分段時（fallback 體驗區用），擠一排
          const scenesHtml = scenes.length ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin: 6px 0 20px;">
              ${scenes.map((src, i) => `
                <figure style="margin: 0; transform: rotate(${(i % 2 ? 1 : -1) * (0.6 + (i % 3) * 0.4)}deg);">
                  <img src="${src}" alt="" loading="lazy" style="width: 100%; aspect-ratio: 3/2; object-fit: cover; border-radius: 4px; border: 5px solid #fff; box-shadow: 0 3px 12px rgba(0,0,0,0.12);">
                </figure>`).join('')}
            </div>` : '';
          const rh = (t) => `<div style="font-family: var(--f-hand-cn); font-size: 16px; font-weight: 700; color: var(--ink); margin: 22px 0 10px;">${t}</div>`;
          const listCol = (emo, title, items, clr, bg) => `
            <div style="background: ${bg}; border-radius: 6px; padding: 13px 15px;">
              <div style="font-family: var(--f-hand-cn); font-weight: 700; color: ${clr}; margin-bottom: 8px;">${emo} ${title}</div>
              <ul style="margin: 0; padding-left: 16px; font-size: 13px; line-height: 1.75; color: var(--ink-soft);">
                ${(items || []).map(x => `<li style="margin-bottom: 4px;">${escapeHtml(x)}</li>`).join('')}
              </ul>
            </div>`;
          if (r && r.story) {
            // story 分段，第一段後嵌 band(0)，讓圖坐在閱讀流裡而非堆一排
            const sp = (r.story || '').split(/\n\n+/).map(p => p.trim()).filter(Boolean);
            const storyHtml = sp.map((p, idx) =>
              `<p style="margin: 0 0 13px;">${escapeHtml(p)}</p>` + (idx === 0 && sp.length > 1 ? band(0) : '')
            ).join('') || para(r.story);
            const storyTrailBand = sp.length <= 1 ? band(0) : '';
            return `
            <section style="margin: 8px 0 4px; padding: 20px 22px; background: var(--paper); border: 1px solid var(--paper-edge); border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.04);">
              ${r.thesis ? `<div style="font-family: var(--f-serif); font-size: 18px; font-style: italic; line-height: 1.85; color: var(--ink); border-left: 3px solid var(--gold-deep); padding-left: 16px; margin-bottom: 20px;">${escapeHtml(r.thesis)}</div>` : ''}
              <div style="font-family: var(--f-serif); font-size: 16.5px; line-height: 2.05; color: var(--ink); margin-bottom: 18px;">${storyHtml}</div>
              ${storyTrailBand}
              ${r.weekday_rhythm ? `${band(1)}${rh('🕘 平日的一天')}<div style="font-size: 14px; line-height: 1.95; color: var(--ink-soft);">${para(r.weekday_rhythm)}</div>` : ''}
              ${(r.weekend_plays && r.weekend_plays.length) ? `${band(2)}${rh('🌅 週末這樣玩')}<div style="display: grid; gap: 12px;">${r.weekend_plays.map(w => `
                <div style="background: rgba(74,124,168,0.07); border-radius: 6px; padding: 12px 14px;">
                  <div style="font-weight: 700; color: #3a6a96; margin-bottom: 4px;">${escapeHtml(w.title || '')}</div>
                  <div style="font-size: 13px; line-height: 1.7; color: var(--ink-soft);">${escapeHtml(w.detail || '')}</div>
                </div>`).join('')}</div>` : ''}
              ${rh('這趟對你們各自是什麼')}
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
                ${listCol('👧', '女兒會記得', r.kid_joys, 'var(--sage-deep)', 'rgba(122,142,102,0.10)')}
                ${listCol('💆', '你會喘口氣', r.mom_joys, 'var(--gold-deep)', 'rgba(217,164,65,0.10)')}
                ${listCol('😮‍💨', '要忍的', r.friction, 'var(--coral-deep)', 'rgba(197,107,90,0.08)')}
              </div>
              ${(r.fit || r.not_fit) ? `${rh('適合你們嗎')}<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
                ${r.fit ? `<div style="border-left: 3px solid var(--sage-deep); padding-left: 12px;"><div style="font-weight: 700; color: var(--sage-deep); margin-bottom: 4px;">✓ 適合</div><div style="font-size: 13.5px; line-height: 1.75; color: var(--ink-soft);">${escapeHtml(r.fit)}</div></div>` : ''}
                ${r.not_fit ? `<div style="border-left: 3px solid var(--coral-deep); padding-left: 12px;"><div style="font-weight: 700; color: var(--coral-deep); margin-bottom: 4px;">✕ 不適合</div><div style="font-size: 13.5px; line-height: 1.75; color: var(--ink-soft);">${escapeHtml(r.not_fit)}</div></div>` : ''}
              </div>` : ''}
              <div style="margin-top: 18px; font-family: var(--f-hand-cn); font-size: 12px; color: var(--ink-muted);">— 好處壞處都寫了。去不去、選哪個，你自己決定。</div>
            </section>`;
          }
          // fallback：無 rich 時用舊的三桶體驗
          const ex = c.experience || {};
          const cols = [
            ['👧', '女兒會記得', ex.kid, 'rgba(122,142,102,0.10)', 'var(--sage-deep)'],
            ['💆', '你會喘口氣', ex.mom, 'rgba(217,164,65,0.10)', 'var(--gold-deep)'],
            ['🌅', '你們一起', ex.together, 'rgba(74,124,168,0.10)', '#3a6a96'],
          ].filter(col => col[2] && col[2].length);
          if (!cols.length) return '';
          return `
          <section style="margin: 8px 0 4px; padding: 18px 20px; background: var(--paper); border: 1px solid var(--paper-edge); border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.04);">
            <div style="font-family: var(--f-hand-cn); font-size: 19px; font-weight: 700; color: var(--ink); margin-bottom: 14px;">✨ 這個夏天會這樣</div>
            ${scenesHtml}
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px;">
              ${cols.map(([emo, title, items, bg, clr]) => listCol(emo, title, (items || []).slice(0, 4), clr, bg)).join('')}
            </div>
          </section>`;
        })()}

        <details class="dossier-fold" style="margin-top: 8px;">
          <summary style="cursor: pointer; list-style: none; font-family: var(--f-hand-cn); font-size: 14px; color: var(--ink-soft); padding: 12px 16px; background: rgba(60,40,30,0.04); border: 1px dashed var(--paper-edge); border-radius: 8px; user-select: none;">📋 詳細資料 · 預算 · 飛行簽證 · 住宿 · 醫療 · 查證來源 —— 想認真比較某個地方再展開 ▾</summary>
        <div class="spread-body" style="margin-top: 18px;">

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
            ${(c.confidence?.discrepancies && c.confidence.discrepancies.length) ? `
              <div style="margin-top: 12px; padding: 10px 12px; border-left: 3px solid var(--coral-deep); background: rgba(197,107,90,0.07); border-radius: 4px;">
                <div style="font-family: var(--f-hand-cn); font-weight: 600; color: var(--coral-deep); margin-bottom: 6px;">🔍 查證差異（2026-05-31）· 報名前確認</div>
                ${c.confidence.verified_dates_2026 ? `<div style="font-size: 12px; margin-bottom: 3px;"><strong>實際日期：</strong>${escapeHtml(c.confidence.verified_dates_2026)}</div>` : ''}
                ${c.confidence.verified_cost ? `<div style="font-size: 12px; margin-bottom: 6px;"><strong>實際費用：</strong>${escapeHtml(c.confidence.verified_cost)}</div>` : ''}
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; color: var(--ink-soft);">
                  ${c.confidence.discrepancies.slice(0,5).map(d => `<li>${escapeHtml(d)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

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
                ${c.sources.map(s => cleanUrl(s)).filter(Boolean).map(u => `<li><a href="${escapeHtml(u)}" target="_blank" rel="noopener" style="color: var(--ink-soft);">${escapeHtml(u)}</a></li>`).join('')}
              </ul>
            ` : ''}

          </div>
        </div>
        </details>

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
