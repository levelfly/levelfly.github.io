// 光珠與需求槽 —— 晨風群島的兩個核心零件。
//
// 光珠是可以拿起來搬走的一顆光；需求槽是「這裡需要多少」的地方。
// 兩者之間的動作就是整個 6 歲檔的動詞：**分**。
//
// 需求全部用畫面講，一個算式符號都沒有：
//   空位     幾個沒亮的位子 → 需要幾顆
//   一樣多   一條絲帶連到旁邊那一群 → 跟它一樣
//   剩下的   一個敞口的籃子 → 其他的都放這裡
//   標價     價格牌上畫著光幣 → 要付剛好這麼多
//   自由     一個柔邊的空碗 → 有光就好，怎麼分你決定
//
// 這是刻意的：6 歲要先有具體物的經驗，符號是後面的事（也因此 glyphs.js 只有 0～10 就夠）。

import { el, blob } from './paper.js';
import { makeGlyph } from './glyphs.js';
import { Prop } from './props.js';
import { Spring, FEEL } from '../core/spring.js';
import { onTick } from '../core/ticker.js';
import { SKY } from './sky.js';

/* ───────────────────────── 光珠 ───────────────────────── */

/**
 * 一顆光。面值 1 是純粹的光；5 和 10 是光幣（市集才會出現）。
 * 光幣上寫數字是唯一的例外 —— 錢幣本來就是符號系統，一年級課綱也是這樣教的。
 */
export function makeOrb(layer, value = 1, { size = 60, x = 0, y = 0, seed } = {}) {
  const p = new Prop(layer, { x, y, size, drift: .55, seed });
  const g = p.art;
  p.value = value;
  p.node.dataset.orb = String(value);
  p.node.classList.add('orb');

  // 尺寸是配著托盤的格子（半徑 u*.34，也就是內部座標的 68）長的。
  // 畫小了在日出的天空上會直接消失 —— 亮底沒有夜色可以襯，光只能靠實體大小被看見。
  if (value === 1) {
    p.halo = el('circle', { cx: 0, cy: 0, r: 96, fill: 'url(#g-warm)', opacity: .55 }, g);
    el('circle', { cx: 0, cy: 6, r: 70, fill: '#C98A4E', opacity: .32 }, g);
    el('circle', { cx: 0, cy: 0, r: 68, fill: SKY.gold }, g);
    el('circle', { cx: 0, cy: 0, r: 68, fill: 'none', stroke: '#E9A24E', 'stroke-width': 4, opacity: .55 }, g);
    el('circle', { cx: 0, cy: 0, r: 44, fill: '#FFFDF4', opacity: .95 }, g);
    el('ellipse', { cx: -22, cy: -24, rx: 17, ry: 11, fill: '#FFFFFF', opacity: .8, transform: 'rotate(-28,-22,-24)' }, g);
  } else {
    const rim = value === 10 ? '#6FAECF' : '#D9A25E';
    const face = value === 10 ? '#DCF0F8' : '#FFEEC6';
    p.halo = el('circle', { cx: 0, cy: 0, r: 94, fill: 'url(#g-warm)', opacity: .38 }, g);
    el('circle', { cx: 0, cy: 6, r: 72, fill: '#9A7A52', opacity: .32 }, g);
    el('circle', { cx: 0, cy: 0, r: 70, fill: face }, g);
    el('circle', { cx: 0, cy: 0, r: 70, fill: 'none', stroke: rim, 'stroke-width': 8 }, g);
    el('circle', { cx: 0, cy: 0, r: 54, fill: 'none', stroke: rim, 'stroke-width': 3, opacity: .5 }, g);
    const gl = makeGlyph(value, { color: value === 10 ? '#3E7C9A' : '#B07B2E', ink: '#FFF6E0', width: 15, glow: null });
    gl.setAttribute('transform', 'scale(0.62)');
    g.appendChild(gl);
  }
  return p;
}

/* ───────────────────────── 需求槽 ───────────────────────── */

/**
 * 一個托盤。它自己知道要幾顆、現在有幾顆、每一格在畫面上的哪裡。
 *
 * 尺寸用「一顆光珠多大」倒推，不是先決定托盤再塞光珠 ——
 * 這樣不管直握橫握、需要 2 顆還是 10 顆，光珠永遠是同一個好按的大小。
 */
