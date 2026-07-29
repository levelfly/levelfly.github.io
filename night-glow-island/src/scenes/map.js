// 島。
//
// 這張地圖不是背景圖 + 幾顆按鈕：整座島是在遊戲場（field）的座標系裡畫出來的，
// 所以五個地點永遠站在自己的地形上——沼澤有蘆葦、海灘有貝殼、樹林有果樹、
// 懸崖有岩柱、燈塔在最高處。暗的地方會呼吸，亮起來就再也不會滅。

import {
  app, setScenery, placeLumi, hudMode, go, fx, fy, fs, el, PAL, A, paperCard, refreshHud,
} from '../game.js';
import { AREAS } from '../data/world.js';
import { Prop } from '../art/props.js';
import { setAmbientMotes, burst } from '../art/particles.js';
import { onTick } from '../core/ticker.js';
import { lockTaps } from '../core/pointer.js';
import { stage } from '../core/stage.js';
import { blob } from '../art/paper.js';
import { makeRng } from '../core/rng.js';

let nodes = [], offs = [], islandSvg = null;

// 島的輪廓（遊戲場的比例座標），順時針
const SHORE = [
  [.10, .30], [.16, .12], [.34, .04], [.56, .015], [.76, .08],
  [.90, .24], [.955, .46], [.90, .68], [.76, .86], [.54, .945],
  [.30, .91], [.13, .75], [.055, .52],
];

export const map = {
  async enter({ first = false, justLit = null } = {}) {
    setScenery('map');
    setAmbientMotes(.5, '#6FE3C4');
    hudMode('map');
    placeLumi(stage.portrait ? { x: .14, y: 1.02, s: .66 } : { x: .09, y: 1.02, s: .60 });
    refreshHud();

    const lit = app.run.lit;
    app.lumi.setLantern(0.15 + lit.size * 0.17);

    drawIsland(lit);

    nodes = []; offs = [];
    const allBase = AREAS.filter(a => !a.final).every(a => lit.has(a.key));

    AREAS.forEach((area, i) => {
      const locked = area.final && !allBase;
      const isLit = lit.has(area.key);
      const n = makeNode(area, { locked, isLit });
      nodes.push(n);
      n.appear(0.14 + i * 0.08);
      if (!locked) {
        n.interactive(() => {
          lockTaps(1.0);
          A.whoosh({ gain: .3, dur: .5 });
          A.chime(660 + i * 90, { gain: .35 });
          n.celebrate();
          const b = n.node.getBoundingClientRect();
          burst(b.left + b.width / 2, b.top + b.height / 2, { count: 16, col: area.tint, power: .8 });
          setTimeout(() => go('level', { areaKey: area.key }), 620);
        });
      } else {
        n.interactive(() => { A.thud({ gain: .25 }); n.shy(); app.lumi.tilt(); });
      }
    });

    if (justLit) {
      const n = nodes.find(x => x.area.key === justLit);
      if (n) {
        n.celebrate();
        const b = n.node.getBoundingClientRect();
        burst(b.left + b.width / 2, b.top + b.height / 2, { count: 26, power: 1.1, col: n.area.tint });
      }
    }

    if (allBase && !lit.has('light')) {
      setTimeout(() => {
        paperCard(app.layers.overlay, `<div class="pc-line">燈塔醒過來了</div>`, { dur: 2.6 });
        A.chime(1318, { gain: .4, decay: 2.2 });
      }, 900);
    }

    setTimeout(() => A.say('pick_place'), first ? 700 : 500);

    if (AREAS.every(a => lit.has(a.key))) setTimeout(() => go('finale'), 1800);
  },

  onResize() { islandSvg?.remove(); drawIsland(app.run.lit); nodes.forEach(n => n.reposition?.()); },

  exit() {
    nodes.forEach(n => n.destroy()); nodes = [];
    offs.forEach(f => f()); offs = [];
    islandSvg?.remove(); islandSvg = null;
  },
};

