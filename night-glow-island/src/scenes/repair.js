// 分光 —— 晨風群島的核心玩法。
//
// 夜光島的動詞是「找」（這是幾？在哪裡？），這裡的動詞是「分」：
// 燈籠裡有 N 顆光，島上有幾個地方各自需要一些，她把光分過去。
// 同一個 8 可以是 5＋3，也可以是 4＋4，**每一種都對** ——
// 數量守恆大約 6 歲才長出來，這個玩法正好踩在她剛長出來的能力上。
//
// 🔴 一條不能碰的線：**光永遠守恆。**
// 對 6 歲來說資源耗損會被感覺成能力評價，「分錯 → 光變少」會直接翻譯成「我輸了」。
// 所以分錯的時候光珠只是飛回燈籠、化成一縷霧，嚕米說「我們換一種分法看看」。
// 一晚的長度用風表示（見 voyage.js），跟對錯完全脫鉤。

import {
  app, setScenery, placeLumi, hudMode, go, fx, fy, fs, el, A,
  paperCard, makeProgressLamps, makeGlyph,
} from '../game.js';
import { areaByKey } from '../profiles.js';
import { makeTask, reviewIsle } from '../data/director.js';
import { TOOLS, toolLevelFor } from '../data/tools.js';
import { makeOrb, Tray, trayLayout, mistPuff } from '../art/lightorb.js';
import { SKY } from '../art/sky.js';
import { burst, flyLight, setAmbientMotes } from '../art/particles.js';
import { draggable } from '../core/drag.js';
import { tappable, lockTaps, buzz } from '../core/pointer.js';
import { store } from '../core/store.js';
import { onTick } from '../core/ticker.js';
import { stage } from '../core/stage.js';

let area, skill, epoch = 0, lamps = null;
let qi = 0, task = null, trays = [], pool = [], orbs = [], history = [];
let poolArt = null, bar = null, ribbonArt = null;
let ease = 0, misses = 0, isleMisses = 0, settling = false, poolMode = 'cluster';
let idleT = 0, offIdle = null, toolNote = null;

const alive = e => e === epoch;
const sleep = s => new Promise(r => setTimeout(r, s * 1000));

export const repair = {
  async enter({ areaKey }) {
    area = areaByKey(areaKey) || areaByKey('garden');
    skill = area.skill || 'bond';
    epoch++;
    const me = epoch;

    setScenery(area.key);
    setAmbientMotes(.45, area.tint);
    hudMode('level');
    placeLumi(lumiSpot());
    app.lumi.setLantern(0.35 + (app.run.lit?.size || 0) * 0.1);

    qi = 0; ease = 0; misses = 0; isleMisses = 0; settling = false; poolMode = 'cluster';
    trays = []; pool = []; history = [];

    lamps = makeProgressLamps(app.layers.overlay, area.questions);
    paperCard(app.layers.overlay, `<div class="pc-line">${area.name}</div>`, { dur: 2.0, cls: 'pc-light' });
    A.say(area.voice);

    buildToolbar();

    // 久沒動作 → 把需求再講一次。不是催促，是「我還在這裡」。
    idleT = 0;
    offIdle = onTick(dt => {
      if (!alive(me) || settling || !task) return;
      idleT += dt;
      if (idleT > 9) { idleT = 0; repeat(); }
    });

    await sleep(1.5);
    if (!alive(me)) return;
    nextTask(me);
  },

  onResize() {
    placeLumi(lumiSpot());
    layoutAll();
  },

  onPokeLumi() { repeat(); },

  exit() {
    epoch++;
    offIdle?.(); offIdle = null;
    lamps?.destroy(); lamps = null;
    clearBoard();
    bar?.remove(); bar = null;
    toolNote = null;
  },
};

/* ───────────────────────── 版面 ───────────────────────── */

const lumiSpot = () => (stage.portrait ? { x: .12, y: 1.02, s: .68 } : { x: .07, y: 1.00, s: .74 });
const TRAY_Y = () => (stage.portrait ? .33 : .34);
const POOL_Y = () => (stage.portrait ? .80 : .80);

/**
 * 光珠多大。
 *
 * 先從「手指按得到」的下限出發，再確認幾個托盤橫著排得下 —— 排不下就縮，
 * 縮到 40px 為止。反過來（先決定托盤再塞光珠）會在橫握的窄畫面上爆版。
 */
