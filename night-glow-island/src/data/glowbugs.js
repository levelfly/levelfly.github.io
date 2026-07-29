// 光靈 —— 這一輪玩下來會帶回家的東西。
//
// 一共 12 隻，每完成一個地點得到一隻（隨機，含小機率的金色變體）。
// 一輪最多拿 5 隻，所以想集滿必須再玩幾輪——這是重玩動機的主軸，
// 而且它跟數學無關，純粹是「我想看下一隻長什麼樣」。

import { el, blob, PAL } from '../art/paper.js';
import { makeRng } from '../core/rng.js';

export const GLOWBUGS = [
  { id: 'popo',   name: '波波',   body: '#FFC46B', wing: '#FFE3A3', shape: 'round',  wings: 'moth',   crest: 'antenna' },
  { id: 'mimi',   name: '咪咪',   body: '#6FE3C4', wing: '#B9F5E4', shape: 'round',  wings: 'fairy',  crest: 'leaf' },
  { id: 'nunu',   name: '努努',   body: '#FF8B7A', wing: '#FFC9BE', shape: 'pear',   wings: 'beetle', crest: 'horn' },
  { id: 'suisui', name: '穗穗',   body: '#B9A6FF', wing: '#DCD2FF', shape: 'long',   wings: 'fairy',  crest: 'antenna' },
  { id: 'tata',   name: '噠噠',   body: '#FFE3A3', wing: '#FFF7E2', shape: 'round',  wings: 'beetle', crest: 'crown' },
  { id: 'yoyo',   name: '呦呦',   body: '#7FC7FF', wing: '#CBE8FF', shape: 'pear',   wings: 'moth',   crest: 'leaf' },
  { id: 'lala',   name: '啦啦',   body: '#FF9ECF', wing: '#FFD1EA', shape: 'round',  wings: 'fairy',  crest: 'horn' },
  { id: 'kuku',   name: '咕咕',   body: '#9BE86F', wing: '#D6FFC0', shape: 'long',   wings: 'moth',   crest: 'antenna' },
  { id: 'bibi',   name: '嗶嗶',   body: '#FFD166', wing: '#FFF0BF', shape: 'pear',   wings: 'fairy',  crest: 'crown' },
  { id: 'momo',   name: '摸摸',   body: '#C9A0FF', wing: '#EBDCFF', shape: 'round',  wings: 'beetle', crest: 'leaf' },
  { id: 'zizi',   name: '吱吱',   body: '#5FD8E8', wing: '#BDF3F9', shape: 'long',   wings: 'beetle', crest: 'horn' },
  { id: 'hoho',   name: '齁齁',   body: '#FFB08A', wing: '#FFDCC7', shape: 'pear',   wings: 'moth',   crest: 'crown' },
];

export const byId = id => GLOWBUGS.find(b => b.id === id);

/**
 * 畫一隻光靈。golden=true 是稀有變體（全身鍍金 + 額外光暈）。
 * @returns <g>
 */