/* ───────────────────────── 島本體 ───────────────────────── */

function drawIsland(lit) {
  const F = stage.field;
  const H = 1000 * F.h / Math.max(1, F.w);
  const X = f => f * 1000, Y = f => f * H;
  const R = makeRng(20260727);
  // 島的內部座標永遠是 1000 寬，但 H 會隨方向從 ~2100（直握）變到 ~330（橫握）。
  // 寫死的尺寸（草叢、小樹、地點裝飾）在橫握時會變成畫面高度的一大塊，
  // 所以全部乘上 k：一個跟著畫面比例收縮的尺寸係數。
  const k = Math.min(1, H * 1.45 / 1000);

  const svg = islandSvg = el('svg', {
    viewBox: `0 0 1000 ${H.toFixed(1)}`,
    style: `position:absolute;left:${F.x}px;top:${F.y}px;width:${F.w}px;height:${F.h}px;overflow:visible;pointer-events:none`,
  });
  app.layers.scene.appendChild(svg);

  const shore = SHORE.map(([a, b]) => [X(a), Y(b)]);
  const land = smoothClosed(shore);
  const inner = smoothClosed(shore.map(([x, y]) => [500 + (x - 500) * .965, Y(.5) + (y - Y(.5)) * .955]));
  const core = smoothClosed(shore.map(([x, y]) => [500 + (x - 500) * .70, Y(.46) + (y - Y(.46)) * .66]));

  // 沙灘 → 陸地 → 被月光打亮的高地，三層剪紙
  el('path', { d: land, fill: '#05080F', opacity: .55, transform: `translate(0,${14 * k})`, filter: 'url(#torn-l)' }, svg);
  el('path', { d: land, fill: '#3E3222', filter: 'url(#torn-l)' }, svg);
  el('path', { d: inner, fill: '#0E2A1F', filter: 'url(#torn-l)' }, svg);
  el('path', { d: core, fill: '#143726', opacity: .75, transform: `translate(${-10 * k},${-16 * k})`, filter: 'url(#torn-l)' }, svg);

  // 草皮質感：一大堆小草叢，讓地面不是一塊平的綠
  const tuft = el('g', { opacity: .85 }, svg);
  for (let i = 0; i < 150; i++) {
    const a = R() * 6.28, rr = Math.sqrt(R());
    const gx = 500 + Math.cos(a) * rr * 400, gy = Y(.5) + Math.sin(a) * rr * (H * .40);
    const s = (5 + R() * 7) * k;
    el('path', {
      d: `M${gx - s},${gy} q${s},${-s * 1.5} ${s * 2},0`,
      fill: 'none', stroke: R() < .3 ? '#38714C' : '#1B4530', 'stroke-width': 3.4 * k, 'stroke-linecap': 'round',
    }, tuft);
  }
  // 散落的小樹與石頭
  for (let i = 0; i < 16; i++) {
    const a = R() * 6.28, rr = .25 + R() * .62;
    const gx = 500 + Math.cos(a) * rr * 400, gy = Y(.5) + Math.sin(a) * rr * (H * .40);
    if (R() < .62) {
      el('path', { d: `M${gx - 5 * k},${gy} l${3 * k},${-24 * k} h${5 * k} l${3 * k},${24 * k} z`, fill: '#3A2B40', opacity: .9 }, svg);
      const cr = (22 + R() * 10) * k;
      el('path', { d: blob(gx, gy - 36 * k, cr, { n: 9, wob: .3, squash: .84, rnd: R }), fill: '#14402C', filter: 'url(#torn-s)' }, svg);
      el('path', { d: blob(gx - cr * .25, gy - 36 * k - cr * .3, cr * .55, { n: 8, wob: .34, squash: .8, rnd: R }), fill: '#225B3C', opacity: .8, filter: 'url(#torn-s)' }, svg);
    } else {
      el('path', { d: blob(gx, gy, (13 + R() * 10) * k, { n: 7, wob: .36, squash: .66, rnd: R }), fill: '#2E3760', opacity: .85, filter: 'url(#torn-s)' }, svg);
    }
  }
  // 岸邊的浪花
  el('path', {
    d: smoothClosed(shore.map(([x, y]) => [500 + (x - 500) * 1.06, Y(.5) + (y - Y(.5)) * 1.06])),
    fill: 'none', stroke: PAL.mint, 'stroke-width': 3 * k, opacity: .09,
    'stroke-dasharray': `${10 * k} ${26 * k}`, filter: 'url(#glow-s)',
  }, svg);

  // 走過的路：把五個地點串起來的小徑
  const order = ['cliff', 'light', 'grove', 'cove', 'marsh'];
  const pts = order.map(key => AREAS.find(a => a.key === key).lampAt).map(p => [X(p.x), Y(p.y)]);
  el('path', {
    d: smoothOpen(pts), fill: 'none', stroke: '#C7AE84', 'stroke-width': 9 * k,
    opacity: .22, 'stroke-linecap': 'round', 'stroke-dasharray': `${3 * k} ${22 * k}`, filter: 'url(#torn-s)',
  }, svg);

  // 地形細節：每個地點周圍撒一點屬於它的東西
  const decor = (x, y, fn) => { const g = el('g', { transform: `translate(${X(x)},${Y(y)}) scale(${k.toFixed(4)})` }, svg); fn(g); };

  decor(.21, .63, g => {           // 沼澤：水塘 + 蘆葦
    el('path', { d: blob(10, 46, 108, { n: 10, wob: .3, squash: .42, rnd: R }), fill: '#0C2A2E', opacity: .95, filter: 'url(#torn-m)' }, g);
    el('path', { d: blob(4, 42, 84, { n: 9, wob: .3, squash: .40, rnd: R }), fill: '#123B3C', opacity: .8, filter: 'url(#torn-m)' }, g);
    for (let i = 0; i < 9; i++) {
      const bx = -110 + R() * 220, hh = 40 + R() * 44;
      el('path', { d: `M${bx},60 C${bx + 4},${60 - hh * .6} ${bx + 8},${60 - hh * .9} ${bx + 10},${60 - hh}`, stroke: '#0A2622', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, g);
    }
  });
  decor(.63, .80, g => {           // 海灘：沙灣
    el('path', { d: blob(0, 40, 132, { n: 10, wob: .26, squash: .44, rnd: R }), fill: '#6B573A', opacity: .85, filter: 'url(#torn-m)' }, g);
    el('path', { d: blob(-6, 34, 104, { n: 9, wob: .26, squash: .40, rnd: R }), fill: '#8A7048', opacity: .7, filter: 'url(#torn-m)' }, g);
  });
  decor(.80, .44, g => {           // 樹林
    for (let i = 0; i < 4; i++) {
      const tx = -104 + i * 66 + R() * 20, ty = 46 - R() * 30;
      el('path', { d: `M${tx - 7},${ty} l4,-36 h8 l4,36 z`, fill: '#2E2130' }, g);
      el('path', { d: blob(tx, ty - 58, 34 + R() * 12, { n: 10, wob: .3, squash: .84, rnd: R }), fill: '#0F3226', filter: 'url(#torn-m)' }, g);
    }
  });
  decor(.25, .24, g => {           // 懸崖：三根岩柱
    [[-88, 30, 54], [-14, 44, 68], [70, 26, 46]].forEach(([x, y, r]) => {
      el('path', { d: blob(x, y, r, { n: 8, wob: .34, squash: .95, rnd: R }), fill: '#232B48', filter: 'url(#torn-m)' }, g);
      el('path', { d: blob(x - r * .2, y - r * .3, r * .5, { n: 7, wob: .34, squash: .7, rnd: R }), fill: PAL.mint, opacity: .09, style: 'mix-blend-mode:screen' }, g);
    });
  });
  decor(.60, .13, g => {           // 燈塔基座
    el('path', { d: blob(0, 54, 96, { n: 9, wob: .28, squash: .5, rnd: R }), fill: '#20284A', filter: 'url(#torn-m)' }, g);
  });

  // 已經點亮的地方，地上會留著暖光
  AREAS.forEach(a => {
    if (!lit.has(a.key)) return;
    el('circle', {
      cx: X(a.lampAt.x), cy: Y(a.lampAt.y) + 30 * k, r: 150 * k,
      fill: 'url(#g-warm)', opacity: .30, style: 'mix-blend-mode:screen',
    }, svg);
  });
}

function smoothClosed(p) {
  const n = p.length; let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}`
       + ` ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}`
       + ` ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
