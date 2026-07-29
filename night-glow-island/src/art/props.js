// 可以被戳的東西。
//
// 每一顆都有重量：按下去會被壓扁一點、放開會彈回來、被選中會綻放、選錯會害羞地縮起來。
// 所有物件共用同一組彈簧，所以整個世界的手感是一致的。

import { el, blob, PAL } from './paper.js';
import { makeGlyph } from './glyphs.js';
import { Spring, FEEL } from '../core/spring.js';
import { onTick } from '../core/ticker.js';
import { tappable, buzz } from '../core/pointer.js';
import { rng } from '../core/rng.js';

export class Prop {
  constructor(layer, { x = 0, y = 0, size = 90, drift = 1, seed = Math.random() } = {}) {
    this.node = document.createElement('div');
    this.node.className = 'prop';
    this.node.style.cssText = `position:absolute;left:0;top:0;width:${size}px;height:${size}px;margin-left:${-size / 2}px;margin-top:${-size / 2}px;will-change:transform`;
    layer.appendChild(this.node);

    this.svg = el('svg', { viewBox: '-100 -100 200 200', width: size, height: size, style: 'overflow:visible' }, this.node);
    this.art = el('g', {}, this.svg);

    this.x = x; this.y = y; this.size = size;
    this.ph = seed * 6.28; this.drift = drift;
    this.sc = new Spring(0, FEEL.bouncy);
    this.rot = new Spring(0, { stiffness: 150, damping: 11 });
    this.lift = new Spring(0, FEEL.bouncy);
    this.glow = new Spring(0, FEEL.soft);
    this.alive = true; this.t = 0;

    this.off = onTick((dt) => this.tick(dt));
  }

  /** 讓它可以被戳；handler 收到 (prop) */
  interactive(onTap) {
    this.node.style.cursor = 'pointer';
    tappable(this.node, () => { if (this.alive) onTap?.(this); }, {
      onPress: () => { this.sc.to(this.baseScale * 0.86); this.lift.to(-0.25); buzz(8); },
      onRelease: () => { this.sc.to(this.baseScale); this.lift.to(0); },
    });
    return this;
  }
  lock(v = true) {
    this.node.dataset.locked = v ? '1' : '0';
    this.node.classList.toggle('locked', v);
  }
  /** 解鎖時的小彈跳，讓小朋友知道「現在可以按了」 */
  bounce() {
    this.sc.set(this.baseScale * 0.82).to(this.baseScale);
    this.rot.kick((Math.random() - .5) * 10);
  }

  setPos(x, y) { this.x = x; this.y = y; return this; }

  baseScale = 1;

  appear(delay = 0) {
    this.sc.set(0);
    setTimeout(() => { this.sc.to(this.baseScale); this.rot.kick((Math.random() - .5) * 6); }, delay * 1000);
    return this;
  }
  /** 被選中：往上彈、放大、發光 */
  celebrate() {
    this.sc.set(this.baseScale * 1.34).to(this.baseScale * 1.12);
    this.lift.kick(-3.4); this.glow.to(1);
    this.rot.kick((Math.random() - .5) * 10);
  }
  /** 選錯：縮一下、左右搖頭，但不消失、不變紅 */
  shy() {
    this.sc.set(this.baseScale * .82).to(this.baseScale);
    this.rot.kick(9); setTimeout(() => this.rot.kick(-14), 90); setTimeout(() => this.rot.kick(9), 180);
  }
  /** 提示：套一圈會呼吸的環。用環不用發光，因為「亮起來」在這個遊戲裡有別的意思。 */
  hint(on = true) {
    if (on && !this._ring) {
      this._ring = el('circle', {
        cx: 0, cy: 0, r: 86, fill: 'none', stroke: PAL.cream,
        'stroke-width': 2.6, opacity: .0, 'stroke-dasharray': '10 20', 'stroke-linecap': 'round',
      }, this.art);
      this._ringT = -Math.random() * 1.9;   // 每顆錯開，畫面才不會一起閃
    }
    if (!on && this._ring) { this._ring.remove(); this._ring = null; }
    this.node.classList.toggle('hinting', false);
  }
  vanish(delay = 0) {
    setTimeout(() => { this.sc.to(0); this.alive = false; setTimeout(() => this.destroy(), 700); }, delay * 1000);
  }
  destroy() { this.off?.(); this.node.remove(); this.alive = false; }

