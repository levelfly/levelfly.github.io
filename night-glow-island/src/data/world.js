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
    modes: ['count'], range: [1, 5], questions: 4,
    lampAt: { x: .21, y: .63 }, band: { y0: .06, y1: .52 },
  },
  {
    key: 'cove', name: '貝殼海灘', voice: 'area_cove',
    motif: 'shell', holder: 'shell', tint: '#FFC46B',
    modes: ['listen'], range: [1, 5], questions: 4,
    lampAt: { x: .63, y: .80 }, band: { y0: .30, y1: .72 },
  },
  {
    key: 'grove', name: '果實樹林', voice: 'area_grove',
    motif: 'berry', holder: 'leaf', tint: '#FF8B7A',
    modes: ['count'], range: [3, 8], questions: 4,
    lampAt: { x: .80, y: .44 }, band: { y0: .06, y1: .46 },
  },
  {
    key: 'cliff', name: '星星懸崖', voice: 'area_cliff',
    motif: 'star', holder: 'star', tint: '#FFE3A3',
    modes: ['listen'], range: [4, 10], questions: 4,
    lampAt: { x: .25, y: .24 }, band: { y0: .08, y1: .54 },
  },
  {
    key: 'light', name: '燈塔', voice: 'area_light',
    motif: 'firefly', holder: 'bubble', tint: '#6FE3C4',
    modes: ['listen', 'count', 'quantity'], range: [2, 10], questions: 5,
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
export function makeQuestion(area, i, skill, rand) {
  const mode = area.modes[i % area.modes.length];

  // 選項數量跟著表現走：連錯就變簡單，連對就變難，永遠夾在 2~4 之間
  let opts = 3;
  if (skill.streakWrong >= 2) opts = 2;
  else if (skill.streakRight >= 3) opts = 4;
  else if (skill.streakRight >= 1) opts = 3;

  // 範圍：前兩題偏小，後面才放大
  const [lo, hiFull] = area.range;
  const hi = i < 2 ? Math.max(lo + 1, Math.round(lo + (hiFull - lo) * 0.6)) : hiFull;

  // 盡量不要連續出同一個數字
  let answer, guard = 0;
  do { answer = lo + Math.floor(rand() * (hi - lo + 1)); guard++; }
  while (guard < 12 && skill.recent.includes(answer));
  skill.recent = [answer, ...skill.recent].slice(0, 2);

  return { mode, answer, options: pickOptions(answer, opts, lo, hiFull, rand), area };
}

/** 誘答項：靠近正確答案（差 1~2），這樣才是真的在辨識，不是靠排除 */
function pickOptions(answer, n, lo, hi, rand) {
  const set = new Set([answer]);
  const near = [answer - 1, answer + 1, answer - 2, answer + 2, answer + 3, answer - 3];
  for (const v of near) {
    if (set.size >= n) break;
    if (v >= Math.max(1, lo - 1) && v <= Math.min(10, hi + 1)) set.add(v);
  }
  while (set.size < n) {
    const v = 1 + Math.floor(rand() * 10);
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
