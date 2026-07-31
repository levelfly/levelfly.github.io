// 程序化剪紙場景。
//
// 每個地點都是當場畫出來的：天空、星星、遠山、水、蘆葦、樹冠、岩石。
// 因為是程序生成，所以 (1) 每次進來都長得不太一樣 (2) 直握橫握會重新構圖
// (3) 每一層都能動——草會晃、水會湧、星星會呼吸、霧會飄。

import { el, blob, tornEdge, PAL } from './paper.js';
import { makeRng } from '../core/rng.js';
import { SKY_STOPS, SKY_BUILDERS, SKY_KEYS } from './sky.js';

const SKY = {
  title:  [['0%', '#1B2450'], ['42%', '#131C3E'], ['100%', '#080C22']],
  map:    [['0%', '#1E2758'], ['46%', '#141D40'], ['100%', '#090E26']],
  marsh:  [['0%', '#16283F'], ['44%', '#102A31'], ['100%', '#07131A']],
  cove:   [['0%', '#1A2A55'], ['40%', '#132B44'], ['100%', '#08121F']],
  grove:  [['0%', '#152B33'], ['40%', '#0E2723'], ['100%', '#061410']],
  cliff:  [['0%', '#241B4A'], ['38%', '#181F47'], ['100%', '#0A1030']],
  light:  [['0%', '#182150'], ['44%', '#101B3A'], ['100%', '#070C1E']],
  finale: [['0%', '#2A2A63'], ['38%', '#1B2A55'], ['100%', '#0A1330']],
};

export function buildScenery(container, key, { w, h, seed = 1 }) {
  container.innerHTML = '';
  const R = makeRng(seed);
  const svg = el('svg', {
    class: 'scenery', viewBox: `0 0 ${w} ${h}`,
    preserveAspectRatio: 'none',
    style: 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none',
  }, container);

  const defs = el('defs', {}, svg);
  const sky = el('linearGradient', { id: `sky-${key}-${seed}`, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  (SKY_STOPS[key] || SKY[key] || SKY.map).forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, sky));
  el('rect', { x: 0, y: 0, width: w, height: h, fill: `url(#sky-${key}-${seed})` }, svg);

  const anim = [];   // { node, fn }
  const api = {
    svg, anim,
    tick(t) { for (const a of anim) a.fn(t); },
    destroy() { svg.remove(); anim.length = 0; },
  };

  // U = 尺寸單位。
  //
  // 位置用 w / h 的比例沒問題，但「大小」不能只看 w：
  // 直向 h≈2.2w，橫向 h≈0.4w。同一句 `w * .3` 在直向是畫面高度的 14%，
  // 在橫向卻是 77%——樹冠會撐滿整個螢幕，光暈會把畫面洗成一片灰。
  // 所以所有半徑、高度、筆畫寬、波幅一律以 U 為單位。
  const U = Math.min(w, h * 1.45);

  const ctx = { svg, defs, w, h, U, R, anim, key };
  const build = SKY_BUILDERS[key] || BUILDERS[key] || BUILDERS.map;
  build(ctx);
  // 晨風群島不套這層霧：它是青白色、走 screen 混色，疊在亮天空上等於把整張圖洗白。
  // 那座島用雲層做層次。
  if (!SKY_KEYS.has(key)) addFog(ctx);
  return api;
}

/* ───────── 共用零件 ───────── */

function starField(c, { count = 90, top = 0, bottom = .55, twinkle = true } = {}) {
  const { svg, w, h, U, R, anim } = c;
  const g = el('g', { class: 'stars' }, svg);
  let twinklers = 0;
  const MAX_TWINKLE = 18;      // 會呼吸的星星有上限，其餘靜止——看不出差別，但省一半的每幀寫入
  for (let i = 0; i < count; i++) {
    const x = R() * w, y = h * (top + R() * (bottom - top));
    const r = 0.9 + R() * 2.4;
    const big = r > 2.6;
    const node = big
      ? el('path', {
          d: `M${x},${y - r * 2.6} Q${x + r * .5},${y - r * .5} ${x + r * 2.6},${y}
              Q${x + r * .5},${y + r * .5} ${x},${y + r * 2.6}
              Q${x - r * .5},${y + r * .5} ${x - r * 2.6},${y}
              Q${x - r * .5},${y - r * .5} ${x},${y - r * 2.6} Z`,
          fill: R() < .25 ? PAL.mint : PAL.cream, opacity: .55 + R() * .45,
        }, g)
      : el('circle', { cx: x, cy: y, r, fill: R() < .18 ? PAL.honey : PAL.cream, opacity: .35 + R() * .5 }, g);
    if (twinkle && twinklers < MAX_TWINKLE && R() < .45) {
      twinklers++;
      const ph = R() * 6.28, sp = .5 + R() * 1.3, base = +node.getAttribute('opacity');
      anim.push({ node, fn: t => node.setAttribute('opacity', (base * (.55 + .45 * Math.sin(t * sp + ph))).toFixed(2)) });
    }
  }
  return g;
}

