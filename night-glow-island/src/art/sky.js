// 晨風浮空群島的程序化剪紙場景。
//
// 跟夜光島刻意長得不一樣：那邊是深藍的夜、海、星星；這邊是日出、雲、風。
// 不是「夜光島調亮版」—— 連構圖邏輯都不同：夜光島是一座島從下往上看，
// 這裡是一串浮島掛在空中，你在它們之間航行。
//
// 每一局的島數、高低、雲橋怎麼連、雲層厚度、日出位置都會重抽，
// 所以同一個地點每次進來都是新的一張圖。
//
// 效能守則（夜光島用 12fps 換來的教訓，不准重犯）：
//   1. 撕紙感放在幾何裡（blob / tornEdge），不要靠濾鏡 —— 尤其是會動的東西
//   2. 會動的一律整組動：一個 <g> 一個 transform，不要每片雲各自寫屬性
//   3. 亮背景不能用 mix-blend-mode:screen —— 在淺色上疊白等於直接洗成白紙

import { el, blob, tornEdge } from './paper.js';

/** 晨風群島的色盤。跟 PAL（夜光島）分開，免得有人不小心把深藍色帶進來。 */
export const SKY = {
  high: '#9FD8EC',    // 高空的淡青
  mid: '#DCEFF3',
  low: '#FFE6C4',     // 靠近日出的暖
  glow: '#FFC9A0',
  sun: '#FFF3D6',
  sunRim: '#FFD9A8',  // 杏桃橘
  cream: '#FFF6E6',
  grass: '#7FD4A8',   // 嫩綠
  grassDeep: '#4FB489',
  soil: '#C79A6B',
  soilDeep: '#9E7450',
  rock: '#B9A98F',
  gold: '#FFE9A8',
  ink: '#3E5A6E',     // 亮背景上的「深色」——不要用純黑，紙感會死掉
  shade: '#8AA9BF',
};

/** 天空漸層。上面淡青、中間奶白、下面被日出染暖。 */
export const SKY_STOPS = {
  skytitle: [['0%', '#8FD1EA'], ['44%', '#D8EDF4'], ['74%', '#FFE7C8'], ['100%', '#FFC79C']],
  skymap: [['0%', '#9BD6EE'], ['46%', '#DDF0F5'], ['76%', '#FFE9CE'], ['100%', '#FFD0A8']],
  garden: [['0%', '#A6DCEE'], ['48%', '#E3F2F1'], ['78%', '#FFF0D6'], ['100%', '#FFDCB4']],
  mill: [['0%', '#93D2EC'], ['45%', '#DCEEF2'], ['75%', '#FFE7C6'], ['100%', '#FFCEA6']],
  falls: [['0%', '#8FCFEA'], ['46%', '#D6EDF4'], ['76%', '#FFE4C2'], ['100%', '#FFC99E']],
  market: [['0%', '#A0D6E8'], ['44%', '#E6F0EC'], ['72%', '#FFEBCC'], ['100%', '#FFD2AA']],
  beacon: [['0%', '#7FC6E8'], ['40%', '#CDE8F2'], ['70%', '#FFE0BC'], ['100%', '#FFC194']],
};

/** 這些場景不套夜光島那層冷色霧 —— 在亮天空上疊青白色會把整張圖洗掉。這裡用雲。 */
export const SKY_KEYS = new Set(Object.keys(SKY_STOPS));

/* ───────────────────────── 共用零件 ───────────────────────── */

/**
 * 太陽該多大。
 *
 * 只看 U 會在橫握爆掉：光暈是本體的 3.4 倍，橫向的畫面又矮，
 * 一顆太陽就能把半張圖洗成奶白色。所以再用畫面高度夾一次上限。
 */
const sunRadius = (c, f) => Math.min(c.U * f, c.h * .10);

