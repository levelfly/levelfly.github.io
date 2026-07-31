// 路上的三種節點：寶箱、光靈、休息。
//
// 一晚不能五段都在算數學。這三種節點是節奏的呼吸，也是三個「她做主」的地方：
//   寶箱  兩件道具挑一件 —— 這是整晚最像 roguelike 的一次選擇
//   光靈  牠跟不跟來、要什麼花紋，她決定
//   休息  什麼都不用做。這一段風就是拿來看風景的。
//
// 🔴 這裡發的東西**永遠不是答錯後的補救品**。
// 道具是她自己挑的裝備，不是系統對她的診斷。獎勵一旦變成表現評級，
// 內在動機就開始被侵蝕，而這件事對兒童比成人嚴重。

import {
  app, setScenery, placeLumi, hudMode, go, fx, fy, fs, el, A, paperCard,
} from '../game.js';
import { areaByKey } from '../profiles.js';
import { TOOLS, nextToolFor } from '../data/tools.js';
import { drawSpirit, unlockedPatterns, pickSpirit } from '../data/spirits.js';
import { SKY } from '../art/sky.js';
import { Prop } from '../art/props.js';
import { setAmbientMotes, burst } from '../art/particles.js';
import { store } from '../core/store.js';
import { lockTaps, tappable } from '../core/pointer.js';
import { stage } from '../core/stage.js';

let props = [], timer = 0, epoch = 0, taken = false;
const alive = e => e === epoch;
const sleep = s => new Promise(r => setTimeout(r, s * 1000));

export const event = {
  async enter({ areaKey, type = 'rest' }) {
    epoch++;
    const me = epoch;
    taken = false;
    props = [];

    const area = areaByKey(areaKey) || areaByKey('garden');
    setScenery(area.key);
    setAmbientMotes(.5, area.tint);
    hudMode('level');                                   // 回航線圖的按鈕一直都在
    placeLumi(stage.portrait ? { x: .16, y: 1.00, s: .74 } : { x: .10, y: .99, s: .80 });
    app.lumi.setLantern(0.4);

    if (type === 'chest') return chest(me);
    if (type === 'spirit') return spirit(me);
    return rest(me, area);
  },

  onResize() {
    placeLumi(stage.portrait ? { x: .16, y: 1.00, s: .74 } : { x: .10, y: .99, s: .80 });
    props.forEach(p => p.reposition?.());
  },

  exit() {
    epoch++;
    clearTimeout(timer); timer = 0;
    props.forEach(p => p.destroy?.());
    props = [];
    document.querySelectorAll('.pick-row').forEach(n => n.remove());
  },
};

const back = () => go(app.profile.mapScene);

/* ───────────────────────── 寶箱 ───────────────────────── */

async function chest(me) {
  A.say('sky_chest');
  const box = new Prop(app.layers.scene, { x: fx(.5), y: fy(.44), size: fs(.34), drift: .5 });
  drawChest(box.art);
  box.appear(.2);
  box.interactive(() => openChest(me, box));
  box.reposition = () => { box.x = fx(.5); box.y = fy(.44); };
  props.push(box);
  setTimeout(() => box.hint(true), 2200);
  // 她不開也沒關係：站一下自己會開，遊戲不會停在這裡等她。
  timer = setTimeout(() => { if (alive(me) && !taken) openChest(me, box); }, 9000);
}

async function openChest(me, box) {
  if (taken) return;
  taken = true;
  clearTimeout(timer);
  box.hint(false);
  box.celebrate();
  A.chime(1046, { gain: .4, decay: 1.6 });
  const b = box.node.getBoundingClientRect();
  burst(b.left + b.width / 2, b.top + b.height / 2, { count: 26, col: SKY.gold, power: 1 });
  await sleep(.6);
  if (!alive(me)) return;
  box.vanish(0);

  const v = app.run.voyage;
  const a = nextToolFor(store, v?.plan?.focus, Math.random);
  const b2 = a ? nextToolFor(store, null, Math.random, [a]) : null;
  const two = [a, b2].filter(Boolean);

  if (!two.length) return scrollReward(me);
  A.say('sky_tool_get');
  offerTools(me, two);
}