export class Tray {
  constructor(layer, slot, { x = 0, y = 0, orb = 60, tint = SKY.gold, motif = 'petal', capHint = 0 } = {}) {
    this.slot = slot;
    this.x = x; this.y = y;
    this.orbPx = orb;
    this.tint = tint;
    this.motif = motif;
    this.orbs = [];                    // 已經放進來的光珠

    // 🔴 需求「看得見」的槽（空位、十格框）＝ 位子就是物理容量，塞不下第 n+1 顆是誠實的。
    //    需求「看不見」的槽（一樣多、標價、剩下的、自由）**不能**用容量偷偷擋住她 ——
    //    那等於幫她把答案圍出來，這一題就不用想了。
    //    而且它們的碗一律照 capHint（今晚這一題的總光數）畫成同樣大，
    //    否則碗的大小本身就洩漏了答案。
    const L = trayLayout(slot, orb, capHint);
    this.visible = L.visible;
    this.cells = L.cells;
    this.pts = L.pts;
    this.allPts = L.allPts;
    this.sc = new Spring(0, FEEL.bouncy);
    this.rot = new Spring(0, { stiffness: 150, damping: 11 });
    this.t = 0; this.alive = true;

    this.w = L.w; this.h = L.h; this.cy = L.cy;

    this.node = document.createElement('div');
    this.node.className = 'tray';
    this.node.dataset.kind = slot.kind;
    this.node.style.cssText =
      `position:absolute;left:0;top:0;width:${this.w}px;height:${this.h}px;` +
      `margin-left:${-this.w / 2}px;margin-top:${-this.h / 2}px;will-change:transform`;
    layer.appendChild(this.node);

    this.svg = el('svg', {
      viewBox: `${(-this.w / 2).toFixed(1)} ${(this.cy - this.h / 2).toFixed(1)} ${this.w.toFixed(1)} ${this.h.toFixed(1)}`,
      width: this.w, height: this.h, style: 'overflow:visible',
    }, this.node);
    this.art = el('g', {}, this.svg);

    this.sockets = [];
    draw(this);

    this.off = onTick(dt => this.tick(dt));
  }

  /**
   * 光珠該擺在哪。
   *
   * 有格子的槽（空位／十格框）照格子擺 —— 格子在哪就是哪，那是它的意義。
   * 沒有格子的碗（一樣多／標價／剩下的／自由）**每放一顆就重排一次**，
   * 讓那一堆永遠是置中的一小群。照固定格子擺的話，第一顆會孤零零地卡在左上角，
   * 看起來像放錯地方了。
   */
  layoutPts() {
    if (this.visible) return this.pts;
    return gridPoints(Math.max(1, this.orbs.length), this.orbPx, this.slot);
  }
  socketAt(i) {
    const pts = this.layoutPts();
    const p = pts[Math.min(i, pts.length - 1)] || { dx: 0, dy: 0 };
    // 格子在 SVG 裡畫在 (dx, cy+dy)，而 viewBox 的原點就是 cy，
    // 所以換算回螢幕剛好抵銷掉 —— 這裡再減一次 cy 就會整排往下偏半個光珠。
    return { x: this.x + p.dx, y: this.y + p.dy };
  }

  /** 現在裝了多少（光幣算面值，不是顆數） */
  get value() { return this.orbs.reduce((a, o) => a + (o.value || 1), 0); }

  /** 這個槽滿足了嗎 */
  get ok() {
    const s = this.slot;
    if (s.kind === 'free') return this.value >= (s.min || 1);
    return this.value === s.need;
  }
  /** 還收得下嗎。看得見需求的槽收滿就停（位子就這麼多）；看不見的收到碗的容量為止。 */
  get full() {
    if (this.visible) return this.value >= this.slot.need;
    return this.orbs.length >= this.cells;
  }

  accept(orb) {
    this.orbs.push(orb);
    this.relayout();                       // 沒格子的碗每收一顆就重新置中
    return this.orbs.length - 1;
  }
  release(orb) {
    const i = this.orbs.indexOf(orb);
    if (i < 0) return -1;
    this.orbs.splice(i, 1);
    this.relayout();
    return i;
  }
  /** 拿走一顆之後，剩下的往前遞補，格子的亮暗也要跟著改 */
  relayout() {
    this.sockets.forEach((_, i) => this.lightSocket(i, i < this.orbs.length));
    this.orbs.forEach((o, i) => { const p = this.socketAt(i); o.x = p.x; o.y = p.y; });
  }
  lightSocket(i, on) {
    const s = this.sockets[i];
    if (!s) return;
    s.setAttribute('opacity', on ? '0' : '1');     // 有光珠蓋在上面時，空格自己讓開
  }