/** 幾組用細線連起來的星座，讓大片空天不會只是隨機灑點 */
function constellations(c, { count = 3, top = .06, bottom = .46 } = {}) {
  const { svg, w, h, U, R, anim } = c;
  const g = el('g', { class: 'consts' }, svg);
  for (let k = 0; k < count; k++) {
    const cx = w * (.12 + R() * .76), cy = h * (top + R() * (bottom - top));
    const n = 4 + Math.floor(R() * 3);
    const pts = [];
    let a = R() * 6.28;
    for (let i = 0; i < n; i++) {
      a += (R() - .35) * 1.9;
      const rr = U * (.045 + R() * .06);
      pts.push([cx + Math.cos(a) * rr * (i + 1) * .48, cy + Math.sin(a) * rr * (i + 1) * .34]);
    }
    const sub = el('g', {}, g);
    el('path', {
      d: 'M' + pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L'),
      fill: 'none', stroke: PAL.mint, 'stroke-width': U * .0016, opacity: .16,
    }, sub);
    pts.forEach(p => {
      el('circle', { cx: p[0], cy: p[1], r: U * .0042, fill: PAL.cream, opacity: .85 }, sub);
      el('circle', { cx: p[0], cy: p[1], r: U * .011, fill: 'url(#g-warm)', opacity: .25, style: 'mix-blend-mode:screen' }, sub);
    });
    const ph = R() * 6.28;
    anim.push({ node: sub, fn: t => sub.setAttribute('opacity', (.62 + .38 * Math.sin(t * .45 + ph)).toFixed(2)) });
  }
  return g;
}

function moon(c, x, y, r) {
  const { svg } = c;
  const g = el('g', {}, svg);
  el('circle', { cx: x, cy: y, r: r * 3.4, fill: 'url(#g-warm)', opacity: .18, style: 'mix-blend-mode:screen' }, g);
  el('circle', { cx: x, cy: y, r, fill: '#FFF3D2' }, g);
  el('circle', { cx: x - r * .22, cy: y - r * .18, r: r * .16, fill: '#E9DCBB', opacity: .55 }, g);
  el('circle', { cx: x + r * .3, cy: y + r * .22, r: r * .11, fill: '#E9DCBB', opacity: .45 }, g);
  return g;
}

/** 一排水的紙帶，會慢慢起伏 */
function waterBands(c, y0, { bands = 5, colors = ['#0E2B2B', '#123A3A', '#16494A'], amp = 7 } = {}) {
  const { svg, w, h, U, R, anim } = c;
  const g = el('g', {}, svg);
  for (let i = 0; i < bands; i++) {
    const y = y0 + (h - y0) * (i / bands) * 1.05;
    const col = colors[i % colors.length];
    // 帶身與浪頭放在同一個 <g> 一起動：每幀只寫一個 transform，而不是兩個
    const band = el('g', { style: 'will-change:transform' }, g);
    const wob = tornEdge(-40, w + 40, y, amp * (1 + i * .18), 34 + R() * 20, R);
    el('path', { d: wob + ` L${w + 40},${h + 40} L-40,${h + 40} Z`, fill: col, opacity: .92 - i * .04 }, band);
    el('path', {
      d: wob, fill: 'none', stroke: i < 2 ? PAL.mint : PAL.cream,
      'stroke-width': 1.6 + R() * 1.4, opacity: .10 + R() * .16,
    }, band);
    if (i > 1) continue;
    const ph = R() * 6.28, sp = .35 + R() * .5, dx = 6 + R() * 10;
    anim.push({ node: band, fn: t => {
      band.setAttribute('transform',
        `translate(${(Math.sin(t * sp + ph) * dx).toFixed(2)},${(Math.sin(t * sp * .7 + ph) * 2.4).toFixed(2)})`);
    } });
  }
  return g;
}

/** 一叢會晃的蘆葦／草 */
/**
 * 一叢會晃的蘆葦／草。
 * 每根草各自動一次 = 每幀寫幾十個 transform；改成分三束、每束整組搖，
 * 看起來一樣有風，每幀只寫三個屬性。
 */
function reeds(c, x, ybase, { n = 7, hgt = 120, spread = 46, color = '#08201F', tip = null } = {}) {
  const { svg, U, R, anim } = c;
  const g = el('g', {}, svg);
  const BUNCH = 2;
  const groups = [];
  for (let b = 0; b < BUNCH; b++) {
    const gg = el('g', { style: 'will-change:transform' }, g);
    groups.push({ node: gg, ph: R() * 6.28, sp: .6 + R() * .8, sw: 1.4 + R() * 2.6 });
  }
  for (let i = 0; i < n; i++) {
    const gg = groups[i % BUNCH].node;
    const bx = x + (R() - .5) * spread * 2;
    const hh = hgt * (.55 + R() * .8);
    const bend = (R() - .5) * 34;
    el('path', {
      d: `M${bx},${ybase} C${bx + bend * .2},${ybase - hh * .5} ${bx + bend * .7},${ybase - hh * .8} ${bx + bend},${ybase - hh}`,
      fill: 'none', stroke: color, 'stroke-width': 3 + R() * 4.5, 'stroke-linecap': 'round',
    }, gg);
    if (tip && R() < .5) {
      el('ellipse', { cx: bx + bend, cy: ybase - hh, rx: 3.4, ry: 8, fill: tip, opacity: .55, transform: `rotate(${bend * .4},${bx + bend},${ybase - hh})` }, gg);
    }
  }
  groups.forEach(({ node, ph, sp, sw }) => {
    anim.push({ node, fn: t => node.setAttribute('transform', `rotate(${(Math.sin(t * sp + ph) * sw).toFixed(2)},${x},${ybase})`) });
  });
  return g;
}

