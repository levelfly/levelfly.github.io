// ============================================================
// 夏令營研究 — wizard (q0 心法 + q1-q5 既有 + q6 女兒視角) + radar chart
// ============================================================

const wizardState = {
  step: 0, // 0..6 questions, 7 = result
  answers: {}, // q0: 'daughter', q1: 'opt0', ...
  radarChart: null,
};

// ----------------- q0 + q6 動態 weight -----------------
// q0: 真心話：送女兒 vs 送自己
// 'daughter' / 'both' → 偏「適合 5-6 歲」高的候選 (Tier 1 + 結構化營隊)
// 'mom' / 'unsure'    → 偏「me-time / 媽媽課程多」候選
const KID_FRIENDLY_IDS = new Set([
  'penang_tenby','singapore_bintan','kl_alice_smith','sydney','bali_ayana',
  'clubmed_bali','okinawa','phuket','ubud_green_school','movenpick_bali',
  'four_seasons_bali','chiang_mai_panyaden','six_senses_vn','phu_quoc_danang',
  'maldives','niseko'
]);
const ME_TIME_IDS = new Set([
  'penang_tenby','singapore_bintan','hong_kong_macau','vancouver','amsterdam',
  'tokyo','seoul_jeju','london_oxford','melbourne','dublin','malta',
  'san_diego','san_diego','goldcoast','gold_coast'
]);

// q6: 跟女兒看 3 候選短片，她最興奮哪個？
// match by c.city / c.country keyword 自動加權
function q6CityMatch(c, vibe) {
  const s = (c.city + ' ' + (c.country || '')).toLowerCase();
  if (vibe === 'beach') {
    return /penang|bali|bintan|phuket|maldives|cebu|hawaii|sydney|gold ?coast|brisbane|phu\s*quoc|da ?nang|沖繩|okinawa|峇里|普吉|宿霧|海島|塞班|沙灘/i.test(s);
  }
  if (vibe === 'city') {
    return /singapore|tokyo|london|oxford|amsterdam|dublin|malta|toronto|melbourne|hong ?kong|macau|san ?diego|kuala|seoul|kl |新加坡|東京|倫敦|阿姆斯特丹|多倫多|墨爾本|首爾|香港|澳門|吉隆坡|聖地牙哥/i.test(s);
  }
  if (vibe === 'forest') {
    return /vancouver|chiang ?mai|panyaden|ubud|green school|victoria|wellington|auckland|cape town|nature|溫哥華|清邁|烏布|綠校|威靈頓|奧克蘭|開普|森林|山林/i.test(s);
  }
  if (vibe === 'snow') {
    return /niseko|sapporo|hokkaido|london|oxford|sydney|melbourne|cape town|新雪谷|札幌|北海道|倫敦|雪|冬|cold|alps/i.test(s);
  }
  return false;
}

// Inject q0/q6 weights into existing W_WEIGHTS at runtime
(function injectQ0Q6Weights() {
  if (typeof W_WEIGHTS === 'undefined' || typeof CANDIDATES === 'undefined') return;
  // q0
  const q0w = { daughter: {}, mom: {}, both: {}, unsure: {} };
  CANDIDATES.forEach(c => {
    const kid = KID_FRIENDLY_IDS.has(c.id) ? 3 : 0;
    const me  = ME_TIME_IDS.has(c.id) ? 3 : 0;
    q0w.daughter[c.id] = kid;
    q0w.mom[c.id]      = me;
    q0w.both[c.id]     = Math.max(kid, me);
    q0w.unsure[c.id]   = me;  // 還不確定 → 偏 me-time（讓媽媽舒服優先）
  });
  W_WEIGHTS.q0 = q0w;

  // q6
  const q6w = { beach: {}, city: {}, forest: {}, snow: {} };
  CANDIDATES.forEach(c => {
    q6w.beach[c.id]  = q6CityMatch(c, 'beach')  ? 3 : 0;
    q6w.city[c.id]   = q6CityMatch(c, 'city')   ? 3 : 0;
    q6w.forest[c.id] = q6CityMatch(c, 'forest') ? 3 : 0;
    q6w.snow[c.id]   = q6CityMatch(c, 'snow')   ? 2 : 0;
  });
  W_WEIGHTS.q6 = q6w;

  // Inject q0 / q6 into WIZARD array (q0 at front, q6 at end)
  const Q0 = {
    id: 'q0',
    title: '真心話：你比較想送女兒去，還是送自己去？',
    sub: '兩個答案都對。先看清楚動機，後面 5 題的答案才不會自欺。',
    options: [
      { id: 'daughter', badge: 'A', label: '送女兒去（她想要這個體驗）' },
      { id: 'mom',      badge: 'B', label: '送自己去（我需要 me-time）' },
      { id: 'both',     badge: 'C', label: '兩個都想（誠實）' },
      { id: 'unsure',   badge: 'D', label: '還不確定（這就是我來這裡的原因）' },
    ],
  };
  const Q6 = {
    id: 'q6',
    title: '想像跟 5 歲女兒看 3 個候選的短片，她最興奮哪個？',
    sub: '不是你選，是她選。閉上眼想她看到畫面的反應。',
    options: [
      { id: 'beach',  badge: 'A', label: '海島 / 沙灘 / 浮潛' },
      { id: 'city',   badge: 'B', label: '城市 / 公園 / 博物館' },
      { id: 'forest', badge: 'C', label: '森林 / 山林 / 動物' },
      { id: 'snow',   badge: 'D', label: '雪山 / 冷涼 / 戶外' },
    ],
  };
  // Avoid double injection on hot reload
  if (!WIZARD.some(q => q.id === 'q0')) WIZARD.unshift(Q0);
  if (!WIZARD.some(q => q.id === 'q6')) WIZARD.push(Q6);
})();

