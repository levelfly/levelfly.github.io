// 遊戲外殼：場景切換、常駐的嚕米、HUD、以及那個「戳五下會打噴嚏」的秘密。

import { stage, onResize, fx, fy, fs } from './core/stage.js';
import { buildScenery } from './art/scenery.js';
import { Lumi } from './art/lumi.js';
import { el, PAL, injectPaperDefs, grainDataUrl } from './art/paper.js';
import { makeGlyph } from './art/glyphs.js';
import { drawGlowbug, GLOWBUGS } from './data/glowbugs.js';
import { Prop, drawBubble } from './art/props.js';
import { onTick } from './core/ticker.js';
import { tappable, buzz, lockTaps } from './core/pointer.js';
import { store } from './core/store.js';
import { rng, makeRng } from './core/rng.js';
import * as A from './core/audio.js';
import { initParticles, setAmbientMotes, burst, clearParticles } from './art/particles.js';

export const app = {
  layers: {}, lumi: null, scenery: null, scene: null, sceneName: '',
  run: null, hud: {},
};

/* ───────────────────────── 啟動 ───────────────────────── */

export function bootShell() {
  injectPaperDefs();
  document.documentElement.style.setProperty('--grain-url', grainDataUrl());

  app.layers = {
    stage: document.getElementById('stage'),
    bg: document.getElementById('bgLayer'),
    fx: document.getElementById('fx'),
    scene: document.getElementById('scene'),
    char: document.getElementById('charLayer'),
    hud: document.getElementById('hud'),
    overlay: document.getElementById('overlay'),
  };
  initParticles(app.layers.fx);

  app.lumi = new Lumi(app.layers.char, { scale: 1 });
  app.lumi.root.style.cssText = 'position:absolute;left:0;top:0;transform-origin:50% 80%;will-change:transform';
  makeLumiPokeable();

  buildHud();
  onResize(() => { placeLumi(); layoutHud(); if (app.scene?.onResize) app.scene.onResize(); });

  // 嚕米的眼睛跟著手指走
  window.addEventListener('pointerdown', e => app.lumi.lookAt(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointermove', e => { if (e.buttons) app.lumi.lookAt(e.clientX, e.clientY); }, { passive: true });

  onTick(t => { if (app.scenery) app.scenery.tick(performance.now() / 1000); });
}

/* ───────────────────────── 場景切換 ───────────────────────── */

const SCENES = {};
export function registerScene(name, mod) { SCENES[name] = mod; }

export async function go(name, params = {}) {
  if (app.scene?.exit) { try { await app.scene.exit(); } catch (e) { console.error(e); } }
  app.layers.scene.innerHTML = '';
  app.layers.overlay.innerHTML = '';
  clearParticles();
  app.sceneName = name;
  app.scene = SCENES[name];
  document.body.dataset.scene = name;
  await app.scene.enter(params);
}

/** 換一張場景畫（程序生成，直橫向會重新構圖） */
export function setScenery(key, seed = (Math.random() * 1e6) | 0) {
  app.scenery?.destroy();
  const w = 1000, h = Math.round(1000 * stage.h / Math.max(1, stage.w));
  app.scenery = buildScenery(app.layers.bg, key, { w, h, seed });
  app.layers.bg.classList.add('on');
  app._scnKey = key; app._scnSeed = seed;
  A.setMusic(key); A.setAmbient(key);
}
onResize(() => {
  if (!app._scnKey) return;
  clearTimeout(app._reScn);
  app._reScn = setTimeout(() => setScenery(app._scnKey, app._scnSeed), 180);
});

/* ───────────────────────── 嚕米 ───────────────────────── */

export function placeLumi(pos) {
  if (pos) app._lumiPos = pos;
  const p = app._lumiPos || { x: .16, y: .90, s: 1 };
  // 基準看遊戲場的短邊，但再用「場高」夾一次上限：
  // 平板的場很寬，只看短邊會把嚕米放大到壓住下面那排選項。
  const s = Math.min((p.s || 1) * fs(0.0026) * 1.05, stage.field.h * 0.000935);
  const x = fx(p.x), y = fy(p.y);
  app.lumi.root.style.transform = `translate3d(${(x - 110 * s).toFixed(1)}px,${(y - 190 * s).toFixed(1)}px,0) scale(${s.toFixed(3)})`;
  app.lumi.root.style.transformOrigin = '0 0';
}

let pokes = 0, pokeTimer = 0;
function makeLumiPokeable() {
  tappable(app.lumi.root, () => {
    app.lumi.poke();
    A.pluck(392 + Math.random() * 180, { gain: .3, decay: .3 });
    buzz(10);
    pokes++;
    clearTimeout(pokeTimer);
    pokeTimer = setTimeout(() => (pokes = 0), 3200);
    if (pokes === 3) A.say('giggle');
    if (pokes >= 5) { pokes = 0; sneezeBubbles(); }
    else app.scene?.onPokeLumi?.();
  });
}

/** ✨ 秘密一：連戳五下 → 嚕米打噴嚏，噴出一串會念數字的泡泡 */
async function sneezeBubbles() {
  const first = store.unlock('sneeze');
  await app.lumi.sneeze();
  A.say('sneeze');
  A.whoosh({ gain: .35, dur: .35, up: false });
  const r = app.lumi.root.getBoundingClientRect();
  const ox = r.left + r.width * .5, oy = r.top + r.height * .35;
  burst(ox, oy, { count: 26, col: PAL.mint, col2: PAL.cream, power: 1.3 });

  const n = 6;
  for (let i = 0; i < n; i++) {
    const val = 1 + Math.floor(rng() * 10);
    const p = new Prop(app.layers.scene, {
      x: ox + (i - (n - 1) / 2) * fs(.15) + (Math.random() - .5) * 30,
      y: oy - Math.random() * 30,
      size: fs(.22), drift: 1.4, seed: Math.random(),
    });
    drawBubble(p, { tint: [PAL.mint, PAL.honey, PAL.coral][i % 3] });
    el('circle', { cx: 0, cy: 0, r: 44, fill: '#111A31', opacity: .55 }, p.art);
    const gl = makeGlyph(val, { color: '#FFF3D0', ink: '#0A0F1E', width: 18, glow: 'glow-s' });
    gl.setAttribute('transform', 'scale(0.60)');
    p.art.appendChild(gl);
    p.appear(i * 0.09);
    p.interactive(() => {
      A.bubble({ up: false });
      A.sayNumber(val);
      const b = p.node.getBoundingClientRect();
      burst(b.left + b.width / 2, b.top + b.height / 2, { count: 14, col: PAL.cream, power: .8 });
      p.vanish();
    });
    // 慢慢飄上去，飄出畫面就自己消失
    const vx = (Math.random() - .5) * 40, vy = -(26 + Math.random() * 30);
    const off = onTick(dt => {
      if (!p.alive) return off();
      p.x += vx * dt; p.y += vy * dt;
      if (p.y < -160) { off(); p.destroy(); }
    });
  }
  if (first) setTimeout(() => A.chime(1174, { gain: .3, decay: 1.6 }), 500);
}

/* ───────────────────────── HUD ───────────────────────── */

function buildHud() {
  const h = app.layers.hud;
  h.innerHTML = '';

  // 收藏（燈籠）
  const lant = document.createElement('button');
  lant.className = 'hud-btn hud-lantern';
  lant.setAttribute('aria-label', '打開燈籠看收藏');
  lant.innerHTML = `<svg viewBox="-60 -80 120 150" width="100%" height="100%">
      <path d="M0,-64 C-8,-52 -8,-46 0,-40" stroke="#C9A26A" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M-34,-40 h68 l8,11 h-84 z" fill="#C9A26A"/>
      <path d="M-29,-29 h58 v52 a29 25 0 0 1 -58 0 z" fill="#0F1A33" opacity=".8"/>
      <circle class="hl-core" cx="0" cy="0" r="17" fill="url(#g-warm)" opacity=".8"/>
      <path d="M-29,-29 h58 v52 a29 25 0 0 1 -58 0 z" fill="none" stroke="#E6C894" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-33,48 h66" stroke="#C9A26A" stroke-width="7" stroke-linecap="round"/>
    </svg><i class="hud-count"></i>`;
  tappable(lant, () => { A.chime(880, { gain: .3 }); go('lantern', { from: app.sceneName }); });
  h.appendChild(lant);

  // 回島（只有在關卡裡出現）
  const back = document.createElement('button');
  back.className = 'hud-btn hud-back';
  back.setAttribute('aria-label', '回到島上');
  back.innerHTML = `<svg viewBox="-50 -50 100 100" width="100%" height="100%">
      <path d="M-34,-26 L-4,-36 L20,-26 L38,-34 L38,26 L20,34 L-4,24 L-34,34 Z" fill="#1B2440" stroke="#E6C894" stroke-width="4" stroke-linejoin="round"/>
      <path d="M-4,-36 L-4,24 M20,-26 L20,34" stroke="#E6C894" stroke-width="2.6" opacity=".55"/>
      <circle cx="8" cy="-4" r="6" fill="#FFC46B"/>
    </svg>`;
  tappable(back, () => { A.whoosh({ up: false }); go('map'); });
  h.appendChild(back);

  // 靜音
  const mute = document.createElement('button');
  mute.className = 'hud-btn hud-mute';
  mute.setAttribute('aria-label', '聲音開關');
  mute.innerHTML = `<svg viewBox="-50 -50 100 100" width="100%" height="100%">
      <path d="M-26,-12 h-12 v24 h12 L-6,28 V-28 Z" fill="#E6C894"/>
      <g class="mute-on"><path d="M6,-16 C16,-8 16,8 6,16" stroke="#E6C894" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M18,-28 C34,-14 34,14 18,28" stroke="#E6C894" stroke-width="6" fill="none" stroke-linecap="round" opacity=".6"/></g>
      <g class="mute-off"><path d="M8,-14 L34,14 M34,-14 L8,14" stroke="#E6C894" stroke-width="6" stroke-linecap="round"/></g>
    </svg>`;
  tappable(mute, () => {
    const m = !A.isMuted();
    A.setMuted(m);
    mute.classList.toggle('is-muted', m);
    if (!m) A.chime(880, { gain: .3 });
  });
  mute.classList.toggle('is-muted', A.isMuted());
  h.appendChild(mute);

  // 本關挑戰狀態（完美 / 專心）
  const challenge = document.createElement('div');
  challenge.className = 'hud-challenge';
  challenge.innerHTML = `<span class="hc-icon hc-perfect" title="完美挑戰：零錯誤、不亂點、不跳過、不用提示">★</span><span class="hc-icon hc-focus" title="專心挑戰：少錯、不亂點、不跳過">✦</span>`;
  h.appendChild(challenge);

  app.hud = { lant, back, mute, count: lant.querySelector('.hud-count'), challenge };
  refreshHud();
  layoutHud();
}

export function updateChallengeHud({ perfect = true, focus = true } = {}) {
  if (!app.hud?.challenge) return;
  app.hud.challenge.querySelector('.hc-perfect').classList.toggle('lost', !perfect);
  app.hud.challenge.querySelector('.hc-focus').classList.toggle('lost', !focus);
}

export function refreshHud() {
  const n = store.bugCount();
  app.hud.count.textContent = n ? String(n) : '';
  app.hud.count.style.display = n ? 'grid' : 'none';
  app.hud.lant.classList.toggle('has-bugs', n > 0);
}

function layoutHud() {
  // 小手指要按得到，但不能大到搶走畫面：52～76px
  const s = Math.max(52, Math.min(76, fs(.13)));
  ['lant', 'back', 'mute'].forEach(k => {
    const b = app.hud[k]; if (!b) return;
    b.style.width = b.style.height = s.toFixed(0) + 'px';
  });
}

/** 讓 HUD 依場景顯示 / 隱藏 */
export function hudMode(mode) {
  app.layers.hud.dataset.mode = mode;
}

/* ───────────────────────── 進度小燈 ───────────────────────── */

export function makeProgressLamps(parent, total) {
  const wrap = document.createElement('div');
  wrap.className = 'progress-lamps';
  for (let i = 0; i < total; i++) {
    const d = document.createElement('i');
    d.innerHTML = `<svg viewBox="-20 -20 40 40" width="100%" height="100%">
      <circle class="pl-glow" cx="0" cy="0" r="15" fill="url(#g-warm)" opacity="0"/>
      <circle cx="0" cy="0" r="7.5" fill="none" stroke="#E6C894" stroke-width="2.6" opacity=".38"/>
      <circle class="pl-core" cx="0" cy="0" r="4.6" fill="#FFE3A3" opacity="0"/></svg>`;
    wrap.appendChild(d);
  }
  parent.appendChild(wrap);
  return {
    node: wrap,
    light(i) {
      const d = wrap.children[i]; if (!d) return;
      d.classList.add('lit');
      d.querySelector('.pl-core').setAttribute('opacity', '1');
      d.querySelector('.pl-glow').setAttribute('opacity', '.85');
    },
    destroy() { wrap.remove(); },
  };
}

/* ───────────────────────── 小工具 ───────────────────────── */

/** 一張會飄進來的紙卡（地點名、獎勵…），不用來承載玩法，只當節奏的呼吸 */
export function paperCard(parent, html, { dur = 2.2, cls = '' } = {}) {
  const c = document.createElement('div');
  c.className = 'paper-card ' + cls;
  c.innerHTML = html;
  parent.appendChild(c);
  requestAnimationFrame(() => c.classList.add('in'));
  if (dur > 0) setTimeout(() => { c.classList.remove('in'); setTimeout(() => c.remove(), 700); }, dur * 1000);
  return c;
}

export { fx, fy, fs, el, PAL, makeGlyph, drawGlowbug, GLOWBUGS, stage, A, makeRng, lockTaps };