/** 剪紙樹：粗幹 + 幾團樹冠 */
function tree(c, x, ybase, scale, { crown = '#0D2A26', trunk = '#2E2130', lit = null } = {}) {
  const { svg, U, R, anim } = c;
  const g = el('g', {}, svg);
  const hh = 100 * scale;                       // 樹幹短、樹冠大 —— 繪本樹的比例
  el('path', {
    d: `M${x - 16 * scale},${ybase} C${x - 10 * scale},${ybase - hh * .55} ${x - 12 * scale},${ybase - hh * .8} ${x - 8 * scale},${ybase - hh}
        L${x + 8 * scale},${ybase - hh} C${x + 12 * scale},${ybase - hh * .8} ${x + 11 * scale},${ybase - hh * .5} ${x + 17 * scale},${ybase} Z`,
    fill: trunk,
  }, g);
  const crownG = el('g', {}, g);
  const big = (72 + R() * 26) * scale;
  el('path', { d: blob(x, ybase - hh - big * .5, big, { n: 12, wob: .26, squash: .82, rnd: R }), fill: crown }, crownG);
  for (let i = 0; i < 2; i++) {
    const cx = x + (R() - .5) * big * 1.5, cy = ybase - hh - big * (.35 + R() * .55);
    const rr = big * (.5 + R() * .35);
    el('path', { d: blob(cx, cy, rr, { n: 10, wob: .32, squash: .82, rnd: R }), fill: crown }, crownG);
  }
  // 樹冠受光的那一側
  el('path', {
    d: blob(x - big * .3, ybase - hh - big * .85, big * .55, { n: 9, wob: .34, squash: .7, rnd: R }),
    fill: lit || '#1E4A3E', opacity: lit ? .14 : .5,
    ...(lit ? { style: 'mix-blend-mode:screen' } : {}),
  }, crownG);
  const ph = R() * 6.28;
  anim.push({ node: crownG, fn: t => crownG.setAttribute('transform', `rotate(${(Math.sin(t * .55 + ph) * 1.3).toFixed(2)},${x},${ybase})`) });
  return g;
}

/** 岩石 */
function rock(c, x, y, r, { fill = '#1E2340', lit = PAL.mint } = {}) {
  const { svg, R } = c;
  const g = el('g', {}, svg);
  const d = blob(x, y, r, { n: 8, wob: .38, squash: .66, rnd: R });
  el('path', { d, fill }, g);
  el('path', {
    d: blob(x - r * .1, y - r * .3, r * .72, { n: 7, wob: .4, squash: .4, rnd: R }),
    fill: lit, opacity: .10, style: 'mix-blend-mode:screen',
  }, g);
  return g;
}

/**
 * 遠處的霧帶，讓層次分開。
 * 柔邊做在漸層裡而不是靠 feGaussianBlur——霧每幀都在動，
 * 帶著濾鏡跑等於每幀重算一次大面積模糊，手機直接掉幀。
 */
function addFog(c) {
  const { svg, defs, w, h, U, R, anim, key } = c;
  const g = el('g', { style: 'mix-blend-mode:screen' }, svg);
  for (let i = 0; i < 3; i++) {
    const y = h * (.42 + i * .13), band = h * .06;
    const id = `fog-${key}-${i}`;
    const lg = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    const col = i === 0 ? PAL.mint : PAL.cream;
    [['0%', 0], ['38%', 1], ['62%', 1], ['100%', 0]].forEach(([o, a]) =>
      el('stop', { offset: o, 'stop-color': col, 'stop-opacity': a }, lg));
    const p = el('rect', {
      x: -w * .3, y: y - band, width: U * 1.6, height: band * 2,
      fill: `url(#${id})`, opacity: (.06 + R() * .05).toFixed(3),
      style: 'will-change:transform',
    }, g);
    const sp = .05 + R() * .07, ph = R() * 6.28, dx = w * .05 + R() * w * .06;
    anim.push({ node: p, fn: t => p.setAttribute('transform', `translate(${(Math.sin(t * sp + ph) * dx).toFixed(1)},0)`) });
  }
}

/* ───────── 各地點 ───────── */

