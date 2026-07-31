// 晨風群島的航線圖 —— 也是一晚航程的方向盤。
//
// 跟夜光島的地圖是兩件事：那邊是一整座島，五個地點站在自己的地形上，愛去哪就去哪；
// 這裡是一串浮島掛在天上，風一次只吹得到兩個地方，她挑一個。
//
// 兩件事刻意分開：
//   **地理是固定的** —— 五座島的相對位置永遠一樣。認得路是安全感的來源。
//   **風景是隨機的** —— 島的高低、橋怎麼垂、雲多厚每次重抽。
//
// 天色是進度條：風吹過幾段，天就亮幾分。可預期、可視覺化的進度提示會降低焦慮，
// 突然逼近的倒數則會誘發數學焦慮 —— 所以這裡有天色，沒有計時器。

import {
  app, setScenery, placeLumi, hudMode, go, fx, fy, fs, el, A, paperCard, refreshHud,
} from '../game.js';
import { areas, activeProfile } from '../profiles.js';
import { SKYROUTE } from '../data/skyworld.js';
import { newVoyage, rollOptions, advance, dawnProgress, isLastLeg, NODE } from '../data/voyage.js';
import { store } from '../core/store.js';
import { Prop } from '../art/props.js';
import { setAmbientMotes, burst } from '../art/particles.js';
import { lockTaps } from '../core/pointer.js';
import { stage } from '../core/stage.js';
import { makeRng } from '../core/rng.js';
import { floatingIsle, cloudBridge, SKY } from '../art/sky.js';

let nodes = [], chartSvg = null, sail = null, chosen = false;

/** 一晚的航程掛在 app.run 上（不進存檔：明天是新的一趟） */
export function voyage() {
  if (!app.run.voyage) app.run.voyage = newVoyage(store, Math.random);
  return app.run.voyage;
}

/** 天色。0 = 還很早，1 = 天亮了。CSS 讀這個變數把整張畫面慢慢烘暖。 */
export function paintDawn(v) {
  document.documentElement.style.setProperty('--dawn', dawnProgress(v).toFixed(3));
}

export const skymap = {
  async enter({ first = false, justLit = null } = {}) {
    const prof = activeProfile();
    const AREAS = areas();
    const v = voyage();
    chosen = false;

    // 風吹完了就收帆回家。run 的結束是風停，不是死亡。
    if (v.done >= v.segs) return go('dawn');

    setScenery(prof.mapScenery);
    setAmbientMotes(.4, SKY.cream);
    hudMode('map');
    placeLumi(stage.portrait ? { x: .13, y: 1.02, s: .62 } : { x: .08, y: 1.02, s: .56 });
    refreshHud();
    paintDawn(v);

    const lit = app.run.lit;
    app.lumi.setLantern(0.15 + lit.size * 0.17);

    const opts = rollOptions(v, store, Math.random);
    const optKeys = new Set(opts.map(o => o.key));

    drawChart(lit, optKeys);
    drawSail(v);

    if (first) {
      paperCard(app.layers.overlay,
        `<div class="pc-line">${prof.islandName}</div><div class="pc-cycle">第 ${store.nights + 1} 趟</div>`,
        { dur: 2.2, cls: 'pc-cycle-card pc-light' });
    }

    nodes = [];
    AREAS.forEach((area, i) => {
      const opt = opts.find(o => o.key === area.key);
      const n = makeNode(area, { isLit: lit.has(area.key), opt });
      nodes.push(n);
      n.appear(0.16 + i * 0.07);
      if (!opt) {
        // 風吹不到的地方按下去不是「錯」，只是風不往那邊 —— 給一個小小的回應就好。
        n.interactive(() => { A.whoosh({ gain: .16, dur: .3 }); n.shy(); });
        return;
      }
      n.interactive(() => choose(area, opt, n));
    });

    if (justLit) {
      const n = nodes.find(x => x.area.key === justLit);
      if (n) {
        n.celebrate();
        const b = n.node.getBoundingClientRect();
        burst(b.left + b.width / 2, b.top + b.height / 2, { count: 26, power: 1.1, col: n.area.tint });
      }
    }

    setTimeout(() => A.say(isLastLeg(v) ? 'sky_last' : first ? 'sky_pick' : 'sky_wind'), first ? 700 : 500);
  },

  onResize() {
    const v = voyage();
    chartSvg?.remove();
    drawChart(app.run.lit, new Set(v.options.map(o => o.key)));
    nodes.forEach(n => n.reposition?.());
    sail?.remove(); drawSail(v);
  },

  exit() {
    nodes.forEach(n => n.destroy()); nodes = [];
    chartSvg?.remove(); chartSvg = null;
    sail?.remove(); sail = null;
  },
};

function choose(area, opt, n) {
  if (chosen) return;
  chosen = true;
  const v = voyage();
  lockTaps(1.0);
  A.whoosh({ gain: .3, dur: .5 });
  A.chime(680, { gain: .35 });
  n.celebrate();
  const b = n.node.getBoundingClientRect();
  burst(b.left + b.width / 2, b.top + b.height / 2, { count: 16, col: area.tint, power: .8 });

  advance(v, opt);
  paintDawn(v);
  setTimeout(() => {
    if (opt.type === 'repair') go(activeProfile().levelScene, { areaKey: area.key });
    else go('event', { areaKey: area.key, type: opt.type });
  }, 620);
}