/** 日出。位置每局會變，它決定整張圖的光往哪邊打。 */
function sunrise(c, x, y, r) {
  const { svg, defs, key } = c;
  const g = el('g', {}, svg);
  const id = `sun-${key}-${(x | 0)}`;
  const rg = el('radialGradient', { id, cx: '50%', cy: '50%', r: '50%' }, defs);
  el('stop', { offset: '0%', 'stop-color': SKY.sun, 'stop-opacity': .95 }, rg);
  el('stop', { offset: '46%', 'stop-color': SKY.sunRim, 'stop-opacity': .5 }, rg);
  el('stop', { offset: '100%', 'stop-color': SKY.glow, 'stop-opacity': 0 }, rg);

  el('circle', { cx: x, cy: y, r: r * 3.4, fill: `url(#${id})`, opacity: .8 }, g);
  el('circle', { cx: x, cy: y, r, fill: SKY.sun }, g);
  el('circle', { cx: x, cy: y, r: r * 1.14, fill: 'none', stroke: SKY.sunRim, 'stroke-width': r * .12, opacity: .5 }, g);
  return g;
}

/**
 * 一層雲。
 * 整層放同一個 <g>，每幀只寫一個 transform —— 十幾朵雲各自飄的話，
 * 每幀就是十幾次屬性寫入，手機會有感。
 */
function cloudLayer(c, y, { n = 6, scale = 1, color = SKY.cream, opacity = .8, speed = .012, span = 1 } = {}) {
  const { svg, w, h, U, R, anim } = c;
  const g = el('g', { style: 'will-change:transform' }, svg);
  for (let i = 0; i < n; i++) {
    const cx = -w * .15 + R() * w * 1.3;
    const cy = y + (R() - .5) * h * .05 * span;
    const rr = U * (.05 + R() * .07) * scale;
    const puff = el('g', {}, g);
    // 一朵雲＝三四團 blob 疊在一起。用幾何做形狀，不要用濾鏡糊邊。
    el('path', { d: blob(cx, cy, rr, { n: 11, wob: .2, squash: .42, rnd: R }), fill: color, opacity }, puff);
    for (let k = 0; k < 2 + Math.floor(R() * 2); k++) {
      const ox = cx + (R() - .5) * rr * 2.1;
      const oy = cy - R() * rr * .5;
      el('path', {
        d: blob(ox, oy, rr * (.45 + R() * .4), { n: 10, wob: .24, squash: .5, rnd: R }),
        fill: color, opacity: opacity * (.85 + R() * .15),
      }, puff);
    }
  }
  const ph = R() * 6.28, dx = w * (.02 + R() * .03);
  anim.push({ node: g, fn: t => g.setAttribute('transform', `translate(${(Math.sin(t * speed * 8 + ph) * dx).toFixed(1)},0)`) });
  return g;
}

/**
 * 一座浮島。
 *
 * 上面是一塊草地，下面是逐漸收尖的岩底 —— 那個尖端是整個「浮」的感覺來源，
 * 它讓島看起來是被拔起來的一塊地，而不是漂在水上的船。
 */
