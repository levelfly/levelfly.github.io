// Canvas 粒子層：空氣裡永遠有東西在飄，畫面才不會死。
// 只有一張 canvas、一個迴圈，手機上也跑得動。

import { onTick } from '../core/ticker.js';
import { stage } from '../core/stage.js';

const PARTS = [];
let ctx = null, canvas = null, dpr = 1, ambientRate = 0.55, ambientTint = '#FFE3A3';

export function initParticles(cv) {
  canvas = cv; ctx = cv.getContext('2d');
  onTick(step);
}

function push(p) { if (PARTS.length < 620) PARTS.push(p); }

/** 一直存在的空氣浮塵 */
function spawnAmbient() {
  const { w, h } = stage;
  push({
    x: Math.random() * w, y: h + 20,
    vx: (Math.random() - .5) * 8, vy: -(6 + Math.random() * 22),
    r: 0.8 + Math.random() * 2.4, life: 1, decay: 0.045 + Math.random() * 0.05,
    col: Math.random() < .22 ? '#6FE3C4' : ambientTint,
    glow: 1, wob: Math.random() * 6.28,
  });
}

export function setAmbientMotes(rate, tint) {
  ambientRate = rate;
  if (tint) ambientTint = tint;
}

/** 答對的光爆 */
export function burst(x, y, { count = 26, col = '#FFE3A3', col2 = '#6FE3C4', power = 1 } = {}) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * 6.28, sp = (60 + Math.random() * 240) * power;
    push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
      r: 1.4 + Math.random() * 3.6, life: 1, decay: 0.5 + Math.random() * 0.7,
      col: Math.random() < .45 ? col2 : col, glow: 1.6, grav: 120, wob: Math.random() * 6.28,
    });
  }
}

/** 溫柔的「不是這個喔」：幾顆小泡泡往上飄走 */
export function puff(x, y, { count = 8, col = '#9FB4D6' } = {}) {
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (Math.random() - .5) * 1.6;
    push({
      x, y, vx: Math.cos(a) * 40, vy: Math.sin(a) * 60,
      r: 2 + Math.random() * 3, life: 1, decay: 0.9, col, glow: .5, wob: Math.random() * 6.28,
    });
  }
}

/** 一顆光從 (x0,y0) 飛到 (x1,y1)，抵達時呼叫 onArrive —— 收集光種子的主要語彙 */
export function flyLight(x0, y0, x1, y1, { col = '#FFE3A3', dur = 0.9, onArrive } = {}) {
  const p = {
    x: x0, y: y0, vx: 0, vy: 0, r: 5.5, life: 1, decay: 0,
    col, glow: 2.4, wob: 0, trail: true,
    path: { x0, y0, x1, y1, t: 0, dur, onArrive },
  };
  push(p);
}

function step(dt) {
  if (!ctx) return;
  const { w, h, dpr: d } = stage;
  dpr = d;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';

  if (Math.random() < ambientRate * dt * 60 / 60 * 2.2) spawnAmbient();

  for (let i = PARTS.length - 1; i >= 0; i--) {
    const p = PARTS[i];

    if (p.path) {
      const pa = p.path;
      pa.t += dt / pa.dur;
      const t = Math.min(1, pa.t);
      const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      // 弧線飛行，比直線有生命
      const mx = (pa.x0 + pa.x1) / 2, my = Math.min(pa.y0, pa.y1) - Math.abs(pa.x1 - pa.x0) * .28 - 40;
      const u = 1 - e;
      p.x = u * u * pa.x0 + 2 * u * e * mx + e * e * pa.x1;
      p.y = u * u * pa.y0 + 2 * u * e * my + e * e * pa.y1;
      p.r = 5.5 + Math.sin(t * Math.PI) * 4;
      if (t >= 1) { pa.onArrive?.(); PARTS.splice(i, 1); continue; }
      // 拖尾
      if (Math.random() < .8) push({
        x: p.x + (Math.random() - .5) * 6, y: p.y + (Math.random() - .5) * 6,
        vx: (Math.random() - .5) * 20, vy: (Math.random() - .5) * 20,
        r: 1.2 + Math.random() * 2.2, life: 1, decay: 2.6, col: p.col, glow: 1.2, wob: 0,
      });
    } else {
      p.wob += dt * 2.2;
      p.x += (p.vx + Math.sin(p.wob) * 9) * dt;
      p.y += p.vy * dt;
      if (p.grav) p.vy += p.grav * dt;
      p.vx *= 1 - dt * 1.1; p.vy *= 1 - dt * 0.55;
      p.life -= p.decay * dt;
      if (p.life <= 0 || p.y < -60 || p.x < -60 || p.x > w + 60) { PARTS.splice(i, 1); continue; }
    }

    const a = Math.max(0, Math.min(1, p.life));
    const rr = p.r * (p.path ? 1 : 0.4 + a * 0.6);
    const R2 = rr * 5 * p.glow;
    // 每顆粒子即時 createRadialGradient 會直接吃掉手機的幀率，
    // 所以每個顏色只烘一次小 sprite，之後都只是 drawImage。
    const spr = sprite(p.col);
    ctx.globalAlpha = a;
    ctx.drawImage(spr, p.x - R2, p.y - R2, R2 * 2, R2 * 2);
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'source-over';
}

const SPRITES = new Map();
const SPR = 64;
function sprite(col) {
  let s = SPRITES.get(col);
  if (s) return s;
  s = document.createElement('canvas');
  s.width = s.height = SPR;
  const c = s.getContext('2d');
  const g = c.createRadialGradient(SPR / 2, SPR / 2, 0, SPR / 2, SPR / 2, SPR / 2);
  g.addColorStop(0, hexA(col, 0.95));
  g.addColorStop(0.10, hexA('#FFFFFF', 0.85));
  g.addColorStop(0.28, hexA(col, 0.34));
  g.addColorStop(1, hexA(col, 0));
  c.fillStyle = g;
  c.fillRect(0, 0, SPR, SPR);
  SPRITES.set(col, s);
  return s;
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
}

export function clearParticles() { PARTS.length = 0; }
