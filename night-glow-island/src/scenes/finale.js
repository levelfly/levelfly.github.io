// 結局。
//
// 整座島亮起來，然後——只有真的玩到這裡的人才看得到——
// 一隻由光組成的大鯨魚會從夜空游過去。
// 它不做任何事，不能收集，也沒有分數。它只是出現，然後游走。

import {
  app, setScenery, placeLumi, hudMode, go, fx, fy, fs, el, PAL, A, paperCard,
} from '../game.js';
import { Prop } from '../art/props.js';
import { burst, flyLight, setAmbientMotes } from '../art/particles.js';
import { onTick } from '../core/ticker.js';
import { store } from '../core/store.js';
import { lockTaps } from '../core/pointer.js';
import { stage } from '../core/stage.js';

let offs = [], seed = null, whaleNode = null;

export const finale = {
  async enter() {
    setScenery('finale');
    setAmbientMotes(1.6, '#FFE3A3');
    hudMode('finale');
    placeLumi({ x: .5, y: .95, s: 1.0 });
    app.lumi.setLantern(1);
    store.finishRun();
    offs = [];

    A.setMusic('finale'); A.setAmbient('finale');
    lockTaps(1.2);

    // 光潮：從提燈湧向整個畫面
    const lr = app.lumi.root.getBoundingClientRect();
    const lx = lr.left + lr.width * .22, ly = lr.top + lr.height * .62;
    for (let i = 0; i < 46; i++) {
      setTimeout(() => flyLight(lx, ly, Math.random() * stage.w, Math.random() * stage.h * .8, {
        col: Math.random() < .4 ? PAL.mint : PAL.honey, dur: .8 + Math.random() * .8,
      }), i * 42);
    }
    A.bloom({ gain: .6 });
    A.sparkle({ n: 8, root: 523 });
    app.lumi.cheer();
    await sleep(1.0);
    A.say('finale1');

    await sleep(2.6);
    await swimWhale();

    await sleep(1.2);
    A.say('finale2');
    paperCard(app.layers.overlay,
      `<div class="pc-line">今晚的島，亮了</div>
       <div class="pc-sub">你帶回了 ${store.bugCount()} 隻光靈</div>`, { dur: 4.2 });

    await sleep(2.2);
    // 再玩一次：又是一顆光種子，跟開場同一個動詞
    seed = new Prop(app.layers.scene, { x: fx(.5), y: fy(.62), size: fs(.26), drift: 1.1 });
    el('circle', { cx: 0, cy: 0, r: 92, fill: 'url(#g-mint)', opacity: .5, style: 'mix-blend-mode:screen' }, seed.art);
    el('circle', { cx: 0, cy: 0, r: 42, fill: PAL.mint, filter: 'url(#glow-l)' }, seed.art);
    el('circle', { cx: 0, cy: 0, r: 26, fill: '#FFFDF4' }, seed.art);
    el('path', {
      d: 'M0,-64 C22,-30 30,-16 62,0 C30,16 22,30 0,64 C-22,30 -30,16 -62,0 C-30,-16 -22,-30 0,-64 Z',
      fill: PAL.mint, opacity: .5, filter: 'url(#torn-s)',
    }, seed.art);
    seed.appear(0);
    seed.hint(true);
    seed.interactive(() => {
      lockTaps(1.2);
      seed.celebrate();
      A.sparkle({ n: 6 }); A.bloom();
      const b = seed.node.getBoundingClientRect();
      burst(b.left + b.width / 2, b.top + b.height / 2, { count: 30, col: PAL.mint, power: 1.2 });
      seed.vanish(.1);
      app.run.lit.clear();
      app.run.skill.streakRight = 0; app.run.skill.streakWrong = 0;
      setTimeout(() => go('map', { first: true }), 900);
    });
    A.say('again');
  },

  exit() { offs.forEach(f => f()); offs = []; seed?.destroy(); seed = null; whaleNode?.remove(); whaleNode = null; },
};

const sleep = s => new Promise(r => setTimeout(r, s * 1000));