export function floatingIsle(c, x, y, rx, {
  depth = null, grass = SKY.grass, grassDeep = SKY.grassDeep,
  soil = SKY.soil, soilDeep = SKY.soilDeep, drift = 0,
} = {}) {
  const { svg, R } = c;
  const g = el('g', {}, svg);
  // 底要夠深、收得夠尖。收太淺會變成一個碗，「被連根拔起的一塊地」那個感覺就沒了。
  const dep = depth ?? rx * (1.4 + R() * .55);
  const tipX = x + (R() - .5) * rx * .4 + drift;

  // 岩底：左邊緣 → 收到一個尖 → 右邊緣
  el('path', {
    d: `M${x - rx},${y}
        C${x - rx * .78},${y + dep * .5} ${x - rx * .18},${y + dep * .86} ${tipX},${y + dep}
        C${x + rx * .2},${y + dep * .84} ${x + rx * .8},${y + dep * .46} ${x + rx},${y} Z`,
    fill: soilDeep,
  }, g);
  // 受光的那一側
  el('path', {
    d: `M${x + rx * .08},${y}
        C${x + rx * .26},${y + dep * .42} ${x + rx * .42},${y + dep * .66} ${tipX + rx * .05},${y + dep * .96}
        C${x + rx * .46},${y + dep * .68} ${x + rx * .82},${y + dep * .42} ${x + rx},${y} Z`,
    fill: soil, opacity: .7,
  }, g);
  // 岩層的橫紋。很淡就好 —— 畫太清楚會從「岩壁」變成「木碗的年輪」。
  for (let i = 0; i < 3; i++) {
    const t = .2 + i * .19;
    const half = rx * (1 - t * .9);
    el('path', {
      d: `M${x - half},${y + dep * t} Q${x},${y + dep * (t + .05)} ${x + half},${y + dep * t}`,
      fill: 'none', stroke: SKY.rock, 'stroke-width': rx * .022, opacity: .17, 'stroke-linecap': 'round',
    }, g);
  }
  // 草地：上緣用撕紙邊，才不會像一塊被切齊的蛋糕
  const top = tornEdge(x - rx, x + rx, y - rx * .1, rx * .045, rx * .28, R);
  el('path', { d: `${top} L${x + rx},${y + rx * .06} L${x - rx},${y + rx * .06} Z`, fill: grassDeep }, g);
  el('path', {
    d: blob(x, y - rx * .12, rx * .96, { n: 13, wob: .12, squash: .2, rnd: R }),
    fill: grass,
  }, g);
  g.dataset && (g.dataset.isle = '1');
  return { node: g, x, y, rx, dep, tipX };
}

/** 島與島之間的雲橋。roguelike 的航線就是這些橋。 */
export function cloudBridge(c, x1, y1, x2, y2, { color = SKY.cream, opacity = .62 } = {}) {
  const { svg, R, U } = c;
  const g = el('g', {}, svg);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + U * (.03 + R() * .03);   // 中間垂下去一點
  const steps = 7;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // 二次貝茲取點
    const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
    const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
    const rr = U * (.016 + R() * .012) * (1 - Math.abs(t - .5) * .5);
    el('path', {
      d: blob(px, py, rr, { n: 9, wob: .26, squash: .55, rnd: R }),
      fill: color, opacity: opacity * (.7 + R() * .3),
    }, g);
  }
  return g;
}

// 零件的內部尺寸是照「viewBox 寬 1000」寫死的（風車塔高 78、氣球半徑 26…），
// 所以 scale 要換算成「這個畫面的 U 相對於 1000 有多大」。
// 直接寫 U * 0.08 那種算式會在橫向炸開：U 可能是 671，scale 就變成 53 倍。
const unit = U => U / 1000;

/** 風車。葉片會轉 —— 一座風車一個 transform，所以數量要克制。 */
function windmill(c, x, ybase, scale) {
  const { svg, R, anim } = c;
  const g = el('g', {}, svg);
  const hh = 78 * scale;
  el('path', {
    d: `M${x - 15 * scale},${ybase} L${x - 8 * scale},${ybase - hh} L${x + 8 * scale},${ybase - hh} L${x + 15 * scale},${ybase} Z`,
    fill: SKY.cream,
  }, g);
  el('path', {
    d: `M${x - 8 * scale},${ybase - hh} L${x},${ybase - hh - 16 * scale} L${x + 8 * scale},${ybase - hh} Z`,
    fill: SKY.sunRim,
  }, g);
  const hub = { x, y: ybase - hh * .92 };
  const blades = el('g', { style: 'will-change:transform' }, g);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const bx = hub.x + Math.cos(a) * 30 * scale, by = hub.y + Math.sin(a) * 30 * scale;
    el('path', {
      d: `M${hub.x},${hub.y} L${bx + Math.cos(a + .5) * 9 * scale},${by + Math.sin(a + .5) * 9 * scale} L${bx},${by} Z`,
      fill: SKY.cream, stroke: SKY.soil, 'stroke-width': 1.6 * scale, 'stroke-linejoin': 'round',
    }, blades);
  }
  el('circle', { cx: hub.x, cy: hub.y, r: 4.5 * scale, fill: SKY.soilDeep }, g);
  const sp = 22 + R() * 16;
  anim.push({ node: blades, fn: t => blades.setAttribute('transform', `rotate(${((t * sp) % 360).toFixed(1)},${hub.x},${hub.y})`) });
  return g;
}