function fitOrb() {
  const F = stage.field;
  // 托盤可以借用一點 field 的留白（那圈留白是為了不讓「可以戳的東西」貼邊，
  // 一個十格框的盤子稍微伸出去不礙事），但光珠絕不小於 40px —— 抓不住就不用玩了。
  const budget = F.w + Math.max(0, (stage.w - F.w) * .6);
  const want = Math.min(fs(.115), F.h * .13);
  for (let u = Math.max(44, want); u >= 40; u -= 2) {
    const ws = task.slots.map(s => trayLayout(s, u, task.total).w);
    const gap = u * .7;
    const total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
    if (total <= budget && poolSpan(task.pool.length, u) <= F.w) return u;
  }
  return 40;
}

function poolSpan(n, u) {
  const cols = Math.min(5, Math.max(1, n));
  return cols * u * 1.15;
}

/** 托盤橫排，寬度不平均（十格框比小碗寬），所以按實際寬度依序擺 */
function placeTrays() {
  const F = stage.field;
  const u = trays[0]?.orbPx || 48;
  const gap = u * .7;
  const total = trays.reduce((a, t) => a + t.w, 0) + gap * (trays.length - 1);
  let x = F.x + (F.w - total) / 2;
  const y = fy(TRAY_Y());
  trays.forEach(t => { t.setPos(x + t.w / 2, y); x += t.w + gap; });
}

/** 光池：燈籠倒出來的一攤光，五顆一排 */
function poolPoints(n, u) {
  const cols = poolMode === 'ten' ? 5 : Math.min(5, Math.max(1, Math.ceil(n / Math.ceil(n / 5))));
  const rows = Math.ceil(n / cols);
  const gap = u * 1.15;
  const cx = stage.field.x + stage.field.w * .5;
  const cy = fy(POOL_Y());
  const pts = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const inRow = Math.min(cols, n - r * cols);
    pts.push({
      x: cx + (c - (inRow - 1) / 2) * gap,
      y: cy + (r - (rows - 1) / 2) * gap * .92,
    });
  }
  return pts;
}

function layoutAll() {
  if (!task) return;
  placeTrays();
  trays.forEach(t => t.relayout());
  layoutPool();
  layoutPoolArt();
}

function layoutPool() {
  const u = pool[0]?.size || 48;
  const pts = poolPoints(pool.length, u);
  pool.forEach((o, i) => { o.x = pts[i].x; o.y = pts[i].y; });
}

/** 池子底下那攤光暈。它同時是「把光放回來」的投放區。 */
function layoutPoolArt() {
  if (!poolArt) return;
  const u = 48;
  const w = Math.max(poolSpan(Math.max(task.pool.length, 3), u) * 1.25, stage.field.w * .42);
  const h = u * 2.6;
  const cx = stage.field.x + stage.field.w * .5, cy = fy(POOL_Y());
  poolArt.style.left = (cx - w / 2) + 'px';
  poolArt.style.top = (cy - h / 2) + 'px';
  poolArt.style.width = w + 'px';
  poolArt.style.height = h + 'px';
}

/* ───────────────────────── 出題 ───────────────────────── */

