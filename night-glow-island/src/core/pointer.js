// 觸控優先的點擊處理。
//
// 三歲小孩的手指會抖、會拖、會用手掌蹭到螢幕，所以：
// - 按下就給回饋（不等放開），這是「觸覺感」的來源
// - 放開時只要還在合理範圍內就算數（容忍 24px 位移）
// - 同一次觸控不會觸發兩個物件
// - 全程 pointer events，滑鼠 / 觸控 / 手寫筆共用一條路

let lockedUntil = 0;
export const globalPointer = { x: 0, y: 0, active: false };

window.addEventListener('pointermove', e => {
  globalPointer.x = e.clientX; globalPointer.y = e.clientY;
}, { passive: true });

/**
 * 讓一個元素可以被戳。
 * @param el      DOM/SVG 元素
 * @param onTap   (x, y, el) => void
 * @param opts    { onPress, onRelease, tolerance, cooldown }
 */
export function tappable(el, onTap, opts = {}) {
  const { onPress, onRelease, tolerance = 26, cooldown = 0.12 } = opts;
  let id = null, sx = 0, sy = 0, stuckTimer = 0;

  const clear = (doRelease = false) => {
    clearTimeout(stuckTimer); stuckTimer = 0;
    if (id === null) return;
    id = null; globalPointer.active = false;
    if (doRelease) onRelease?.(el);
  };

  const down = e => {
    // 先把瀏覽器預設行為擋掉，避免 iPad 上快速點擊觸發縮放或捲動
    e.preventDefault();
    e.stopPropagation();
    if (el.dataset.locked === '1') return;
    if (performance.now() < lockedUntil) return;
    if (id !== null) return;
    id = e.pointerId; sx = e.clientX; sy = e.clientY;
    globalPointer.active = true;
    try { el.setPointerCapture?.(e.pointerId); } catch {}
    onPress?.(e.clientX, e.clientY, el);
    // 保險：如果 2 秒內沒收到 pointerup/cancel/lostcapture，強制歸零，避免 iPad 上偶發狀態卡住
    stuckTimer = setTimeout(() => clear(false), 2000);
  };
  const up = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.pointerId !== id) return;
    clear(true);
    const moved = Math.hypot(e.clientX - sx, e.clientY - sy);
    if (moved <= tolerance && el.dataset.locked !== '1') {
      lockedUntil = performance.now() + cooldown * 1000;
      onTap?.(e.clientX, e.clientY, el);
    }
  };
  const cancel = e => { if (e.pointerId === id) clear(true); };

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('lostpointercapture', cancel);
  el.style.touchAction = 'none';

  return () => {
    clear();
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', cancel);
    el.removeEventListener('lostpointercapture', cancel);
  };
}

/** 短暫鎖住全場的點擊（播動畫時用），避免小孩狂點打斷演出 */
export function lockTaps(sec) { lockedUntil = Math.max(lockedUntil, performance.now() + sec * 1000); }
export function tapsLocked() { return performance.now() < lockedUntil; }

/** 觸覺回饋（有支援的裝置才會震） */
export function buzz(ms = 12) { try { navigator.vibrate?.(ms); } catch {} }