  /** 空格輕輕呼吸：卡住的時候用，不是常態 —— 一直閃會變成催促 */
  pulse(on = true) {
    this.node.classList.toggle('tray-pulse', on);
  }

  shy() {
    this.sc.set(.94).to(1);
    this.rot.kick(7); setTimeout(() => this.rot.kick(-11), 90); setTimeout(() => this.rot.kick(7), 180);
  }
  celebrate() { this.sc.set(1.12).to(1); this.rot.kick((Math.random() - .5) * 6); }
  appear(delay = 0) { this.sc.set(0); setTimeout(() => this.sc.to(1), delay * 1000); return this; }
  setPos(x, y) { this.x = x; this.y = y; return this; }

  destroy() { this.off?.(); this.node.remove(); this.alive = false; }

  tick(dt) {
    this.t += dt;
    this.sc.step(dt); this.rot.step(dt);
    const bob = Math.sin(this.t * .9) * 2.4;
    this.node.style.transform =
      `translate3d(${this.x.toFixed(1)}px,${(this.y + bob).toFixed(1)}px,0)` +
      ` rotate(${this.rot.value.toFixed(2)}deg) scale(${Math.max(0, this.sc.value).toFixed(3)})`;
  }
}

/* ───────────────────────── 版面計算 ───────────────────────── */

/**
 * 一個托盤要多大、格子在哪。
 *
 * 場景要先知道「這幾個托盤加起來排不排得下」才能決定光珠多大，
 * 但托盤的大小又是從光珠推出來的 —— 所以把純計算的部分抽出來，
 * 場景可以先算不畫。Tray 自己也用同一份，不會有兩套版面規則。
 *
 * 🔴 需求看不見的槽（一樣多／標價／剩下的／自由）一律照 capHint 畫成同樣大。
 *    照 need 畫的話，碗的大小本身就把答案說出去了。
 */
export function trayLayout(slot, orb, capHint = 0) {
  const visible = slot.kind === 'sockets';
  const cells = visible
    ? (slot.filled || 0) + slot.need
    : Math.min(10, Math.max(3, capHint || slot.need + 2));
  const allPts = gridPoints(cells, orb, slot);
  const box = bbox(allPts, orb, slot);
  return {
    visible, cells, allPts,
    pts: visible ? allPts.slice(slot.filled || 0) : allPts,
    w: box.w, h: box.h, cy: box.cy,
  };
}

/**
 * 格子的排法。
 * 剛好十格一定排成 5＋5 —— 那是十格框（ten frame），湊十的整個直覺都靠它，
 * 排成別的樣子就只是十個圓圈。
 */
function gridPoints(n, orb, slot) {
  const gap = orb * 1.16;
  const isTenFrame = slot.kind === 'sockets' && (slot.filled || 0) + slot.need === 10;
  let cols;
  if (isTenFrame) cols = 5;
  else if (n <= 3) cols = n;
  else if (n <= 6) cols = Math.ceil(n / 2);
  else cols = Math.ceil(n / 2);
  const rows = Math.ceil(n / cols);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const inRow = Math.min(cols, n - r * cols);
    pts.push({
      dx: (c - (inRow - 1) / 2) * gap,
      dy: (r - (rows - 1) / 2) * gap,
    });
  }
  return pts;
}

/** 托盤外框：格子的範圍 + 邊距，再替特別的槽留出裝飾空間 */
function bbox(pts, orb, slot) {
  const xs = pts.map(p => p.dx), ys = pts.map(p => p.dy);
  const pad = orb * .58;
  const left = Math.min(...xs) - pad, right = Math.max(...xs) + pad;
  const top = Math.min(...ys) - pad, bot = Math.max(...ys) + pad;
  // 上方要放的東西：一樣多的參考群、價格牌
  const head = (slot.kind === 'mirror' || slot.kind === 'price') ? orb * 1.5 : orb * .5;
  const w = Math.max(orb * 2.2, right - left);
  const h = (bot - top) + head;
  return { w, h, cy: (top + bot) / 2 - head / 2 };
}

/* ───────────────────────── 畫托盤 ───────────────────────── */

