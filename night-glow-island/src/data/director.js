// 教學導演。
//
// 這是晨風群島跟夜光島最大的結構差別。夜光島的難度是「連對就變難、連錯就變簡單」，
// 那是連對連錯計數；這裡走的是**精熟路徑**：每個數學骨架有自己的層級，
// 層級只會往上，不會因為今天狀況不好就掉回去。
//
// 隨機性關在籠子裡：
//   導演決定「今晚練什麼、練到第幾層」——數學骨架
//   隨機決定「哪座島、哪些數字、什麼順序」——包裝
//   她決定「怎麼拆、先去哪、帶哪個道具」——選擇
//
// 🔴 這裡出的題永遠不含算式符號。全部是「幾個空位」「跟那邊一樣多」「剩下的全部」，
// 因為 6 歲要先有具體物的經驗，符號是後面的事。所以 glyphs.js 只有 0～10 就夠用。

const pick = (arr, rand) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi, rand) => lo + Math.floor(rand() * (hi - lo + 1));
const ones = n => Array.from({ length: Math.max(0, n) }, () => 1);

/** 五個數學骨架。name 是給大人看的（日記頁、圖鑑），小孩畫面上不會出現。 */
export const SKILLS = {
  bond:    { name: '合成與分解', isle: 'garden', maxLevel: 3 },
  inverse: { name: '拿走與剩下', isle: 'mill',   maxLevel: 2 },
  diff:    { name: '一樣多與差幾個', isle: 'falls', maxLevel: 2 },
  coin:    { name: '光幣換算', isle: 'market', maxLevel: 2 },
  makeTen: { name: '湊十與十幾', isle: 'beacon', maxLevel: 2 },
};

/* ───────────────────────── 今晚練什麼 ───────────────────────── */

/**
 * 一晚的骨架。
 * 焦點技能會影響航線圖上比較容易出現哪幾座島，但不會強迫她去 ——
 * 她要一整晚都待在花園也可以，那也是一種選擇。
 */
export function planNight(store, rand = Math.random) {
  const ids = Object.keys(SKILLS);
  // 練得最少的那一個優先當焦點：不是為了平均，是因為那通常就是她還沒站穩的地方。
  const load = ids.map(id => {
    const s = store.skill(id);
    return { id, n: s.ok + s.miss, level: s.level };
  });
  const min = Math.min(...load.map(l => l.n));
  const focus = pick(load.filter(l => l.n <= min + 2), rand).id;
  return { focus, levels: Object.fromEntries(load.map(l => [l.id, l.level])) };
}

/* ───────────────────────── 出一題 ───────────────────────── */

/**
 * @param skill  骨架 id
 * @param opts   { level, i, ease, rand }
 *   level 精熟層級（0 起跳）
 *   i     這座島的第幾題
 *   ease  局內降級：連錯 2 次就 +1，讓題目變短、把「自由拆」換成「照著空位填」
 * @returns task
 */
export function makeTask(skill, { level = 0, i = 0, ease = 0, rand = Math.random } = {}) {
  const lv = Math.max(0, Math.min(SKILLS[skill]?.maxLevel ?? 2, level - (ease >= 2 ? 1 : 0)));
  const t = (BUILD[skill] || BUILD.bond)(lv, i, ease, rand);
  t.skill = skill;
  t.level = lv;
  // pool 沒特別指定就是一堆 1 顆的光
  if (!t.pool) t.pool = Array.from({ length: t.total }, () => 1);
  t.total = t.pool.reduce((a, b) => a + b, 0);
  // 有沒有「自由拆」的槽，決定她能不能發明自己的分法
  t.free = t.slots.some(s => s.kind === 'free');
  // 需要記進配方圖鑑的條件：這一題真的把一個數拆成了兩份以上
  t.recipeWorthy = t.slots.length >= 2;
  return t;
}

const S = {
  /** n 個空位，前 filled 個已經亮著。空位數就是需求，不需要任何文字。 */
  sockets: (need, filled = 0) => ({ kind: 'sockets', need, filled }),
  /** 空碗 ＋ 一條絲帶連到旁邊那一群：要「一樣多」。 */
  mirror:  ref => ({ kind: 'mirror', need: ref, ref }),
  /** 剩下的全部。她不用先算出是幾，做完嚕米會幫她數。 */
  rest:    need => ({ kind: 'rest', need }),
  /** 標價：要剛剛好的光幣。 */
  price:   need => ({ kind: 'price', need }),
  /** 自由：只要有光就好。多解的來源。 */
  free:    () => ({ kind: 'free', need: null, min: 1 }),
};

