// 晨風群島的光靈。
//
// 跟夜光島的螢火蟲圖鑑刻意不一樣：那邊是「收集到第幾隻」，這邊是「牠記得你做過什麼」。
//
// 🔴 兩條界線：
// 1. **不比較、不排名、不做稀有壓迫。** 沒有金色版、沒有彩虹版，
//    因為 4 歲檔那套是綁「零錯＋不亂點」的表現評級，搬過來就變成「我不夠好所以牠不亮」。
// 2. **客製化只增加表達，不增加學習優勢。** 花紋不影響任何題目。
//    而且花紋不是從選單挑的 —— 是她發現的拆法愈多，可以畫的花紋就愈多。
//    有實證的性別差異只有「偏好替換配件而非改體型」，所以能換的是花紋與光色，體型固定。

import { el } from '../art/paper.js';
import { SKY } from '../art/sky.js';

export const SKY_SPIRITS = [
  { id: 'weiwei', name: '微微', hue: '#8FDCB4', note: '住在雲上花園的風裡' },
  { id: 'lulu',   name: '嚕嚕', hue: '#FFD9A8', note: '喜歡跟著風車轉' },
  { id: 'dida',   name: '滴答', hue: '#BEE9F5', note: '水瀑島的水花變的' },
  { id: 'dingdo', name: '叮多', hue: '#FFE9A8', note: '市集鈴鐺上的光' },
  { id: 'chenchen', name: '晨晨', hue: '#FFC9A0', note: '每天第一道光' },
  { id: 'piaopiao', name: '飄飄', hue: '#D8C7F0', note: '常常睡著飄走' },
  { id: 'nuannuan', name: '暖暖', hue: '#FFB6A0', note: '抱起來熱熱的' },
  { id: 'xixi',   name: '希希', hue: '#A8E0EC', note: '會學嚕米說話' },
];

export const spiritById = id => SKY_SPIRITS.find(s => s.id === id);

/** 花紋。解鎖來源是「發現過幾種拆法」——她做的數學，直接變成她的光靈長什麼樣。 */
export const PATTERNS = [
  { id: 0, name: '素的' },
  { id: 1, name: '小圓點', need: 2 },
  { id: 2, name: '條紋', need: 4 },
  { id: 3, name: '星星', need: 7 },
  { id: 4, name: '花瓣', need: 11 },
  { id: 5, name: '波浪', need: 16 },
];

/** 現在可以用的花紋（依她發現過的拆法總數） */
export function unlockedPatterns(store) {
  const n = store.recipeCount();
  return PATTERNS.filter(p => !p.need || n >= p.need);
}

/**
 * 畫一隻光靈。
 * @returns <g>，內部座標約 ±100
 */
export function drawSpirit(spirit, { pat = 0, sleepy = false } = {}) {
  const g = el('g', { class: 'spirit' });
  const hue = spirit?.hue || SKY.gold;

  el('circle', { cx: 0, cy: 0, r: 92, fill: 'url(#g-warm)', opacity: .34 }, g);

  // 翅膀：兩片半透明的葉子，先畫才會在身體後面
  const wings = el('g', {}, g);
  [-1, 1].forEach(s => el('ellipse', {
    cx: s * 52, cy: -18, rx: 34, ry: 22, fill: '#FFFFFF', opacity: .48,
    transform: `rotate(${s * 26},${s * 52},-18)`,
  }, wings));

  el('circle', { cx: 0, cy: 6, r: 58, fill: '#A98459', opacity: .22 }, g);
  el('circle', { cx: 0, cy: 0, r: 58, fill: hue }, g);
  el('circle', { cx: -18, cy: -20, r: 20, fill: '#FFFFFF', opacity: .34 }, g);

  drawPattern(g, pat, hue);

  // 臉：兩顆眼睛跟一張很小的嘴。眼睛大、間距寬 = 幼態，看起來就想摸。
  if (sleepy) {
    el('path', { d: 'M-26,-4 q10,10 20,0 M6,-4 q10,10 20,0', stroke: '#3B4B52', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, g);
  } else {
    el('circle', { cx: -17, cy: -4, r: 8.5, fill: '#3B4B52' }, g);
    el('circle', { cx: 17, cy: -4, r: 8.5, fill: '#3B4B52' }, g);
    el('circle', { cx: -14, cy: -7, r: 3, fill: '#FFFFFF' }, g);
    el('circle', { cx: 20, cy: -7, r: 3, fill: '#FFFFFF' }, g);
  }
  el('path', { d: 'M-7,16 q7,7 14,0', stroke: '#3B4B52', 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }, g);
  // 兩坨腮紅
  el('ellipse', { cx: -34, cy: 12, rx: 11, ry: 7, fill: '#FF9B8A', opacity: .5 }, g);
  el('ellipse', { cx: 34, cy: 12, rx: 11, ry: 7, fill: '#FF9B8A', opacity: .5 }, g);

  return g;
}

function drawPattern(g, pat, hue) {
  const ink = shade(hue);
  const clip = el('g', { opacity: .55 }, g);
  const inside = (cx, cy, r = 0) => Math.hypot(cx, cy) + r < 56;
  if (pat === 1) {
    [[-30, 22], [0, 34], [30, 22], [-38, -8], [38, -8], [0, -38]].forEach(([x, y]) => {
      if (inside(x, y, 7)) el('circle', { cx: x, cy: y, r: 7, fill: ink }, clip);
    });
  } else if (pat === 2) {
    [-34, -12, 10, 32].forEach(x => el('path', {
      d: `M${x},-48 q8,48 0,96`, stroke: ink, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round',
      opacity: .8, transform: 'scale(1,0.86)',
    }, clip));
  } else if (pat === 3) {
    [[0, -30], [-30, 16], [30, 16]].forEach(([x, y]) => el('path', {
      d: `M${x},${y - 15} l5,11 l12,1 l-9,8 l3,12 l-11,-6 l-11,6 l3,-12 l-9,-8 l12,-1 z`, fill: ink,
    }, clip));
  } else if (pat === 4) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      el('ellipse', {
        cx: Math.cos(a) * 26, cy: Math.sin(a) * 26, rx: 15, ry: 9, fill: ink, opacity: .7,
        transform: `rotate(${(a * 180 / Math.PI).toFixed(1)},${Math.cos(a) * 26},${Math.sin(a) * 26})`,
      }, clip);
    }
  } else if (pat === 5) {
    [-24, 0, 24].forEach(y => el('path', {
      d: `M-46,${y} q14,-12 28,0 t28,0`, stroke: ink, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round',
    }, clip));
  }
}

/** 同色系但更深一階，當花紋的墨色。亮底上不要用黑，紙感會死掉。 */
function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = 0.62;
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
}

/** 今晚會遇到誰：還沒收過的優先，都收過了就挑一隻回來串門子。 */
export function pickSpirit(store, rand = Math.random) {
  const owned = store.spirits;
  const fresh = SKY_SPIRITS.filter(s => !owned[s.id]);
  const pool = fresh.length ? fresh : SKY_SPIRITS;
  return pool[Math.floor(rand() * pool.length)];
}
