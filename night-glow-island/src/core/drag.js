// 拖曳。
//
// 夜光島只需要「戳」，晨風群島的動詞是「分」——分東西這件事，手要真的把它搬過去，
// 感覺才對。所以這裡另外開一條路，不動 pointer.js 的 tappable。
//
// 三件事是為了六歲的手指做的：
//
// 1. **拖不動也要能玩。** 位移小於門檻就當成一次點擊回報給呼叫端。
//    小手常常「按下去、抖一下、放開」，那應該是點擊，不是失敗的拖曳。
// 2. **落點判定放寬。** 用投放區的外接矩形再外擴一圈，並取「中心距離最近」的那個，
//    而不是嚴格的命中測試。差幾像素不該讓一次正確的判斷失敗。
// 3. **一定要收得回來。** pointercancel / lostpointercapture / 逾時都會走同一條收尾路徑，
//    不然 iPad 上偶發的事件遺失會讓一顆光永遠黏在手指上。

import { tapsLocked, buzz } from './pointer.js';

/**
 * 讓一個元素可以被拖。
 *
 * @param el   DOM 元素
 * @param opts {
 *   zones()      → [{ node, data }]  每次按下時重新問一遍（版面會變）
 *   onGrab(x,y)  按住
 *   onMove(x,y)  跟著手指
 *   onDrop(zone, x, y)  放在某個投放區上
 *   onCancel()   放在空白處 / 被取消
 *   onTap()      位移太小，當成點擊
 *   slop         判定成拖曳的最小位移（預設 14px）
 *   grow         投放區外擴（預設 26px）
 * }
 * @returns 解除函式
 */
export function draggable(el, opts = {}) {
  const { zones, onGrab, onMove, onDrop, onCancel, onTap, slop = 14, grow = 26 } = opts;
  let id = null, sx = 0, sy = 0, moved = false, guard = 0, list = null;

  const finish = (cancelled, x, y) => {
    if (id === null) return;
    clearTimeout(guard); guard = 0;
    id = null;
    const zs = list; list = null;
    if (cancelled) return onCancel?.();
    if (!moved) return onTap?.();
    const z = pickZone(zs, x, y, grow);
    if (z) onDrop?.(z, x, y); else onCancel?.();
  };

  const down = e => {
    e.preventDefault(); e.stopPropagation();
    if (id !== null || el.dataset.locked === '1' || tapsLocked()) return;
    id = e.pointerId; sx = e.clientX; sy = e.clientY; moved = false;
    list = zones?.() || [];
    try { el.setPointerCapture?.(e.pointerId); } catch {}
    onGrab?.(e.clientX, e.clientY);
    buzz(8);
    // 事件掉了也一定要放手：沒有這一條，一顆光會永遠黏在手指上。
    guard = setTimeout(() => finish(true), 8000);
  };

  const move = e => {
    if (e.pointerId !== id) return;
    if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > slop) moved = true;
    if (moved) onMove?.(e.clientX, e.clientY);
  };

  const up = e => {
    if (e.pointerId !== id) return;
    e.preventDefault(); e.stopPropagation();
    finish(false, e.clientX, e.clientY);
  };

  const cancel = e => { if (e.pointerId === id) finish(true); };

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('lostpointercapture', cancel);
  el.style.touchAction = 'none';

  return () => {
    finish(true);
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', cancel);
    el.removeEventListener('lostpointercapture', cancel);
  };
}

/** 落在哪一個投放區：先看外擴後的矩形，再挑中心最近的。 */
function pickZone(zones, x, y, grow) {
  if (!zones?.length) return null;
  let best = null, bestD = Infinity;
  for (const z of zones) {
    const r = z.node?.getBoundingClientRect?.();
    if (!r || !r.width) continue;
    if (x < r.left - grow || x > r.right + grow || y < r.top - grow || y > r.bottom + grow) continue;
    const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
    if (d < bestD) { bestD = d; best = z; }
  }
  return best;
}