  tick(dt) {
    this.t += dt;
    this.sc.step(dt); this.rot.step(dt); this.lift.step(dt); this.glow.step(dt);
    const bob = Math.sin(this.t * 1.25 + this.ph) * 5 * this.drift;
    const sway = Math.sin(this.t * .82 + this.ph * 1.7) * 3.4 * this.drift;
    this.node.style.transform =
      `translate3d(${(this.x + sway).toFixed(2)}px,${(this.y + bob + this.lift.value * 14).toFixed(2)}px,0)` +
      ` rotate(${(this.rot.value + Math.sin(this.t * .7 + this.ph) * 2.2 * this.drift).toFixed(2)}deg)` +
      ` scale(${Math.max(0, this.sc.value).toFixed(3)})`;
    // 只有在真的在變的時候才寫 SVG 屬性：每幀寫一次會讓整顆 prop 連同它的濾鏡重畫
    if (this.halo && !this.glow.settled) {
      this.halo.setAttribute('opacity', (0.30 + this.glow.value * 0.7).toFixed(2));
    }
    if (this._ring) {
      this._ringT += dt;
      const k = ((this._ringT % 2.6) + 2.6) % 2.6 / 2.6;
      this._ring.setAttribute('r', (74 + k * 30).toFixed(1));
      this._ring.setAttribute('opacity', (Math.max(0, Math.sin(k * Math.PI)) * .40).toFixed(3));
      this._ring.setAttribute('transform', `rotate(${(this._ringT * 26).toFixed(1)})`);
    }
  }
}

/* ───────── 各地點的造型 ───────── */

const R = rng;

/** 螢火蟲：小小的身體 + 兩片薄翅 + 屁股的光 */
export function drawFirefly(p, { hue = PAL.honey } = {}) {
  const g = p.art;
  p.halo = el('circle', { cx: 0, cy: 22, r: 72, fill: 'url(#g-warm)', opacity: .55, style: 'mix-blend-mode:screen' }, g);
  const wings = el('g', {}, g);
  el('ellipse', { cx: -30, cy: -14, rx: 30, ry: 17, fill: '#EAFBF4', opacity: .5, transform: 'rotate(-24,-30,-14)' }, wings);
  el('ellipse', { cx: 30, cy: -14, rx: 30, ry: 17, fill: '#EAFBF4', opacity: .5, transform: 'rotate(24,30,-14)' }, wings);
  el('path', { d: 'M-9,-32 C-16,-46 -21,-51 -26,-54 M9,-32 C16,-46 21,-51 26,-54', stroke: '#6B5B3E', 'stroke-width': 3.4, fill: 'none', 'stroke-linecap': 'round' }, g);
  el('circle', { cx: -26, cy: -54, r: 4.6, fill: PAL.honey, opacity: .9 }, g);
  el('circle', { cx: 26, cy: -54, r: 4.6, fill: PAL.honey, opacity: .9 }, g);
  el('path', { d: blob(0, 2, 27, { n: 9, wob: .12, squash: 1.25, rnd: R }), fill: '#6B5B3E', filter: 'url(#torn-s)' }, g);
  el('path', { d: blob(-3, -4, 20, { n: 8, wob: .16, squash: 1.1, rnd: R }), fill: '#8C7750', opacity: .8 }, g);
  el('circle', { cx: 0, cy: -20, r: 14, fill: '#4A3F2C' }, g);
  el('circle', { cx: -5.5, cy: -23, r: 4.4, fill: PAL.cream, opacity: .95 }, g);
  el('circle', { cx: 4.5, cy: -18, r: 2.2, fill: PAL.cream, opacity: .6 }, g);
  el('circle', { cx: 0, cy: 24, r: 19, fill: hue, filter: 'url(#glow-m)' }, g);
  el('circle', { cx: 0, cy: 24, r: 9, fill: '#FFFDF4', opacity: .9 }, g);
  let wt = 0;
  p.extra = dt => { wt += dt; wings.setAttribute('transform', `scale(${(1 + Math.sin(wt * 15) * .16).toFixed(3)},1)`); };
  const base = p.tick.bind(p);
  p.tick = dt => { base(dt); p.extra?.(dt); };
  return p;
}

