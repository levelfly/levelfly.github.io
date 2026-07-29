// 單一 rAF 迴圈：所有動畫都掛這裡，避免各自開 rAF 造成不同步。
const subs = new Set();
let last = 0, running = false, slow = 1;

function loop(t) {
  if (!running) return;
  const dt = Math.min(0.05, (t - last) / 1000) * slow;   // 上限 50ms，切分頁回來不爆衝
  last = t;
  for (const fn of subs) {
    try { fn(dt, t / 1000); } catch (e) { console.error('[ticker]', e); }
  }
  requestAnimationFrame(loop);
}

export function onTick(fn) {
  subs.add(fn);
  if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  return () => subs.delete(fn);
}

export function setTimeScale(s) { slow = s; }

/** 承諾式延遲，跟著 timeScale 走，場景切換時可被中斷 */
export function wait(sec) {
  return new Promise(res => {
    let acc = 0;
    const off = onTick(dt => { acc += dt; if (acc >= sec) { off(); res(); } });
  });
}
