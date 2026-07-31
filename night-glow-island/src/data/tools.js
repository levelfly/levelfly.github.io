// 十件道具。
//
// 每一件都是一個數學鷹架（scaffold），所以每一件都必須有**撤除路徑** ——
// 一直幫下去的工具會變成她的義肢，而不是她的能力。
//
// 撤除不是把東西沒收。說法從來不是「你長大了所以這個要拿走」，
// 而是道具自己變得更漂亮、介入更少：
//
//   level 0  直接幫她做（分光鏡真的把光切成兩半）
//   level 1  只給提示（分光鏡只畫出中線）
//   level 2  只剩裝飾（碗邊多一道光，它還在，只是不再替她想）
//
// 升級的觸發是對應骨架的精熟層級（見 director.js 的 reviewIsle），
// 不是「用了幾次」——用得多不代表不需要了，做得順才代表。
//
// 🔴 道具不可以是「答錯後系統發的補救品」。她是在寶箱／市集自己挑的，
// 所以它是她的裝備，不是她的診斷結果。

import { el } from '../art/paper.js';
import { SKY } from '../art/sky.js';

const ic = (g, d, { fill = 'none', stroke = SKY.ink, w = 7, op = 1 } = {}) =>
  el('path', { d, fill, stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: op }, g);

export const TOOLS = {

  /* ── 分光鏡：平分／近半拆分 ───────────────────────────────── */
  prism: {
    name: '分光鏡', teaches: 'bond',
    icon(g) {
      ic(g, 'M0,-46 L40,34 L-40,34 Z', { stroke: SKY.ink, w: 7 });
      ic(g, 'M-52,0 L-14,0', { stroke: SKY.sunRim, w: 6 });
      ic(g, 'M18,6 L54,-6 M18,14 L54,14 M18,22 L54,34', { stroke: SKY.gold, w: 5 });
    },
    enabled: ctx => ctx.freeTrays().length >= 2 && ctx.pool.length > 0,
    use(ctx) {
      const free = ctx.freeTrays();
      if (ctx.level('prism') === 0) {
        // 真的替她切一半：剩下的光平分進兩個碗，奇數就差一顆
        const n = ctx.pool.length;
        const half = Math.floor(n / 2);
        for (let i = 0; i < n; i++) ctx.sendTo(free[i < half ? 0 : 1], i * 90);
        return '分光鏡把光切成兩半了';
      }
      if (ctx.level('prism') === 1) { ctx.midline(free); return '中間在這裡'; }
      ctx.shimmer(free); return null;
    },
  },

  /* ── 星星托盤：十的框架 ───────────────────────────────────── */
  startray: {
    name: '星星托盤', teaches: 'makeTen',
    icon(g) {
      el('rect', { x: -50, y: -22, width: 100, height: 44, rx: 8, fill: 'none', stroke: SKY.ink, 'stroke-width': 6 }, g);
      ic(g, 'M0,-22 L0,22', { w: 5, op: .7 });
      [-30, -10, 10, 30].forEach(x => el('circle', { cx: x, cy: -8, r: 6, fill: SKY.gold }, g));
    },
    enabled: ctx => ctx.pool.length > 0,
    use(ctx) {
      const lv = ctx.level('startray');
      ctx.poolLayout(lv <= 1 ? 'ten' : 'cluster');
      if (lv === 0) return '排成五個一排，好數多了';
      if (lv === 1) return null;
      return null;
    },
  },

  /* ── 回音貝：把要求再講一次 ───────────────────────────────── */
  shell: {
    name: '回音貝', teaches: null,
    icon(g) {
      ic(g, 'M0,-44 L-44,18 A44,40 0 0 0 44,18 Z', { fill: SKY.cream, stroke: SKY.ink, w: 6 });
      ic(g, 'M0,-40 L-22,18 M0,-40 L0,18 M0,-40 L22,18', { w: 4, op: .6 });
    },
    enabled: () => true,
    use(ctx) {
      const lv = ctx.level('shell');
      if (lv <= 1) ctx.repeat();
      else ctx.blip();
      if (lv === 0) ctx.pulseNeeds(true);
      return null;
    },
  },

  /* ── 小螃蟹：一一對應數數 ─────────────────────────────────── */
  crab: {
    name: '小螃蟹', teaches: null,
    icon(g) {
      el('ellipse', { cx: 0, cy: 4, rx: 34, ry: 24, fill: '#F09A86' }, g);
      ic(g, 'M-30,-6 L-52,-22 M30,-6 L52,-22', { stroke: '#E06A54', w: 8 });
      ic(g, 'M-20,22 L-30,40 M20,22 L30,40', { stroke: '#E06A54', w: 7 });
      el('circle', { cx: -11, cy: -12, r: 5, fill: '#3B2B2B' }, g);
      el('circle', { cx: 11, cy: -12, r: 5, fill: '#3B2B2B' }, g);
    },
    enabled: ctx => ctx.pool.length > 0,
    use(ctx) { ctx.countPool(); return null; },
  },

  /* ── 配對絲帶：把兩群綁起來看合起來多少 ─────────────────── */
  ribbon: {
    name: '配對絲帶', teaches: 'bond',
    icon(g) {
      ic(g, 'M-50,10 C-24,-34 24,-34 50,10', { stroke: '#E78FA8', w: 8 });
      ic(g, 'M-50,10 l-8,16 l18,-6 M50,10 l8,16 l-18,-6', { stroke: '#E78FA8', w: 7 });
    },
    enabled: ctx => ctx.trays.filter(t => t.orbs.length > 0).length >= 2,
    use(ctx) {
      const lv = ctx.level('ribbon');
      ctx.tie(lv === 0);        // level 0 才報出合起來的量，之後只做視覺連線
      return null;
    },
  },

  /* ── 月秤：比較與差量 ─────────────────────────────────────── */
  scale: {
    name: '月秤', teaches: 'diff',
    icon(g) {
      ic(g, 'M0,-42 L0,30 M-46,-24 L46,-24', { w: 7 });
      ic(g, 'M-46,-24 L-62,6 A18,14 0 0 0 -30,6 Z', { fill: SKY.cream, w: 5 });
      ic(g, 'M46,-24 L30,6 A18,14 0 0 0 62,6 Z', { fill: SKY.cream, w: 5 });
      ic(g, 'M-26,34 L26,34', { w: 8 });
    },
    enabled: ctx => ctx.trays.some(t => t.slot.kind === 'mirror' || (t.slot.filled || 0) > 0),
    use(ctx) {
      ctx.compare(ctx.level('scale') === 0);
      return null;
    },
  },

  /* ── 湊十風箏：先找十 ─────────────────────────────────────── */
  kite: {
    name: '湊十風箏', teaches: 'makeTen',
    icon(g) {
      ic(g, 'M0,-48 L34,0 L0,40 L-34,0 Z', { fill: '#BFE3F2', stroke: SKY.ink, w: 6 });
      ic(g, 'M0,-48 L0,40 M-34,0 L34,0', { w: 4, op: .55 });
      ic(g, 'M0,40 C10,52 -10,60 0,72', { w: 5, op: .8 });
    },
    enabled: ctx => ctx.trays.some(t => t.slot.kind === 'sockets' && (t.slot.filled || 0) + t.slot.need === 10),
    use(ctx) {
      const ten = ctx.trays.find(t => t.slot.kind === 'sockets' && (t.slot.filled || 0) + t.slot.need === 10);
      if (!ten) return null;
      if (ctx.level('kite') === 0) {
        for (let i = 0; i < ten.slot.need; i++) ctx.sendTo(ten, i * 110);
        return '先把十湊滿';
      }
      ctx.pulseTray(ten);
      return '先找十';
    },
  },

  /* ── 零錢袋：1／5／10 換算 ────────────────────────────────── */
  purse: {
    name: '零錢袋', teaches: 'coin',
    icon(g) {
      ic(g, 'M-36,-14 C-36,-38 36,-38 36,-14 L44,34 A20,16 0 0 1 -44,34 Z', { fill: '#E8CFA4', stroke: SKY.ink, w: 6 });
      el('circle', { cx: -12, cy: 8, r: 11, fill: SKY.gold }, g);
      el('circle', { cx: 14, cy: 12, r: 11, fill: '#FFEEC6', stroke: '#E9C07A', 'stroke-width': 3 }, g);
    },
    enabled: ctx => ctx.canExchange(),
    use(ctx) { return ctx.exchange(); },
  },

  /* ── 退一步小船：撤回上一步 ───────────────────────────────
     這一件**永遠不升級、永遠不撤除**。它不是數學鷹架，是操作安全網：
     知道「做錯可以退回來」是她敢自己試的前提。 */
  boat: {
    name: '退一步小船', teaches: 'inverse', permanent: true,
    icon(g) {
      ic(g, 'M-46,10 L46,10 L30,38 L-30,38 Z', { fill: SKY.cream, stroke: SKY.ink, w: 6 });
      ic(g, 'M0,10 L0,-42 L34,-6 Z', { fill: '#BFE3F2', stroke: SKY.ink, w: 5 });
      ic(g, 'M-54,48 C-30,40 -10,56 14,48 C30,43 40,50 54,46', { w: 5, op: .6 });
    },
    enabled: ctx => ctx.canUndo(),
    use(ctx) { ctx.undo(); return null; },
  },

  /* ── 配方書籤：多解法的記錄者 ─────────────────────────────── */
  bookmark: {
    name: '配方書籤', teaches: 'bond',
    icon(g) {
      ic(g, 'M-28,-46 L28,-46 L28,46 L0,24 L-28,46 Z', { fill: '#F3D9A8', stroke: SKY.ink, w: 6 });
      ic(g, 'M0,-30 l7,15 l16,2 l-12,11 l4,16 l-15,-8 l-15,8 l4,-16 l-12,-11 l16,-2 z', { fill: SKY.gold, stroke: 'none', w: 0 });
    },
    enabled: ctx => ctx.task?.free,
    use(ctx) {
      ctx.markNew(ctx.level('bookmark') === 0);
      return null;
    },
  },
};