/* ───────────────────────── 風帆進度 ───────────────────────── */

/**
 * 一晚有幾段風，吹過幾段。
 * 這是這個遊戲唯一的「時間」表示法 —— 它跟對錯無關，分錯不會吹走一段風。
 */
function drawSail(v) {
  const wrap = document.createElement('div');
  wrap.className = 'sail-bar';
  for (let i = 0; i < v.segs; i++) {
    const d = document.createElement('i');
    if (i < v.done) d.className = 'on';
    d.innerHTML = `<svg viewBox="-24 -18 48 36" width="100%" height="100%">
      <path d="M-18,8 C-8,-2 8,-2 18,8" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <path d="M-6,-10 C2,-4 6,0 10,8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity=".6"/>
    </svg>`;
    wrap.appendChild(d);
  }
  app.layers.overlay.appendChild(wrap);
  sail = wrap;
}

/* ───────────────────────── 航線圖本體 ───────────────────────── */

function drawChart(lit, optKeys) {
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
    // 這一段風吹得到的橋亮起來 —— 選項不是用文字說的，是路自己亮給她看。
    const live = optKeys?.has(from) || optKeys?.has(to);
    cloudBridge(c, p.x, p.y + 26 * k, q.x, q.y + 26 * k, {
      color: live || bothLit ? SKY.gold : SKY.cream,
      opacity: live ? .95 : bothLit ? .7 : .34,
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
      soil: on ? SKY.soil : '#E4D2BA',
      soilDeep: on ? SKY.soilDeep : '#CDB89E',
    });
    // 透明度不要壓太低：壓下去就會被天空染成冷灰，
    // 而淺底上的冷灰讀起來是「壞掉了」，不是「還沒去過」。
    if (!on) isle.node.setAttribute('opacity', optKeys?.has(a.key) ? '.95' : '.78');
    if (on || optKeys?.has(a.key)) {
      // 亮起來、或這一段風吹得到的島，底下留著暖光
      el('ellipse', {
        cx: p.x, cy: p.y + isle.dep * .2, rx: rx * 1.5, ry: rx * .55,
        fill: SKY.gold, opacity: optKeys?.has(a.key) ? .26 : .16,
      }, svg);
    }
  });
}

/* ───────────────────────── 島上的標記 ───────────────────────── */

function makeNode(area, { isLit, opt }) {
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
  const on = !!opt || isLit;

  // 亮背景不能用 screen 混色的光暈（疊上去只會變白），改用實心的暖色圓＋低透明度
  if (on) el('circle', { cx: 0, cy: 0, r: 92, fill: SKY.gold, opacity: opt ? .38 : .28 }, g);

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

  // 這一段風吹得到的島，頭上掛一個「那裡有什麼」的小記號。
  // 不藏資訊、也不做代價陷阱 —— 六歲選的是偏好，不是最佳化。
  if (opt) badge(g, opt.type);
  if (!opt) p.node.style.opacity = '.5';
  p.node.dataset.isle = area.key;
  if (opt) p.node.dataset.pickable = opt.type;
  return p;
}

function badge(g, type) {
  const b = el('g', { transform: 'translate(0,-86)' }, g);
  el('circle', { cx: 0, cy: 0, r: 30, fill: SKY.cream, opacity: .95 }, b);
  el('circle', { cx: 0, cy: 0, r: 30, fill: 'none', stroke: SKY.soilDeep, 'stroke-width': 3, opacity: .5 }, b);
  const ink = SKY.ink;
  if (type === 'repair') {
    el('circle', { cx: 0, cy: 0, r: 13, fill: SKY.gold }, b);
    el('circle', { cx: 0, cy: 0, r: 7, fill: '#FFFDF4' }, b);
  } else if (type === 'chest') {
    el('path', { d: 'M-17,-4 h34 v16 h-34 z M-17,-4 a17,11 0 0 1 34,0', fill: '#E8CFA4', stroke: ink, 'stroke-width': 3, 'stroke-linejoin': 'round' }, b);
    el('path', { d: 'M0,-4 v16', stroke: ink, 'stroke-width': 3 }, b);
  } else if (type === 'spirit') {
    el('circle', { cx: 0, cy: 2, r: 13, fill: '#8FDCB4' }, b);
    el('circle', { cx: -4.5, cy: 0, r: 2.6, fill: ink }, b);
    el('circle', { cx: 4.5, cy: 0, r: 2.6, fill: ink }, b);
  } else {
    el('path', { d: 'M-18,4 q9,-9 18,0 t18,0', stroke: ink, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, b);
    el('path', { d: 'M-12,-8 q8,-7 15,0', stroke: ink, 'stroke-width': 3.4, fill: 'none', 'stroke-linecap': 'round', opacity: .6 }, b);
  }
  b.setAttribute('aria-label', NODE[type]?.label || '');
}