function viewWizard() {
  if (wizardState.step >= WIZARD.length) return viewWizardResult();
  const q = WIZARD[wizardState.step];
  const stepIdx = wizardState.step;
  return `
    <div class="page">
      <h2 class="mag-h"><span class="em">決策</span>助手</h2>
      <p class="mag-eyebrow">5 questions · personalised top 3</p>
      <hr class="mag-rule">

      <div class="wizard-wrap">
        <div class="wizard-card">
          <div class="wizard-progress">
            ${WIZARD.map((_,i) => `<span class="${i <= stepIdx ? 'done' : ''}"></span>`).join('')}
          </div>
          <div class="wizard-q">question ${stepIdx + 1} of ${WIZARD.length}</div>
          <h3 class="wizard-h">${escapeHtml(q.title)}</h3>
          ${q.sub ? `<p class="muted" style="margin-top: 8px;">${escapeHtml(q.sub)}</p>` : ''}

          <div class="wizard-options">
            ${q.options.map(opt => `
              <button class="wizard-opt ${wizardState.answers[q.id] === opt.id ? 'selected' : ''}" data-wopt="${opt.id}">
                <span class="badge">${opt.badge}</span>
                <span>${escapeHtml(opt.label)}</span>
              </button>
            `).join('')}
          </div>

          <div class="wizard-nav">
            <button class="btn ghost" data-wprev ${stepIdx === 0 ? 'disabled style="visibility:hidden;"' : ''}>← 上一題</button>
            <div class="handnote-en" style="align-self: center;">${stepIdx + 1} / ${WIZARD.length}</div>
            <button class="btn primary" data-wnext ${!wizardState.answers[q.id] ? 'disabled style="opacity:.4; cursor:not-allowed;"' : ''}>${stepIdx === WIZARD.length - 1 ? '看結果 →' : '下一題 →'}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function computeScores() {
  const scores = {};
  CANDIDATES.forEach(c => scores[c.id] = 0);
  Object.entries(wizardState.answers).forEach(([qid, optId]) => {
    const w = W_WEIGHTS[qid]?.[optId] || {};
    Object.entries(w).forEach(([cid, val]) => scores[cid] = (scores[cid] || 0) + val);
  });
  return Object.entries(scores)
    .map(([cid, score]) => ({ cand: CANDIDATES.find(c => c.id === cid), score }))
    .filter(x => x.cand && x.cand.tier !== 0)
    .sort((a,b) => b.score - a.score);
}

function viewWizardResult() {
  const ranked = computeScores();
  const top = ranked.slice(0, 3);
  const maxScore = top[0]?.score || 1;
  return `
    <div class="page">
      <h2 class="mag-h"><span class="em">結果</span>出爐</h2>
      <p class="mag-eyebrow">based on your 5 answers</p>
      <hr class="mag-rule">

      <div class="wizard-result-grid">
        <div>
          <div class="hero-issue" style="margin-top:0;">your personalised top 3</div>
          <h3 class="wizard-result-h3">根據你的答案，最適合的三個候選 ✦</h3>

          <div class="result-stack">
            ${top.map((r, i) => `
              <div class="result-row">
                <span class="rank">${i+1}</span>
                <div>
                  <div class="name">${r.cand.flag} ${escapeHtml(r.cand.city)} <span class="country">— ${escapeHtml(r.cand.country)}</span></div>
                  <div class="result-hook">${escapeHtml(r.cand.hook)}</div>
                </div>
                <span class="pct">${Math.round(r.score / maxScore * 100)}<small style="font-size:14px;">%</small></span>
                <button class="btn" data-open="${r.cand.id}">看完整檔 →</button>
              </div>
            `).join('')}
          </div>

          <div class="wizard-ranked-block">
            <h4 class="wizard-ranked-h">完整排行（8 個候選）</h4>
            <div class="wizard-ranked-list">
              ${ranked.map((r,i) => `
                <div class="wizard-ranked-row">
                  <span class="rk ${i<3?'top':'rest'}">${i+1}</span>
                  <span class="nm"><strong>${escapeHtml(r.cand.city)}</strong> <span class="muted">${escapeHtml(r.cand.country)}</span></span>
                  <span class="bar"><i style="width:${r.score/maxScore*100}%;"></i></span>
                  <span class="scr">${r.score}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="flex wizard-result-actions">
            <button class="btn" data-wreset>↻ 重新作答</button>
            <button class="btn primary" data-add-top3>把 Top 3 加入比較</button>
            <button class="btn ghost" data-download-script>↓ 下載親子對話腳本</button>
          </div>

          ${renderNoGoCompareBlock()}

        </div>

        <div>
          <div id="radarBox">
            <div class="mag-eyebrow" style="margin-bottom: 4px;">8 dimensions · radar</div>
            <h4 class="radar-h">Top 3 雷達圖</h4>
            <div class="radar-wrap">
              <canvas id="radarCanvas"></canvas>
            </div>
            <p class="muted radar-cap">scores from /10 across 8 evaluation axes</p>
          </div>

          <div class="sticky sticky-mama">
            <strong class="sticky-h">媽媽備註</strong>
            分數差距 ≤ 5% 都算「平手」。看完三個完整檔再做決定。
          </div>
        </div>
      </div>
    </div>
  `;
}

function drawRadar() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas || typeof Chart === 'undefined') return;
  if (wizardState.radarChart) { wizardState.radarChart.destroy(); }
  const top = computeScores().slice(0, 3);
  const labels = Object.keys(top[0].cand.scores || {});
  const palette = ['#B6862C', '#5C7048', '#A04A3A'];
  const palBg   = ['rgba(217,164,65,0.18)', 'rgba(122,142,102,0.18)', 'rgba(197,107,90,0.18)'];

  wizardState.radarChart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels,
      datasets: top.map((t, i) => ({
        label: t.cand.city,
        data: labels.map(l => t.cand.scores[l] || 0),
        borderColor: palette[i],
        backgroundColor: palBg[i],
        borderWidth: 2,
        pointBackgroundColor: palette[i],
        pointBorderColor: '#fbf7ef',
        pointRadius: 3.5,
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: "'Noto Serif TC', serif", size: 13 },
            color: '#2A2218',
            padding: 12,
          }
        }
      },
      scales: {
        r: {
          min: 0, max: 10,
          ticks: { display: false, stepSize: 2 },
          grid: { color: 'rgba(155,126,104,0.25)' },
          angleLines: { color: 'rgba(155,126,104,0.35)' },
          pointLabels: {
            font: { family: "'Noto Serif TC', serif", size: 11 },
            color: '#4a3c2c',
          }
        }
      }
    }
  });
}

