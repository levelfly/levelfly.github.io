// 光靈的窩 —— 晨風群島的收藏頁。
//
// 夜光島那一頁收的是「第幾隻光靈」；這裡收的是三件不一樣的東西：
//
//   配方圖鑑   她發現過的拆法。收集的不是角色，是**方法**。
//   光靈的窩   跟著她的光靈，花紋是她發現的拆法變出來的。
//   島嶼日記   走過的路，一頁一張圖，可以拿給爸媽看。
//
// 🔴 三條界線同時生效：
//   不比較、不排名、不做稀有壓迫 —— 沒收到的光靈**根本不顯示**，
//   沒發現的拆法也不畫成空格子。空格子會變成「我還缺幾個」，那是收集壓力不是好奇心。
//   最後一格永遠是一張虛線卡：「還有別的嗎？」—— 那是邀請，不是待辦事項。

import { app, hudMode, go, el, A, fs } from '../game.js';
import { drawSpirit, spiritById } from '../data/spirits.js';
import { diaryFigure } from '../art/diary.js';
import { SKY } from '../art/sky.js';
import { store } from '../core/store.js';
import { tappable } from '../core/pointer.js';
import { setAmbientMotes } from '../art/particles.js';

let root = null, backTo = 'skymap';

export const nest = {
  async enter({ from = null } = {}) {
    backTo = from && from !== 'nest' ? from : app.profile.mapScene;
    hudMode('lantern');
    setAmbientMotes(.35, SKY.gold);
    app.lumi.setLantern(0.6);

    root = document.createElement('div');
    root.className = 'nest';
    root.innerHTML = `
      <div class="nest-tabs">
        <button class="nest-tab on" data-tab="recipes">配方</button>
        <button class="nest-tab" data-tab="spirits">光靈</button>
        <button class="nest-tab" data-tab="diary">日記</button>
      </div>
      <div class="nest-body"></div>
      <button class="nest-close" aria-label="關起來">
        <svg viewBox="-50 -50 100 100" width="100%" height="100%">
          <path d="M-24,-24 L24,24 M24,-24 L-24,24" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>
        </svg>
      </button>`;
    app.layers.overlay.appendChild(root);
    requestAnimationFrame(() => root.classList.add('in'));

    root.querySelectorAll('.nest-tab').forEach(b => tappable(b, () => {
      root.querySelectorAll('.nest-tab').forEach(x => x.classList.toggle('on', x === b));
      A.pluck(660, { gain: .25, decay: .35 });
      show(b.dataset.tab);
    }));
    tappable(root.querySelector('.nest-close'), () => { A.whoosh({ up: false }); go(backTo); });

    show('recipes');
    A.say('sky_nest');
  },

  onResize() { /* 版面全靠 CSS，直橫向都是同一條規則 */ },

  exit() { root?.remove(); root = null; },
};

function show(tab) {
  const body = root.querySelector('.nest-body');
  body.innerHTML = '';
  body.dataset.tab = tab;
  ({ recipes, spirits, diary }[tab] || recipes)(body);
  body.scrollTop = 0;
}

/* ───────────────────────── 配方圖鑑 ───────────────────────── */

function recipes(body) {
  const all = store.recipes;
  const totals = Object.keys(all).map(Number).filter(n => all[String(n)]?.length).sort((a, b) => a - b);

  if (!totals.length) {
    body.appendChild(empty('把光分成幾群，這裡就會記下來'));
    return;
  }

  totals.forEach(total => {
    const row = document.createElement('div');
    row.className = 'rec-row';
    row.innerHTML = `<i class="rec-total">${total}</i>`;
    const list = document.createElement('div');
    list.className = 'rec-list';
    all[String(total)].forEach(sig => {
      const card = document.createElement('div');
      card.className = 'rec-card';
      sig.split('+').forEach((n, i) => {
        if (i) card.appendChild(Object.assign(document.createElement('em'), { textContent: '·' }));
        const grp = document.createElement('i');
        grp.className = 'rec-dots';
        grp.innerHTML = '<b></b>'.repeat(Math.min(20, Number(n)));
        card.appendChild(grp);
      });
      tappable(card, () => {
        card.classList.add('pop'); setTimeout(() => card.classList.remove('pop'), 400);
        A.pluck(523 + Number(sig.split('+')[0]) * 40, { gain: .28, decay: .5 });
      });
      list.appendChild(card);
    });
    // 邀請，不是待辦：最後一張虛線卡只是說「還有嗎？」
    const more = document.createElement('div');
    more.className = 'rec-card rec-more';
    more.textContent = '還有嗎？';
    list.appendChild(more);
    row.appendChild(list);
    body.appendChild(row);
  });
}

/* ───────────────────────── 光靈的窩 ───────────────────────── */

function spirits(body) {
  const owned = Object.keys(store.spirits);
  if (!owned.length) {
    body.appendChild(empty('路上遇到的光靈會住在這裡'));
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'sp-grid';
  owned.forEach(id => {
    const s = spiritById(id);
    if (!s) return;
    const cell = document.createElement('div');
    cell.className = 'sp-cell';
    const svg = el('svg', { viewBox: '-110 -110 220 220', width: '100%', height: '100%' });
    svg.appendChild(drawSpirit(s, { pat: store.spirits[id]?.pat || 0 }));
    cell.appendChild(svg);
    const cap = document.createElement('span');
    cap.textContent = s.name;
    cell.appendChild(cap);
    tappable(cell, () => {
      cell.classList.add('pop'); setTimeout(() => cell.classList.remove('pop'), 500);
      A.pluck(700 + Math.random() * 320, { gain: .3, decay: .5 });
      A.say('giggle');
      note(cell, s.note);
    });
    grid.appendChild(cell);
  });
  body.appendChild(grid);
}

function note(cell, text) {
  cell.querySelector('.sp-note')?.remove();
  const n = document.createElement('div');
  n.className = 'sp-note';
  n.textContent = text;
  cell.appendChild(n);
  requestAnimationFrame(() => n.classList.add('in'));
  setTimeout(() => n.remove(), 2600);
}

/* ───────────────────────── 島嶼日記 ───────────────────────── */

function diary(body) {
  const pages = store.diary;
  if (!pages.length) {
    body.appendChild(empty('走完一趟，這裡就會多一頁'));
    return;
  }
  pages.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'diary-card';
    card.appendChild(diaryFigure(p, { title: i === 0 ? '最近的一趟' : '' }));
    body.appendChild(card);
  });
}

function empty(text) {
  const d = document.createElement('div');
  d.className = 'nest-empty';
  d.innerHTML = `<svg viewBox="-60 -60 120 120" width="${Math.round(fs(.26))}" height="${Math.round(fs(.26))}">
      <circle cx="0" cy="0" r="34" fill="${SKY.gold}" opacity=".3"/>
      <circle cx="0" cy="0" r="18" fill="#FFFDF4" opacity=".8"/>
    </svg><p>${text}</p>`;
  return d;
}