/** 貝殼：扇形，可以打開 */
export function drawShell(p, { col = '#E8C89A' } = {}) {
  const g = p.art;
  // 扇貝：鉸鏈在上、扇面朝下張開，寬的那一半才放得下數字
  const D = 'M0,-50 L-58,16 A58,54 0 0 0 58,16 Z';
  p.halo = el('circle', { cx: 0, cy: 0, r: 78, fill: 'url(#g-warm)', opacity: .3, style: 'mix-blend-mode:screen' }, g);
  el('path', { d: D, fill: '#7A6248', opacity: .6, transform: 'translate(0,6)', filter: 'url(#torn-s)' }, g);
  el('path', { d: D, fill: col, filter: 'url(#torn-s)' }, g);
  for (let i = -3; i <= 3; i++) {
    el('path', { d: `M0,-46 L${i * 18},22`, stroke: '#B99A6E', 'stroke-width': 3.4, 'stroke-linecap': 'round', opacity: .7 }, g);
  }
  el('path', { d: D, fill: 'none', stroke: '#FFF3D6', 'stroke-width': 3, opacity: .45, filter: 'url(#torn-s)' }, g);
  el('ellipse', { cx: 0, cy: -50, rx: 17, ry: 8, fill: '#B99A6E', filter: 'url(#torn-s)' }, g);
  return p;
}

