// 島嶼日記的一頁。
//
// 這一頁是給爸媽看的，不是給她評分的 —— 所以上面**沒有數字、沒有星星、沒有百分比**，
// 只有一條她今晚走過的航線：經過哪幾座島、在哪裡遇到誰、發現了幾種新的分法。
//
// 六歲還不太認字，但她認得自己走過的路。把一晚畫成一張圖，她會指著說
// 「我去了這裡，然後這裡」——那句話本身就是最好的複述。

import { el, blob } from './paper.js';
import { SKY } from './sky.js';
import { skyIsleByKey } from '../data/skyworld.js';

const TYPE_COL = {
  repair: SKY.gold,
  chest: '#E8CFA4',
  spirit: '#8FDCB4',
  rest: '#BFE3F2',
};

/**
 * 把一晚畫成一張圖。
 * @param page  voyage.js 的 diaryPage()
 * @returns <svg>，viewBox 0 0 320 200，外面自己決定要多大
 */
export function diaryFigure(page, { title = '' } = {}) {
  const svg = el('svg', { viewBox: '0 0 320 200', class: 'diary-fig' });
  const isles = page?.isles || [];

  // 底紙
  el('path', {
    d: blob(160, 100, 150, { n: 15, wob: .04, squash: .62 }),
    fill: '#FFFBF2', stroke: '#D9C7A8', 'stroke-width': 2, filter: 'url(#torn-m)',
  }, svg);

  if (!isles.length) {
    el('path', {
      d: 'M90,110 q30,-24 60,0 t60,0', stroke: '#CFC0A6', 'stroke-width': 5,
      fill: 'none', 'stroke-linecap': 'round',
    }, svg);
    return svg;
  }

  // 航線：一條從左下往右上的風
  const pts = isles.map((k, i) => ({
    x: 44 + (232 * (isles.length === 1 ? .5 : i / (isles.length - 1))),
    y: 148 - i * (96 / Math.max(1, isles.length - 1)) + (i % 2 ? -8 : 8),
    key: k, type: page.types?.[i] || 'repair',
  }));

  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    d += ` Q${(a.x + b.x) / 2},${Math.min(a.y, b.y) - 22} ${b.x},${b.y}`;
  }
  el('path', { d, stroke: SKY.sunRim, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', opacity: .8, 'stroke-dasharray': '1 11' }, svg);

  pts.forEach((p, i) => {
    const isle = skyIsleByKey(p.key);
    el('ellipse', { cx: p.x, cy: p.y + 13, rx: 19, ry: 7, fill: '#C9B49B', opacity: .35 }, svg);
    el('path', {
      d: `M${p.x - 19},${p.y} C${p.x - 12},${p.y + 16} ${p.x + 10},${p.y + 18} ${p.x + 19},${p.y} Z`,
      fill: '#DCC6A6',
    }, svg);
    el('path', {
      d: `M${p.x - 19},${p.y} a19,9 0 0 1 38,0 z`,
      fill: isle?.tint || SKY.grass,
    }, svg);
    el('circle', { cx: p.x, cy: p.y - 13, r: 8, fill: TYPE_COL[p.type] || SKY.gold }, svg);
    el('circle', { cx: p.x, cy: p.y - 13, r: 8, fill: 'none', stroke: '#B79A76', 'stroke-width': 1.6, opacity: .6 }, svg);
    if (i === pts.length - 1) el('path', {
      d: `M${p.x},${p.y - 34} l4,9 l10,1 l-7,7 l2,10 l-9,-5 l-9,5 l2,-10 l-7,-7 l10,-1 z`,
      fill: SKY.gold, stroke: '#C9A26A', 'stroke-width': 1.4,
    }, svg);
  });

  // 今晚發現了幾種新分法：畫成右下角幾顆小光，不寫數字。
  for (let i = 0; i < Math.min(8, page.recipes || 0); i++) {
    el('circle', { cx: 246 + (i % 4) * 15, cy: 168 + Math.floor(i / 4) * 15, r: 5, fill: SKY.gold }, svg);
    el('circle', { cx: 246 + (i % 4) * 15, cy: 168 + Math.floor(i / 4) * 15, r: 2.4, fill: '#FFFDF4' }, svg);
  }
  if (page.spirit) {
    el('circle', { cx: 46, cy: 40, r: 13, fill: '#8FDCB4' }, svg);
    el('circle', { cx: 42, cy: 38, r: 2.4, fill: '#3B4B52' }, svg);
    el('circle', { cx: 51, cy: 38, r: 2.4, fill: '#3B4B52' }, svg);
  }
  if (title) el('text', {
    x: 160, y: 30, 'text-anchor': 'middle', fill: '#8A7355',
    'font-size': 15, 'font-family': 'inherit', text: title,
  }, svg);

  return svg;
}