// --------- 不去也是選項：在台 vs 海外 4 維對照 + Q0 highlight ----------
function renderNoGoCompareBlock() {
  const q0 = wizardState.answers['q0'];
  const isUnsure = q0 === 'unsure';
  return `
    <section style="margin-top: 56px; padding: 24px 28px; background: rgba(60,40,30,0.04); border-left: 4px solid var(--brown);">
      <div class="mag-eyebrow" style="margin-bottom: 4px;">side B · the no-go option</div>
      <h4 style="font-family: var(--f-display); font-size: 26px; margin: 0 0 6px;">在台 21 天 vs 海外 21 天</h4>
      <p class="muted" style="margin-bottom: 18px; font-size: 13px;">把這選項從清單刪除前，先看一眼這張對照表。</p>
      ${isUnsure ? `
        <div class="sticky pink" style="margin-bottom: 18px;">
          <strong style="font-family: var(--f-display); font-size: 17px; display: block; margin-bottom: 4px;">你 q0 答「還不確定」</strong>
          <span style="font-family: var(--f-hand-cn);">這頁就是給你看的。不去也是答案，不必為了不浪費研究而硬出國。</span>
        </div>
      ` : ''}
      <table style="width:100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="border-bottom: 1.5px solid var(--ink);">
            <th style="text-align:left; padding: 8px 6px; font-family: var(--f-display); width: 26%;">維度</th>
            <th style="text-align:left; padding: 8px 6px; font-family: var(--f-display);">在台 21 天</th>
            <th style="text-align:left; padding: 8px 6px; font-family: var(--f-display);">海外 21 天</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px dashed var(--paper-edge);">
            <td style="padding: 8px 6px;"><strong>女兒英語幫助</strong></td>
            <td style="padding: 8px 6px;">補習班 21 天 × 2hr = 42 hr 暴露，老師多為台籍</td>
            <td style="padding: 8px 6px;">21 天 × 6hr = 126 hr immersion，native speaker，真實情境</td>
          </tr>
          <tr style="border-bottom: 1px dashed var(--paper-edge);">
            <td style="padding: 8px 6px;"><strong>媽媽 me-time</strong></td>
            <td style="padding: 8px 6px;">接送 + 家務循環 / 工作群可能 zoom in</td>
            <td style="padding: 8px 6px;">完全 reset / 8 類進修課可選 / spa / 跟自己對話</td>
          </tr>
          <tr style="border-bottom: 1px dashed var(--paper-edge);">
            <td style="padding: 8px 6px;"><strong>家庭財務</strong></td>
            <td style="padding: 8px 6px;">省 NT$25 萬 → 6% 年複利 5 年後 NT$33.5 萬</td>
            <td style="padding: 8px 6px;">花 NT$25 萬 → 5 年後女兒 10-11 歲，買不回這段</td>
          </tr>
          <tr>
            <td style="padding: 8px 6px;"><strong>5 年後回看</strong></td>
            <td style="padding: 8px 6px;">「我有省下 NT$25 萬」 → 女兒可能記不得</td>
            <td style="padding: 8px 6px;">「我帶她去過 ___」 → 有照片有故事</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 18px; font-family: var(--f-hand-cn); color: var(--coral-deep); font-size: 16px;">
        ✦ <strong>不去也是選項</strong>。沒有錯誤答案。建議做法：把這份手帳放一週不打開，一週後重看再決定。
      </p>
      <p style="margin-top: 6px; font-size: 13px;">
        <a href="#/library" style="color: var(--coral-deep); text-decoration: underline;">→ 完整章節「不出國的版本」</a>
      </p>
    </section>
  `;
}