export const TOOL_IDS = Object.keys(TOOLS);

/** 還沒拿到的道具（寶箱要發什麼）。焦點技能相關的優先出現。 */
export function nextToolFor(store, focusSkill, rand = Math.random, exclude = []) {
  const missing = TOOL_IDS.filter(id => !store.tool(id) && !exclude.includes(id));
  if (!missing.length) return null;
  const preferred = missing.filter(id => TOOLS[id].teaches === focusSkill);
  const pool = preferred.length ? preferred : missing;
  return pool[Math.floor(rand() * pool.length)];
}

/**
 * 道具該升到第幾級。
 *
 * 綁在它教的那個骨架上：那個骨架她已經走到第 2 層 → 這件道具退成提示；
 * 第 3 層（或該骨架已達頂）→ 退成裝飾。沒有綁骨架的（回音貝、小螃蟹）
 * 看她總共完成過幾晚，慢慢退。退一步小船永遠是 0。
 */
export function toolLevelFor(store, id) {
  const t = TOOLS[id];
  if (!t || t.permanent) return 0;
  if (t.teaches) {
    const lv = store.skill(t.teaches).level;
    return lv >= 2 ? 2 : lv >= 1 ? 1 : 0;
  }
  const n = store.nights;
  return n >= 6 ? 2 : n >= 3 ? 1 : 0;
}
