// 天亮了 —— 一晚航程的結束。
//
// 這裡刻意**不做結算畫面**：沒有分數、沒有星星、沒有「你答對幾題」。
// 一晚結束的理由是風停了，不是她表現如何，所以收尾要像回到家，不像交卷。
//
// 畫面上只有兩樣東西：今晚走過的那一張圖，以及一張還可以再張開的帆。

import {
  app, setScenery, placeLumi, hudMode, go, fx, fy, fs, el, A, paperCard,
} from '../game.js';
import { diaryPage } from '../data/voyage.js';
import { diaryFigure } from '../art/diary.js';
import { drawSpirit } from '../data/spirits.js';
import { spiritById } from '../data/spirits.js';
import { SKY } from '../art/sky.js';
import { Prop } from '../art/props.js';
import { burst, setAmbientMotes } from '../art/particles.js';
import { store } from '../core/store.js';
import { lockTaps } from '../core/pointer.js';
import { stage } from '../core/stage.js';

let props = [], sheet = null, epoch = 0;
const alive = e => e === epoch;
const sleep = s => new Promise(r => setTimeout(r, s * 1000));

export const dawn = {
  async enter() {
    epoch++;
    const me = epoch;
    props = [];

    setScenery('skytitle');
    setAmbientMotes(.55, SKY.gold);
    hudMode('title');
    placeLumi(LUMI());
    app.lumi.setLantern(0.9);
    document.documentElement.style.setProperty('--dawn', '1');

    const v = app.run.voyage;
    // 沒有航程就翻出上一晚那一頁（`?go=dawn` 直接跳進來、或重新整理之後）。
    // 空白的一頁對小孩來說就是「昨天沒發生過」，那不對。
    const page = v ? diaryPage(v, store) : (store.diary[0] || null);

    // 存這一晚。存的是「發生過什麼」，不是「做得好不好」。
    // 記號打在航程上，不是打在場景上 —— 她從天亮這一頁打開窩再關回來，
    // 場景會重新 enter 一次，記在場景上的旗標會讓同一晚被記兩遍。
    if (page && v && !v.recorded) {
      v.recorded = true;
      store.addDiary(page);
      store.finishRun();
    }

    A.chime(523, { gain: .4, decay: 2.6 });
    setTimeout(() => A.chime(784, { gain: .35, decay: 2.6 }), 260);
    setTimeout(() => A.chime(1046, { gain: .3, decay: 3.2 }), 520);
    A.say('sky_sunrise');
    app.lumi.cheer();

    await sleep(1.6);
    if (!alive(me)) return;

    // 今晚的那一頁
    sheet = document.createElement('div');
    sheet.className = 'diary-sheet';
    sheet.appendChild(diaryFigure(page || { isles: [] }));
    app.layers.scene.appendChild(sheet);
    layoutSheet();
    requestAnimationFrame(() => sheet.classList.add('in'));
    A.say('sky_diary', { delay: .6 });

    // 一起回家的光靈
    const sp = page?.spirit ? spiritById(page.spirit) : null;
    if (sp) {
      const p = new Prop(app.layers.scene, { x: fx(.82), y: fy(.30), size: fs(.20), drift: 1.4 });
      p.art.appendChild(drawSpirit(sp, { pat: store.spirits[sp.id]?.pat || 0, sleepy: true }));
      p.appear(.4);
      p.interactive(() => { p.celebrate(); A.pluck(880, { gain: .28 }); });
      p.reposition = () => { p.x = fx(.82); p.y = fy(.30); };
      props.push(p);
    }

    await sleep(1.4);
    if (!alive(me)) return;

    // 還可以再張開的帆
    const sail = new Prop(app.layers.scene, { x: fx(.5), y: fy(.80), size: fs(.30), drift: 1.0 });
    drawSail(sail.art);
    sail.appear(.1);
    sail.reposition = () => { sail.x = fx(.5); sail.y = fy(.80); };
    sail.interactive(() => again());
    props.push(sail);
    setTimeout(() => sail.hint(true), 2600);

    paperCard(app.layers.overlay,
      `<div class="pc-sub">再張開帆，就是新的一趟</div>`, { dur: 4.0, cls: 'pc-light pc-tip' });
  },

  onResize() { placeLumi(LUMI()); layoutSheet(); props.forEach(p => p.reposition?.()); },

  exit() {
    epoch++;
    props.forEach(p => p.destroy());
    props = [];
    sheet?.remove(); sheet = null;
  },
};

const LUMI = () => (stage.portrait ? { x: .16, y: 1.02, s: .74 } : { x: .10, y: 1.00, s: .70 });

function layoutSheet() {
  if (!sheet) return;
  const w = Math.min(stage.field.w * .82, fs(1.05));
  sheet.style.width = w + 'px';
  sheet.style.left = (stage.field.x + (stage.field.w - w) / 2) + 'px';
  sheet.style.top = fy(stage.portrait ? .16 : .10) + 'px';
}

function again() {
  lockTaps(1.2);
  A.whoosh({ gain: .35, dur: .7 });
  A.sparkle({ n: 6 });
  burst(fx(.5), fy(.80), { count: 24, col: SKY.gold, power: 1 });
  // 新的一趟：航程重來、島重新變暗，但配方、光靈、道具都留著。
  app.run.voyage = null;
  app.run.lit = new Set();
  document.documentElement.style.setProperty('--dawn', '0');
  setTimeout(() => go(app.profile.mapScene, { first: true }), 800);
}

function drawSail(g) {
  el('path', { d: 'M0,-88 L0,72', stroke: '#C9A26A', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
  el('path', { d: 'M-8,-84 L-8,44 L-74,44 Z', fill: '#FFF6E6', opacity: .96, filter: 'url(#torn-s)' }, g);
  el('path', { d: 'M8,-84 L8,44 L68,44 Z', fill: '#CFF3E6', opacity: .92, filter: 'url(#torn-s)' }, g);
  el('path', { d: 'M-84,66 C-52,58 -24,74 8,66 C34,60 56,70 84,64', stroke: '#9FD8EC', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round', opacity: .8 }, g);
  el('circle', { cx: 0, cy: -6, r: 92, fill: SKY.gold, opacity: .18 }, g);
}