/** 兩件道具挑一件。挑不挑得「對」不重要 —— 重要的是這是她選的。 */
function offerTools(me, ids) {
  const row = document.createElement('div');
  row.className = 'pick-row';
  app.layers.overlay.appendChild(row);

  const take = (id, card) => {
    if (!alive(me) || row.dataset.done) return;
    row.dataset.done = '1';
    lockTaps(.8);
    store.giveTool(id);
    app.run.voyage?.gotTools.push(id);
    card.classList.add('taken');
    row.querySelectorAll('.pick-card').forEach(c => { if (c !== card) c.classList.add('fade'); });
    A.sparkle({ n: 5 }); A.bloom();
    app.lumi.cheer();
    paperCard(app.layers.overlay, `<div class="pc-line">${TOOLS[id].name}</div><div class="pc-sub">路上用得到</div>`,
      { dur: 2.2, cls: 'pc-light' });
    setTimeout(back, 2400);
  };

  const cards = ids.map((id, i) => {
    const t = TOOLS[id];
    const card = document.createElement('button');
    card.className = 'pick-card';
    card.dataset.tool = id;
    const svg = el('svg', { viewBox: '-80 -80 160 160', width: '100%', height: '100%' });
    t.icon(el('g', {}, svg));
    card.appendChild(svg);
    const cap = document.createElement('span');
    cap.textContent = t.name;
    card.appendChild(cap);
    tappable(card, () => take(id, card));
    setTimeout(() => card.classList.add('in'), 120 + i * 120);
    row.appendChild(card);
    return card;
  });

  // 一直不選也會走：站著不動不該卡住一晚。
  // 但這個等待要夠久 —— 幫她選是最後手段，那本來是她的選擇。
  // （HUD 的回航線圖按鈕全程都在，她隨時可以自己走。）
  // 這裡直接呼叫 take，不是對按鈕發 click —— 卡片走的是 tappable（pointer 事件），
  // 送一個合成的 click 進去什麼都不會發生。
  timer = setTimeout(() => { if (alive(me) && !row.dataset.done) take(ids[0], cards[0]); }, 18000);
}

/** 道具都拿齊了：寶箱裡改放一張配方卷軸，直接送她一種還沒發現的拆法。 */
async function scrollReward(me) {
  const total = 6 + Math.floor(Math.random() * 5);
  const known = store.recipesOf(total);
  let parts = null;
  for (let a = 1; a < total; a++) {
    const sig = [Math.min(a, total - a), Math.max(a, total - a)].join('+');
    if (!known.includes(sig)) { parts = [a, total - a]; break; }
  }
  if (!parts) return setTimeout(back, 1200);
  store.addRecipe(total, parts);
  if (app.run.voyage) app.run.voyage.recipes++;
  A.chime(1568, { gain: .4, decay: 2 });
  paperCard(app.layers.overlay,
    `<div class="pc-line">舊卷軸上的分法</div>
     <div class="rc-row"><span>${total}</span><i class="rc-dots">${'<b></b>'.repeat(parts[0])}</i><em>·</em><i class="rc-dots">${'<b></b>'.repeat(parts[1])}</i></div>`,
    { dur: 3.0, cls: 'pc-light pc-recipe' });
  await A.say('sky_newway');
  if (!alive(me)) return;
  setTimeout(back, 1400);
}

