// 夜光島的五個地方，以及每個地方會出什麼題。
//
// 兩個學習支柱：
//   listen   聽到一個數字 → 從畫面中找到那個數字（符號辨識）
//   count    看到一群東西 → 選出對應的數字（數量 ↔ 符號）
// 燈塔那一關再加上反過來的 quantity：聽到數字 → 選出那麼多的一群。
//
// 難度不是關卡寫死的，是跟著小朋友走的（見 pickOptions）。

export const AREAS = [
  {
    key: 'marsh', name: '螢火沼澤', voice: 'area_marsh',
    motif: 'firefly', holder: 'lantern', tint: '#FFE3A3',
    modes: ['count', 'listen'], range: [1, 5], questions: 5,
    lampAt: { x: .21, y: .63 }, band: { y0: .06, y1: .52 },
  },
  {
    key: 'cove', name: '貝殼海灘', voice: 'area_cove',
    motif: 'shell', holder: 'shell', tint: '#FFC46B',
    modes: ['listen', 'count'], range: [1, 5], questions: 5,
    lampAt: { x: .63, y: .80 }, band: { y0: .30, y1: .72 },
  },
  {
    key: 'grove', name: '果實樹林', voice: 'area_grove',
    motif: 'berry', holder: 'leaf', tint: '#FF8B7A',
    modes: ['count', 'listen'], range: [3, 8], questions: 5,
    lampAt: { x: .80, y: .44 }, band: { y0: .06, y1: .46 },
  },
  {
    key: 'cliff', name: '星星懸崖', voice: 'area_cliff',
    motif: 'star', holder: 'star', tint: '#FFE3A3',
    modes: ['listen', 'count'], range: [4, 10], questions: 5,
    lampAt: { x: .25, y: .24 }, band: { y0: .08, y1: .54 },
  },
  {
    key: 'light', name: '燈塔', voice: 'area_light',
    motif: 'firefly', holder: 'bubble', tint: '#6FE3C4',
    modes: ['listen', 'count', 'quantity'], range: [2, 10], questions: 6,
    lampAt: { x: .60, y: .13 }, band: { y0: .10, y1: .58 }, final: true,
  },
];

export const areaByKey = k => AREAS.find(a => a.key === k);

/**
 * 出一題。
 * @param area   地點設定
 * @param i      這是這個地點的第幾題（0-based）
 * @param skill  { streakRight, streakWrong, seen:Set }
 * @param rand   亂數
 */
export function makeQuestion(area, i, skill, rand, cycle = 0) {
  const mode = area.modes[Math.floor(rand() * area.modes.length)];

  // 週目影響：二週目範圍擴大、選項變多；三週目再更難一點
  const [baseLo, baseHi] = area.range;
  const lo = baseLo;
  const hiFull = Math.min(10, baseHi + cycle * 2);

  // 選項數量跟著表現與週目走：連錯變簡單，連對 / 高週目變難
  let opts = 3;
  if (skill.streakWrong >= 2) opts = 2;
  else if (skill.streakRight >= 3 || cycle >= 2) opts = Math.min(5, 4 + cycle - 1);
  else if (skill.streakRight >= 1 || cycle >= 1) opts = Math.min(4, 3 + cycle);
  opts = Math.min(5, Math.max(2, opts));

  // 範圍：前兩題偏小，後面才放大
  const hi = i < 2 ? Math.max(lo + 1, Math.round(lo + (hiFull - lo) * 0.6)) : hiFull;

  // 盡量不要連續出同一個數字
  let answer, guard = 0;
  do { answer = lo + Math.floor(rand() * (hi - lo + 1)); guard++; }
  while (guard < 12 && skill.recent.includes(answer));
  skill.recent = [answer, ...skill.recent].slice(0, 2);

  return { mode, answer, options: pickOptions(answer, opts, lo, hiFull, rand), area };
}

/** 誘答項：先放鄰近數字，再補一些較遠的，避免每次題型都長得一樣 */
function pickOptions(answer, n, lo, hi, rand) {
  const set = new Set([answer]);
  const near = [answer - 1, answer + 1, answer - 2, answer + 2, answer - 3, answer + 3];
  for (const v of near) {
    if (set.size >= n) break;
    if (v >= Math.max(1, lo - 1) && v <= Math.min(10, hi + 1)) set.add(v);
  }
  // 若選項還不夠，補上離答案較遠的數字，讓小朋友無法只靠「差一」猜
  let guard = 0;
  while (set.size < n && guard++ < 50) {
    const v = lo + Math.floor(rand() * (hi - lo + 1));
    set.add(v);
  }
  const arr = [...set].slice(0, n);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const newSkill = () => ({ streakRight: 0, streakWrong: 0, recent: [], best: 0 });

export function recordAnswer(skill, ok) {
  if (ok) {
    skill.streakRight++; skill.streakWrong = 0;
    skill.best = Math.max(skill.best, skill.streakRight);
  } else {
    skill.streakWrong++; skill.streakRight = 0;
  }
}
