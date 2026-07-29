// 一個地點的一整輪。
//
// 三種題型輪替，但殼是一樣的：世界上出現東西 → 嚕米問一句 → 小朋友戳 →
// 世界發生變化。答對，光會飛進提燈；答錯，那個東西只是害羞地縮一下，
// 沒有紅色、沒有叉叉、沒有分數，永遠可以再試。

import {
  app, setScenery, placeLumi, hudMode, go, fx, fy, fs, el, PAL, A,
  paperCard, makeProgressLamps, refreshHud, makeGlyph,
} from '../game.js';
import { areaByKey, makeQuestion, recordAnswer } from '../data/world.js';
import { makeNumberToken, makeCountable, makeQuantityToken, Prop } from '../art/props.js';
import { drawGlowbug, pickReward } from '../data/glowbugs.js';
import { burst, flyLight, setAmbientMotes } from '../art/particles.js';
import { lockTaps, buzz } from '../core/pointer.js';
import { store } from '../core/store.js';
import { onTick } from '../core/ticker.js';
import { stage } from '../core/stage.js';

let area, epoch = 0, lamps = null, qi = 0, q = null;
let tokens = [], countables = [], counted = 0, wrongs = 0;
let idleT = 0, offIdle = null, secretRock = null, rockTaps = 0;
let answering = false;
let rapidTaps = [], guidedRapidAt = 0;   // 亂點偵測用
let areaWrongs = 0, areaHadRapidTap = false, areaSkippedCount = false, areaUsedHint = false; // 專心挑戰用

const alive = e => e === epoch;

export const level = {
  async enter({ areaKey }) {
    area = areaByKey(areaKey);
    epoch++;
    const me = epoch;

    setScenery(area.key);
    setAmbientMotes(area.key === 'cliff' ? .3 : .6, area.tint);
    hudMode('level');
    placeLumi(lumiSpot());
    app.lumi.setLantern(0.15 + app.run.lit.size * 0.17);

    lamps = makeProgressLamps(app.layers.overlay, area.questions);
    paperCard(app.layers.overlay, `<div class="pc-line">${area.name}</div>`, { dur: 2.0 });
    A.say(area.voice);

    if (area.key === 'cove') plantSecretRock();

    qi = 0; wrongs = 0; areaWrongs = 0; areaHadRapidTap = false; areaSkippedCount = false; areaUsedHint = false;
    offIdle = onTick(dt => {
      if (!alive(me) || answering || !q) return;
      idleT += dt;
      if (idleT > 7.5) { idleT = 0; repeatPrompt(); }
    });

    await sleep(1.4);
    if (!alive(me)) return;
    nextQuestion(me);
  },

  onResize() {
    placeLumi(lumiSpot());
    layoutAll();
  },

  onPokeLumi() { repeatPrompt(); },

  exit() {
    epoch++;
    offIdle?.(); offIdle = null;
    lamps?.destroy(); lamps = null;
    tokens.forEach(t => t.destroy()); tokens = [];
    countables.forEach(c => c.destroy()); countables = [];
    secretRock?.destroy(); secretRock = null;
    q = null; answering = false; rapidTaps = []; guidedRapidAt = 0; areaUsedHint = false;
  },
};

const sleep = s => new Promise(r => setTimeout(r, s * 1000));

// 嚕米站在角落，但絕不能站在選項上面。三個區帶各自分開：
//   上：要數的東西  ／  中下：可以戳的選項  ／  最下：嚕米
const lumiSpot = () => (stage.portrait ? { x: .13, y: 1.00, s: .72 } : { x: .085, y: .99, s: .80 });
const ROW_Y = () => (stage.portrait ? .715 : .68);
const FIELD_TOP = () => (stage.portrait ? { y0: .04, y1: .50 } : { y0: .04, y1: .44 });

/* ───────────────────────── 出題 ───────────────────────── */