/** 從島邊掉下去、還沒落地就散成雲的水瀑 */
function hangingFall(c, x, y, len, wid) {
  const { svg, defs, R, key } = c;
  const g = el('g', {}, svg);
  const id = `fall-${key}-${(x | 0)}`;
  const lg = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: '0%', 'stop-color': '#BEE9F5', 'stop-opacity': .98 }, lg);
  el('stop', { offset: '58%', 'stop-color': '#E2F5FB', 'stop-opacity': .8 }, lg);
  el('stop', { offset: '100%', 'stop-color': SKY.cream, 'stop-opacity': .05 }, lg);
  el('path', {
    d: `M${x - wid / 2},${y} C${x - wid * .3},${y + len * .5} ${x - wid * .4},${y + len * .8} ${x - wid * .2},${y + len}
        L${x + wid * .2},${y + len} C${x + wid * .4},${y + len * .8} ${x + wid * .3},${y + len * .5} ${x + wid / 2},${y} Z`,
    fill: `url(#${id})`,
  }, g);
  // 落點的水氣
  for (let i = 0; i < 3; i++) {
    el('path', {
      d: blob(x + (R() - .5) * wid * 2, y + len * (.9 + R() * .18), wid * (.5 + R() * .5), { n: 9, wob: .3, squash: .5, rnd: R }),
      fill: SKY.cream, opacity: .5,
    }, g);
  }
  return g;
}

/** 熱氣球，慢慢上下浮 */
function balloon(c, x, y, scale) {
  const { svg, R, anim } = c;
  const g = el('g', { style: 'will-change:transform' }, svg);
  const r = 26 * scale;
  const cols = [SKY.sunRim, SKY.cream, SKY.grass];
  el('path', { d: blob(x, y, r, { n: 12, wob: .06, squash: 1.12, rnd: R }), fill: cols[Math.floor(R() * cols.length)] }, g);
  el('path', {
    d: `M${x - r * .5},${y + r * .86} Q${x},${y + r * 1.5} ${x + r * .5},${y + r * .86}`,
    fill: 'none', stroke: SKY.cream, 'stroke-width': r * .12, opacity: .8,
  }, g);
  el('path', { d: `M${x - r * .34},${y + r * 1.05} L${x - r * .26},${y + r * 1.5} M${x + r * .34},${y + r * 1.05} L${x + r * .26},${y + r * 1.5}`, stroke: SKY.soilDeep, 'stroke-width': r * .07 }, g);
  el('rect', { x: x - r * .3, y: y + r * 1.48, width: r * .6, height: r * .42, rx: r * .1, fill: SKY.soil }, g);
  const ph = R() * 6.28, sp = .3 + R() * .25, dy = r * .3;
  anim.push({ node: g, fn: t => g.setAttribute('transform', `translate(0,${(Math.sin(t * sp + ph) * dy).toFixed(2)})`) });
  return g;
}

