// 存檔：只存「值得留下來的東西」——收藏的光靈、玩過幾輪、發現過哪些秘密。
// 關卡進度刻意不長期保存：每次開始都是一座新的暗島，重點是重玩。
//
// v2 起分成兩個年齡檔（age4 小小找光 / age6 島嶼修復師）。兩個檔的進度完全隔開，
// 但「靜音」和「秘密」是共用的——那是關於這台裝置與這個小孩的，不是關於某個檔的。
//
// 對外的 API 跟 v1 一模一樣（store.bugs / store.cycle(key) / …），只是內部指向
// 當前的檔。這樣 level / lantern / finale 那些場景一行都不用改。

const KEY = 'glowisle.v2';
const OLD_KEY = 'glowisle.v1';

const blankProfile = () => ({
  bugs: {},         // { bugId: 隻數 }
  goldenBugs: {},   // { bugId: 金色隻數 }
  platinumBugs: {}, // { bugId: 彩虹/白金隻數 }
  runs: 0,          // 完成過的冒險輪數
  cycles: {},       // { areaKey: 該地點已通關幾次 }
  best: 0,          // 單輪最高連對

  // ── 以下是晨風群島（age6）才會用到的。age4 的檔留著空的沒有壞處，
  //    而且共用同一個 blankProfile 表示「換檔＝換一整個世界」這件事在資料層是乾淨的。──
  skills: {},       // { bond: { level, ok, miss, streak } } 教學導演的精熟路徑
  recipes: {},      // { "8": ["3+5","4+4"] } 配方圖鑑：她發現過的拆法
  tools: {},        // { boat: { got:true, level:0 } } 道具與它現在的介入程度
  spirits: {},      // { id: { pat, fed } } 光靈的窩
  diary: [],        // 最近幾晚的一頁圖（只留最後 8 筆）
  nights: 0,        // 完成過幾次航程
});

const blank = () => ({
  activeProfile: 'age4',
  shared: {
    muted: false,
    secrets: {},    // { sneeze:true, crab:true, whale:true, song:true }
  },
  profiles: { age4: blankProfile(), age6: blankProfile() },
});

let data = load();

/** v1 的單一檔 → v2 的 age4。舊檔留著不刪，萬一 v2 出事還救得回來。 */
function migrateV1(raw) {
  const old = JSON.parse(raw);
  const next = blank();
  next.profiles.age4 = Object.assign(blankProfile(), {
    bugs: old.bugs || {},
    goldenBugs: old.goldenBugs || {},
    platinumBugs: old.platinumBugs || {},
    runs: old.runs || 0,
    cycles: old.cycles || {},
    best: old.best || 0,
  });
  next.shared.muted = !!old.muted;
  next.shared.secrets = old.secrets || {};
  return next;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = Object.assign(blank(), JSON.parse(raw));
      d.shared = Object.assign(blank().shared, d.shared);
      d.profiles = Object.assign(blank().profiles, d.profiles);
      for (const k of Object.keys(d.profiles)) {
        d.profiles[k] = Object.assign(blankProfile(), d.profiles[k]);
      }
      if (!d.profiles[d.activeProfile]) d.activeProfile = 'age4';
      return d;
    }
    const legacy = localStorage.getItem(OLD_KEY);
    if (legacy) return migrateV1(legacy);
    return blank();
  } catch { return blank(); }
}

/** 當前這個年齡檔的資料。所有 getter 都走這裡。 */
const cur = () => data.profiles[data.activeProfile];

let saveTimer = 0;
function flush() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* 隱私模式：忘掉就忘掉 */ }
}
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(flush, 250); }