const BUILD = {

  /* 雲上花園 —— 10 的合成分解。這座島是整個 6 歲檔的立論所在：
     同一個 8 可以是 5+3 也可以是 4+4，每一種都對。
     數量守恆大約 6 歲才長出來，這題正好踩在上面。 */
  bond(lv, i, ease, rand) {
    const range = [[4, 6], [6, 8], [8, 10], [8, 10]][lv];
    const total = between(range[0], range[1], rand);
    // 每三題插一題「照著空位填」：先看到一種確定的拆法，再回去自由發明。
    if (i % 3 === 2 || ease >= 2) {
      const a = between(1, total - 1, rand);
      return { total, slots: [S.sockets(a), S.rest(total - a)], voice: 'sky_task_fill' };
    }
    const groups = lv >= 3 ? 3 : 2;
    return {
      total,
      slots: Array.from({ length: groups }, () => S.free()),
      voice: groups > 2 ? 'sky_task_free3' : 'sky_task_free',
    };
  },

  /* 風車島 —— 拿走多少、剩下多少。
     一邊是明示的空位（風車要幾顆才會轉），另一邊收剩下的。
     做完嚕米會把「八顆，風車拿走三顆，剩下五顆」唸出來 —— 那句話就是加減互逆的種子。 */
  inverse(lv, i, ease, rand) {
    const range = [[5, 7], [7, 9], [8, 10]][lv];
    const total = between(range[0], range[1], rand);
    if (lv >= 2 && i % 2 === 1 && ease < 2) {
      const a = between(1, total - 2, rand);
      const b = between(1, total - a - 1, rand);
      return { total, slots: [S.sockets(a), S.sockets(b), S.rest(total - a - b)], voice: 'sky_task_fill' };
    }
    const a = between(1, total - 1, rand);
    return { total, slots: [S.sockets(a), S.rest(total - a)], voice: 'sky_task_rest' };
  },

  /* 水瀑島 —— 一樣多、多幾個。
     lv0 是「跟那邊一樣多」（要先數對面才知道自己要幾顆）；
     lv1 起加上「比那邊多 d」：畫成 ref 個已亮 ＋ d 個空位，差量就在畫面上，不必講。 */
  diff(lv, i, ease, rand) {
    if (lv === 0 || (ease >= 2 && i % 2 === 0)) {
      const ref = between(2, 4 + lv, rand);
      const restN = between(1, 4, rand);
      return { total: ref + restN, slots: [S.mirror(ref), S.rest(restN)], voice: 'sky_task_same' };
    }
    const ref = between(2, lv >= 2 ? 7 : 5, rand);
    const d = between(1, lv >= 2 ? 3 : 2, rand);
    const restN = between(1, 3, rand);
    return {
      total: d + restN,
      // 已亮的那 ref 顆是池子外的既有物，她只要補滿 d 個空位
      slots: [S.sockets(d, ref), S.rest(restN)],
      voice: 'sky_task_more',
    };
  },

  /* 晨風市集 —— 1／5／10 的換算（一年級課綱的錢幣單元）。
     兩個攤位各有標價，錢袋裡的光幣剛好夠。要買到東西就得挑對面值 ——
     「五個一元跟一個五元一樣」不是講出來的，是她自己付一次就懂的。 */
  coin(lv, i, ease, rand) {
    if (lv === 0 || ease >= 2) {
      const a = between(2, 4, rand), b = between(2, 4, rand);
      return { total: a + b, pool: Array.from({ length: a + b }, () => 1), slots: [S.price(a), S.price(b)], voice: 'sky_task_price' };
    }
    if (lv === 1) {
      const a = 5, b = between(2, 4, rand);
      // 錢袋：一枚 5 元 ＋ 剛好夠的 1 元。她可以用五個 1 付 5 元那攤，也可以用 5 元幣。
      const pool = [5, ...Array.from({ length: b }, () => 1)];
      return { total: a + b, pool, slots: [S.price(a), S.price(b)], voice: 'sky_task_price' };
    }
    const a = 10, b = between(3, 8, rand);
    // 一半的機會不給十元幣 —— 沒有那枚硬幣，「兩個五元合起來是十元」才會被她自己做出來。
    const big = rand() < .5 ? [10] : [5, 5];
    const rest = b >= 5 ? [5, ...ones(b - 5)] : ones(b);
    return { total: a + b, pool: [...big, ...rest], slots: [S.price(a), S.price(b)], voice: 'sky_task_price' };
  },

  /* 晨鐘塔 —— 湊十，然後十幾。
     lv0/1：十格燈架已經亮了幾格，把它填滿，剩下的收走。
     lv2：兩個框，一個是完整的十格框、一個是小框 —— 13 顆光就這樣被拆成 10 和 3。
     這是「十幾＝10 加幾」最直接的一張圖。 */
  makeTen(lv, i, ease, rand) {
    if (lv >= 2 && i % 2 === 1 && ease < 2) {
      const k = between(1, 6, rand);
      return { total: 10 + k, slots: [S.sockets(10, 0), S.sockets(k, 0)], voice: 'sky_task_ten' };
    }
    const filled = between(lv >= 1 ? 3 : 6, lv >= 1 ? 7 : 8, rand);
    const need = 10 - filled;
    const restN = between(1, 3, rand);
    return { total: need + restN, slots: [S.sockets(need, filled), S.rest(restN)], voice: 'sky_task_ten' };
  },
};

/* ───────────────────────── 精熟判定 ───────────────────────── */

/**
 * 一座島做完之後，決定這個骨架有沒有往上一層。
 *
 * 判準刻意寬鬆而且只看「做完了沒」，不看做得多漂亮：
 * 這一層做完三次、而且最近一次沒有一直卡住，就往上。錯了不扣、不退層。
 */
export function reviewIsle(store, skill, { done, stuck }) {
  const s = store.skill(skill);
  store.skillUp(skill, done);
  if (!done) return s.level;
  const enough = s.ok >= (s.level + 1) * 3;
  if (enough && !stuck) return store.setSkillLevel(skill, Math.min(SKILLS[skill].maxLevel, s.level + 1));
  return s.level;
}

/** 這一題的正解拆法（記進配方圖鑑用）。free 題沒有標準答案，用她實際放的。 */
export function taskParts(task, placed) {
  return task.slots.map((_, i) => placed[i]).filter(v => v > 0);
}