function draw(tray) {
  const { art, slot, orbPx: u, tint } = tray;
  const w = tray.w, h = tray.h, cy = tray.cy;
  const R = Math.random;

  // 盤身：一塊撕過的紙。亮天空上不能用深色，會讀成「壞掉了」，所以是奶油白＋暖邊。
  const body = blob(0, cy, Math.max(w, h) * .48, { n: 13, wob: .07, squash: h / Math.max(w, h) * 1.02, rnd: R });
  el('path', { d: body, fill: '#C8A87E', opacity: .30, transform: 'translate(0,7)', filter: 'url(#torn-m)' }, art);
  el('path', { d: body, fill: SKY.cream, filter: 'url(#torn-m)' }, art);
  el('path', { d: body, fill: tint, opacity: .22, filter: 'url(#torn-m)' }, art);
  el('path', { d: body, fill: 'none', stroke: SKY.soilDeep, 'stroke-width': 3, opacity: .38, filter: 'url(#torn-m)' }, art);

  const KIND = {
    /* 空位：沒亮的位子畫成虛線圈，亮著的畫成實心的光。
       一眼就知道「還缺幾個」，不需要任何數字。 */
    sockets() {
      const filled = slot.filled || 0;
      // 已經在那裡的光（池子外的既有物）畫在格子的最前面，她要填的是後面那幾格
      const all = tray.allPts;
      all.forEach((p, i) => {
        if (i < filled) {
          el('circle', { cx: p.dx, cy: cy + p.dy, r: u * .34, fill: SKY.gold }, art);
          el('circle', { cx: p.dx, cy: cy + p.dy, r: u * .21, fill: '#FFFDF4', opacity: .9 }, art);
        } else {
          tray.sockets.push(el('circle', {
            cx: p.dx, cy: cy + p.dy, r: u * .34, fill: 'none',
            stroke: SKY.soilDeep, 'stroke-width': 3.4, 'stroke-dasharray': '7 9',
            'stroke-linecap': 'round', opacity: .62, class: 'tr-socket',
          }, art));
        }
      });
      // 十格框：把 5＋5 框起來，湊十的直覺靠這個框
      if (filled + slot.need === 10) {
        const gap = u * 1.16;
        el('rect', {
          x: -gap * 2.5, y: cy - gap, width: gap * 5, height: gap * 2,
          rx: u * .22, fill: 'none', stroke: SKY.soilDeep, 'stroke-width': 3, opacity: .34,
        }, art);
        el('path', { d: `M0,${cy - gap} v${gap * 2}`, stroke: SKY.soilDeep, 'stroke-width': 3, opacity: .34 }, art);
      }
    },

    /* 一樣多：上面畫著參考的那一群，一條絲帶垂下來連到一個**空的**盤子。
       盤子裡刻意不畫格子 —— 畫了就等於把答案圈出來，她就不必去數對面了。
       要先數對面有幾個才知道自己要拿幾顆，那一步就是比較。 */
    mirror() {
      const refPts = gridPoints(slot.ref, u * .62, { kind: 'sockets', need: slot.ref, filled: 0 });
      const top = cy - h / 2 + u * .72;
      refPts.forEach(p => {
        el('circle', { cx: p.dx, cy: top + p.dy * .8, r: u * .21, fill: SKY.gold, opacity: .95 }, art);
        el('circle', { cx: p.dx, cy: top + p.dy * .8, r: u * .12, fill: '#FFFDF4' }, art);
      });
      el('path', {
        d: `M0,${top + u * .5} C${u * .3},${top + u * .9} ${-u * .3},${cy - u * .9} 0,${cy - u * .55}`,
        stroke: tint, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', opacity: .75,
      }, art);
      el('path', {
        d: blob(0, cy, Math.min(w, h) * .30, { n: 11, wob: .1, rnd: R }),
        fill: 'none', stroke: tint, 'stroke-width': 4.5, 'stroke-dasharray': '13 12',
        'stroke-linecap': 'round', opacity: .7,
      }, art);
    },

    /* 剩下的全部：一個敞口的籃子。沒有格子，因為「剩下」本來就不該先被數出來 ——
       她把剩的倒進去，嚕米才幫她數，那個順序才是加減互逆的鋪墊。 */
    rest() {
      el('path', {
        d: `M${-w * .34},${cy - u * .5} C${-w * .30},${cy + u * .75} ${w * .30},${cy + u * .75} ${w * .34},${cy - u * .5}`,
        fill: 'none', stroke: SKY.soilDeep, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .5,
      }, art);
      el('path', {
        d: `M${-w * .30},${cy - u * .5} h${w * .60}`,
        stroke: SKY.soilDeep, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .32,
      }, art);
      // 一圈往內收的風：暗示「都掃進來」
      el('path', {
        d: `M${-u * .55},${cy - u * .05} a${u * .55},${u * .40} 0 1 1 ${u * .55},${u * .40}`,
        fill: 'none', stroke: tint, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .55,
      }, art);
    },

    /* 標價：價格牌上直接畫著要付的光幣。
       7 元畫成一枚 5 和兩枚 1 —— 換算的答案就攤在她眼前，她只要照著付。 */
    price() {
      const coins = breakdown(slot.need);
      const top = cy - h / 2 + u * .70;
      const cw = u * .46;
      el('path', {
        d: `M${-cw * coins.length / 2 - u * .3},${top - u * .42} h${cw * coins.length + u * .6} a${u * .12},${u * .12} 0 0 1 ${u * .12},${u * .12} v${u * .6} a${u * .12},${u * .12} 0 0 1 ${-u * .12},${u * .12} h${-cw * coins.length - u * .6} z`,
        fill: '#FFF6E6', stroke: SKY.soilDeep, 'stroke-width': 3, opacity: .95, filter: 'url(#torn-s)',
      }, art);
      coins.forEach((v, i) => {
        const cx = (i - (coins.length - 1) / 2) * cw;
        el('circle', { cx, cy: top, r: u * .19, fill: v === 10 ? '#DCF0F8' : v === 5 ? '#FFEEC6' : SKY.gold }, art);
        el('circle', { cx, cy: top, r: u * .19, fill: 'none', stroke: v === 10 ? '#8FC6E0' : '#E9C07A', 'stroke-width': 2.6 }, art);
      });
      el('path', {
        d: `M0,${top + u * .34} v${u * .34}`, stroke: SKY.soilDeep, 'stroke-width': 3, opacity: .4, 'stroke-linecap': 'round',
      }, art);
      // 錢袋也是空的：畫格子等於指定她要用幾枚硬幣，那就沒有「五個一元換一個五元」了。
      el('path', {
        d: blob(0, cy, Math.min(w, h) * .30, { n: 11, wob: .1, rnd: R }),
        fill: 'none', stroke: tint, 'stroke-width': 4.5, 'stroke-dasharray': '13 12',
        'stroke-linecap': 'round', opacity: .7,
      }, art);
    },

    /* 自由：一個柔邊的空碗，什麼都沒規定。
       這是多解的入口 —— 8 分成 5 和 3 或 4 和 4，兩個碗都不會告訴她該放幾顆。 */
    free() {
      el('path', {
        d: blob(0, cy, Math.min(w, h) * .34, { n: 11, wob: .1, rnd: R }),
        fill: 'none', stroke: tint, 'stroke-width': 5, 'stroke-dasharray': '13 12',
        'stroke-linecap': 'round', opacity: .8,
      }, art);
      el('circle', { cx: 0, cy: cy, r: Math.min(w, h) * .26, fill: tint, opacity: .12 }, art);
    },
  };
  (KIND[slot.kind] || KIND.free)();
}

