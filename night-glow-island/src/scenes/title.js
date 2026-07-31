// 開場。
//
// 沒有「開始遊戲」按鈕。畫面上只有一顆會呼吸的光種子飄在嚕米面前。
// 小朋友一定會去戳它——戳了，光就飛進提燈，島就開始了。
// 第一次互動就是整個遊戲的核心動詞，不需要任何說明文字。

import {
  app, setScenery, placeLumi, hudMode, go, fx, fy, fs, el, PAL, A, paperCard,
} from '../game.js';
import { Prop } from '../art/props.js';
import { flyLight, burst, setAmbientMotes } from '../art/particles.js';
import { store } from '../core/store.js';
import { lockTaps } from '../core/pointer.js';
import { stage } from '../core/stage.js';

let seed = null, hintT = 0, offHint = null;

export const title = {
  async enter() {
    const prof = app.profile;
    setScenery(prof.titleScenery);
    setAmbientMotes(.5, '#FFE3A3');
    hudMode('title');
    // 橫向時畫面很扁，嚕米、光種子、燈塔全部會擠在正中間互相蓋住 ——
    // 所以橫向把嚕米挪到左邊，光種子放到她右前方，兩個都看得清楚。
    placeLumi(LUMI_AT());
    app.lumi.setLantern(0.1);

    // 標題：手繪風的字 + 一道撕紙筆刷
    const t = document.createElement('div');
    t.className = 'title-block';
    const chars = [...prof.islandName].map(c => `<span>${c}</span>`).join('');
    t.innerHTML = `
      <div class="title-main">${chars}</div>
      <svg class="title-swash" viewBox="0 0 320 26" aria-hidden="true">
        <path d="M6,17 C60,6 120,22 176,12 C224,4 276,16 314,9" fill="none"
              stroke="#FFC46B" stroke-width="5" stroke-linecap="round" filter="url(#torn-s)" opacity=".85"/>
      </svg>
      <div class="title-sub">${prof.sub}</div>`;
    app.layers.scene.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));

    // 光種子
    const SP = SEED_AT();
    seed = new Prop(app.layers.scene, { x: fx(SP.x), y: fy(SP.y), size: fs(.32), drift: 1.1 });
    seed.fieldPos = SP;
    const g = seed.art;
    seed.halo = el('circle', { cx: 0, cy: 0, r: 96, fill: 'url(#g-warm)', opacity: .6, style: 'mix-blend-mode:screen' }, g);
    el('circle', { cx: 0, cy: 0, r: 46, fill: PAL.honey, filter: 'url(#glow-l)' }, g);
    el('circle', { cx: 0, cy: 0, r: 30, fill: '#FFFDF4' }, g);
    el('path', {
      d: 'M0,-70 L11,-24 L58,-16 L20,10 L30,58 L0,32 L-30,58 L-20,10 L-58,-16 L-11,-24 Z',
      fill: PAL.honey, opacity: .55, filter: 'url(#torn-s)',
    }, g);
    seed.appear(0.35);
    seed.interactive(() => start());

    // 一顆會呼吸的提示環：兩秒沒動作就開始脈動
    hintT = 0;
    offHint = null;
    const pulse = () => { seed.hint(true); };
    setTimeout(pulse, 2400);

    A.say('intro1');
    setTimeout(() => A.say('intro2'), 2600);
    setTimeout(() => { if (seed?.alive) A.say('tap_start'); }, 6400);

    if (store.runs > 0) {
      paperCard(app.layers.overlay,
        `<div class="pc-row"><b>${store.bugCount()}</b><span>／12 隻光靈</span></div>`,
        { dur: 3.4, cls: 'pc-corner' });
    }
  },

  onResize() {
    placeLumi(LUMI_AT());
    if (seed) { const p = SEED_AT(); seed.x = fx(p.x); seed.y = fy(p.y); seed.fieldPos = p; }
  },

  exit() { seed?.destroy(); seed = null; offHint?.(); },
};

const LUMI_AT = () => (stage.portrait ? { x: .50, y: .95, s: 1.00 } : { x: .30, y: 1.00, s: .96 });
const SEED_AT = () => (stage.portrait ? { x: .50, y: .52 } : { x: .64, y: .46 });

async function start() {
  if (!seed?.alive) return;
  lockTaps(1.6);
  seed.hint(false);
  seed.celebrate();
  A.sparkle({ n: 6 });
  A.bloom();

  const r = seed.node.getBoundingClientRect();
  const lr = app.lumi.root.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, { count: 30, power: 1.2 });
  seed.vanish(.15);

  flyLight(r.left + r.width / 2, r.top + r.height / 2,
    lr.left + lr.width * 0.22, lr.top + lr.height * 0.62,
    { dur: 0.85, onArrive() {
      app.lumi.setLantern(0.28);
      app.lumi.cheer();
      A.chime(1046, { gain: .4, decay: 1.8 });
      burst(lr.left + lr.width * 0.22, lr.top + lr.height * 0.62, { count: 18, power: .7 });
    } });

  document.querySelector('.title-block')?.classList.remove('in');
  setTimeout(() => go('map', { first: true }), 1500);
}