async function nextQuestion(me) {
  if (!alive(me)) return;
  clearBoard();
  wrongs = 0; counted = 0; idleT = 0; rapidTaps = [];

  q = makeQuestion(area, qi, app.run.skill, Math.random, store.cycle(area.key));
  app.q = q;                 // 給除錯／自動化測試看的當前題目
  const n = q.answer;

  if (q.mode === 'count') {
    // 世界上出現 n 個東西
    const pts = scatter(n, FIELD_TOP());
    countables = pts.map((p, i) => {
      const c = makeCountable(app.layers.scene, area.motif, {
        x: fx(p.x), y: fy(p.y), size: motifSize(n), seed: Math.random(),
      });
      c.fieldPos = p;
      c.appear(0.05 + i * 0.07);
      c.interactive(() => tapCountable(c, me));
      return c;
    });
    // 下面一排數字牌：先鎖住，數完才解鎖
    tokens = layoutRow(q.options, (v, x, y, size) =>
      makeNumberToken(app.layers.scene, v, { holder: area.holder, size, x, y, seed: Math.random() }));
    tokens.forEach((t, i) => { t.appear(0.35 + i * 0.09); t.lock(true); t.interactive(() => answer(t, me)); });
    await sleep(1.0);
    if (!alive(me)) return;
    A.sayOneOf(['ask1', 'ask2', 'ask3']);

  } else if (q.mode === 'listen') {
    // 數字散落在場景裡，聽到哪個就去找哪個
    const b = area.band || { y0: .12, y1: .58 };
    const pts = scatter(q.options.length, stage.portrait ? b : { y0: b.y0 * .9, y1: b.y1 * .92 });
    tokens = q.options.map((v, i) => {
      const t = makeNumberToken(app.layers.scene, v, {
        holder: area.holder, size: tokenSize(q.options.length),
        x: fx(pts[i].x), y: fy(pts[i].y), seed: Math.random(),
      });
      t.fieldPos = pts[i];
      t.appear(0.1 + i * 0.1);
      t.lock(true);
      t.interactive(() => answer(t, me));
      return t;
    });
    await sleep(0.9);
    if (!alive(me)) return;
    await A.sayFind(n, qi % 2 === 1);
    if (!alive(me)) return;
    await unlockTokensWithThinkDelay(me);

  } else {
    // quantity：聽到數字，選出「那麼多」的一群
    tokens = layoutRow(q.options, (v, x, y, size) =>
      makeQuantityToken(app.layers.scene, v, area.motif, { size: size * 1.05, x, y, seed: Math.random(), tint: area.tint }));
    tokens.forEach((t, i) => { t.appear(0.15 + i * 0.1); t.lock(true); t.interactive(() => answer(t, me)); });
    await sleep(0.9);
    if (!alive(me)) return;
    await A.sayFind(n, true);
    if (!alive(me)) return;
    await unlockTokensWithThinkDelay(me);
  }
}

function repeatPrompt() {
  if (!q || answering) return;
  app.lumi.hop(.6);
  if (q.mode === 'count') A.sayOneOf(['ask1', 'ask2', 'ask3']);
  else A.sayFind(q.answer, false);
  idleT = 0;
}

/* ── 數數：戳一個亮一個，木琴音一階一階往上 ── */
function tapCountable(c, me) {
  if (c.tagged || answering || !alive(me)) return;
  c.tagged = true;
  counted++;
  c.celebrate();
  c.glow.to(1);
  // 數過的東西「被點亮了」——這是它自己說得出口的狀態，不需要打勾或編號
  el('circle', { cx: 0, cy: 0, r: 48, fill: 'none', stroke: PAL.mint, 'stroke-width': 3, opacity: .3, 'stroke-dasharray': '8 10' }, c.art);
  A.countTone(counted - 1, countables.length);
  A.sayNumber(counted);
  buzz(10);
  const b = c.node.getBoundingClientRect();
  burst(b.left + b.width / 2, b.top + b.height / 2, { count: 8, col: area.tint, power: .5 });
  idleT = 0;
  if (counted === countables.length) {
    setTimeout(() => {
      A.chime(1046, { gain: .3, decay: 1.4 }); app.lumi.hop(.7);
      unlockTokensWithThinkDelay(me);
    }, 260);
  }
}

/** 數字牌/選項解鎖前留一點「想一想」的空白，抑制衝動亂點 */
async function unlockTokensWithThinkDelay(me) {
  await sleep(0.32);
  if (!alive(me)) return;
  tokens.forEach(t => { t.lock(false); t.bounce(); });
}

/** 偵測連續亂點：短時間內戳太多不同選項，Lumi 會輕輕擋一下並引導 */
function checkRapidTapping(me) {
  const now = performance.now();
  rapidTaps.push(now);
  rapidTaps = rapidTaps.filter(t => now - t < 2500);
  if (rapidTaps.length < 4) return;
  areaHadRapidTap = true;
  if (now - guidedRapidAt < 6000) return;   // 不要一直念
  guidedRapidAt = now;
  app.lumi.tilt();
  tokens.forEach(t => t.lock(true));
  setTimeout(() => {
    if (!alive(me) || answering) return;
    tokens.forEach(t => t.lock(false));
  }, 1200);
}