export const store = {
  get all() { return data; },
  get bugs() { return cur().bugs; },
  get goldenBugs() { return cur().goldenBugs; },
  get platinumBugs() { return cur().platinumBugs; },
  get runs() { return cur().runs; },
  get secrets() { return data.shared.secrets; },
  get muted() { return data.shared.muted; },

  /* ── 年齡檔 ── */
  get profileId() { return data.activeProfile; },
  /** 有沒有玩過這個檔（決定要不要直接進去，還是先讓她挑一扇門） */
  played(id) {
    const p = data.profiles[id];
    return !!p && (p.runs > 0 || Object.keys(p.cycles).length > 0 || Object.keys(p.bugs).length > 0);
  },
  setProfile(id) {
    if (!data.profiles[id]) data.profiles[id] = blankProfile();
    data.activeProfile = id; save(); return id;
  },

  addBug(id) { const c = cur(); c.bugs[id] = (c.bugs[id] || 0) + 1; save(); return c.bugs[id]; },
  hasBug(id) { return !!cur().bugs[id]; },
  bugCount() { const c = cur(); return new Set([...Object.keys(c.bugs), ...Object.keys(c.goldenBugs), ...Object.keys(c.platinumBugs)]).size; },
  totalBugs() { return Object.values(cur().bugs).reduce((a, b) => a + b, 0); },

  addGoldenBug(id) { const c = cur(); c.goldenBugs[id] = (c.goldenBugs[id] || 0) + 1; save(); return c.goldenBugs[id]; },
  hasGoldenBug(id) { return !!cur().goldenBugs[id]; },
  goldenBugCount() { return Object.keys(cur().goldenBugs).length; },
  totalGoldenBugs() { return Object.values(cur().goldenBugs).reduce((a, b) => a + b, 0); },

  addPlatinumBug(id) { const c = cur(); c.platinumBugs[id] = (c.platinumBugs[id] || 0) + 1; save(); return c.platinumBugs[id]; },
  hasPlatinumBug(id) { return !!cur().platinumBugs[id]; },
  platinumBugCount() { return Object.keys(cur().platinumBugs).length; },
  totalPlatinumBugs() { return Object.values(cur().platinumBugs).reduce((a, b) => a + b, 0); },

  finishRun() { cur().runs++; save(); },
  cycle(key) { return cur().cycles[key] || 0; },
  cycleUp(key) { const c = cur(); c.cycles[key] = (c.cycles[key] || 0) + 1; save(); return c.cycles[key]; },
  unlock(k) { const first = !data.shared.secrets[k]; data.shared.secrets[k] = true; save(); return first; },
  found(k) { return !!data.shared.secrets[k]; },
  setBest(n) { const c = cur(); if (n > c.best) { c.best = n; save(); } },
  setMuted(m) { data.shared.muted = m; save(); },
  reset() { data = blank(); flush(); },

  /* ─────────────── 晨風群島：精熟路徑 ───────────────
     刻意不存「連對幾題」當成績。存的是「這個骨架她走到哪一層了」——
     層級只會因為做得順而往上，不會因為做錯而掉回去（錯誤在局內就地降級，
     見 director.js 的 ease）。這是精熟路徑，不是評分。 */
  skill(id) {
    const c = cur();
    if (!c.skills[id]) c.skills[id] = { level: 0, ok: 0, miss: 0 };
    return c.skills[id];
  },
  skillUp(id, ok) {
    const s = store.skill(id);
    if (ok) s.ok++; else s.miss++;
    save(); return s;
  },
  setSkillLevel(id, lv) { const s = store.skill(id); if (lv > s.level) { s.level = lv; save(); } return s.level; },

  /* ─────────────── 配方圖鑑 ───────────────
     收集的不是角色，是方法。key 是被拆的那個數，value 是拆法（小的在前，去重）。 */
  addRecipe(total, parts) {
    const c = cur();
    const key = String(total);
    const sig = [...parts].sort((a, b) => a - b).join('+');
    const list = c.recipes[key] || (c.recipes[key] = []);
    if (list.includes(sig)) return false;
    list.push(sig); list.sort();
    save(); return true;                  // true = 這是新發現
  },
  recipesOf(total) { return cur().recipes[String(total)] || []; },
  get recipes() { return cur().recipes; },
  recipeCount() { return Object.values(cur().recipes).reduce((a, l) => a + l.length, 0); },

  /* ─────────────── 道具 ───────────────
     level：0 直接幫 → 1 只提示 → 2 只剩裝飾。永遠不會被沒收，只會變得更含蓄。 */
  tool(id) { const c = cur(); return c.tools[id] || null; },
  get tools() { return cur().tools; },
  giveTool(id) {
    const c = cur();
    if (c.tools[id]) return false;
    c.tools[id] = { level: 0 };
    save(); return true;
  },
  toolLevel(id) { return cur().tools[id]?.level ?? 0; },
  setToolLevel(id, lv) {
    const c = cur(); const t = c.tools[id]; if (!t) return 0;
    if (lv > t.level) { t.level = Math.min(2, lv); save(); }
    return t.level;
  },

  /* ─────────────── 光靈的窩 ───────────────
     花紋不是從選單挑的，是她做過的數學留下來的（見 spirits.js 的 patternFor）。 */
  get spirits() { return cur().spirits; },
  addSpirit(id, pat = 0) {
    const c = cur();
    if (c.spirits[id]) { c.spirits[id].fed++; save(); return false; }
    c.spirits[id] = { pat, fed: 1 };
    save(); return true;
  },
  setSpiritPattern(id, pat) {
    const c = cur();
    if (!c.spirits[id]) c.spirits[id] = { pat, fed: 1 };
    else c.spirits[id].pat = pat;
    save();
  },
  spiritCount() { return Object.keys(cur().spirits).length; },

  /* ─────────────── 島嶼日記 ───────────────
     一晚一頁，只留最近 8 頁。給爸媽看的，不是給她評分的。 */
  get diary() { return cur().diary; },
  addDiary(page) {
    const c = cur();
    c.diary.unshift(page);
    c.diary.length = Math.min(c.diary.length, 8);
    c.nights = (c.nights || 0) + 1;
    save();
  },
  get nights() { return cur().nights || 0; },
};
