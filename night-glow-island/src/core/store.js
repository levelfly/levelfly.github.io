// 存檔：只存「值得留下來的東西」——收藏的光靈、玩過幾輪、發現過哪些秘密。
// 關卡進度刻意不長期保存：每次開始都是一座新的暗島，重點是重玩。

const KEY = 'glowisle.v1';

const blank = () => ({
  bugs: {},        // { bugId: 隻數 }
  goldenBugs: {},  // { bugId: 金色隻數 }
  runs: 0,         // 完成過的冒險輪數
  secrets: {},     // { sneeze:true, crab:true, whale:true, song:true }
  best: 0,         // 單輪最高連對
  muted: false,
});

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    return Object.assign(blank(), JSON.parse(raw));
  } catch { return blank(); }
}

let saveTimer = 0;
function flush() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* 隱私模式：忘掉就忘掉 */ }
}
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(flush, 250); }

export const store = {
  get all() { return data; },
  get bugs() { return data.bugs; },
  get runs() { return data.runs; },
  get secrets() { return data.secrets; },
  get muted() { return data.muted; },

  addBug(id) { data.bugs[id] = (data.bugs[id] || 0) + 1; save(); return data.bugs[id]; },
  hasBug(id) { return !!data.bugs[id]; },
  bugCount() { return new Set([...Object.keys(data.bugs), ...Object.keys(data.goldenBugs)]).size; },
  totalBugs() { return Object.values(data.bugs).reduce((a, b) => a + b, 0); },

  addGoldenBug(id) { data.goldenBugs[id] = (data.goldenBugs[id] || 0) + 1; save(); return data.goldenBugs[id]; },
  hasGoldenBug(id) { return !!data.goldenBugs[id]; },
  goldenBugCount() { return Object.keys(data.goldenBugs).length; },
  totalGoldenBugs() { return Object.values(data.goldenBugs).reduce((a, b) => a + b, 0); },

  finishRun() { data.runs++; save(); },
  unlock(k) { const first = !data.secrets[k]; data.secrets[k] = true; save(); return first; },
  found(k) { return !!data.secrets[k]; },
  setBest(n) { if (n > data.best) { data.best = n; save(); } },
  setMuted(m) { data.muted = m; save(); },
  reset() { data = blank(); flush(); },
};