function drawChest(g) {
  el('path', { d: 'M-70,-6 h140 v56 a10,10 0 0 1 -10,10 h-120 a10,10 0 0 1 -10,-10 z', fill: '#E8CFA4', stroke: SKY.ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
  el('path', { d: 'M-70,-6 a70,44 0 0 1 140,0 z', fill: '#F2DFB8', stroke: SKY.ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
  el('path', { d: 'M0,-50 v116', stroke: SKY.ink, 'stroke-width': 5, opacity: .5 }, g);
  el('circle', { cx: 0, cy: 12, r: 13, fill: SKY.gold, stroke: SKY.ink, 'stroke-width': 4 }, g);
  el('circle', { cx: 0, cy: -34, r: 40, fill: SKY.gold, opacity: .22 }, g);
}

/* ───────────────────────── 光靈 ───────────────────────── */

async function spirit(me) {
  const s = pickSpirit(store, Math.random);
  const isNew = !store.spirits[s.id];
  A.say('sky_node_spirit');

  const p = new Prop(app.layers.scene, { x: fx(.55), y: fy(.42), size: fs(.36), drift: 1.2 });
  p.art.appendChild(drawSpirit(s, { pat: store.spirits[s.id]?.pat || 0 }));
  p.appear(.25);
  p.reposition = () => { p.x = fx(.55); p.y = fy(.42); };
  p.interactive(() => { p.celebrate(); A.pluck(660 + Math.random() * 300, { gain: .3 }); A.say('giggle'); });
  props.push(p);

  await sleep(1.6);
  if (!alive(me)) return;
  store.addSpirit(s.id, store.spirits[s.id]?.pat || 0);
  if (app.run.voyage) app.run.voyage.gotSpirit = s.id;
  A.sparkle({ n: 5 });
  paperCard(app.layers.overlay,
    `<div class="pc-line">${s.name}</div><div class="pc-sub">${isNew ? '跟我們一起走' : s.note}</div>`,
    { dur: 2.6, cls: 'pc-light' });
  A.say('sky_spirit_join');

  await sleep(2.2);
  if (!alive(me)) return;
  offerPatterns(me, s, p);
}

/**
 * 花紋。
 *
 * 可以選的花紋來自「她發現過幾種拆法」——客製化的來源是她做過的數學，不是一份選單。
 * 而且花紋只增加表達，不增加任何學習優勢：它不會讓題目變簡單。
 */
function offerPatterns(me, s, prop) {
  const opts = unlockedPatterns(store);
  if (opts.length <= 1) { timer = setTimeout(back, 1600); return; }

  const row = document.createElement('div');
  row.className = 'pick-row pat-row';
  app.layers.overlay.appendChild(row);

  opts.slice(0, 4).forEach((pat, i) => {
    const card = document.createElement('button');
    card.className = 'pick-card pat-card';
    card.dataset.pat = String(pat.id);
    const svg = el('svg', { viewBox: '-110 -110 220 220', width: '100%', height: '100%' });
    svg.appendChild(drawSpirit(s, { pat: pat.id }));
    card.appendChild(svg);
    tappable(card, () => {
      if (!alive(me) || row.dataset.done) return;
      row.dataset.done = '1';
      store.setSpiritPattern(s.id, pat.id);
      prop.art.innerHTML = '';
      prop.art.appendChild(drawSpirit(s, { pat: pat.id }));
      prop.celebrate();
      A.chime(1318, { gain: .35 });
      row.querySelectorAll('.pick-card').forEach(c => c.classList.add(c === card ? 'taken' : 'fade'));
      setTimeout(back, 1600);
    });
    setTimeout(() => card.classList.add('in'), 120 + i * 100);
    row.appendChild(card);
  });

  timer = setTimeout(() => { if (alive(me) && !row.dataset.done) back(); }, 15000);
}


/* ───────────────────────── 休息 ───────────────────────── */

/** 什麼都不用做的一段。可以戳雲、可以看風景，然後自己走回航線上。 */
async function rest(me, area) {
  A.say('sky_rest');
  paperCard(app.layers.overlay, `<div class="pc-line">${area.name}</div><div class="pc-sub">停一下下</div>`,
    { dur: 2.6, cls: 'pc-light' });

  const spots = stage.portrait
    ? [[.24, .30], [.68, .24], [.44, .46], [.78, .48]]
    : [[.20, .28], [.44, .20], [.66, .34], [.86, .24]];
  spots.forEach(([x, y], i) => {
    const p = new Prop(app.layers.scene, { x: fx(x), y: fy(y), size: fs(.20 + (i % 2) * .05), drift: 1.5 });
    el('path', {
      d: 'M-64,10 C-64,-16 -34,-30 -14,-20 C-4,-40 30,-42 40,-18 C62,-20 72,4 58,16 z',
      fill: '#FFFFFF', opacity: .78, filter: 'url(#torn-m)',
    }, p.art);
    p.appear(.2 + i * .12);
    p.interactive(() => {
      p.celebrate();
      A.pluck(523 + i * 110, { gain: .28, decay: .8 });
      const b = p.node.getBoundingClientRect();
      burst(b.left + b.width / 2, b.top + b.height / 2, { count: 10, col: SKY.cream, power: .5 });
    });
    p.reposition = () => { p.x = fx(x); p.y = fy(y); };
    props.push(p);
  });

  await sleep(6.5);
  if (!alive(me)) return;
  A.whoosh({ gain: .25, dur: .6 });
  timer = setTimeout(back, 1400);
}