function smoothOpen(p) {
  if (p.length < 2) return '';
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}`
       + ` ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}`
       + ` ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/* ───────────────────────── 地點節點 ───────────────────────── */

function makeNode(area, { locked, isLit }) {
  const size = fs(.30);
  const p = new Prop(app.layers.scene, {
    x: fx(area.lampAt.x), y: fy(area.lampAt.y), size, drift: .5,
  });
  p.area = area;
  p.reposition = () => {
    p.x = fx(area.lampAt.x); p.y = fy(area.lampAt.y);
    const s = fs(.30);
    p.node.style.width = p.node.style.height = s + 'px';
    p.node.style.marginLeft = p.node.style.marginTop = (-s / 2) + 'px';
    p.svg.setAttribute('width', s); p.svg.setAttribute('height', s);
  };

  const g = p.art;
  const on = isLit && !locked;
  const dark = locked ? '#141B33' : '#1A2440';
  const glowOp = on ? .85 : .0;

  p.halo = el('circle', { cx: 0, cy: -4, r: 104, fill: 'url(#g-warm)', opacity: glowOp, style: 'mix-blend-mode:screen' }, g);

  const ART = {
    marsh(g) {                       // 蘆葦叢中的提燈
      [-52, -34, 40, 58].forEach((x, i) => el('path', {
        d: `M${x},72 C${x + 5},30 ${x + 9},4 ${x + 12},-16`,
        stroke: on ? '#1D4A3E' : '#16283A', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round',
      }, g));
      lamp(g, 0, 0);
    },
    cove(g) {                        // 大貝殼
      el('path', { d: 'M0,66 L-62,-8 A62,58 0 0 1 62,-8 Z', fill: on ? '#EBD3AC' : '#2A3450', filter: 'url(#torn-s)' }, g);
      for (let i = -3; i <= 3; i++) el('path', { d: `M0,62 L${i * 19},-10`, stroke: on ? '#C0A176' : '#1B2440', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
      el('ellipse', { cx: 0, cy: 66, rx: 20, ry: 8, fill: on ? '#C0A176' : '#1B2440' }, g);
      if (on) el('circle', { cx: 0, cy: 16, r: 22, fill: 'url(#g-warm)', opacity: .8, style: 'mix-blend-mode:screen' }, g);
    },
    grove(g) {                       // 結著發光果實的小樹
      el('path', { d: 'M-13,72 l6,-52 h14 l6,52 z', fill: '#2E2130', filter: 'url(#torn-s)' }, g);
      el('path', { d: blob(0, -22, 62, { n: 11, wob: .26, squash: .86, rnd: Math.random }), fill: on ? '#1B4A34' : '#182A38', filter: 'url(#torn-m)' }, g);
      [[-28, -34], [22, -46], [4, -6], [36, -14]].forEach(([x, y]) => {
        el('circle', { cx: x, cy: y, r: 11, fill: on ? PAL.coral : '#2A3450', filter: on ? 'url(#glow-s)' : '' }, g);
      });
    },
    cliff(g) {                       // 岩柱頂上的星星
      el('path', { d: 'M-34,74 L-16,4 L18,4 L36,74 Z', fill: dark, filter: 'url(#torn-m)' }, g);
      el('path', { d: 'M-24,74 L-10,10 L0,10 L-6,74 Z', fill: '#2B3560', opacity: .8 }, g);
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 15 : 38;
        pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr - 34).toFixed(1)}`);
      }
      el('path', { d: `M${pts.join(' L')} Z`, fill: on ? PAL.honey : '#2A3450', filter: 'url(#torn-s)' }, g);
      if (on) el('circle', { cx: 0, cy: -34, r: 16, fill: '#FFFDF4', filter: 'url(#glow-m)' }, g);
    },
    light(g) {                       // 燈塔
      el('path', { d: 'M-30,76 L-17,-30 L17,-30 L30,76 Z', fill: dark, filter: 'url(#torn-m)' }, g);
      el('path', { d: 'M-23,76 L-13,-30 L-3,-30 L-10,76 Z', fill: '#2B3560', opacity: .75 }, g);
      [50, 22, -6].forEach(y => el('path', { d: `M${-30 + (76 - y) * .0},${y} L${30 - (76 - y) * .0},${y}`, stroke: '#0E1730', 'stroke-width': 6, opacity: .6 }, g));
      el('path', { d: 'M-26,-30 h52', stroke: '#33406B', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
      el('path', { d: 'M-21,-34 h42 v-34 h-42 z', fill: on ? PAL.honey : '#0C1226', filter: 'url(#torn-s)' }, g);
      el('path', { d: 'M-24,-70 L0,-96 L24,-70 Z', fill: '#243056', filter: 'url(#torn-s)' }, g);
      if (on) {
        const beam = el('path', { d: 'M-16,-52 L-190,-104 L-190,0 Z', fill: PAL.honey, opacity: .16, filter: 'url(#glow-l)' }, g);
        offs.push(onTick((dt, t) => beam.setAttribute('transform', `rotate(${Math.sin(t * .5) * 22},0,-52)`)));
      }
      if (locked) {   // 睡著的燈塔：閉著的眼睛
        el('path', { d: 'M-11,-52 C-6,-46 6,-46 11,-52', stroke: '#3A4670', 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }, g);
      }
    },
  };

  function lamp(gg, x, y) {
    el('path', { d: `M${x},${y - 46} C${x - 7},${y - 36} ${x - 7},${y - 30} ${x},${y - 24}`, stroke: '#8B6F49', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, gg);
    el('path', { d: `M${x - 32},${y - 24} h64 l9,12 h-82 z`, fill: '#8B6F49', filter: 'url(#torn-s)' }, gg);
    el('path', { d: `M${x - 27},${y - 12} h54 v46 a27 22 0 0 1 -54 0 z`, fill: on ? '#3A2A12' : '#0C1428', opacity: .9, filter: 'url(#torn-s)' }, gg);
    if (on) {
      const core = el('circle', { cx: x, cy: y + 12, r: 22, fill: 'url(#g-warm)', opacity: .95, style: 'mix-blend-mode:screen' }, gg);
      offs.push(onTick((dt, t) => core.setAttribute('r', (20 + Math.sin(t * 4.3) * 3).toFixed(1))));
    }
    el('path', { d: `M${x - 27},${y - 12} h54 v46 a27 22 0 0 1 -54 0 z`, fill: 'none', stroke: on ? '#E6C894' : '#3A4670', 'stroke-width': 4.5, 'stroke-linejoin': 'round', filter: 'url(#torn-s)' }, gg);
    el('path', { d: `M${x - 31},${y + 40} h62`, stroke: '#8B6F49', 'stroke-width': 8, 'stroke-linecap': 'round' }, gg);
  }

  (ART[area.key] || ART.marsh)(g);

  if (!isLit && !locked) p.hint(true);
  p.baseScale = locked ? .9 : 1;
  return p;
}