/** 幾隻遠處的鳥，整群一起飄 */
function birds(c, y) {
  const { svg, w, U, R, anim } = c;
  const g = el('g', { style: 'will-change:transform' }, svg);
  const n = 3 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    const bx = w * (.1 + R() * .8), by = y + (R() - .5) * U * .08;
    const s = U * (.008 + R() * .006);
    el('path', {
      d: `M${bx - s},${by} q${s},${-s * .8} ${s},0 q0,${-s * .8} ${s},0`,
      fill: 'none', stroke: SKY.ink, 'stroke-width': s * .28, opacity: .35, 'stroke-linecap': 'round',
    }, g);
  }
  const ph = R() * 6.28;
  anim.push({ node: g, fn: t => g.setAttribute('transform', `translate(${(Math.sin(t * .09 + ph) * w * .05).toFixed(1)},${(Math.sin(t * .13 + ph) * U * .012).toFixed(1)})`) });
  return g;
}

/** 島上的草叢。整叢一起搖，不要每根各搖。 */
function skyGrass(c, x, ybase, { n = 6, hgt = 26, spread = 30, color = SKY.grassDeep } = {}) {
  const { svg, R, anim } = c;
  const g = el('g', { style: 'will-change:transform' }, svg);
  for (let i = 0; i < n; i++) {
    const bx = x + (R() - .5) * spread * 2;
    const hh = hgt * (.6 + R() * .8);
    const bend = (R() - .5) * 12;
    el('path', {
      d: `M${bx},${ybase} C${bx + bend * .3},${ybase - hh * .6} ${bx + bend * .8},${ybase - hh * .85} ${bx + bend},${ybase - hh}`,
      fill: 'none', stroke: color, 'stroke-width': 2.4 + R() * 2, 'stroke-linecap': 'round',
    }, g);
  }
  const ph = R() * 6.28, sp = .8 + R() * .6, sw = 2 + R() * 2.5;
  anim.push({ node: g, fn: t => g.setAttribute('transform', `rotate(${(Math.sin(t * sp + ph) * sw).toFixed(2)},${x},${ybase})`) });
  return g;
}

/** 小花：只是幾個點，但沒有它島看起來會很空 */
function flowers(c, x, ybase, n = 5, spread = 34) {
  const { svg, R } = c;
  const g = el('g', {}, svg);
  const cols = [SKY.sunRim, SKY.cream, '#FFB6C1', SKY.gold];
  for (let i = 0; i < n; i++) {
    const fx2 = x + (R() - .5) * spread * 2, fy2 = ybase - R() * 8;
    el('circle', { cx: fx2, cy: fy2, r: 2.6 + R() * 2, fill: cols[Math.floor(R() * cols.length)], opacity: .9 }, g);
  }
  return g;
}

/** 風的痕跡：幾道細細的弧線，讓「有風」這件事看得見 */
function windStreaks(c, y0, y1) {
  const { svg, w, U, R, anim } = c;
  const g = el('g', { style: 'will-change:transform' }, svg);
  for (let i = 0; i < 4; i++) {
    const sy = y0 + R() * (y1 - y0);
    const sx = w * (.05 + R() * .5), len = w * (.14 + R() * .2);
    el('path', {
      d: `M${sx},${sy} q${len * .5},${-U * .02} ${len},0`,
      fill: 'none', stroke: SKY.cream, 'stroke-width': U * .004,
      opacity: .35 + R() * .25, 'stroke-linecap': 'round',
    }, g);
  }
  const ph = R() * 6.28;
  anim.push({ node: g, fn: t => {
    const k = (t * .12 + ph) % 1;
    g.setAttribute('transform', `translate(${(k * w * .55).toFixed(1)},0)`);
    g.setAttribute('opacity', (Math.sin(k * Math.PI) * .9).toFixed(2));
  } });
  return g;
}

/* ───────────────────────── 各地點 ───────────────────────── */

/** 每局重抽的骨架：幾座島、各自多高多大、日出在哪 */
function isleChain(c, { n = 4, y0 = .34, y1 = .68 } = {}) {
  const { w, h, U, R } = c;
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? .5 : i / (n - 1);
    out.push({
      x: w * (.12 + t * .76 + (R() - .5) * .06),
      y: h * (y0 + R() * (y1 - y0)),
      rx: U * (.09 + R() * .07),
    });
  }
  return out;
}