async function nextTask(me) {
  if (!alive(me)) return;
  clearBoard();
  misses = 0; idleT = 0;

  task = makeTask(skill, { level: store.skill(skill).level, i: qi, ease, rand: Math.random });
  app.task = task;                       // 給自動走查看的當前題目
  const u = fitOrb();

  // 光池的底
  poolArt = document.createElement('div');
  poolArt.className = 'light-pool';
  // 燈籠倒出來的一攤光。它同時是「把光放回來」的投放區，所以要看得出來是一個地方，
  // 不能只是一團淡淡的暖色 —— 在什麼地形上都要讀得到（島是咖啡色的，光暈會被吃掉）。
  poolArt.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
      <ellipse cx="50" cy="54" rx="49" ry="40" fill="${SKY.gold}" opacity=".30"/>
      <ellipse cx="50" cy="52" rx="42" ry="31" fill="${SKY.cream}" opacity=".55"/>
      <ellipse cx="50" cy="52" rx="42" ry="31" fill="none" stroke="${SKY.soilDeep}"
               stroke-width=".7" stroke-dasharray="3 3" opacity=".38"/>
    </svg>`;
  app.layers.scene.appendChild(poolArt);
  layoutPoolArt();

  trays = task.slots.map(slot => new Tray(app.layers.scene, slot, {
    orb: u, tint: area.tint, motif: area.motif, capHint: task.total,
  }));
  placeTrays();
  trays.forEach((t, i) => {
    t.node.dataset.slot = String(i);
    t.appear(0.1 + i * 0.12);
    tappable(t.node, () => pullFromPool(t, me));
  });

  const pts = poolPoints(task.pool.length, u);
  pool = task.pool.map((v, i) => {
    const o = makeOrb(app.layers.scene, v, { x: pts[i].x, y: pts[i].y, size: u, seed: Math.random() });
    o.tray = null;
    o.node.dataset.in = 'pool';
    o.appear(0.35 + i * 0.05);
    wireOrb(o, me);
    return o;
  });
  orbs = [...pool];
  history = [];
  refreshToolbar();
  // 棋盤擺好了才開放操作。上一題的收尾動畫期間 settling 一直是 true，
  // 中間那段空白她點什麼都不會有事 —— 演出還沒演完就能動，看起來像 bug。
  settling = false;

  // 自動走查用的把手：一張「棋盤現在長什麼樣」的快照。
  // 走查要能像人一樣做決定（這一盤還缺幾顆、池子裡有哪些面額），
  // 從 DOM 反推很脆弱，直接給它一份真實狀態比較誠實。
  app.board = () => ({
    total: task?.total ?? 0,
    pool: pool.map(o => o.value),
    trays: trays.map((t, i) => ({
      i, kind: t.slot.kind, need: t.slot.need, value: t.value, full: t.full, ok: t.ok,
    })),
  });

  await sleep(0.7);
  if (!alive(me)) return;
  A.say(task.voice);
}

function repeat() {
  if (!task || settling) return;
  app.lumi.hop(.5);
  A.say(task.voice);
  idleT = 0;
}

/* ───────────────────────── 拿與放 ───────────────────────── */

function zones() {
  return [
    ...trays.map(t => ({ node: t.node, tray: t })),
    { node: poolArt, pool: true },
  ];
}

function wireOrb(orb, me) {
  let from = null;
  draggable(orb.node, {
    zones,
    onGrab() {
      if (!alive(me) || settling) return;
      from = orb.tray || null;
      orb.node.classList.add('dragging');
      orb.sc.to(1.18);
      trays.forEach(t => t.node.classList.toggle('tray-open', !t.full || t === from));
      A.pluck(660, { gain: .16, decay: .18 });
    },
    onMove(x, y) { orb.x = x; orb.y = y; },
    onDrop(z) {
      orb.node.classList.remove('dragging');
      trays.forEach(t => t.node.classList.remove('tray-open'));
      orb.sc.to(1);
      if (z.pool) return toPool(orb, me);
      if (z.tray) return toTray(orb, z.tray, me);
      settleOrb(orb);
    },
    onCancel() {
      orb.node.classList.remove('dragging');
      trays.forEach(t => t.node.classList.remove('tray-open'));
      orb.sc.to(1);
      settleOrb(orb);
    },
    // 拖不動也要能玩：在托盤裡的光珠點一下就回燈籠，池子裡的點一下只是回應一聲。
    onTap() {
      if (!alive(me) || settling) return;
      if (orb.tray) toPool(orb, me);
      else { orb.celebrate(); A.pluck(784, { gain: .22, decay: .3 }); }
    },
  });
}

/** 光珠現在在哪：'pool' 或第幾個托盤。人看不到，走查看得到。 */
function tagOrb(orb) {
  orb.node.dataset.in = orb.tray ? String(trays.indexOf(orb.tray)) : 'pool';
}

/** 把光珠放回它現在該在的位置（池子裡或托盤的格子裡） */
function settleOrb(orb) {
  if (orb.tray) { const i = orb.tray.orbs.indexOf(orb); const p = orb.tray.socketAt(Math.max(0, i)); orb.x = p.x; orb.y = p.y; }
  else layoutPool();
}

function toTray(orb, tray, me) {
  if (!alive(me) || settling) return;
  if (tray.full && orb.tray !== tray) {
    // 位子就這麼多，塞不下是誠實的。搖一下、退回去，不算錯。
    tray.shy(); A.thud({ gain: .18 }); settleOrb(orb);
    return;
  }
  if (orb.tray === tray) return settleOrb(orb);
  if (orb.tray) orb.tray.release(orb);
  else pool = pool.filter(o => o !== orb);

  const i = tray.accept(orb);
  orb.tray = tray;
  const p = tray.socketAt(i);
  orb.x = p.x; orb.y = p.y;
  orb.celebrate();
  A.countTone(Math.min(i, 9), 10);
  buzz(10);
  history = history.filter(h => h.orb !== orb);   // 同一顆光只留最後一次的落點
  history.push({ orb, tray });
  tagOrb(orb);
  layoutPool();
  hideRibbon();
  refreshToolbar();
  maybeCheck(me);
}

function toPool(orb, me) {
  if (!alive(me) || settling) return;
  returnToPool(orb);
}

/**
 * 把一顆光放回燈籠。
 *
 * 跟 toPool 分開是因為**分錯的時候也要走這條路**，而那時候 settling 是 true。
 * 如果讓退回去的動作被 settling 擋掉，錯一次之後池子是空的、盤子又不對，
 * 她就沒有任何東西可以動了 —— 遊戲會像壞掉一樣停在那裡。
 */
function returnToPool(orb) {
  if (orb.tray) { orb.tray.release(orb); orb.tray = null; }
  if (!pool.includes(orb)) pool.push(orb);
  tagOrb(orb);
  A.bubble({ up: true, gain: .2 });
  layoutPool();
  hideRibbon();
  history = history.filter(h => h.orb !== orb);
  refreshToolbar();
}

/** 點托盤：從池子裡拿一顆過來。拖曳是表達力，點擊是可靠度，兩條路同一個結果。 */
function pullFromPool(tray, me) {
  if (!alive(me) || settling) return;
  if (!pool.length) { tray.shy(); return; }
  if (tray.full) { tray.shy(); A.thud({ gain: .18 }); return; }
  toTray(pool[0], tray, me);
}

/* ───────────────────────── 驗收 ───────────────────────── */

/**
 * 光都放完了就自己檢查 —— 不做「送出」按鈕。
 *
 * 理由：多一個按鈕就多一次「我要交卷了嗎」的心理負擔，
 * 而光守恆本身已經是一個天然的完成訊號：燈籠空了，就是分完了。
 */
function maybeCheck(me) {
  if (pool.length) return;
  setTimeout(() => { if (alive(me) && !pool.length && !settling) check(me); }, 460);
}

async function check(me) {
  settling = true;
  const bad = trays.filter(t => !t.ok);

  if (!bad.length) return succeed(me);

  // 沒對上。**光一顆都不會少** —— 不對的那幾盤把光還回燈籠，化成一縷霧。
  misses++; isleMisses++;
  if (misses >= 2) ease = Math.min(3, ease + 1);
  A.nudge();
  app.lumi.tilt();

  // 死結防呆：不對的盤子全是空的（例如兩個碗她只放了一邊），
  // 那就把最滿的那一盤退回來，不然池子空著、盤子不對，她會沒有東西可以動。
  let give = bad.filter(t => t.orbs.length);
  if (!give.length) {
    const fullest = trays.slice().sort((a, b) => b.orbs.length - a.orbs.length)[0];
    if (fullest?.orbs.length) give = [fullest];
  }
  give.forEach(t => t.shy());
  give.forEach(t => {
    [...t.orbs].forEach((o, i) => setTimeout(() => {
      if (!alive(me)) return;
      mistPuff(app.layers.scene, o.x, o.y, area.tint);
      returnToPool(o);
    }, 90 + i * 70));
  });

  await sleep(0.9);
  if (!alive(me)) return;
  A.say('sky_retry');
  // 卡住兩次以上才讓空位開始呼吸。一直閃會變成催促。
  if (misses >= 2) trays.forEach(t => t.pulse(true));
  settling = false;
}

async function succeed(me) {
  lockTaps(1.2);
  const parts = trays.map(t => t.value);
  trays.forEach((t, i) => setTimeout(() => t.celebrate(), i * 110));
  A.sparkle({ n: 5 });
  A.bloom();
  app.lumi.cheer();
  buzz(22);
  trays.forEach(t => {
    const r = t.node.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, { count: 16, col: area.tint, power: .85 });
  });
  trays.forEach(t => t.pulse(false));

  // 配方圖鑑：收集的不是角色，是方法。
  let fresh = false;
  if (task.recipeWorthy && parts.every(v => v > 0)) fresh = store.addRecipe(task.total, parts);
  if (fresh && app.run.voyage) app.run.voyage.recipes++;

  await sleep(0.45);
  if (!alive(me)) return;

  // 「八可以分成五跟三」是拼出來的（n8 + sky_can + n5 + sky_and + n3），
  // 五段語音接起來要八、九秒。**每一題都講就變成背景噪音**，而且六歲等不了那麼久，
  // 等一等她就開始亂點了。所以只在「這一題是新發現」或「這座島的第一題」講 ——
  // 那正好是這句話最有意義的兩個時刻：示範一次，然後在她真的想出新分法時說出來。
  if (fresh || qi === 0) {
    await narrate(parts);
    if (!alive(me)) return;
  }

  if (fresh) {
    A.chime(1568, { gain: .4, decay: 2.2 });
    paperCard(app.layers.overlay, recipeCardHtml(task.total, parts), { dur: 2.8, cls: 'pc-light pc-recipe' });
    await A.say('sky_newway');
  } else if (task.free) {
    A.say('sky_oldway');
    await sleep(1.0);
  } else {
    A.sayOneOf(['good1', 'good2', 'good3', 'good4', 'good5', 'good6']);
    await sleep(0.8);
  }
  if (!alive(me)) return;

  lamps?.light(qi);
  app.lumi.setLantern(0.35 + ((qi + 1) / area.questions) * 0.2);
  qi++;
  await sleep(0.35);
  if (!alive(me)) return;

  if (qi >= area.questions) finishIsle(me);
  else nextTask(me);
}

/**
 * 嚕米把剛剛發生的事講一遍。
 * 這句話就是整個玩法的教學點：她做的是搬東西，聽到的是「八可以分成五跟三」。
 * 畫面上永遠不出現算式 —— 6 歲要先有具體物的經驗，符號是後面的事。
 */
async function narrate(parts) {
  if (parts.length !== 2) return;
  const kind = task.slots.map(s => s.kind);
  await A.say(`n${Math.min(20, task.total)}`);
  if (kind.includes('rest')) {
    const i = kind.indexOf('rest');
    const taken = parts[1 - i], left = parts[i];
    await A.say('sky_take'); await A.say(`n${taken}`);
    await A.say('sky_left'); await A.say(`n${left}`);
  } else {
    await A.say('sky_can'); await A.say(`n${parts[0]}`);
    await A.say('sky_and'); await A.say(`n${parts[1]}`);
  }
}

function recipeCardHtml(total, parts) {
  const dot = n => `<i class="rc-dots">${'<b></b>'.repeat(n)}</i>`;
  return `<div class="pc-line">新的分法</div>
    <div class="rc-row"><span>${total}</span>${parts.map(dot).join('<em>·</em>')}</div>`;
}

/* ───────────────────────── 收尾 ───────────────────────── */

async function finishIsle(me) {
  settling = true;
  clearBoard();
  app.run.lit?.add(area.key);
  store.cycleUp(area.key);

  // 精熟路徑：只往上，不往下。做完就算數，做得漂不漂亮不影響層級。
  reviewIsle(store, skill, { done: true, stuck: isleMisses >= area.questions });
  // 道具跟著骨架一起長大：她愈熟，工具介入愈少（但永遠不會被沒收）。
  Object.keys(store.tools).forEach(id => store.setToolLevel(id, toolLevelFor(store, id)));

  const lr = app.lumi.root.getBoundingClientRect();
  const lx = lr.left + lr.width * 0.22, ly = lr.top + lr.height * 0.62;
  A.bloom({ gain: .5 });
  A.sparkle({ n: 8, root: 392 });
  for (let i = 0; i < 22; i++) {
    setTimeout(() => {
      if (!alive(me)) return;
      flyLight(lx, ly, fx(Math.random()), fy(Math.random() * .7), {
        col: Math.random() < .4 ? SKY.gold : area.tint, dur: .7 + Math.random() * .5,
      });
    }, i * 55);
  }
  app.lumi.cheer();
  A.say('sky_clear');
  await sleep(2.2);
  if (!alive(me)) return;
  go(app.profile.mapScene, { justLit: area.key, advanced: true });
}

function clearBoard() {
  trays.forEach(t => t.destroy()); trays = [];
  // 收的是 orbs 不是 pool：放進托盤的光珠早就不在 pool 裡了，
  // 只收 pool 會留下一堆孤兒 DOM 掛在場景上（而且它們的 ticker 還在跑）。
  orbs.forEach(o => o.destroy());
  orbs = []; pool = []; history = [];
  poolArt?.remove(); poolArt = null;
  hideRibbon();
  task = null;
  app.board = null;
}

/* ───────────────────────── 道具列 ───────────────────────── */

function buildToolbar() {
  bar?.remove();
  const owned = Object.keys(store.tools);
  if (!owned.length) { bar = null; return; }
  // 這座島教的骨架相關的排前面，太多就只顯示前五個 —— 六歲不該管理背包。
  owned.sort((a, b) => (TOOLS[b]?.teaches === skill ? 1 : 0) - (TOOLS[a]?.teaches === skill ? 1 : 0));
  bar = document.createElement('div');
  bar.className = 'tool-bar';
  owned.slice(0, 4).forEach(id => {
    const t = TOOLS[id]; if (!t) return;
    const b = document.createElement('button');
    b.className = 'tool-btn';
    b.dataset.tool = id;
    b.setAttribute('aria-label', t.name);
    const svg = el('svg', { viewBox: '-70 -70 140 140', width: '100%', height: '100%' });
    t.icon(el('g', {}, svg));
    b.appendChild(svg);
    tappable(b, () => useTool(id, b));
    bar.appendChild(b);
  });
  app.layers.overlay.appendChild(bar);
  refreshToolbar();
}

function refreshToolbar() {
  if (!bar) return;
  const ctx = toolCtx();
  bar.querySelectorAll('.tool-btn').forEach(b => {
    const t = TOOLS[b.dataset.tool];
    const on = !!t && (t.enabled ? t.enabled(ctx) : true);
    b.classList.toggle('off', !on);
    b.dataset.level = String(store.toolLevel(b.dataset.tool));
  });
}

function useTool(id, btn) {
  const t = TOOLS[id];
  if (!t || settling || !task) return;
  const ctx = toolCtx();
  if (t.enabled && !t.enabled(ctx)) { btn.classList.add('nope'); setTimeout(() => btn.classList.remove('nope'), 400); return; }
  A.pluck(880, { gain: .3, decay: .4 });
  btn.classList.add('used'); setTimeout(() => btn.classList.remove('used'), 500);
  const note = t.use(ctx);
  if (note) showToolNote(note);
  idleT = 0;
  refreshToolbar();
}

function showToolNote(text) {
  toolNote?.remove();
  toolNote = paperCard(app.layers.overlay, `<div class="pc-sub">${text}</div>`, { dur: 2.0, cls: 'pc-light pc-tip' });
}

/** 道具能碰到的東西。刻意只開放這幾個動作，道具不能直接改題目。 */
function toolCtx() {
  const me = epoch;
  return {
    task, trays, pool, store,
    level: id => store.toolLevel(id),
    freeTrays: () => trays.filter(t => t.slot.kind === 'free'),
    sendTo(tray, delay = 0) {
      setTimeout(() => { if (alive(me) && pool.length && !tray.full) toTray(pool[0], tray, me); }, delay);
    },
    poolLayout(mode) { poolMode = mode; layoutPool(); },
    repeat, blip: () => A.pluck(1046, { gain: .25, decay: .5 }),
    pulseNeeds(on) { trays.forEach(t => t.pulse(on)); setTimeout(() => trays.forEach(t => t.pulse(false)), 3200); },
    pulseTray(t) { t.pulse(true); setTimeout(() => t.pulse(false), 3200); },
    countPool() { countOut(me); },
    tie(showTotal) { showRibbon(showTotal); },
    compare(strong) {
      trays.forEach(t => { if (t.slot.kind === 'mirror' || (t.slot.filled || 0) > 0) { t.pulse(true); t.celebrate(); } });
      setTimeout(() => trays.forEach(t => t.pulse(false)), strong ? 4000 : 1800);
    },
    midline(free) {
      free.forEach(t => t.node.classList.add('tray-mid'));
      setTimeout(() => free.forEach(t => t.node.classList.remove('tray-mid')), 3600);
    },
    shimmer(list) {
      list.forEach(t => t.node.classList.add('tray-shimmer'));
      setTimeout(() => list.forEach(t => t.node.classList.remove('tray-shimmer')), 1600);
    },
    canUndo: () => history.length > 0,
    undo() {
      const h = history.pop();
      if (h) { A.whoosh({ up: false, gain: .25, dur: .35 }); toPool(h.orb, me); }
    },
    canExchange: () => pool.filter(o => o.value === 1).length >= 5 || pool.some(o => o.value > 1),
    exchange() {
      const ones = pool.filter(o => o.value === 1);
      if (ones.length >= 5) { swapOrbs(ones.slice(0, 5), [5], me); return '五個一元，換一個五元'; }
      const big = pool.find(o => o.value > 1);
      if (big) {
        const parts = big.value === 10 ? [5, 5] : [1, 1, 1, 1, 1];
        swapOrbs([big], parts, me);
        return big.value === 10 ? '一個十元，換兩個五元' : '一個五元，換五個一元';
      }
      return null;
    },
    markNew(strong) {
      const parts = trays.map(t => t.value).filter(v => v > 0);
      const sig = [...parts].sort((a, b) => a - b).join('+');
      const isNew = parts.length >= 2 && !store.recipesOf(task.total).includes(sig);
      trays.forEach(t => t.node.classList.toggle('tray-star', strong && isNew));
      showToolNote(isNew ? '這個分法還沒記過' : '這個分法我們記過了');
      setTimeout(() => trays.forEach(t => t.node.classList.remove('tray-star')), 3000);
    },
  };
}

/** 小螃蟹：一顆一顆點過去，邊點邊唸 —— 一一對應的數數，六歲仍然常常需要。 */
function countOut(me) {
  const list = [...pool];
  list.forEach((o, i) => setTimeout(() => {
    if (!alive(me) || !o.alive) return;
    o.celebrate();
    A.countTone(i, list.length);
    A.sayNumber(Math.min(10, i + 1));
  }, i * 480));
}

/** 零錢袋：把池子裡的光幣換成等值的另一種面額 */
function swapOrbs(gone, values, me) {
  const u = gone[0]?.size || 48;
  gone.forEach(o => {
    pool = pool.filter(x => x !== o);
    orbs = orbs.filter(x => x !== o);
    mistPuff(app.layers.scene, o.x, o.y, SKY.gold);
    o.destroy();
  });
  values.forEach(v => {
    const o = makeOrb(app.layers.scene, v, { x: fx(.5), y: fy(POOL_Y()), size: u, seed: Math.random() });
    o.tray = null;
    o.node.dataset.in = 'pool';
    o.appear(0);
    wireOrb(o, me);
    pool.push(o); orbs.push(o);
  });
  A.chime(1318, { gain: .35, decay: 1.2 });
  layoutPool();
}

/* ───────────────────────── 配對絲帶 ───────────────────────── */

function showRibbon(showTotal) {
  hideRibbon();
  const filled = trays.filter(t => t.orbs.length > 0);
  if (filled.length < 2) return;
  const a = filled[0].node.getBoundingClientRect(), b = filled[filled.length - 1].node.getBoundingClientRect();
  const x1 = a.left + a.width / 2, y1 = a.bottom - a.height * .12;
  const x2 = b.left + b.width / 2, y2 = b.bottom - b.height * .12;
  const svg = el('svg', {
    style: 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none',
  });
  el('path', {
    d: `M${x1},${y1} Q${(x1 + x2) / 2},${Math.max(y1, y2) + 60} ${x2},${y2}`,
    stroke: '#E78FA8', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round', opacity: .85,
  }, svg);
  if (showTotal) {
    const sum = filled.reduce((s, t) => s + t.value, 0);
    const g = makeGlyph(Math.min(10, sum), { color: '#FFF3D0', ink: '#8A5A6A', width: 16, glow: 'glow-s' });
    g.setAttribute('transform', `translate(${(x1 + x2) / 2},${Math.max(y1, y2) + 58}) scale(0.38)`);
    svg.appendChild(g);
  }
  app.layers.overlay.appendChild(svg);
  ribbonArt = svg;
  setTimeout(() => { if (ribbonArt === svg) hideRibbon(); }, 3400);
}

function hideRibbon() { ribbonArt?.remove(); ribbonArt = null; }
