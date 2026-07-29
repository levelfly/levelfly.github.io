// 燈籠裡面 —— 收藏。
//
// 12 隻光靈，一輪最多帶回 5 隻，所以想看齊全部得再玩幾次。
// 每一隻戳下去會發出一個音；順著戳過去就是一段五聲音階的小旋律，
// 這裡沒有任何任務，就是一個可以玩的盒子。

import { app, hudMode, go, fx, fy, fs, el, PAL, A, drawGlowbug, GLOWBUGS, setScenery } from '../game.js';
import { Prop } from '../art/props.js';
import { store } from '../core/store.js';
import { burst, setAmbientMotes } from '../art/particles.js';
import { tappable } from '../core/pointer.js';

let items = [], back = null, fromScene = 'map', tapSeq = [];

const NOTES = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7];

export const lantern = {
  async enter({ from = 'map' } = {}) {
    fromScene = from === 'lantern' ? 'map' : from;
    setScenery('title');
    setAmbientMotes(1.1, '#FFE3A3');
    hudMode('lantern');

    // 暖光內壁
    const warm = document.createElement('div');
    warm.className = 'lantern-room';
    app.layers.scene.appendChild(warm);
    const glass = document.createElement('div');
    glass.className = 'lantern-glass';
    app.layers.scene.appendChild(glass);
    requestAnimationFrame(() => warm.classList.add('in'));

    items = [];
    tapSeq = [];
    const cols = app.layers.stage.clientWidth >= app.layers.stage.clientHeight ? 6 : 3;
    const rows = Math.ceil(GLOWBUGS.length / cols);
    const size = Math.min(fs(.32), (stage_w() * .86) / cols, (stage_h() * .74) / rows);

    GLOWBUGS.forEach((bug, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const gx = fx(.5) + (c - (cols - 1) / 2) * size * 1.12;
      const gy = fy(.50) + (r - (rows - 1) / 2) * size * 1.12;
      const have = store.hasBug(bug.id);
      const goldenHave = store.hasGoldenBug(bug.id);
      const platinumHave = store.hasPlatinumBug(bug.id);
      const owned = have || goldenHave || platinumHave;
      const variant = platinumHave ? 'platinum' : goldenHave ? 'golden' : 'normal';
      const p = new Prop(app.layers.scene, { x: gx, y: gy, size, drift: owned ? .9 : .25 });

      if (owned) {
        p.art.appendChild(drawGlowbug(bug, { variant, seed: 5 + i }));
        const cnt = store.bugs[bug.id] || 0;
        const gCnt = store.goldenBugs[bug.id] || 0;
        const pCnt = store.platinumBugs[bug.id] || 0;
        if (pCnt > 0 || gCnt > 0 || cnt > 1) {
          const badge = el('g', { transform: 'translate(46,46)' }, p.art);
          el('circle', { r: 20, fill: '#0F1A33', opacity: .85 }, badge);
          const badgeCol = platinumHave ? '#E6E6FF' : goldenHave ? '#FFD873' : PAL.honey;
          const badgeText = pCnt > 0 ? '✦' : gCnt > 0 ? '★' : '×' + cnt;
          el('circle', { r: 20, fill: 'none', stroke: badgeCol, 'stroke-width': 2.6, opacity: .7 }, badge);
          el('text', {
            text: badgeText, y: 7, 'text-anchor': 'middle',
            fill: badgeCol, 'font-size': 18, 'font-family': 'inherit', 'font-weight': 700,
          }, badge);
        }
        p.interactive(() => {
          p.celebrate();
          A.pluck(NOTES[i], { gain: .45, decay: 1.1 });
          const b = p.node.getBoundingClientRect();
          const burstCol = platinumHave ? '#E6E6FF' : goldenHave ? '#FFD873' : bug.body;
          burst(b.left + b.width / 2, b.top + b.height / 2, { count: 10, col: burstCol, power: .6 });
          noteSeq(i);
        });
      } else {
        // 還沒收到的：一個空著的位子，只看得到一團睡著的影子
        el('circle', { cx: 0, cy: 0, r: 60, fill: '#2A1B08', opacity: .30 }, p.art);
        const sil = drawGlowbug(bug, { seed: 5 + i });
        sil.setAttribute('opacity', '.20');
        sil.style.filter = 'grayscale(1) brightness(.30)';
        p.art.appendChild(sil);
        el('circle', {
          cx: 0, cy: 0, r: 62, fill: 'none', stroke: PAL.honey, 'stroke-width': 2.4,
          opacity: .22, 'stroke-dasharray': '9 13',
        }, p.art);
        p.interactive(() => { p.shy(); A.thud({ gain: .18 }); });
      }
      p.appear(0.05 + i * 0.035);
      items.push(p);
    });

    // 回去
    back = document.createElement('button');
    back.className = 'lantern-back';
    back.setAttribute('aria-label', '回去');
    back.innerHTML = `<svg viewBox="-30 -30 60 60" width="100%" height="100%">
      <path d="M10,-20 L-12,0 L10,20" fill="none" stroke="#FFE3A3" stroke-width="7"
            stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    tappable(back, () => { A.whoosh({ up: false, gain: .25 }); go(fromScene, {}); });
    app.layers.overlay.appendChild(back);

    A.say('lantern');
  },

  exit() {
    items.forEach(p => p.destroy()); items = [];
    back?.remove(); back = null;
    document.querySelector('.lantern-room')?.remove();
    document.querySelector('.lantern-glass')?.remove();
  },
};

const stage_w = () => app.layers.stage.clientWidth;
const stage_h = () => app.layers.stage.clientHeight;

/** ✨ 秘密三：從左到右按順序戳過所有收到的光靈 → 一段完整的旋律 */
function noteSeq(i) {
  tapSeq.push(i);
  if (tapSeq.length > 12) tapSeq.shift();
  const owned = GLOWBUGS.map((b, k) => (store.hasBug(b.id) || store.hasGoldenBug(b.id) || store.hasPlatinumBug(b.id) ? k : -1)).filter(k => k >= 0);
  if (owned.length < 4) return;
  const tail = tapSeq.slice(-owned.length);
  if (tail.length === owned.length && tail.every((v, k) => v === owned[k])) {
    tapSeq = [];
    const first = store.unlock('song');
    owned.forEach((k, n) => setTimeout(() => A.chime(NOTES[k] * 2, { gain: .3, decay: 1.4, pan: (n / owned.length) * 1.6 - .8 }), n * 130));
    setTimeout(() => {
      items.forEach((p, n) => setTimeout(() => { if (store.hasBug(GLOWBUGS[n].id) || store.hasGoldenBug(GLOWBUGS[n].id) || store.hasPlatinumBug(GLOWBUGS[n].id)) p.celebrate(); }, n * 60));
      const b = app.layers.stage.getBoundingClientRect();
      burst(b.width / 2, b.height / 2, { count: 44, col: PAL.honey, col2: PAL.mint, power: 1.3 });
      if (first) A.say('giggle');
    }, owned.length * 130);
  }
}