/* ───────────────────────── 判定 ───────────────────────── */

async function answer(tok, me) {
  if (!alive(me) || answering || !q) return;
  idleT = 0;

  if (tok.value !== q.answer) {
    // 溫柔的不對
    recordAnswer(app.run.skill, false);
    wrongs++; areaWrongs++;
    tok.shy();
    // 錯誤回饋不要太熱鬧，避免亂點反而變成多巴胺來源
    if (wrongs <= 2) A.nudge();
    checkRapidTapping(me);
    A.say(wrongs === 1 ? 'miss1' : wrongs === 2 ? 'miss3' : 'miss4');
    if (wrongs >= 2) {
      areaUsedHint = true;
      const right = tokens.find(t => t.value === q.answer);
      right?.hint(true);
      if (wrongs >= 3 && q.mode !== 'count') setTimeout(() => A.sayFind(q.answer, false), 900);
    }
    return;
  }

  // 對了
  if (q.mode === 'count' && counted < countables.length) areaSkippedCount = true;
  answering = true;
  lockTaps(1.2);
  tokens.forEach(t => t.lock(true));
  recordAnswer(app.run.skill, true);
  tok.hint(false);
  tok.celebrate();
  tokens.filter(t => t !== tok).forEach(t => t.vanish(0.05));

  A.sparkle({ n: 5 });
  A.bloom();
  app.lumi.cheer();
  buzz(24);

  const tb = tok.node.getBoundingClientRect();
  burst(tb.left + tb.width / 2, tb.top + tb.height / 2, { count: 30, col: area.tint, power: 1.15 });

  const lr = app.lumi.root.getBoundingClientRect();
  const lampX = lr.left + lr.width * 0.22, lampY = lr.top + lr.height * 0.62;

  if (q.mode === 'count') {
    // 東西一個一個飛進提燈，邊飛邊數
    countables.forEach((c, i) => {
      setTimeout(() => {
        if (!alive(me)) return;
        const b = c.node.getBoundingClientRect();
        c.vanish(0);
        A.countTone(i, countables.length);
        flyLight(b.left + b.width / 2, b.top + b.height / 2, lampX, lampY, {
          col: area.tint, dur: .62,
          onArrive: () => { app.lumi.hop(.35); },
        });
      }, 220 + i * 190);
    });
    await sleep(0.4 + countables.length * 0.19 + 0.4);
    if (!alive(me)) return;
    await A.sayIs(q.answer);
  } else {
    const b = tok.node.getBoundingClientRect();
    setTimeout(() => tok.vanish(0), 420);
    flyLight(b.left + b.width / 2, b.top + b.height / 2, lampX, lampY, {
      col: area.tint, dur: .8, onArrive: () => app.lumi.hop(.6),
    });
    await sleep(0.6);
    if (!alive(me)) return;
    A.sayOneOf(['good1', 'good2', 'good3', 'good4', 'good5', 'good6']);
    await sleep(0.9);
  }
  if (!alive(me)) return;

  lamps?.light(qi);
  app.lumi.setLantern(0.15 + app.run.lit.size * 0.17 + ((qi + 1) / area.questions) * 0.16);
  store.setBest(app.run.skill.best);

  qi++;
  answering = false;
  await sleep(0.5);
  if (!alive(me)) return;

  if (qi >= area.questions) finishArea(me);
  else nextQuestion(me);
}

/* ───────────────────────── 收尾 ───────────────────────── */