function downloadKidScript() {
  const md = `# 跟 5 歲女兒談 camp 的 5 個問題\n\n> 不是要說服她，是要聽她。挑一個她心情好、肚子飽、沒事的晚上。\n\n## 1. 如果可以去一個地方住三個星期，你最想去哪裡？\n\n聆聽要點：\n- 不要急著糾正她的答案（「太遠了」「太貴了」之類）\n- 注意她有沒有提到「同學」「朋友」（暗示她在意社交）\n- 如果她說「我不知道」 → 給她看 3 張不同地方的照片，問「這三張選一張」\n\n## 2. 你想在那邊做什麼？\n\n聆聽要點：\n- 玩水 / 玩沙 / 看動物 / 上課 / 認識新朋友\n- 她說的「想做的事」會 reveal 她真正在乎的體驗類型\n\n## 3. 如果媽媽要去上課，你自己跟同學玩一整天，OK 嗎？\n\n聆聽要點：\n- 觀察她的猶豫程度（這是 21 天的真實情境）\n- 如果她說「我要媽媽陪」 → 重新評估全日 camp 適不適合\n- 如果她說「可以啊我跟同學玩」 → 適應力高\n\n## 4. 那邊沒有阿公阿嬤，你會想他們嗎？\n\n聆聽要點：\n- 不是要嚇她，是要 baseline 她的「思鄉」程度\n- 配套：每週固定一晚跟阿公阿嬤視訊\n\n## 5. 如果你不喜歡，可以告訴媽媽嗎？\n\n聆聽要點：\n- 建立「中途可以調整」的心理安全網\n- 提醒她：「我們是 team，你不舒服我們就換」\n\n---\n\n## 觀察她的 body language\n\n- 眼神發亮 → 真的想去\n- 應付式說「好」 → 為了討好你\n- 反覆問同一件事 → 焦慮，需要安撫\n- 主動問細節 → 內心已經在規劃了\n\n## 最後 — 你的觀察筆記\n\n日期：\n她說了哪些「真心話」：\n她最在意的點：\n媽媽的判斷：\n`;
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = '跟女兒談 camp 的 5 個問題.md';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

window.viewWizard = viewWizard;
window.wizardState = wizardState;
window.computeScores = computeScores;
window.drawRadar = drawRadar;
window.downloadKidScript = downloadKidScript;
