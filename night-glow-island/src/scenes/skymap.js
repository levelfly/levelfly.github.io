// 晨風群島的航線圖。
//
// 跟夜光島的地圖是兩件事：那邊是一整座島，五個地點站在自己的地形上；
// 這裡是一串浮島掛在天上，島跟島之間有雲橋，她選要走哪一段。
//
// 這張圖每次進來都不一樣（島的高低、橋怎麼垂、雲多厚都重抽），
// 但五座島的相對位置固定 —— 認得路是安全感的來源，隨機的是風景不是地理。

import {
  app, setScenery, placeLumi, hudMode, go, fx, fy, fs, el, A, paperCard, refreshHud,
} from '../game.js';
import { areas, activeProfile } from '../profiles.js';
import { SKYROUTE } from '../data/skyworld.js';
import { store } from '../core/store.js';
import { Prop } from '../art/props.js';
import { setAmbientMotes, burst } from '../art/particles.js';
import { lockTaps } from '../core/pointer.js';
import { stage } from '../core/stage.js';
import { makeRng } from '../core/rng.js';
import { floatingIsle, cloudBridge, SKY } from '../art/sky.js';

let nodes = [], chartSvg = null;

export const skymap = {
  async enter({ first = false, justLit = null } = {}) {
    const prof = activeProfile();
    const AREAS = areas();
    setScenery(prof.mapScenery);
    setAmbientMotes(.4, SKY.cream);
    hudMode('map');
    placeLumi(stage.portrait ? { x: .13, y: 1.02, s: .62 } : { x: .08, y: 1.02, s: .56 });
    refreshHud();

    const lit = app.run.lit;
    app.lumi.setLantern(0.15 + lit.size * 0.17);

    drawChart(lit);

    const cycle = Math.min(...AREAS.map(a => store.cycle(a.key)));
    const cycleName = ['第一趟', '第二趟', '第三趟', '第四趟'][Math.min(cycle, 3)] || `第 ${cycle + 1} 趟`;
    paperCard(app.layers.overlay,
      `<div class="pc-line">${prof.islandName}</div><div class="pc-cycle">${cycleName}</div>`,
      { dur: 2.2, cls: 'pc-cycle-card pc-light' });

    nodes = [];
    const allBase = AREAS.filter(a => !a.final).every(a => lit.has(a.key));

    AREAS.forEach((area, i) => {
      const locked = area.final && !allBase;
      const n = makeNode(area, { locked, isLit: lit.has(area.key) });
      nodes.push(n);
      n.appear(0.16 + i * 0.08);
      if (locked) {
        n.interactive(() => { A.thud({ gain: .25 }); n.shy(); app.lumi.tilt(); });
      } else {
        n.interactive(() => {
          lockTaps(1.0);
          A.whoosh({ gain: .3, dur: .5 });
          A.chime(660 + i * 90, { gain: .35 });
          n.celebrate();
          const b = n.node.getBoundingClientRect();
          burst(b.left + b.width / 2, b.top + b.height / 2, { count: 16, col: area.tint, power: .8 });
          setTimeout(() => go(prof.levelScene, { areaKey: area.key }), 620);
        });
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

    setTimeout(() => A.say('sky_pick'), first ? 700 : 500);
  },

  onResize() {
    chartSvg?.remove();
    drawChart(app.run.lit);
    nodes.forEach(n => n.reposition?.());
  },

  exit() {
    nodes.forEach(n => n.destroy()); nodes = [];
    chartSvg?.remove(); chartSvg = null;
  },
};

/* ───────────────────────── 航線圖本體 ───────────────────────── */

function drawChart(lit) {
  const AREAS = areas();
  const F = stage.field;
  const H = 1000 * F.h / Math.max(1, F.w);
  const X = f => f * 1000, Y = f => f * H;
  // 島的內部座標永遠是 1000 寬，H 卻會從 ~2100（直握）變到 ~330（橫握）。
  // 所有寫死的尺寸都要乘 k，否則橫握時一座島就是整個畫面。
  const k = Math.min(1, H * 1.45 / 1000);
  const R = makeRng(20260731);

  const svg = chartSvg = el('svg', {
    viewBox: `0 0 1000 ${H.toFixed(1)}`,
    style: `position:absolute;left:${F.x}px;top:${F.y}px;width:${F.w}px;height:${F.h}px;overflow:visible;pointer-events:none`,
  });
  app.layers.scene.appendChild(svg);

  // floatingIsle / cloudBridge 要的是場景繪圖的 ctx。這裡只用到 svg / R / U 三個欄位。
  const c = { svg, defs: el('defs', {}, svg), w: 1000, h: H, U: 1000 * k, R, anim: [], key: 'chart' };

  const at = key => {
    const a = AREAS.find(x => x.key === key);
    return a ? { x: X(a.lampAt.x), y: Y(a.lampAt.y) } : null;
  };

  // 先畫橋，島才會壓在橋上面（橋是從島底穿過去的）
  SKYROUTE.forEach(([from, to]) => {
    const p = at(from), q = at(to);
    if (!p || !q) return;
    const bothLit = lit.has(from) && lit.has(to);
    cloudBridge(c, p.x, p.y + 26 * k, q.x, q.y + 26 * k, {
      color: bothLit ? SKY.gold : SKY.cream,
      opacity: bothLit ? .8 : .45,
    });
  });

  AREAS.forEach(a => {
    const p = at(a.key);
    const on = lit.has(a.key);
    const rx = 96 * k * (a.final ? 1.15 : 1);
    // 還沒去過的島畫成「在晨霧裡」——淡、低對比，但仍是暖色。
    // 不能畫暗：在亮天空上，深灰不會讀成「還沒亮」，會讀成「壞掉了」。
    const isle = floatingIsle(c, p.x, p.y, rx, {
      grass: on ? a.tint : '#CFE2D6',
      grassDeep: on ? SKY.grassDeep : '#B4CDC0',
      soil: on ? SKY.soil : '#E0CDB4',
      soilDeep: on ? SKY.soilDeep : '#C9B49B',
    });
    if (!on) isle.node.setAttribute('opacity', '.82');
    if (on) {
      // 亮起來的島底下留著暖光
      el('ellipse', {
        cx: p.x, cy: p.y + isle.dep * .2, rx: rx * 1.5, ry: rx * .55,
        fill: SKY.gold, opacity: .16,
      }, svg);
    }
  });
}

/* ───────────────────────── 島上的標記 ───────────────────────── */

function makeNode(area, { locked, isLit }) {
  const size = fs(.26);
  const p = new Prop(app.layers.scene, {
    x: fx(area.lampAt.x), y: fy(area.lampAt.y - .035), size, drift: .5,
  });
  p.area = area;
  p.reposition = () => {
    p.x = fx(area.lampAt.x); p.y = fy(area.lampAt.y - .035);
    const s = fs(.26);
    p.node.style.width = p.node.style.height = s + 'px';
    p.node.style.marginLeft = p.node.style.marginTop = (-s / 2) + 'px';
    p.svg.setAttribute('width', s); p.svg.setAttribute('height', s);
  };

  const g = p.art;
  const on = isLit && !locked;

  // 亮背景不能用 screen 混色的光暈（疊上去只會變白），改用實心的暖色圓＋低透明度
  if (on) el('circle', { cx: 0, cy: 0, r: 92, fill: SKY.gold, opacity: .3 }, g);

  const body = on ? SKY.cream : '#F0EFE6';
  const line = on ? SKY.soilDeep : '#B0AEA0';

  const MARK = {
    // 花園：一朵花
    garden(g) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        el('ellipse', {
          cx: Math.cos(a) * 30, cy: Math.sin(a) * 30, rx: 20, ry: 13,
          fill: on ? '#FFB6C1' : body, transform: `rotate(${(a * 180 / Math.PI).toFixed(1)},${Math.cos(a) * 30},${Math.sin(a) * 30})`,
        }, g);
      }
      el('circle', { cx: 0, cy: 0, r: 17, fill: on ? SKY.gold : line }, g);
    },
    // 風車：一支小風車
    mill(g) {
      el('path', { d: 'M-9,52 L-5,-10 L5,-10 L9,52 Z', fill: body }, g);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const bx = Math.cos(a) * 40, by = -10 + Math.sin(a) * 40;
        el('path', {
          d: `M0,-10 L${bx + Math.cos(a + .5) * 12},${by + Math.sin(a + .5) * 12} L${bx},${by} Z`,
          fill: body, stroke: line, 'stroke-width': 2.4, 'stroke-linejoin': 'round',
        }, g);
      }
      el('circle', { cx: 0, cy: -10, r: 6, fill: line }, g);
    },
    // 水瀑：一道垂下來的水
    falls(g) {
      el('path', { d: 'M-20,-42 q6,40 -2,88 q14,10 26,0 q-8,-48 -2,-88 z', fill: on ? '#BEE9F5' : body }, g);
      el('circle', { cx: 0, cy: 52, r: 20, fill: on ? '#E2F5FB' : body, opacity: .8 }, g);
    },
    // 市集：一頂攤位的屋頂
    market(g) {
      el('path', { d: 'M-46,26 L-36,-24 L36,-24 L46,26 Z', fill: on ? SKY.sunRim : body }, g);
      el('path', { d: 'M-34,26 v26 M34,26 v26', stroke: line, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
      el('circle', { cx: 0, cy: -34, r: 11, fill: on ? SKY.gold : line }, g);
    },
    // 晨鐘塔：一口鐘
    beacon(g) {
      el('path', { d: 'M-32,34 a32,38 0 0 1 64,0 z', fill: on ? SKY.gold : body }, g);
      el('path', { d: 'M-40,34 h80', stroke: line, 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
      el('circle', { cx: 0, cy: 46, r: 8, fill: line }, g);
      el('path', { d: 'M0,-8 v-22', stroke: line, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
    },
  };
  (MARK[area.key] || MARK.garden)(g);

  if (locked) p.node.style.opacity = '.55';
  return p;
}