export const SKY_BUILDERS = {

  // 開場：一串島從遠到近，日出在後面
  skytitle(c) {
    const { w, h, U, R } = c;
    sunrise(c, w * (.2 + R() * .6), h * .30, sunRadius(c, .075));
    cloudLayer(c, h * .22, { n: 5, scale: 1.5, opacity: .55, speed: .008 });
    birds(c, h * .26);
    windStreaks(c, h * .3, h * .48);

    const chain = isleChain(c, { n: 3, y0: .48, y1: .62 });
    chain.forEach((s, i) => {
      if (i > 0) cloudBridge(c, chain[i - 1].x + chain[i - 1].rx * .7, chain[i - 1].y, s.x - s.rx * .7, s.y);
    });
    chain.forEach((s, i) => {
      const isle = floatingIsle(c, s.x, s.y, s.rx);
      skyGrass(c, s.x - s.rx * .4, s.y - s.rx * .18, { spread: s.rx * .4 });
      flowers(c, s.x + s.rx * .3, s.y - s.rx * .16, 4, s.rx * .4);
      if (i === 1) windmill(c, s.x, s.y - s.rx * .18, unit(U) * .9);
      return isle;
    });
    balloon(c, w * (.7 + R() * .2), h * .34, unit(U) * 1.1);
    cloudLayer(c, h * .82, { n: 6, scale: 2.1, opacity: .85, speed: .005 });
  },

  // 航線圖的背景。
  // 會被踩的那些島是 skymap 場景自己畫上去的（那些要能點），
  // 這裡只鋪遠景：幾座小小的、灰藍的島飄在後面，讓天空有深度而不是一片空。
  skymap(c) {
    const { w, h, U, R } = c;
    sunrise(c, w * (.12 + R() * .18), h * .22, sunRadius(c, .06));
    cloudLayer(c, h * .16, { n: 5, scale: 1.4, opacity: .45, speed: .01 });
    birds(c, h * .2);
    for (let i = 0; i < 4; i++) {
      const fx2 = w * (.06 + R() * .88), fy2 = h * (.26 + R() * .46);
      floatingIsle(c, fx2, fy2, U * (.03 + R() * .025), {
        grass: '#BCD8DE', grassDeep: '#A6C6CF', soil: '#B7C4CB', soilDeep: '#9FAFB9',
      }).node.setAttribute('opacity', (.3 + R() * .2).toFixed(2));
    }
    cloudLayer(c, h * .88, { n: 7, scale: 2.3, opacity: .8, speed: .004 });
    windStreaks(c, h * .24, h * .7);
  },

  // 空中花園：藤蔓從島底垂下來
  garden(c) {
    const { w, h, U, R } = c;
    sunrise(c, w * (.72 + R() * .2), h * .2, sunRadius(c, .06));
    cloudLayer(c, h * .18, { n: 4, scale: 1.6, opacity: .5, speed: .009 });
    const s = { x: w * .5, y: h * .70, rx: U * .30 };
    floatingIsle(c, s.x, s.y, s.rx, { grass: '#8FDCB4' });
    // 從島底垂下來的藤蔓，上面掛幾片葉子（沒有葉子只是幾條線，看不出是藤）
    for (let i = 0; i < 6; i++) {
      const vx = s.x + (R() - .5) * s.rx * 1.7;
      const vlen = U * (.09 + R() * .13);
      const sway = (R() - .5) * s.rx * .3;
      el('path', {
        d: `M${vx},${s.y + s.rx * .06} q${sway * .4},${vlen * .5} ${sway},${vlen}`,
        fill: 'none', stroke: SKY.grassDeep, 'stroke-width': U * .0075, 'stroke-linecap': 'round', opacity: .85,
      }, c.svg);
      for (let k = 1; k <= 3; k++) {
        const t = k / 3.6;
        const lx = vx + sway * t * t, ly = s.y + s.rx * .06 + vlen * t;
        el('path', {
          d: blob(lx + (R() < .5 ? -1 : 1) * U * .012, ly, U * .012, { n: 7, wob: .2, squash: .55, rnd: R }),
          fill: SKY.grass, opacity: .9,
        }, c.svg);
      }
    }
    [-.55, -.15, .3, .66].forEach(o => {
      skyGrass(c, s.x + s.rx * o, s.y - s.rx * .16, { spread: s.rx * .22, hgt: U * .035 });
      flowers(c, s.x + s.rx * o, s.y - s.rx * .14, 6, s.rx * .24);
    });
    cloudLayer(c, h * .9, { n: 6, scale: 2.2, opacity: .82, speed: .005 });
  },

  // 風車島：三座風車，數量到此為止（每座一個每幀 transform）
  mill(c) {
    const { w, h, U, R } = c;
    sunrise(c, w * (.16 + R() * .16), h * .24, sunRadius(c, .058));
    cloudLayer(c, h * .16, { n: 4, scale: 1.5, opacity: .45, speed: .01 });
    windStreaks(c, h * .26, h * .5);
    const s = { x: w * .5, y: h * .72, rx: U * .32 };
    floatingIsle(c, s.x, s.y, s.rx);
    const mw = unit(U) * 1.1;
    [-.5, .05, .55].forEach((o, i) => windmill(c, s.x + s.rx * o, s.y - s.rx * .16, mw * (i === 1 ? 1.25 : .85)));
    skyGrass(c, s.x - s.rx * .8, s.y - s.rx * .16, { spread: s.rx * .2 });
    skyGrass(c, s.x + s.rx * .85, s.y - s.rx * .16, { spread: s.rx * .2 });
    cloudLayer(c, h * .92, { n: 6, scale: 2.2, opacity: .84, speed: .005 });
  },

  // 懸空水瀑
  falls(c) {
    const { w, h, U, R } = c;
    sunrise(c, w * (.68 + R() * .22), h * .22, sunRadius(c, .062));
    cloudLayer(c, h * .18, { n: 4, scale: 1.5, opacity: .48, speed: .009 });
    const s = { x: w * .48, y: h * .62, rx: U * .28 };
    // 水要掉得比島底還深才像瀑布 —— 只掉到島腰會看起來像牆上的一道漆。
    const isle = floatingIsle(c, s.x, s.y, s.rx, { grass: '#86D9C0' });
    hangingFall(c, s.x - s.rx * .34, s.y + s.rx * .04, isle.dep * 1.25, s.rx * .3);
    hangingFall(c, s.x + s.rx * .48, s.y + s.rx * .02, isle.dep * .8, s.rx * .17);
    skyGrass(c, s.x + s.rx * .1, s.y - s.rx * .16, { spread: s.rx * .3 });
    cloudLayer(c, h * .86, { n: 7, scale: 2.4, opacity: .88, speed: .004 });
  },

  // 晨風市集：布旗與攤子（錢幣換算的地方）
  market(c) {
    const { w, h, U, R } = c;
    sunrise(c, w * (.5 + (R() - .5) * .5), h * .2, sunRadius(c, .055));
    cloudLayer(c, h * .16, { n: 4, scale: 1.4, opacity: .45, speed: .01 });
    const s = { x: w * .5, y: h * .70, rx: U * .34 };
    floatingIsle(c, s.x, s.y, s.rx);
    // 攤位：幾個斜屋頂
    [-.55, 0, .55].forEach(o => {
      const sx = s.x + s.rx * o, sy = s.y - s.rx * .16;
      const bw = s.rx * .3;
      el('path', { d: `M${sx - bw},${sy} L${sx - bw * .8},${sy - bw * .8} L${sx + bw * .8},${sy - bw * .8} L${sx + bw},${sy} Z`, fill: SKY.sunRim, opacity: .9 }, c.svg);
      el('path', { d: `M${sx - bw * .75},${sy} v${-bw * .78}`, stroke: SKY.soilDeep, 'stroke-width': bw * .1 }, c.svg);
      el('path', { d: `M${sx + bw * .75},${sy} v${-bw * .78}`, stroke: SKY.soilDeep, 'stroke-width': bw * .1 }, c.svg);
    });
    // 布旗串成一條線
    const fy0 = s.y - s.rx * .55;
    el('path', { d: `M${s.x - s.rx * .9},${fy0} Q${s.x},${fy0 + s.rx * .12} ${s.x + s.rx * .9},${fy0}`, fill: 'none', stroke: SKY.soil, 'stroke-width': U * .003 }, c.svg);
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const px = s.x - s.rx * .9 + s.rx * 1.8 * t;
      const py = fy0 + Math.sin(t * Math.PI) * s.rx * .06;
      const cols = [SKY.cream, SKY.sunRim, SKY.grass, SKY.gold];
      el('path', { d: `M${px - U * .012},${py} L${px + U * .012},${py} L${px},${py + U * .026} Z`, fill: cols[i % cols.length], opacity: .92 }, c.svg);
    }
    cloudLayer(c, h * .92, { n: 6, scale: 2.2, opacity: .84, speed: .005 });
  },

  // 晨鐘塔：最高的那座島，一趟航程的終點
  beacon(c) {
    const { w, h, U, R } = c;
    sunrise(c, w * .5, h * .30, sunRadius(c, .095));
    cloudLayer(c, h * .2, { n: 5, scale: 1.7, opacity: .5, speed: .008 });
    birds(c, h * .24);
    const s = { x: w * .5, y: h * .74, rx: U * .26 };
    floatingIsle(c, s.x, s.y, s.rx);
    // 塔。奶白色的塔配奶白色的雲和日出光暈 = 三坨一樣的顏色疊在一起，
    // 看起來會像一團奶油而不是建築，所以要給它暗面、簷口跟窗。
    const tw = s.rx * .26, th = Math.min(U * .3, h * .3);
    const ty = s.y - s.rx * .16;
    const P = (l, t) => `${s.x + tw * l},${t}`;
    el('path', { d: `M${P(-1, ty)} L${P(-.62, ty - th)} L${P(.62, ty - th)} L${P(1, ty)} Z`, fill: SKY.cream }, c.svg);
    el('path', { d: `M${P(.24, ty)} L${P(.2, ty - th)} L${P(.62, ty - th)} L${P(1, ty)} Z`, fill: SKY.shade, opacity: .28 }, c.svg);
    el('path', { d: `M${P(-.92, ty - th * .96)} L${P(.92, ty - th * .96)}`, stroke: SKY.soil, 'stroke-width': tw * .12, opacity: .5 }, c.svg);
    el('path', { d: `M${P(-.9, ty - th)} L${P(0, ty - th - tw * 1.5)} L${P(.9, ty - th)} Z`, fill: SKY.sunRim }, c.svg);
    el('path', { d: `M${P(0, ty - th - tw * 1.5)} L${P(.9, ty - th)} L${P(0, ty - th)} Z`, fill: SKY.soilDeep, opacity: .18 }, c.svg);
    // 鐘掛在塔上，塔身開一扇窗
    el('rect', { x: s.x - tw * .2, y: ty - th * .55, width: tw * .4, height: tw * .5, rx: tw * .2, fill: SKY.ink, opacity: .35 }, c.svg);
    el('path', { d: `M${P(-.34, ty - th * .8)} a${tw * .34},${tw * .38} 0 0 1 ${tw * .68},0 z`, fill: SKY.gold }, c.svg);
    skyGrass(c, s.x - s.rx * .7, ty, { spread: s.rx * .18 });
    skyGrass(c, s.x + s.rx * .7, ty, { spread: s.rx * .18 });
    cloudLayer(c, h * .9, { n: 7, scale: 2.4, opacity: .88, speed: .004 });
  },
};