const BUILDERS = {

  title(c) {
    const { svg, w, h, U, R } = c;
    starField(c, { count: 130, bottom: .50 });
    constellations(c, { count: 3, top: .16, bottom: .46 });
    const mx = w * .76, my = h * .13, mr = U * .058;
    moon(c, mx, my, mr);

    const iy = h * .56;                     // 海平線
    // 遠方海：先鋪一層深色，島才有東西可以站
    el('path', {
      d: tornEdge(-40, w + 40, iy, 5, 60, R) + ` L${w + 40},${h + 40} L-40,${h + 40} Z`,
      fill: '#0A1330',
    }, svg);
    // 月光在水面上的柱狀反光
    // 月光在水面上的柱狀反光。
    // 間距與粗細都用 U：直接用 (h - iy) 分段的話，橫向時 h 很小、
    // 每一段被壓到只剩幾個單位，整條反光會疊成一道實心階梯。
    const refl = el('g', { style: 'mix-blend-mode:screen' }, svg);
    for (let i = 0; i < 16; i++) {
      const yy = iy + U * .02 + i * U * .030;
      if (yy > h + U * .02) break;
      const ww = U * (.03 + i * .006) * (0.6 + R() * .8);
      el('rect', {
        x: mx - ww, y: yy, width: ww * 2, height: U * .005 + R() * U * .004, rx: U * .003,
        fill: PAL.honey, opacity: (.22 - i * .012).toFixed(3),
      }, refl);
    }

    // 島：一整塊剪影 + 一層被月光打到的草地，沒有輪廓線
    const cxI = w * .46, cyI = iy + U * .055;
    el('path', { d: blob(cxI, cyI, U * .33, { n: 13, wob: .15, squash: .30, rnd: R }), fill: '#0B1424' }, svg);
    el('path', { d: blob(cxI - U * .012, cyI - U * .030, U * .295, { n: 13, wob: .17, squash: .22, rnd: R }), fill: '#15243A' }, svg);
    // 海浪拍在岸邊的那一線白
    el('path', {
      d: tornEdge(cxI - w * .30, cxI + w * .30, cyI + U * .045, U * .008, U * .05, R),
      fill: 'none', stroke: PAL.mint, 'stroke-width': U * .004, opacity: .18, filter: 'url(#glow-s)',
    }, svg);

    const ts = U / 900;
    tree(c, cxI - w * .19, cyI - U * .022, ts * .60, { crown: '#0B2422' });
    tree(c, cxI - w * .09, cyI - U * .034, ts * .46, { crown: '#0D2A26' });
    tree(c, cxI + w * .16, cyI - U * .020, ts * .54, { crown: '#0B2422' });
    tree(c, cxI + w * .26, cyI - U * .004, ts * .34, { crown: '#0D2A26' });

    // 燈塔（還沒亮）：岩基 → 塔身 → 欄杆 → 燈室 → 尖頂
    const lx = cxI + w * .045, ly = cyI - U * .050, lh = U * .23, u = U * .001;
    el('path', { d: blob(lx, ly + 10 * u, 78 * u, { n: 8, wob: .3, squash: .5, rnd: R }), fill: '#101A2E' }, svg);
    el('path', { d: `M${lx - 34 * u},${ly} L${lx - 20 * u},${ly - lh} L${lx + 20 * u},${ly - lh} L${lx + 34 * u},${ly} Z`, fill: '#1A2340' }, svg);
    el('path', { d: `M${lx - 27 * u},${ly} L${lx - 16 * u},${ly - lh} L${lx - 4 * u},${ly - lh} L${lx - 12 * u},${ly} Z`, fill: '#2A3556', opacity: .75 }, svg);
    for (let i = 1; i < 4; i++) {
      const yy = ly - lh * (i / 4), k = 34 * u - 14 * u * (i / 4);
      el('path', { d: `M${lx - k},${yy} L${lx + k},${yy}`, stroke: '#0F1730', 'stroke-width': 7 * u, opacity: .7 }, svg);
    }
    // 欄杆
    el('path', { d: `M${lx - 30 * u},${ly - lh} h${60 * u}`, stroke: '#33406B', 'stroke-width': 8 * u, 'stroke-linecap': 'round' }, svg);
    // 燈室：比塔身寬一點，這樣才像燈塔而不是火箭
    el('path', { d: `M${lx - 25 * u},${ly - lh - 4 * u} h${50 * u} v${-40 * u} h${-50 * u} z`, fill: '#0C1226' }, svg);
    el('path', { d: `M${lx - 25 * u},${ly - lh - 44 * u} h${50 * u}`, stroke: '#33406B', 'stroke-width': 8 * u, 'stroke-linecap': 'round' }, svg);
    [-12, 0, 12].forEach(k => el('path', { d: `M${lx + k * u},${ly - lh - 6 * u} v${-36 * u}`, stroke: '#33406B', 'stroke-width': 4 * u, opacity: .8 }, svg));
    el('path', { d: `M${lx - 27 * u},${ly - lh - 46 * u} L${lx},${ly - lh - 78 * u} L${lx + 27 * u},${ly - lh - 46 * u} Z`, fill: '#243056' }, svg);

    waterBands(c, iy + U * .10, { bands: 7, colors: ['#0A1C2C', '#10293C', '#16354C'], amp: 7 });

    // 前景：兩塊礁石把畫面框住，底部就不會空
    rock(c, -w * .05, h - U * .06, U * .30, { fill: '#0A1124', lit: PAL.mint });
    rock(c, w * 1.06, h - U * .03, U * .28, { fill: '#0A1124', lit: PAL.mint });
    reeds(c, w * .16, h + U * .02, { n: 9, hgt: U * .26, spread: U * .10, color: '#070C1C', tip: PAL.mint });
    reeds(c, w * .86, h + U * .02, { n: 8, hgt: U * .23, spread: U * .09, color: '#070C1C', tip: PAL.mint });
  },

  // 地圖只鋪天與海——島本身由 scenes/map.js 直接畫在遊戲場座標裡，
  // 這樣五個地點永遠站在自己的地形上，不會跟背景各畫各的。
  map(c) {
    const { w, h } = c;
    starField(c, { count: 70, bottom: .30 });
    constellations(c, { count: 2, top: .04, bottom: .22 });
    waterBands(c, h * .10, { bands: 9, colors: ['#08192A', '#0B2233', '#0F2B3E'], amp: 6 });
  },

  marsh(c) {
    const { svg, w, h, U, R } = c;
    starField(c, { count: 60, bottom: .30 });
    constellations(c, { count: 1, top: .06, bottom: .24 });
    // 遠山
    el('path', {
      d: tornEdge(-40, w + 40, h * .34, U * .05, U * .16, R) + ` L${w + 40},${h} L-40,${h} Z`,
      fill: '#0C1C2C',
    }, svg);
    // 遠處的林線
    el('path', {
      d: tornEdge(-40, w + 40, h * .40, U * .022, U * .08, R) + ` L${w + 40},${h} L-40,${h} Z`,
      fill: '#08181E',
    }, svg);
    for (let i = 0; i < 7; i++) tree(c, R() * w, h * .415, (U / 900) * (.26 + R() * .2), { crown: '#0A2026' });

    // 中景：一片還沒淹到的濕地
    el('path', {
      d: tornEdge(-40, w + 40, h * .46, U * .018, U * .07, R) + ` L${w + 40},${h} L-40,${h} Z`,
      fill: '#0B2226',
    }, svg);
    reeds(c, w * .22, h * .47, { n: 12, hgt: U * .16, spread: U * .18, color: '#06181A', tip: PAL.mint });
    reeds(c, w * .74, h * .47, { n: 12, hgt: U * .17, spread: U * .18, color: '#06181A', tip: PAL.mint });

    // 水面
    waterBands(c, h * .53, { bands: 6, colors: ['#08202A', '#0B2C31', '#0E3A3C'], amp: U * .008 });

    // 睡蓮 + 水裡的螢光
    for (let i = 0; i < 18; i++) {
      const x = R() * w, y = h * (.56 + R() * .40);
      const rr = U * (.012 + R() * .026);
      el('path', { d: blob(x, y, rr, { n: 8, wob: .3, squash: .36, rnd: R }), fill: '#10382F', opacity: .92 }, svg);
      el('path', { d: blob(x - rr * .2, y - rr * .12, rr * .55, { n: 7, wob: .34, squash: .36, rnd: R }), fill: '#1A5040', opacity: .7 }, svg);
      if (R() < .35) {
        const b = el('circle', { cx: x + rr * .4, cy: y - rr * .3, r: U * .006, fill: PAL.mint, opacity: .8, filter: 'url(#glow-s)' }, svg);
        const ph = R() * 6.28;
        c.anim.push({ node: b, fn: t => b.setAttribute('opacity', (.35 + .5 * Math.sin(t * 1.6 + ph)).toFixed(2)) });
      }
    }
    // 水裡的倒影微光
    for (let i = 0; i < 10; i++) {
      const x = R() * w, y = h * (.55 + R() * .42);
      el('rect', { x: x - w * .05, y, width: U * .10, height: U * .004, rx: U * .002, fill: PAL.mint, opacity: .05 + R() * .06 }, svg);
    }

    // 前景蘆葦：左右各一大叢，中間留空給玩法
    reeds(c, w * .03, h * 1.02, { n: 20, hgt: U * .46, spread: U * .13, tip: PAL.mint, color: '#04120F' });
    reeds(c, w * .98, h * 1.02, { n: 20, hgt: U * .48, spread: U * .13, tip: PAL.mint, color: '#04120F' });
    reeds(c, w * .32, h * 1.05, { n: 9, hgt: U * .22, spread: U * .10, color: '#03100D' });
    reeds(c, w * .70, h * 1.05, { n: 9, hgt: U * .24, spread: U * .10, color: '#03100D' });
  },

  cove(c) {
    const { svg, w, h, U, R } = c;
    starField(c, { count: 100, bottom: .38 });
    constellations(c, { count: 2, top: .05, bottom: .30 });
    const mx = w * .32, my = h * .10;
    moon(c, mx, my, U * .05);

    // 遠處的岬角
    rock(c, w * 1.02, h * .44, U * .30, { fill: '#0D1730' });
    rock(c, -w * .04, h * .48, U * .22, { fill: '#0D1730' });
    el('path', {
      d: tornEdge(-40, w + 40, h * .46, U * .012, U * .10, R) + ` L${w + 40},${h + 40} L-40,${h + 40} Z`,
      fill: '#0A1A2A',
    }, svg);
    // 月光在海上的反光
    const refl = el('g', { style: 'mix-blend-mode:screen' }, svg);
    for (let i = 0; i < 14; i++) {
      const yy = h * .47 + i * U * .026;
      if (yy > h) break;
      const ww = U * (.02 + i * .006) * (.6 + R() * .8);
      el('rect', { x: mx - ww, y: yy, width: ww * 2, height: U * .004, rx: U * .002, fill: PAL.honey, opacity: (.20 - i * .012).toFixed(3) }, refl);
    }

    waterBands(c, h * .50, { bands: 6, colors: ['#0B2436', '#0F3145', '#144055'], amp: U * .012 });
    // 一道一道的白浪
    for (let i = 0; i < 4; i++) {
      const y = h * (.60 + i * .045);
      const p = el('path', {
        d: tornEdge(-60, w + 60, y, U * .006, U * .07, R),
        fill: 'none', stroke: '#CFEFE6', 'stroke-width': U * (.005 - i * .0007),
        opacity: .18 + i * .05, filter: 'url(#glow-s)',
      }, svg);
      const ph = R() * 6.28;
      c.anim.push({ node: p, fn: t => p.setAttribute('transform', `translate(0,${(Math.sin(t * .6 + ph) * U * .008).toFixed(2)})`) });
    }

    // 沙灘
    el('path', {
      d: tornEdge(-40, w + 40, h * .78, U * .010, U * .05, R) + ` L${w + 40},${h + 40} L-40,${h + 40} Z`,
      fill: '#31291B',
    }, svg);
    el('path', {
      d: tornEdge(-40, w + 40, h * .82, U * .008, U * .04, R) + ` L${w + 40},${h + 40} L-40,${h + 40} Z`,
      fill: '#463A26', opacity: .95,
    }, svg);
    // 濕沙上的螢光線
    el('path', {
      d: tornEdge(-40, w + 40, h * .775, U * .008, U * .04, R),
      fill: 'none', stroke: PAL.mint, 'stroke-width': U * .005, opacity: .26, filter: 'url(#glow-m)',
    }, svg);

    // 散落的貝殼、小石頭、漂流木
    for (let i = 0; i < 22; i++) {
      const x = R() * w, y = h * (.84 + R() * .15), s = U * (.008 + R() * .014);
      if (R() < .62) {
        el('path', {
          d: `M${x},${y} l${-s},${-s * .78} a${s},${s * .9} 0 1 1 ${s * 2},0 Z`,
          fill: R() < .4 ? '#8A7048' : '#6E5B44', opacity: .75,
        }, svg);
        el('path', { d: `M${x},${y} l0,${-s * 1.5}`, stroke: '#4A3D28', 'stroke-width': 1.6, opacity: .5 }, svg);
      } else {
        el('ellipse', { cx: x, cy: y, rx: s * .8, ry: s * .55, fill: '#5A4C36', opacity: .6 }, svg);
      }
    }
    el('path', {
      d: `M${w * .06},${h * .93} C${w * .16},${h * .915} ${w * .26},${h * .935} ${w * .34},${h * .92}`,
      stroke: '#3A2F20', 'stroke-width': U * .022, 'stroke-linecap': 'round', fill: 'none',
    }, svg);
  },

  grove(c) {
    const { svg, w, h, U, R } = c;
    starField(c, { count: 46, bottom: .16 });

    // 遠處的林子（霧化，只是層次）
    el('path', {
      d: tornEdge(-40, w + 40, h * .30, U * .02, U * .08, R) + ` L${w + 40},${h} L-40,${h} Z`,
      fill: '#0A1E1C',
    }, svg);
    for (let i = 0; i < 6; i++) {
      const x = R() * w;
      el('path', { d: `M${x - U * .012},${h * .62} L${x - U * .006},${h * .22} L${x + U * .006},${h * .22} L${x + U * .014},${h * .62} Z`, fill: '#0E2622', opacity: .8 }, svg);
      el('path', { d: blob(x, h * .21, U * (.06 + R() * .04), { n: 10, wob: .3, squash: .8, rnd: R }), fill: '#0C2622' }, svg);
    }

    // 中景：兩棵粗樹幹，把畫面框住
    [[w * .06, U * .055], [w * .95, U * .05]].forEach(([tx, tw]) => {
      el('path', {
        d: `M${tx - tw * 1.5},${h} C${tx - tw},${h * .6} ${tx - tw * 1.1},${h * .3} ${tx - tw * .8},${h * .02}
            L${tx + tw * .8},${h * .02} C${tx + tw * 1.1},${h * .3} ${tx + tw},${h * .6} ${tx + tw * 1.5},${h} Z`,
        fill: '#2A1F2E',
      }, svg);
      el('path', {
        d: `M${tx - tw * .5},${h} C${tx - tw * .2},${h * .6} ${tx - tw * .3},${h * .3} ${tx},${h * .02}`,
        stroke: '#3E2F42', 'stroke-width': tw * .5, fill: 'none', opacity: .7,
      }, svg);
    });

    // 地面
    el('path', {
      d: tornEdge(-40, w + 40, h * .70, U * .016, U * .07, R) + ` L${w + 40},${h + 40} L-40,${h + 40} Z`,
      fill: '#0A1F17',
    }, svg);
    el('path', {
      d: tornEdge(-40, w + 40, h * .78, U * .012, U * .055, R) + ` L${w + 40},${h + 40} L-40,${h + 40} Z`,
      fill: '#123024', opacity: .95,
    }, svg);
    // 地上掉落的、還在發光的果子
    for (let i = 0; i < 12; i++) {
      const x = R() * w, y = h * (.80 + R() * .18);
      el('circle', { cx: x, cy: y, r: U * (.006 + R() * .008), fill: PAL.coral, opacity: .5, filter: 'url(#glow-s)' }, svg);
    }
    // 草皮
    for (let i = 0; i < 40; i++) {
      const x = R() * w, y = h * (.72 + R() * .28), s = U * (.008 + R() * .012);
      el('path', { d: `M${x - s},${y} q${s},${-s * 1.7} ${s * 2},0`, fill: 'none', stroke: '#0D2A1C', 'stroke-width': U * .004, 'stroke-linecap': 'round' }, svg);
    }

    // 樹冠壓在最上面：一大片，中間留幾個看得到星星的洞
    const canopy = el('g', {}, svg);
    for (let i = 0; i < 18; i++) {
      const x = (i / 17) * w * 1.1 - w * .05 + (R() - .5) * w * .1;
      const y = h * (.005 + R() * .10);
      const rr = U * (.10 + R() * .09);
      el('path', { d: blob(x, y, rr, { n: 11, wob: .32, squash: .78, rnd: R }), fill: i % 3 ? '#0B2620' : '#10332A' }, canopy);
    }
    // 樹冠裡的燈籠果
    for (let i = 0; i < 16; i++) {
      const x = R() * w, y = h * (.03 + R() * .12);
      const cc = el('circle', { cx: x, cy: y, r: U * (.005 + R() * .006), fill: R() < .4 ? PAL.coral : PAL.amber, opacity: .8, filter: 'url(#glow-s)' }, canopy);
      const ph = R() * 6.28, sp = .8 + R() * 1.6;
      c.anim.push({ node: cc, fn: t => cc.setAttribute('opacity', (.35 + .5 * Math.sin(t * sp + ph)).toFixed(2)) });
    }
    c.anim.push({ node: canopy, fn: t => canopy.setAttribute('transform', `translate(${(Math.sin(t * .4) * w * .006).toFixed(2)},${(Math.sin(t * .3) * w * .004).toFixed(2)})`) });

    // 樹冠縫隙漏下來的月光：一團柔和的暖光，不是幾根柱子
    const shafts = el('g', { style: 'mix-blend-mode:screen' }, svg);
    [[.32, .16, .30], [.66, .12, .24], [.48, .30, .34]].forEach(([px, py, pr]) => {
      el('circle', { cx: w * px, cy: h * py, r: U * pr, fill: 'url(#g-warm)', opacity: .085 }, shafts);
    });
    el('circle', { cx: w * .5, cy: h * .06, r: U * .34, fill: 'url(#g-mint)', opacity: .05 }, shafts);

    reeds(c, w * .18, h * 1.02, { n: 10, hgt: U * .16, spread: U * .12, color: '#08200F' });
    reeds(c, w * .84, h * 1.02, { n: 10, hgt: U * .17, spread: U * .12, color: '#08200F' });
  },

  cliff(c) {
    const { svg, w, h, U, R } = c;
    starField(c, { count: 170, bottom: .68 });
    constellations(c, { count: 4, top: .08, bottom: .56 });
    moon(c, w * .80, h * .13, U * .058);
    // 銀河：一條斜斜的亮帶
    const mw = el('g', { style: 'mix-blend-mode:screen' }, svg);
    el('path', {
      d: `M${-40},${h * .40} Q${w * .5},${h * .10} ${w + 40},${h * .32} L${w + 40},${h * .46} Q${w * .5},${h * .24} ${-40},${h * .54} Z`,
      fill: PAL.cream, opacity: .05, filter: 'url(#glow-xl)',
    }, mw);
    // 雲海
    for (let i = 0; i < 4; i++) {
      const y = h * (.70 + i * .07);
      el('path', {
        d: tornEdge(-60, w + 60, y, 12 + i * 4, 70, R) + ` L${w + 60},${h + 60} L-60,${h + 60} Z`,
        fill: ['#1A2148', '#222A57', '#2A3366', '#333C74'][i], opacity: .55 + i * .1,
      }, svg);
    }
    // 腳下的岩台：小朋友要看得出來「嚕米站在懸崖上」
    el('path', {
      d: tornEdge(-60, w + 60, h - U * .30, U * .035, U * .12, R) + ` L${w + 60},${h + 60} L-60,${h + 60} Z`,
      fill: '#141A33',
    }, svg);
    el('path', {
      d: tornEdge(-60, w + 60, h - U * .30, U * .035, U * .12, R),
      fill: 'none', stroke: PAL.mint, 'stroke-width': U * .004, opacity: .18, filter: 'url(#glow-s)',
    }, svg);
    rock(c, w * .10, h - U * .22, U * .20, { fill: '#1A2140' });
    rock(c, w * .90, h - U * .24, U * .17, { fill: '#1A2140' });
    // 崖邊探出去的幾株草
    reeds(c, w * .26, h - U * .28, { n: 6, hgt: U * .10, spread: U * .06, color: '#0C1226' });
    reeds(c, w * .74, h - U * .29, { n: 5, hgt: U * .09, spread: U * .05, color: '#0C1226' });
  },

  light(c) {
    const { svg, w, h, U, R } = c;
    starField(c, { count: 110, bottom: .42 });
    constellations(c, { count: 2, top: .05, bottom: .28 });
    el('path', {
      d: tornEdge(-40, w + 40, h * .50, U * .01, U * .10, R) + ` L${w + 40},${h} L-40,${h} Z`,
      fill: '#08132A',
    }, svg);
    waterBands(c, h * .54, { bands: 6, colors: ['#0A1A2E', '#0E2440', '#122E50'], amp: U * .01 });

    // 燈塔：以畫面寬度定尺寸，直握橫握都是同一個粗細比例
    // 塔身高度要留得下上面的欄杆、燈室與尖頂（約 U * .20），
    // 否則橫向時整座燈塔會被畫面上緣切掉，只剩一根柱子。
    const lx = w * .70, ly = h * .78;
    const hh = Math.max(U * .22, Math.min(U * .72, ly - U * .21));
    const bw = U * .052, tw = U * .032;

    // 岩基
    rock(c, lx, ly + U * .05, U * .22, { fill: '#141A31' });
    rock(c, lx - U * .16, ly + U * .08, U * .14, { fill: '#111629' });
    rock(c, w * .16, h - U * .04, U * .20, { fill: '#101527' });

    const g = el('g', { class: 'lighthouse' }, svg);
    el('path', {
      d: `M${lx - bw},${ly} L${lx - tw},${ly - hh} L${lx + tw},${ly - hh} L${lx + bw},${ly} Z`,
      fill: '#1B2440',
    }, g);
    // 受光的那一側
    el('path', {
      d: `M${lx - bw * .72},${ly} L${lx - tw * .68},${ly - hh} L${lx - tw * .12},${ly - hh} L${lx - bw * .2},${ly} Z`,
      fill: '#2C3A5E', opacity: .75,
    }, g);
    // 紅白條紋（剪紙感的橫帶）
    for (let i = 1; i < 5; i++) {
      const t = i / 5, yy = ly - hh * t, k = bw + (tw - bw) * t;
      el('path', { d: `M${lx - k},${yy} L${lx + k},${yy}`, stroke: '#0E1730', 'stroke-width': U * .012, opacity: .55 }, g);
    }
    // 平台 + 欄杆
    el('path', { d: `M${lx - tw * 1.5},${ly - hh} h${tw * 3} l${-tw * .3},${-U * .014} h${-tw * 2.4} z`, fill: '#243056' }, g);
    el('path', { d: `M${lx - tw * 1.4},${ly - hh - U * .014} h${tw * 2.8}`, stroke: '#33406B', 'stroke-width': U * .008, 'stroke-linecap': 'round' }, g);
    // 燈室（暗的；結局才會亮）
    const ry = ly - hh - U * .014;
    el('path', { d: `M${lx - tw * .95},${ry} h${tw * 1.9} v${-U * .075} h${-tw * 1.9} z`, fill: '#0C1226' }, g);
    [-.55, 0, .55].forEach(k => el('path', { d: `M${lx + tw * k},${ry} v${-U * .075}`, stroke: '#33406B', 'stroke-width': U * .005, opacity: .8 }, g));
    el('path', { d: `M${lx - tw * 1.1},${ry - U * .075} h${tw * 2.2}`, stroke: '#33406B', 'stroke-width': U * .008, 'stroke-linecap': 'round' }, g);
    el('path', { d: `M${lx - tw * 1.15},${ry - U * .078} L${lx},${ry - U * .135} L${lx + tw * 1.15},${ry - U * .078} Z`, fill: '#243056' }, g);
    el('circle', { cx: lx, cy: ry - U * .142, r: U * .009, fill: '#33406B' }, g);
    c.lampSeat = { x: lx, y: ry - U * .038 };

    // 岸邊的浪花
    el('path', {
      d: tornEdge(lx - w * .3, lx + w * .3, ly + U * .02, U * .006, U * .05, R),
      fill: 'none', stroke: PAL.mint, 'stroke-width': U * .004, opacity: .2, filter: 'url(#glow-s)',
    }, svg);
  },

  finale(c) {
    const { svg, w, h, U, R } = c;
    starField(c, { count: 150, bottom: .55 });
    // 極光帶
    const au = el('g', { style: 'mix-blend-mode:screen' }, svg);
    [[PAL.mint, .10, .22], [PAL.coral, .07, .30], [PAL.honey, .06, .16]].forEach(([col, op, yy], i) => {
      const p = el('path', {
        d: `M${-60},${h * yy} Q${w * .3},${h * (yy - .10)} ${w * .62},${h * yy} T${w + 60},${h * (yy + .04)}
            L${w + 60},${h * (yy + .22)} Q${w * .5},${h * (yy + .10)} ${-60},${h * (yy + .26)} Z`,
        fill: col, opacity: op, filter: 'url(#glow-xl)',
      }, au);
      const ph = R() * 6.28;
      c.anim.push({ node: p, fn: t => p.setAttribute('transform', `translate(${(Math.sin(t * .16 + ph) * 40).toFixed(1)},${(Math.sin(t * .11 + ph) * 12).toFixed(1)})`) });
    });
    waterBands(c, h * .66, { bands: 6, colors: ['#12253F', '#173352', '#1D4166'], amp: 8 });
    // 亮起來的島
    el('path', { d: blob(w * .5, h * .78, U * .34, { n: 12, wob: .24, squash: .5, rnd: R }), fill: '#122A28' }, svg);
    for (let i = 0; i < 6; i++) tree(c, w * (.22 + i * .12), h * .74 + R() * 20, .34 + R() * .2, { crown: '#12332B', lit: PAL.amber });
    // 樹上的燈串
    for (let i = 0; i < 40; i++) {
      const x = w * (.16 + R() * .68), y = h * (.60 + R() * .22);
      const cc = el('circle', { cx: x, cy: y, r: 2.6 + R() * 2.6, fill: R() < .3 ? PAL.mint : PAL.honey, opacity: .8, filter: 'url(#glow-m)' }, svg);
      const ph = R() * 6.28, sp = 1 + R() * 2;
      c.anim.push({ node: cc, fn: t => cc.setAttribute('opacity', (.55 + .45 * Math.sin(t * sp + ph)).toFixed(2)) });
    }
  },
};

export { starField, moon, waterBands, reeds, tree, rock };
