// 手寫感數字。
//
// 沒有用任何系統字型——數字是這個世界的主角，用字型會立刻變成「教材網站」。
// 每個數字是一條粗筆畫路徑，圓筆頭、圓轉角，再套撕紙位移濾鏡，
// 於是每次渲染的邊緣都有一點點不一樣的手感。

import { el, PAL } from './paper.js';

// 座標系：x ∈ [-60,60]，y ∈ [-80,80]，筆畫寬 19
const D = {
  0: ['M0,-56 C24,-56 37,-32 37,0 C37,32 24,56 0,56 C-24,56 -37,32 -37,0 C-37,-32 -24,-56 0,-56Z'],
  1: ['M-22,-34 L4,-57 L4,56', 'M-19,56 L29,56'],
  2: ['M-30,-36 C-26,-58 6,-64 22,-50 C38,-36 29,-13 11,5 L-28,45 L32,45'],
  3: ['M-28,-40 C-16,-60 24,-56 28,-34 C31,-14 12,-6 -2,-6 C14,-6 34,4 32,26 C29,50 -10,62 -30,42'],
  4: ['M18,-57 L-34,21 L36,21', 'M18,-57 L18,56'],
  5: ['M26,-52 L-18,-52 L-25,-8 C-4,-22 30,-14 31,14 C32,42 2,60 -26,46'],
  6: ['M24,-50 C-2,-58 -30,-34 -30,6 C-30,36 -13,56 6,56 C25,56 34,39 32,22 C30,3 11,-8 -6,-3 C-19,1 -27,10 -29,19'],
  7: ['M-30,-48 L30,-48 L2,56'],
  8: ['M0,-4 C-19,-4 -30,-17 -30,-30 C-30,-46 -15,-57 0,-57 C15,-57 30,-46 30,-30 C30,-17 19,-4 0,-4 C-23,-4 -35,10 -35,28 C-35,46 -17,57 0,57 C17,57 35,46 35,28 C35,10 23,-4 0,-4Z'],
  9: ['M-24,50 C2,58 30,36 30,-4 C30,-36 13,-57 -6,-57 C-25,-57 -34,-38 -32,-21 C-30,-2 -11,8 6,3 C19,0 27,-9 29,-18'],
};

let uid = 0;

/**
 * 造一個數字。10 由 1 和 0 併排組成。
 * @returns <g> 元素，內部座標約 ±60 × ±80，外面自己 scale
 */
export function makeGlyph(n, {
  color = PAL.honey, ink = '#2A1E10', width = 19, glow = 'glow-m', torn = null, opacity = 1,
} = {}) {
  const g = el('g', { class: 'glyph', 'data-n': n, opacity });

  const draw = (paths, tx = 0, sc = 1) => {
    const sub = el('g', { transform: `translate(${tx},0) scale(${sc})` }, g);
    const common = {
      fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      ...(torn ? { filter: `url(#${torn})` } : {}),
    };
    // 底層：深色描邊當「紙的厚度」
    paths.forEach(d => el('path', { d, ...common, stroke: ink, 'stroke-width': width + 9, opacity: .55, transform: 'translate(0,3.5)' }, sub));
    // 主體
    paths.forEach(d => el('path', { d, ...common, stroke: color, 'stroke-width': width }, sub));
    // 受光邊：往左上偏一點的亮邊
    paths.forEach(d => el('path', {
      d, ...common, stroke: '#FFF7E2', 'stroke-width': width * .30, opacity: .55,
      transform: 'translate(-2.4,-3.4)',
    }, sub));
  };

  if (n === 10) { draw(D[1], -34, .82); draw(D[0], 32, .82); }
  else draw(D[n] || D[0]);

  if (glow) {
    const halo = el('g', { filter: `url(#${glow})`, opacity: .55, style: 'mix-blend-mode:screen' }, g);
    const src = (n === 10 ? [[D[1], -34, .82], [D[0], 32, .82]] : [[D[n] || D[0], 0, 1]]);
    src.forEach(([paths, tx, sc]) => {
      const sub = el('g', { transform: `translate(${tx},0) scale(${sc})` }, halo);
      paths.forEach(d => el('path', {
        d, fill: 'none', stroke: color, 'stroke-width': width * .8,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      }, sub));
    });
    g.insertBefore(halo, g.firstChild);
  }

  uid++;
  return g;
}

/** 數字的視覺寬度（給排版用），單位同上面的內部座標 */
export const glyphWidth = n => (n === 10 ? 150 : 96);