export function drawGlowbug(bug, { golden = false, seed = 7 } = {}) {
  const R = makeRng(seed + bug.id.length * 31);
  const g = el('g', { class: 'glowbug', 'data-id': bug.id });
  const body = golden ? '#FFD873' : bug.body;
  const wing = golden ? '#FFF0C0' : bug.wing;

  el('circle', { cx: 0, cy: 6, r: golden ? 96 : 74, fill: 'url(#g-warm)', opacity: golden ? .55 : .3, style: 'mix-blend-mode:screen' }, g);

  // 翅膀
  const wg = el('g', { class: 'gb-wings' }, g);
  if (bug.wings === 'moth') {
    [-1, 1].forEach(s => {
      el('path', {
        d: `M0,-6 C${s * 44},-52 ${s * 78},-30 ${s * 62},4 C${s * 52},30 ${s * 20},24 0,10 Z`,
        fill: wing, opacity: .62, filter: 'url(#torn-s)',
      }, wg);
    });
  } else if (bug.wings === 'fairy') {
    [-1, 1].forEach(s => {
      el('ellipse', { cx: s * 40, cy: -18, rx: 34, ry: 20, fill: wing, opacity: .5, transform: `rotate(${s * -26},${s * 40},-18)` }, wg);
      el('ellipse', { cx: s * 34, cy: 14, rx: 26, ry: 15, fill: wing, opacity: .42, transform: `rotate(${s * 18},${s * 34},14)` }, wg);
    });
  } else {
    [-1, 1].forEach(s => {
      el('path', {
        d: `M0,-22 C${s * 40},-30 ${s * 56},-2 ${s * 40},22 C${s * 22},34 ${s * 6},20 0,6 Z`,
        fill: wing, opacity: .68, filter: 'url(#torn-s)',
      }, wg);
    });
  }

  // 身體
  const shape = bug.shape === 'long' ? { squash: 1.34, r: 34 }
              : bug.shape === 'pear' ? { squash: 1.14, r: 38 }
              : { squash: 1, r: 38 };
  const d = blob(0, 6, shape.r, { n: 11, wob: .1, squash: shape.squash, rnd: R });
  el('path', { d, fill: '#2C2418', opacity: .5, transform: 'translate(0,6)', filter: 'url(#torn-s)' }, g);
  el('path', { d, fill: body, filter: 'url(#torn-s)' }, g);
  el('path', { d, fill: '#FFFDF4', opacity: .35, transform: 'translate(-4,-5) scale(.82)', filter: 'url(#torn-s)' }, g);
  // 肚子的光
  el('circle', { cx: 0, cy: 26, r: 15, fill: PAL.cream, opacity: .9, filter: 'url(#glow-m)' }, g);

  // 頭冠
  if (bug.crest === 'antenna') {
    el('path', { d: 'M-10,-30 C-18,-46 -26,-52 -32,-56 M10,-30 C18,-46 26,-52 32,-56', stroke: '#3A3226', 'stroke-width': 3.6, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('circle', { cx: -32, cy: -56, r: 6, fill: wing, filter: 'url(#glow-s)' }, g);
    el('circle', { cx: 32, cy: -56, r: 6, fill: wing, filter: 'url(#glow-s)' }, g);
  } else if (bug.crest === 'leaf') {
    el('path', { d: 'M0,-32 C-6,-52 -22,-58 -30,-56 C-24,-40 -12,-32 -2,-30 Z', fill: '#2E5C3E', filter: 'url(#torn-s)' }, g);
    el('path', { d: 'M2,-32 C10,-50 24,-54 30,-52 C24,-38 12,-31 2,-30 Z', fill: '#3E7A4E', filter: 'url(#torn-s)' }, g);
  } else if (bug.crest === 'horn') {
    el('path', { d: 'M-4,-34 C-8,-52 -4,-62 4,-66 C6,-56 4,-44 4,-34 Z', fill: wing, filter: 'url(#torn-s)' }, g);
  } else {
    el('path', { d: 'M-22,-34 L-14,-54 L-4,-40 L4,-58 L14,-40 L22,-54 L24,-32 Z', fill: golden ? '#FFF0C0' : PAL.honey, filter: 'url(#torn-s)' }, g);
  }

  // 眼睛
  [-13, 13].forEach(x => {
    el('ellipse', { cx: x, cy: -4, rx: 8, ry: 9.5, fill: '#241B22' }, g);
    el('circle', { cx: x - 2.6, cy: -7, r: 3.2, fill: '#FFFDF4', opacity: .95 }, g);
  });
  el('path', { d: 'M-7,10 C-3,15 3,15 7,10', stroke: '#241B22', 'stroke-width': 2.8, fill: 'none', 'stroke-linecap': 'round' }, g);
  // 腮紅
  el('ellipse', { cx: -25, cy: 6, rx: 8, ry: 5, fill: PAL.coral, opacity: .35 }, g);
  el('ellipse', { cx: 25, cy: 6, rx: 8, ry: 5, fill: PAL.coral, opacity: .35 }, g);

  if (golden) {
    el('circle', { cx: 0, cy: 0, r: 60, fill: 'none', stroke: '#FFF0C0', 'stroke-width': 2, opacity: .5, filter: 'url(#glow-m)' }, g);
  }
  return g;
}

/** 這一輪要送出的光靈：優先給還沒收過的，全收齊了才隨機重複 */
export function pickReward(collected, rand = Math.random) {
  const fresh = GLOWBUGS.filter(b => !collected[b.id]);
  const pool = fresh.length ? fresh : GLOWBUGS;
  const bug = pool[Math.floor(rand() * pool.length)];
  return { bug, golden: rand() < 0.09 };
}