/** 把一個金額拆成光幣（10 / 5 / 1），用來畫價格牌 */
export function breakdown(n) {
  const out = [];
  let v = n;
  while (v >= 10) { out.push(10); v -= 10; }
  while (v >= 5) { out.push(5); v -= 5; }
  while (v >= 1) { out.push(1); v -= 1; }
  return out;
}

/** 光珠飛回燈籠時留下的一縷霧（「拖錯只是化成霧」，不是被拿走） */
export function mistPuff(layer, x, y, tint = SKY.cream) {
  const g = el('svg', {
    viewBox: '-50 -50 100 100', width: 90, height: 90,
    style: `position:absolute;left:${x - 45}px;top:${y - 45}px;pointer-events:none;overflow:visible`,
  });
  layer.appendChild(g);
  const p = el('path', { d: blob(0, 0, 30, { n: 9, wob: .3, squash: .7 }), fill: tint, opacity: .55 }, g);
  let t = 0;
  const off = onTick(dt => {
    t += dt;
    p.setAttribute('opacity', String(Math.max(0, .55 - t * .8)));
    g.style.transform = `translateY(${(-t * 34).toFixed(1)}px) scale(${(1 + t * .7).toFixed(2)})`;
    if (t > .8) { off(); g.remove(); }
  });
}