async function finishArea(me) {
  answering = true;
  clearBoard();
  app.run.lit.add(area.key);
  const cycle = store.cycleUp(area.key);

  // 整個地點亮起來：一大群光從提燈裡湧出去，散進場景
  const lr = app.lumi.root.getBoundingClientRect();
  const lampX = lr.left + lr.width * 0.22, lampY = lr.top + lr.height * 0.62;
  A.bloom({ gain: .55 });
  A.sparkle({ n: 8, root: 392 });
  for (let i = 0; i < 26; i++) {
    setTimeout(() => {
      if (!alive(me)) return;
      flyLight(lampX, lampY, fx(Math.random()), fy(Math.random() * .8), {
        col: Math.random() < .35 ? PAL.mint : area.tint, dur: .7 + Math.random() * .6,
        onArrive: () => burst(0, 0, { count: 0 }),
      });
    }, i * 55);
  }
  app.lumi.cheer();
  A.say('area_clear');
  await sleep(2.0);
  if (!alive(me)) return;

  // 光靈報酬：完美完成 → 彩虹，專心完成 → 金色，否則一般
  const perfect = areaWrongs === 0 && !areaHadRapidTap && !areaSkippedCount && !areaUsedHint;
  const focusCompleted = areaWrongs <= 2 && !areaHadRapidTap && !areaSkippedCount;
  const forceVariant = perfect ? 'platinum' : focusCompleted ? 'golden' : null;
  const collected = { ...store.bugs };
  Object.keys(store.goldenBugs).forEach(id => collected[id] = (collected[id] || 0) + store.goldenBugs[id]);
  Object.keys(store.platinumBugs).forEach(id => collected[id] = (collected[id] || 0) + store.platinumBugs[id]);
  const { bug, variant } = pickReward(collected, Math.random, forceVariant);
  if (variant === 'platinum') store.addPlatinumBug(bug.id);
  else if (variant === 'golden') store.addGoldenBug(bug.id);
  else store.addBug(bug.id);
  if (variant === 'platinum') store.unlock('platinum');
  if (variant === 'golden') store.unlock('golden');
  refreshHud();

  const p = new Prop(app.layers.scene, { x: fx(.5), y: fy(.42), size: fs(.42), drift: 1.2 });
  p.art.appendChild(drawGlowbug(bug, { variant, seed: 3 }));
  p.appear(0.1);
  p.interactive(() => { p.celebrate(); A.chime(880 + Math.random() * 400, { gain: .35 }); });

  const rewardChime = variant === 'platinum' ? 2093 : variant === 'golden' ? 1568 : 1046;
  const rewardCount = variant === 'platinum' ? 56 : variant === 'golden' ? 46 : 28;
  const rewardCol = variant === 'platinum' ? '#E6E6FF' : variant === 'golden' ? '#FFD873' : bug.body;
  A.chime(rewardChime, { gain: .45, decay: 2.4 });
  burst(fx(.5), fy(.42), { count: rewardCount, col: rewardCol, power: 1.2 });
  A.say(variant === 'platinum' ? 'rare' : variant === 'golden' ? 'rare' : 'collect');

  const badge = variant === 'platinum' ? '<i class="pc-gold">彩虹光靈！</i>'
              : variant === 'golden' ? '<i class="pc-gold">金色的！</i>'
              : '';
  paperCard(app.layers.overlay,
    `<div class="pc-bug"><b>${bug.name}</b>${badge}</div>`,
    { dur: 2.8 });

  await sleep(2.6);
  if (!alive(me)) return;
  p.vanish(0);
  await sleep(0.5);
  if (!alive(me)) return;
  go('map', { justLit: area.key });
}

/* ───────────────────────── 版面 ───────────────────────── */

function clearBoard() {
  tokens.forEach(t => t.destroy()); tokens = [];
  countables.forEach(c => c.destroy()); countables = [];
}

function tokenSize(n) {
  const byWidth = (stage.field.w / n) * 0.80;
  return Math.max(74, Math.min(fs(.30), byWidth));
}
function motifSize(n) {
  const k = n <= 4 ? .21 : n <= 6 ? .175 : .145;
  return Math.max(48, Math.min(fs(k), stage.field.w / (Math.min(n, 5) * 1.15)));
}

/** 底部一排：數字牌 / 數量牌 */
function layoutRow(values, make) {
  const n = values.length;
  const size = tokenSize(n);
  const gap = Math.min(size * 0.24, stage.field.w * 0.05);
  const total = n * size + (n - 1) * gap;
  const startX = stage.field.x + (stage.field.w - total) / 2 + size / 2;
  const y = fy(ROW_Y());
  return values.map((v, i) => {
    const t = make(v, startX + i * (size + gap), y, size);
    t.rowIndex = i; t.rowCount = n;
    return t;
  });
}

/** 散落在場景裡，彼此不重疊 */
function scatter(n, { y0 = .1, y1 = .6, minGap = .16 } = {}) {
  const pts = [];
  const cols = Math.ceil(Math.sqrt(n * (stage.field.w / Math.max(1, stage.field.h)) * 1.4)) || 1;
  const rows = Math.ceil(n / cols);
  const marginX = 0.10;
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const inRow = Math.min(cols, n - r * cols);
    const px = marginX + (1 - marginX * 2) * ((c + 0.5) / inRow) + (Math.random() - .5) * 0.06;
    const py = y0 + (y1 - y0) * (rows === 1 ? 0.5 : (r + 0.5) / rows) + (Math.random() - .5) * 0.05;
    pts.push({ x: Math.max(0.08, Math.min(0.92, px)), y: Math.max(0.04, Math.min(0.94, py)) });
  }
  return pts;
}