/** ✨ 秘密四：光鯨。整輪玩完才會出現一次。 */
async function swimWhale() {
  store.unlock('whale');
  const w = stage.w, h = stage.h;
  const svg = el('svg', {
    class: 'whale', viewBox: '-300 -140 600 280',
    style: `position:absolute;left:0;top:0;width:${Math.min(w * 1.05, 900)}px;height:auto;pointer-events:none;overflow:visible`,
  });
  app.layers.scene.appendChild(svg);
  whaleNode = svg;

  const g = el('g', {}, svg);
  const bodyD = 'M-250,10 C-210,-52 -80,-98 40,-84 C150,-72 232,-24 258,16 C232,34 150,66 40,72 C-70,78 -200,52 -250,10 Z';
  el('path', { d: bodyD, fill: PAL.mint, opacity: .10, filter: 'url(#glow-xl)' }, g);
  el('path', { d: bodyD, fill: '#0E2B3E', opacity: .55, filter: 'url(#torn-l)' }, g);
  el('path', { d: bodyD, fill: 'none', stroke: PAL.mint, 'stroke-width': 3.4, opacity: .85, filter: 'url(#glow-m)' }, g);
  // 尾鰭
  el('path', {
    d: 'M-248,8 C-286,-30 -320,-52 -344,-46 C-330,-16 -312,4 -288,12 C-312,22 -330,42 -342,66 C-316,72 -282,48 -248,14 Z',
    fill: '#0E2B3E', opacity: .55, stroke: PAL.mint, 'stroke-width': 3, filter: 'url(#glow-m)',
  }, g);
  // 胸鰭
  const fin = el('path', {
    d: 'M-30,60 C-20,104 26,124 62,112 C40,88 10,68 -14,58 Z',
    fill: '#0E2B3E', opacity: .5, stroke: PAL.mint, 'stroke-width': 2.6, filter: 'url(#glow-s)',
  }, g);
  // 眼睛 + 身上的星紋
  el('circle', { cx: 186, cy: -18, r: 9, fill: '#FFFDF4', filter: 'url(#glow-s)' }, g);
  for (let i = 0; i < 26; i++) {
    const x = -220 + Math.random() * 440, y = -70 + Math.random() * 130;
    el('circle', { cx: x, cy: y, r: 1.6 + Math.random() * 2.6, fill: Math.random() < .3 ? PAL.honey : PAL.cream, opacity: .35 + Math.random() * .5 }, g);
  }
  // 噴氣孔的光
  const spout = el('g', { opacity: 0 }, g);
  for (let i = 0; i < 7; i++) {
    el('circle', { cx: 96 + (Math.random() - .5) * 30, cy: -96 - i * 16, r: 4 + Math.random() * 5, fill: PAL.cream, opacity: .5, filter: 'url(#glow-s)' }, spout);
  }

  A.whoosh({ gain: .3, dur: 2.4, up: false });
  setTimeout(() => A.say('whale'), 900);
  setTimeout(() => A.chime(392, { gain: .3, decay: 3.4 }), 400);
  setTimeout(() => A.chime(261.6, { gain: .26, decay: 4 }), 1400);

  const dur = 9.5;
  let t = 0;
  const y0 = h * (stage.portrait ? .30 : .26);
  await new Promise(res => {
    const off = onTick(dt => {
      t += dt;
      const k = t / dur;
      const x = -w * 0.55 + k * (w * 2.0);
      const yy = y0 + Math.sin(t * .55) * h * .045;
      const rot = Math.sin(t * .55 + 1.2) * 5;
      svg.style.transform = `translate3d(${x.toFixed(1)}px,${yy.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg)`;
      fin.setAttribute('transform', `rotate(${(Math.sin(t * 1.6) * 10).toFixed(2)},-20,60)`);
      spout.setAttribute('opacity', (k > .38 && k < .52 ? Math.sin((k - .38) / .14 * Math.PI) : 0).toFixed(2));
      if (Math.random() < .5) {
        const r = svg.getBoundingClientRect();
        flyLight(r.left + r.width * (.1 + Math.random() * .8), r.top + r.height * (.3 + Math.random() * .5),
          Math.random() * w, h * (.1 + Math.random() * .5), { col: PAL.mint, dur: 1.4 });
      }
      if (t >= dur) { off(); svg.remove(); whaleNode = null; res(); }
    });
    offs.push(off);
  });
}
