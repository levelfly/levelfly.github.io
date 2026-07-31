// 兩扇門。
//
// 不是設定畫面，也不寫「4 歲 / 6 歲」——那是大人的分類，對小孩沒有意義，
// 而且被歸類成「小的那個」不會讓人想按。畫面上只有兩顆光，各自長得像它那座島：
//
//   左：一盞提燈    夜光島      認數字、數數量
//   右：一張風帆    晨風群島    把光分成幾群
//
// 她自己按哪顆就進哪座島。選擇會記住，但下次還是會問——這是她的選擇，不是設定。

import {
  app, setScenery, placeLumi, hudMode, go, fx, fy, fs, el, PAL, A,
} from '../game.js';
import { Prop } from '../art/props.js';
import { burst, setAmbientMotes } from '../art/particles.js';
import { store } from '../core/store.js';
import { lockTaps } from '../core/pointer.js';
import { stage } from '../core/stage.js';
import { PROFILES, setActiveProfile } from '../profiles.js';
import { blob } from '../art/paper.js';

let doors = [], picked = false;

export const agepick = {
  async enter() {
    picked = false;
    setScenery('title');
    setAmbientMotes(.45, '#FFE3A3');
    hudMode('title');
    placeLumi(stage.portrait ? { x: .50, y: 1.03, s: .82 } : { x: .12, y: 1.02, s: .70 });
    app.lumi.setLantern(0.12);

    const t = document.createElement('div');
    t.className = 'title-block pick-block';
    t.innerHTML = `<div class="pick-ask">想去哪一座島？</div>`;
    app.layers.scene.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));

    doors = [];
    const ready = Object.values(PROFILES).filter(p => p.ready);
    ready.forEach((prof, i) => {
      const pos = SLOT(i, ready.length);
      const d = new Prop(app.layers.scene, { x: fx(pos.x), y: fy(pos.y), size: fs(.30), drift: .9 });
      d.fieldPos = pos;
      d.prof = prof;
      drawDoor(d.art, prof);
      d.appear(0.3 + i * 0.14);
      d.interactive(() => pick(d));
      doors.push(d);

      // 島的名字寫在光下面。她還不太認字，但爸媽念一次就記得哪邊是哪邊。
      const cap = document.createElement('div');
      cap.className = 'pick-cap';
      cap.textContent = prof.islandName;
      cap.dataset.slot = String(i);
      app.layers.scene.appendChild(cap);
      d.cap = cap;
      layoutCap(d);
    });

    setTimeout(() => doors.forEach(d => d.hint(true)), 2600);
  },

  onResize() {
    placeLumi(stage.portrait ? { x: .50, y: 1.03, s: .82 } : { x: .12, y: 1.02, s: .70 });
    doors.forEach((d, i) => {
      const p = SLOT(i, doors.length);
      d.x = fx(p.x); d.y = fy(p.y); d.fieldPos = p;
      layoutCap(d);
    });
  },

  exit() {
    doors.forEach(d => { d.cap?.remove(); d.destroy(); });
    doors = [];
  },
};

/** 兩顆光左右並排；直握時往上挪一點，免得被嚕米的頭擋住。 */
const SLOT = (i, n) => {
  const spread = stage.portrait ? .26 : .22;
  const cx = stage.portrait ? .50 : .58;
  const y = stage.portrait ? .46 : .44;
  return { x: cx + (i - (n - 1) / 2) * spread * 2, y };
};

function layoutCap(d) {
  if (!d.cap) return;
  // 用遊戲場座標算，不要用 getBoundingClientRect：
  // 道具是 appear 進來的，剛建好時還沒有版面，量到的會是 0,0 —— 標籤就飛到左上角去了。
  // 而且它們會一直輕輕漂，跟著量等於每幀都要重排。
  const p = d.fieldPos;
  d.cap.style.left = `${fx(p.x)}px`;
  d.cap.style.top = `${fy(p.y) + fs(.30) * 0.62}px`;
}

/** 每扇門長得像它那座島：夜光島是一盞暖色提燈，晨風群島是一張迎風的帆。 */
function drawDoor(g, prof) {
  if (prof.id === 'age6') {
    el('circle', { cx: 0, cy: 0, r: 96, fill: 'url(#g-mint)', opacity: .5, style: 'mix-blend-mode:screen' }, g);
    el('circle', { cx: 0, cy: 6, r: 40, fill: '#FFD9A8', filter: 'url(#glow-l)' }, g);   // 初升的太陽
    el('path', {                                                                          // 帆
      d: 'M-6,-72 L-6,44 L-58,44 Z', fill: '#FFF6E6', opacity: .95, filter: 'url(#torn-s)',
    }, g);
    el('path', { d: 'M6,-72 L6,44 L54,44 Z', fill: '#CFF3E6', opacity: .9, filter: 'url(#torn-s)' }, g);
    el('path', { d: 'M0,-78 L0,52', stroke: '#C9A26A', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
    el('path', { d: blob(0, 66, 74, { n: 9, wob: .3, squash: .3 }), fill: '#BFE7F2', opacity: .5, filter: 'url(#torn-m)' }, g);  // 腳下的雲
  } else {
    el('circle', { cx: 0, cy: 0, r: 96, fill: 'url(#g-warm)', opacity: .55, style: 'mix-blend-mode:screen' }, g);
    el('path', { d: 'M0,-78 v16', stroke: '#8b7a5a', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M-34,-58 h68 l12,18 h-92 z', fill: '#C9A26A', filter: 'url(#torn-s)' }, g);
    el('path', { d: 'M-42,-40 h84 v72 a42 42 0 0 1 -84 0 z', fill: '#1A2A4A', opacity: .55 }, g);
    el('circle', { cx: 0, cy: 0, r: 34, fill: PAL.honey, filter: 'url(#glow-l)' }, g);
    el('path', {
      d: 'M-42,-40 h84 v72 a42 42 0 0 1 -84 0 z', fill: 'none',
      stroke: '#E6C894', 'stroke-width': 4, 'stroke-linejoin': 'round',
    }, g);
  }
}

async function pick(d) {
  if (picked || !d.alive) return;
  picked = true;
  lockTaps(1.4);
  doors.forEach(x => { x.hint(false); if (x !== d) x.vanish(.05); });
  d.celebrate();
  A.sparkle({ n: 6 });
  A.bloom();
  A.chime(880, { gain: .4, decay: 1.8 });

  const r = d.node.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, { count: 26, power: 1.1 });

  setActiveProfile(d.prof.id);
  store.setProfile(d.prof.id);
  app.profile = d.prof;
  app.run.lit = new Set();          // 換島就是換一趟旅程，上一座島點亮到哪不算數

  document.querySelector('.pick-block')?.classList.remove('in');
  doors.forEach(x => x.cap?.classList.add('out'));
  setTimeout(() => go('title'), 900);
}