function layoutAll() {
  countables.forEach(c => { if (c.fieldPos) { c.x = fx(c.fieldPos.x); c.y = fy(c.fieldPos.y); } });
  if (!tokens.length) return;
  if (tokens[0].fieldPos) {
    tokens.forEach(t => { t.x = fx(t.fieldPos.x); t.y = fy(t.fieldPos.y); });
  } else {
    const n = tokens.length, size = tokenSize(n);
    const gap = Math.min(size * 0.24, stage.field.w * 0.05);
    const total = n * size + (n - 1) * gap;
    const startX = stage.field.x + (stage.field.w - total) / 2 + size / 2;
    const y = fy(ROW_Y());
    tokens.forEach((t, i) => { t.x = startX + i * (size + gap); t.y = y; });
  }
}

/* ───────── ✨ 秘密二：海灘上那顆石頭 ───────── */
function plantSecretRock() {
  const p = new Prop(app.layers.scene, { x: fx(.88), y: fy(.93), size: fs(.20), drift: .25 });
  const g = p.art;
  el('path', {
    d: 'M-62,44 C-72,10 -50,-40 -8,-46 C34,-52 66,-16 62,26 C60,44 40,50 0,50 Z',
    fill: '#232A46', filter: 'url(#torn-m)',
  }, g);
  el('path', {
    d: 'M-40,-6 C-30,-30 -4,-38 16,-30', stroke: PAL.mint, 'stroke-width': 5,
    fill: 'none', opacity: .16, 'stroke-linecap': 'round',
  }, g);
  p.baseScale = 1; p.appear(.6);
  rockTaps = 0;
  p.interactive(() => {
    rockTaps++;
    p.sc.set(.9).to(1); p.rot.kick(4);
    A.thud({ gain: .22 + rockTaps * .02 });
    if (rockTaps === 4) A.bubble({ up: true, gain: .2 });
    if (rockTaps >= 7) { rockTaps = -99; revealCrab(p); }
  });
  secretRock = p;
}

async function revealCrab(rock) {
  const first = store.unlock('crab');
  A.whoosh({ gain: .3, dur: .4 });
  rock.rot.kick(16);
  const b = rock.node.getBoundingClientRect();
  burst(b.left + b.width / 2, b.top + b.height / 2, { count: 18, col: PAL.coral, power: .8 });

  const crab = new Prop(app.layers.scene, { x: rock.x - fs(.10), y: rock.y + fs(.02), size: fs(.16), drift: .6 });
  const g = crab.art;
  el('ellipse', { cx: 0, cy: 0, rx: 54, ry: 40, fill: '#E86A54', filter: 'url(#torn-s)' }, g);
  el('ellipse', { cx: 0, cy: -8, rx: 44, ry: 26, fill: '#FF8B7A', opacity: .8, filter: 'url(#torn-s)' }, g);
  [-1, 1].forEach(s => {
    el('path', { d: `M${s * 46},6 L${s * 78},-14`, stroke: '#E86A54', 'stroke-width': 11, 'stroke-linecap': 'round' }, g);
    el('path', { d: `M${s * 78},-14 l${s * 16},-12 l${s * 4},16 z`, fill: '#FF8B7A' }, g);
    el('path', { d: `M${s * 30},34 L${s * 46},58 M${s * 12},40 L${s * 20},64`, stroke: '#E86A54', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
    el('circle', { cx: s * 16, cy: -34, r: 9, fill: '#FFFDF4' }, g);
    el('circle', { cx: s * 16, cy: -34, r: 4.4, fill: '#241B22' }, g);
    el('path', { d: `M${s * 16},-26 v10`, stroke: '#E86A54', 'stroke-width': 5 }, g);
  });
  el('path', { d: 'M-14,10 C-6,18 6,18 14,10', stroke: '#8A3A30', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, g);
  crab.appear(0);
  A.say('crab');
  A.pluck(659, { gain: .4 }); setTimeout(() => A.pluck(880, { gain: .4 }), 130);

  // 揮手三次然後跑掉
  let t = 0;
  const off = onTick(dt => {
    t += dt;
    crab.rot.value = Math.sin(t * 9) * 9;
    if (t > 2.2) { crab.x -= 160 * dt; }
    if (t > 4.4) { off(); crab.vanish(0); }
  });
  crab.interactive(() => { crab.celebrate(); A.bubble({ up: true }); });
  if (first) setTimeout(() => A.chime(1318, { gain: .35, decay: 2 }), 700);
}