/** 果實：圓潤、有葉子、水彩暈染 */
export function drawBerry(p, { col = PAL.coral } = {}) {
  const g = p.art;
  p.halo = el('circle', { cx: 0, cy: 6, r: 66, fill: 'url(#g-coral)', opacity: .3, style: 'mix-blend-mode:screen' }, g);
  el('path', { d: 'M4,-42 C4,-58 -10,-66 -22,-66 C-12,-52 -8,-46 2,-40 Z', fill: '#2E5C3E', filter: 'url(#torn-s)' }, g);
  el('path', { d: 'M0,-44 C0,-56 6,-62 12,-64', stroke: '#3E6B48', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, g);
  const d = blob(0, 6, 44, { n: 10, wob: .1, squash: 1.04, rnd: R });
  el('path', { d, fill: '#5A2A2E', opacity: .55, transform: 'translate(0,6)', filter: 'url(#torn-s)' }, g);
  el('path', { d, fill: col, filter: 'url(#wash)' }, g);
  el('ellipse', { cx: -14, cy: -10, rx: 15, ry: 11, fill: '#FFF3D6', opacity: .5, transform: 'rotate(-28,-14,-10)' }, g);
  el('circle', { cx: 8, cy: 22, r: 9, fill: PAL.honey, opacity: .35, filter: 'url(#glow-s)' }, g);
  return p;
}

/** 星星：五角剪紙，中心有核 */
export function drawStar(p, { col = PAL.honey } = {}) {
  const g = p.art;
  p.halo = el('circle', { cx: 0, cy: 0, r: 82, fill: 'url(#g-warm)', opacity: .35, style: 'mix-blend-mode:screen' }, g);
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? 24 : 58;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  const d = `M${pts.join(' L')} Z`;
  el('path', { d, fill: '#6B5326', opacity: .5, transform: 'translate(0,5)', filter: 'url(#torn-s)' }, g);
  el('path', { d, fill: col, filter: 'url(#torn-s)' }, g);
  el('path', { d, fill: '#FFF7E2', opacity: .45, transform: 'translate(-3,-4) scale(.86)', filter: 'url(#torn-s)' }, g);
  el('circle', { cx: 0, cy: 0, r: 13, fill: '#FFFDF4', filter: 'url(#glow-s)' }, g);
  return p;
}

/** 泡泡：半透明、有反光，裡面可以裝東西 */
export function drawBubble(p, { tint = PAL.mint } = {}) {
  const g = p.art;
  p.halo = el('circle', { cx: 0, cy: 0, r: 78, fill: 'url(#g-mint)', opacity: .22, style: 'mix-blend-mode:screen' }, g);
  el('circle', { cx: 0, cy: 0, r: 60, fill: tint, opacity: .10 }, g);
  el('circle', { cx: 0, cy: 0, r: 60, fill: 'none', stroke: '#DFFBF1', 'stroke-width': 2.6, opacity: .55 }, g);
  el('ellipse', { cx: -22, cy: -26, rx: 16, ry: 11, fill: '#FFFFFF', opacity: .45, transform: 'rotate(-30,-22,-26)' }, g);
  el('circle', { cx: 24, cy: 22, r: 5, fill: '#FFFFFF', opacity: .3 }, g);
  return p;
}

/** 提燈（沼澤的數字容器） */
export function drawLanternBody(p) {
  const g = p.art;
  p.halo = el('circle', { cx: 0, cy: 4, r: 84, fill: 'url(#g-warm)', opacity: .32, style: 'mix-blend-mode:screen' }, g);
  el('path', { d: 'M0,-72 C-6,-62 -6,-58 0,-52', stroke: '#C9A26A', 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }, g);
  el('path', { d: 'M-46,-52 h92 l10,14 h-112 z', fill: '#C9A26A', filter: 'url(#torn-s)' }, g);
  el('path', { d: 'M-40,-38 h80 v72 a40 34 0 0 1 -80 0 z', fill: '#0F1A33', opacity: .82, filter: 'url(#torn-s)' }, g);
  el('path', { d: 'M-40,-38 h80 v72 a40 34 0 0 1 -80 0 z', fill: 'none', stroke: '#E6C894', 'stroke-width': 4, 'stroke-linejoin': 'round', filter: 'url(#torn-s)' }, g);
  el('path', { d: 'M-44,66 h88', stroke: '#C9A26A', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
  return p;
}

/* ───────── 組合件：數字牌 ───────── */

const HOLDER = {
  lantern: drawLanternBody,
  shell:   p => { const g = el('g', { transform: 'translate(0,-4) scale(1.26)' }, p.art); const sub = { art: g }; drawShell(sub, { col: '#EBD3AC' }); p.halo = sub.halo; return p; },
  star:    p => { const g = el('g', { transform: 'scale(1.2)' }, p.art); const sub = { art: g }; drawStar(sub, { col: '#F6D98E' }); p.halo = sub.halo; return p; },
  bubble:  p => drawBubble(p),
  leaf:    p => {
    const g = el('g', { transform: 'rotate(-8)' }, p.art);
    p.halo = el('circle', { cx: 0, cy: 0, r: 84, fill: 'url(#g-mint)', opacity: .26, style: 'mix-blend-mode:screen' }, g);
    // 一片有尖頭與中脈的葉子，不是一團綠色
    const D = 'M0,-84 C46,-52 76,-14 74,22 C72,60 38,80 0,80 C-38,80 -72,60 -74,22 C-76,-14 -46,-52 0,-84 Z';
    el('path', { d: D, fill: '#0B2418', opacity: .85, transform: 'translate(0,7)', filter: 'url(#torn-m)' }, g);
    el('path', { d: D, fill: '#1E5138', filter: 'url(#torn-m)' }, g);
    el('path', { d: D, fill: '#2C6E48', opacity: .55, transform: 'translate(-4,-6) scale(.9)', filter: 'url(#torn-m)' }, g);
    el('path', { d: 'M0,-80 L0,76', stroke: '#0E3020', 'stroke-width': 4, opacity: .55, 'stroke-linecap': 'round' }, g);
    [[-52, -22], [-58, 16], [-46, 46]].forEach(([x, y], i) => {
      el('path', { d: `M0,${y - 26} Q${x * .55},${y - 12} ${x},${y}`, stroke: '#0E3020', 'stroke-width': 2.8, fill: 'none', opacity: .45 }, g);
      el('path', { d: `M0,${y - 26} Q${-x * .55},${y - 12} ${-x},${y}`, stroke: '#0E3020', 'stroke-width': 2.8, fill: 'none', opacity: .45 }, g);
    });
    return p;
  },
};

/**
 * 一個「裝著數字的東西」。容器造型隨地點變，玩法一樣但感覺完全不同。
 *
 * 不管容器是什麼顏色，數字底下都墊一塊夜色的板子——因為數字是這個遊戲要教的東西，
 * 它的對比度不能交給運氣。
 */
const PLATE = { lantern: null, shell: [0, 8, 37], star: [0, 0, 40], leaf: [0, 2, 42], bubble: [0, 0, 46] };

export function makeNumberToken(layer, n, { holder = 'lantern', size = 130, x = 0, y = 0, seed } = {}) {
  const p = new Prop(layer, { x, y, size, drift: .7, seed });
  (HOLDER[holder] || HOLDER.lantern)(p);

  const plate = PLATE[holder];
  if (plate) {
    const [px, py, pr] = plate;
    el('path', { d: blob(px, py, pr, { n: 11, wob: .07, rnd: R }), fill: '#111A31', opacity: .92, filter: 'url(#torn-s)' }, p.art);
    el('path', { d: blob(px, py, pr, { n: 11, wob: .07, rnd: R }), fill: 'none', stroke: '#E6C894', 'stroke-width': 2.6, opacity: .45, filter: 'url(#torn-s)' }, p.art);
  }

  const gl = makeGlyph(n, { color: '#FFF3D0', ink: '#0A0F1E', width: 17, glow: 'glow-m' });
  gl.setAttribute('transform', `translate(${plate ? plate[0] : 0},${holder === 'lantern' ? 10 : (plate ? plate[1] : 4)}) scale(0.62)`);
  p.art.appendChild(gl);
  p.value = n;
  p.node.dataset.value = n;
  return p;
}

/** 一群「要被數的東西」 */
export function makeCountable(layer, kind, { size = 96, x = 0, y = 0, seed } = {}) {
  const p = new Prop(layer, { x, y, size, drift: 1.15, seed });
  ({ firefly: drawFirefly, shell: drawShell, berry: drawBerry, star: drawStar }[kind] || drawFirefly)(p);
  p.kind = kind;
  p.glow.set(-0.15);      // 還沒被數到的東西亮度低一點，數過就整個亮起來
  return p;
}

/* ───────── 數量牌（聽數字 → 選出「那麼多」的一群） ───────── */

// 排法刻意用骰子式的規則圖形：小朋友可以「一眼看出來」而不必一個一個數，
// 這是 subitizing，比死數更早發展、也更接近真正的數感。
const DOTS = {
  1: [[0, 0]],
  2: [[-30, 0], [30, 0]],
  3: [[-34, 22], [0, -22], [34, 22]],
  4: [[-28, -26], [28, -26], [-28, 26], [28, 26]],
  5: [[-30, -28], [30, -28], [0, 0], [-30, 28], [30, 28]],
  6: [[-30, -34], [30, -34], [-30, 0], [30, 0], [-30, 34], [30, 34]],
  7: [[-32, -36], [32, -36], [-32, 0], [0, 0], [32, 0], [-32, 36], [32, 36]],
  8: [[-30, -42], [30, -42], [-30, -14], [30, -14], [-30, 14], [30, 14], [-30, 42], [30, 42]],
  9: [[-36, -36], [0, -36], [36, -36], [-36, 0], [0, 0], [36, 0], [-36, 36], [0, 36], [36, 36]],
  10: [[-34, -46], [34, -46], [-34, -20], [34, -20], [-34, 6], [34, 6], [-34, 32], [34, 32], [-34, 58], [34, 58]],
};

function miniMotif(g, kind, x, y, r, tint) {
  if (kind === 'shell') {
    el('path', { d: `M${x},${y + r} L${x - r},${y - r * .3} A${r},${r} 0 0 1 ${x + r},${y - r * .3} Z`, fill: '#EBD3AC', filter: 'url(#torn-s)' }, g);
    el('circle', { cx: x, cy: y, r: r * 1.5, fill: 'url(#g-warm)', opacity: .25, style: 'mix-blend-mode:screen' }, g);
  } else if (kind === 'berry') {
    el('circle', { cx: x, cy: y, r, fill: PAL.coral, filter: 'url(#wash)' }, g);
    el('circle', { cx: x - r * .3, cy: y - r * .3, r: r * .3, fill: '#FFF3D6', opacity: .6 }, g);
  } else if (kind === 'star') {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * .42 : r;
      pts.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
    }
    el('path', { d: `M${pts.join(' L')} Z`, fill: tint || PAL.honey, filter: 'url(#torn-s)' }, g);
  } else {
    el('circle', { cx: x, cy: y, r: r * 1.8, fill: 'url(#g-warm)', opacity: .45, style: 'mix-blend-mode:screen' }, g);
    el('circle', { cx: x, cy: y, r, fill: tint || PAL.honey, filter: 'url(#glow-s)' }, g);
    el('circle', { cx: x - r * .25, cy: y - r * .3, r: r * .3, fill: '#FFFDF4', opacity: .8 }, g);
  }
}

/** 一片浮葉上放著 n 個東西 */
export function makeQuantityToken(layer, n, motif, { size = 140, x = 0, y = 0, seed, tint } = {}) {
  const p = new Prop(layer, { x, y, size, drift: .8, seed });
  const g = p.art;
  p.halo = el('circle', { cx: 0, cy: 0, r: 92, fill: 'url(#g-mint)', opacity: .2, style: 'mix-blend-mode:screen' }, g);
  const d = blob(0, 6, 78, { n: 11, wob: .12, squash: .96, rnd: R });
  el('path', { d, fill: '#08201C', opacity: .8, transform: 'translate(0,7)', filter: 'url(#torn-m)' }, g);
  el('path', { d, fill: '#123528', filter: 'url(#torn-m)' }, g);
  el('path', { d, fill: '#1C4A38', opacity: .8, transform: 'scale(.92)', filter: 'url(#torn-m)' }, g);
  const inner = el('g', {}, g);
  const layout = DOTS[n] || DOTS[10];
  const r = n <= 4 ? 15 : n <= 6 ? 13 : 11;
  layout.forEach(([dx, dy]) => miniMotif(inner, motif, dx * .82, dy * .78, r, tint));
  p.value = n;
  p.node.dataset.value = n;
  return p;
}
