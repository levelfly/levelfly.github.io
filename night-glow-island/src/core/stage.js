// 舞台：一切座標的來源。
//
// 遊戲不用固定像素排版，而是用一個「遊戲場（field）」的百分比座標。
// 直握手機、橫握平板、桌機視窗，field 會自己改變比例與內縮，
// 互動物件永遠落在拇指構得到、瀏海與 home indicator 碰不到的地方。

const S = {
  w: 0, h: 0, dpr: 1, portrait: true, ui: 16,
  field: { x: 0, y: 0, w: 0, h: 0 },
  listeners: new Set(),
};

export function initStage(stageEl, canvas) {
  const apply = () => {
    const r = stageEl.getBoundingClientRect();
    S.w = r.width; S.h = r.height;
    S.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    S.portrait = S.h >= S.w;

    // UI 基準：小螢幕不要太擠，大螢幕不要太空
    const base = Math.sqrt(S.w * S.h);
    S.ui = Math.max(13, Math.min(30, base * 0.036));
    document.documentElement.style.setProperty('--ui', S.ui.toFixed(2) + 'px');

    const cs = getComputedStyle(document.documentElement);
    const px = k => parseFloat(cs.getPropertyValue(k)) || 0;
    const st = px('--safe-t'), sb = px('--safe-b'), sl = px('--safe-l'), sr = px('--safe-r');

    // 遊戲場：上方留給題目提示，下方留給嚕米和選項
    const padX = Math.max(14, S.w * (S.portrait ? 0.05 : 0.07));
    const padT = st + Math.max(16, S.h * 0.075);
    const padB = sb + Math.max(16, S.h * 0.05);
    S.field.x = padX + sl; S.field.y = padT;
    S.field.w = S.w - padX * 2 - sl - sr;
    S.field.h = S.h - padT - padB;

    if (canvas) {
      canvas.width = Math.round(S.w * S.dpr);
      canvas.height = Math.round(S.h * S.dpr);
      canvas.style.width = S.w + 'px';
      canvas.style.height = S.h + 'px';
    }
    document.body.dataset.orient = S.portrait ? 'portrait' : 'landscape';
    S.listeners.forEach(fn => fn(S));
  };

  const ro = new ResizeObserver(apply);
  ro.observe(stageEl);
  window.addEventListener('orientationchange', () => setTimeout(apply, 120));
  window.visualViewport?.addEventListener('resize', apply);
  apply();
  return S;
}

export const stage = S;
export function onResize(fn) { S.listeners.add(fn); return () => S.listeners.delete(fn); }

/** field 百分比 → 螢幕像素 */
export function fx(px) { return S.field.x + S.field.w * px; }
export function fy(py) { return S.field.y + S.field.h * py; }
/** field 短邊比例 → 像素（用來定尺寸，直橫向都一致） */
export function fs(k) { return Math.min(S.field.w, S.field.h) * k; }
