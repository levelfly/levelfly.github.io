// 嚕米 —— 這個世界的主角。
//
// 牠不是一張圖，是一具會呼吸的骨架：身體、頭、耳朵、眼皮、瞳孔、尾巴、提燈
// 各自掛在彈簧上。小朋友碰螢幕的位置，牠的眼睛會跟過去；答對牠會跳；
// 選錯牠會歪頭而不是搖頭。提燈裡的光量 = 這一輪的進度。

import { el, blob, PAL } from './paper.js';
import { Spring, FEEL } from '../core/spring.js';
import { onTick } from '../core/ticker.js';
import { rng } from '../core/rng.js';

export class Lumi {
  constructor(parent, { scale = 1 } = {}) {
    this.root = el('svg', {
      class: 'lumi', viewBox: '-110 -170 220 230',
      width: 220 * scale, height: 230 * scale,
      style: 'overflow:visible',
    });
    parent.appendChild(this.root);

    const R = rng;
    const S = this.s = {
      bodyY: new Spring(0, FEEL.bouncy),
      squash: new Spring(1, FEEL.jelly),
      headRot: new Spring(0, FEEL.soft),
      headX: new Spring(0, FEEL.soft),
      earL: new Spring(0, FEEL.bouncy),
      earR: new Spring(0, FEEL.bouncy),
      pupX: new Spring(0, { stiffness: 130, damping: 15 }),
      pupY: new Spring(0, { stiffness: 130, damping: 15 }),
      lantern: new Spring(0.12, FEEL.soft),   // 0..1 提燈亮度
      lanternSwing: new Spring(0, { stiffness: 60, damping: 6 }),
      tail: new Spring(0, { stiffness: 70, damping: 7 }),
      lean: new Spring(0, FEEL.soft),
    };

    this.blinkT = 2 + R() * 3;
    this.mood = 'idle';
    this.t = 0;

    const g = this.root;

    // 腳下的影子
    this.shadow = el('ellipse', { cx: 0, cy: 46, rx: 62, ry: 12, fill: '#04060F', opacity: .45 }, g);

    // ── 尾巴（在身體後面，短短一截毛球） ──
    this.tailG = el('g', { transform: 'translate(44,34)' }, g);
    el('path', {
      d: 'M0,0 C16,6 24,4 30,-4',
      fill: 'none', stroke: '#EADCBE', 'stroke-width': 18, 'stroke-linecap': 'round',
    }, this.tailG);
    el('path', { d: blob(32, -8, 14, { n: 9, wob: .3, rnd: R }), fill: '#F3E7CD' }, this.tailG);
    el('path', { d: blob(34, -12, 8, { n: 8, wob: .3, rnd: R }), fill: PAL.honey, opacity: .55 }, this.tailG);

    // ── 後腳（先畫，讓身體壓在上面才有前後） ──
    el('ellipse', { cx: -34, cy: 50, rx: 21, ry: 12, fill: '#DFCFAC' }, g);
    el('ellipse', { cx: 30, cy: 51, rx: 21, ry: 12, fill: '#DFCFAC' }, g);

    // ── 身體 ──
    this.bodyG = el('g', {}, g);
    const bodyD = blob(0, 6, 52, { n: 12, wob: .1, squash: .84, rnd: R });
    el('path', { d: bodyD, fill: '#2A2418', opacity: .5, transform: 'translate(0,5)' }, this.bodyG);
    el('path', { d: bodyD, fill: '#F3E7CD' }, this.bodyG);
    el('path', { d: bodyD, fill: '#FFFDF4', opacity: .5, transform: 'translate(-3,-4)' }, this.bodyG);
    // 胸口那撮會發光的絨毛
    this.chest = el('g', {}, this.bodyG);
    el('path', { d: 'M-20,4 C-10,20 10,20 20,4 C14,26 -14,26 -20,4 Z', fill: PAL.mint, opacity: .32 }, this.chest);
    this.chestGlow = el('circle', { cx: 0, cy: 12, r: 22, fill: 'url(#g-mint)', opacity: .35 }, this.chest);
    // 另一隻前爪，輕輕貼在身側
    el('ellipse', { cx: 44, cy: 18, rx: 11, ry: 17, fill: '#EFE1C2', transform: 'rotate(-14,44,18)' }, this.bodyG);

    // ── 圍巾：一抹珊瑚色，把奶油色的身體和頭分開，也是這隻角色的記號 ──
    const scarf = el('g', {}, g);
    el('path', { d: 'M-49,-20 C-30,2 30,2 49,-20 C46,10 -46,10 -49,-20 Z', fill: '#D4604E' }, scarf);
    el('path', { d: 'M-49,-20 C-30,2 30,2 49,-20 C48,-8 -48,-8 -49,-20 Z', fill: PAL.coral, opacity: .9 }, scarf);
    el('path', {
      d: 'M34,-4 C50,8 54,26 47,42 C38,34 32,16 28,2 Z', fill: '#D4604E',
    }, scarf);

    // ── 提燈（左手，畫在最前面） ──
    this.lanternG = el('g', { transform: 'translate(-74,-6)' }, g);
    // 手臂：從身體左側伸出來抓住提燈的把手
    el('path', { d: 'M46,4 C22,2 8,-8 2,-20', fill: 'none', stroke: '#EFE1C2', 'stroke-width': 19, 'stroke-linecap': 'round' }, this.lanternG);
    el('ellipse', { cx: 0, cy: -22, rx: 15, ry: 12, fill: '#F7ECD5' }, this.lanternG);
    const lantBody = el('g', {}, this.lanternG);
    // 把手
    el('path', { d: 'M-16,4 C-16,-14 16,-14 16,4', fill: 'none', stroke: '#C9A26A', 'stroke-width': 5, 'stroke-linecap': 'round' }, lantBody);
    // 大範圍光暈（提燈是全場最亮的東西）
    this.lanternHalo = el('circle', { cx: 0, cy: 28, r: 66, fill: 'url(#g-warm)', opacity: .2 }, lantBody);
    el('path', { d: 'M-19,4 h38 l5,8 h-48 z', fill: '#C9A26A' }, lantBody);
    el('path', { d: 'M-17,12 h34 v30 a17 15 0 0 1 -34 0 z', fill: '#1D2440' }, lantBody);
    this.lanternCore = el('ellipse', { cx: 0, cy: 28, rx: 19, ry: 22, fill: 'url(#g-warm)', opacity: .3 }, lantBody);
    this.lanternFlame = el('ellipse', { cx: 0, cy: 30, rx: 8, ry: 10, fill: PAL.honey, opacity: .3 }, lantBody);
    el('ellipse', { cx: 0, cy: 31, rx: 4, ry: 5, fill: '#FFFDF4', opacity: .85 }, lantBody);
    el('path', { d: 'M-17,12 h34 v30 a17 15 0 0 1 -34 0 z', fill: 'none', stroke: '#E6C894', 'stroke-width': 3.4, 'stroke-linejoin': 'round' }, lantBody);
    el('path', { d: 'M-20,52 h40', stroke: '#C9A26A', 'stroke-width': 6, 'stroke-linecap': 'round' }, lantBody);

    // ── 頭 ──
    this.headG = el('g', {}, g);
    // 長長的垂耳：這是嚕米最好認的剪影
    this.earLG = el('g', { transform: 'translate(-44,-92)' }, this.headG);
    this.earRG = el('g', { transform: 'translate(44,-92)' }, this.headG);
    const ear = (grp, dir) => {
      const d = `M0,-8 C${-26 * dir},-16 ${-52 * dir},4 ${-56 * dir},44
                 C${-57 * dir},64 ${-40 * dir},72 ${-28 * dir},60
                 C${-16 * dir},48 ${-6 * dir},20 0,-8 Z`;
      el('path', { d, fill: '#2A2418', opacity: .4, transform: 'translate(0,5)' }, grp);
      el('path', { d, fill: '#EFE2C6' }, grp);
      el('path', {
        d: `M-2,-2 C${-18 * dir},-8 ${-38 * dir},8 ${-41 * dir},40
            C${-42 * dir},54 ${-31 * dir},58 ${-24 * dir},50
            C${-15 * dir},40 ${-6 * dir},18 -2,-2 Z`,
        fill: PAL.coral, opacity: .42,
      }, grp);
      el('circle', { cx: -50 * dir, cy: 54, r: 7, fill: PAL.mint, opacity: .75 }, grp);
    };
    ear(this.earLG, 1); ear(this.earRG, -1);

    const headD = blob(0, -66, 56, { n: 13, wob: .07, squash: .92, rnd: R });
    el('path', { d: headD, fill: '#2A2418', opacity: .5, transform: 'translate(0,5)' }, this.headG);
    el('path', { d: headD, fill: '#F7ECD5' }, this.headG);
    el('path', { d: headD, fill: '#FFFDF4', opacity: .55, transform: 'translate(-4,-5)' }, this.headG);
    // 額頭上的光印：跟提燈同步亮，暗示「牠身上本來就有光」
    this.mark = el('path', {
      d: 'M0,-118 L9,-104 L0,-90 L-9,-104 Z', fill: PAL.mint, opacity: .5,
    }, this.headG);

    // 臉：眼睛（三種型態疊著，用透明度切換表情）
    this.face = el('g', {}, this.headG);
    const eye = (x) => {
      const grp = el('g', { transform: `translate(${x},-66)` }, this.face);
      const open = el('g', {}, grp);
      el('ellipse', { rx: 15, ry: 17, fill: '#241B22' }, open);
      const pup = el('g', {}, open);
      el('circle', { cx: -4.5, cy: -5.5, r: 5.4, fill: '#FFFDF4', opacity: .95 }, pup);
      el('circle', { cx: 5, cy: 5, r: 2.4, fill: '#FFFDF4', opacity: .5 }, pup);
      const happy = el('path', { d: 'M-15,2 C-9,-13 9,-13 15,2', fill: 'none', stroke: '#241B22', 'stroke-width': 6.5, 'stroke-linecap': 'round', opacity: 0 }, grp);
      const shut = el('path', { d: 'M-14,0 C-7,7 7,7 14,0', fill: 'none', stroke: '#241B22', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0 }, grp);
      return { grp, open, pup, happy, shut };
    };
    this.eyeL = eye(-24); this.eyeR = eye(24);

    // 腮紅
    el('ellipse', { cx: -44, cy: -48, rx: 12, ry: 8, fill: PAL.coral, opacity: .35 }, this.face);
    el('ellipse', { cx: 44, cy: -48, rx: 12, ry: 8, fill: PAL.coral, opacity: .35 }, this.face);

    // 鼻子與嘴
    el('path', { d: 'M-7,-42 L7,-42 L0,-34 Z', fill: '#C97A6B' }, this.face);
    this.mouth = el('path', {
      d: 'M0,-34 C0,-27 -8,-25 -12,-29 M0,-34 C0,-27 8,-25 12,-29',
      fill: 'none', stroke: '#8A5A50', 'stroke-width': 3.6, 'stroke-linecap': 'round',
    }, this.face);

    // 頭頂那根呆毛（角色記憶點）
    this.ahoge = el('path', {
      d: 'M2,-118 C6,-134 -6,-140 -2,-152',
      fill: 'none', stroke: '#F0E3C8', 'stroke-width': 7, 'stroke-linecap': 'round',
    }, this.headG);

    this.off = onTick((dt, t) => this.tick(dt, t));
  }

  /* ── 對外的動作 ── */

  hop(power = 1) {
    this.s.bodyY.kick(-2.6 * power);
    this.s.squash.set(1.16).to(1);
    this.s.earL.kick(2.2); this.s.earR.kick(-2.2);
    this.s.lanternSwing.kick(2.4 * power);
  }
  cheer() {
    this.setMood('happy', 1.7);
    this.hop(1.25);
    setTimeout(() => this.hop(.85), 260);
  }
  tilt(dir = 1) {
    this.setMood('puzzle', 1.5);
    this.s.headRot.to(11 * dir);
    this.s.earL.kick(dir > 0 ? 2.4 : .6); this.s.earR.kick(dir > 0 ? -.6 : -2.4);
    setTimeout(() => this.s.headRot.to(0), 900);
  }
  poke() {
    this.s.squash.set(.86).to(1);
    this.s.bodyY.kick(-1.1);
    this.s.headRot.kick((Math.random() - .5) * 26);
    this.s.earL.kick(3); this.s.earR.kick(-3);
    this.s.tail.kick(4);
  }
  /** 打噴嚏：先吸氣往後仰，再爆出去 */
  async sneeze() {
    this.setMood('shut', .55);
    this.s.lean.to(-16); this.s.squash.to(.9);
    await new Promise(r => setTimeout(r, 420));
    this.s.lean.to(9); this.s.squash.set(1.3).to(1);
    this.s.bodyY.kick(-1.6);
    this.s.earL.kick(6); this.s.earR.kick(-6);
    setTimeout(() => { this.s.lean.to(0); this.setMood('idle'); }, 620);
  }
  setMood(m, sec = 0) {
    this.mood = m;
    if (sec) { clearTimeout(this._moodT); this._moodT = setTimeout(() => (this.mood = 'idle'), sec * 1000); }
  }
  /** 眼睛看向螢幕上的某個點 */
  lookAt(clientX, clientY) {
    const r = this.root.getBoundingClientRect();
    if (!r.width) return;
    const cx = r.left + r.width * .5, cy = r.top + r.height * .34;
    const dx = (clientX - cx) / (r.width * .9), dy = (clientY - cy) / (r.height * .9);
    const m = Math.min(1, Math.hypot(dx, dy));
    const a = Math.atan2(dy, dx);
    this.s.pupX.to(Math.cos(a) * m * 5.5);
    this.s.pupY.to(Math.sin(a) * m * 5);
    this.s.headX.to(Math.cos(a) * m * 5);
    this.s.headRot.to(Math.cos(a) * m * 5);
  }
  /** 提燈亮度 = 進度（0..1） */
  setLantern(v) { this.s.lantern.to(Math.max(0.1, Math.min(1, v))); this.s.lanternSwing.kick(1.6); }

  /* ── 每幀 ── */
  tick(dt, time) {
    this.t += dt;
    const S = this.s;
    for (const k in S) S[k].step(dt);

    const breathe = Math.sin(this.t * 1.6) * 0.018;
    const sq = S.squash.value * (1 + breathe);
    const by = S.bodyY.value * 12;

    this.bodyG.setAttribute('transform',
      `translate(0,${by.toFixed(2)}) scale(${(2 - sq).toFixed(3)},${sq.toFixed(3)})`);
    this.shadow.setAttribute('rx', (62 * (2 - sq) - by * .5).toFixed(1));
    this.shadow.setAttribute('opacity', (0.45 + by * 0.012).toFixed(2));

    const headBob = Math.sin(this.t * 1.6 + .5) * 2.2;
    this.headG.setAttribute('transform',
      `translate(${S.headX.value.toFixed(2)},${(by * 1.1 + headBob).toFixed(2)}) rotate(${(S.headRot.value + S.lean.value * .4).toFixed(2)},0,-20)`);

    this.earLG.setAttribute('transform', `translate(-44,-92) rotate(${(S.earL.value * 4 + Math.sin(this.t * 1.1) * 3.4).toFixed(2)})`);
    this.earRG.setAttribute('transform', `translate(44,-92) rotate(${(S.earR.value * 4 - Math.sin(this.t * 1.1 + 1) * 3.4).toFixed(2)})`);
    this.ahoge.setAttribute('transform', `rotate(${(Math.sin(this.t * 1.9) * 7 + S.headRot.value * .5).toFixed(2)},2,-118)`);

    this.tailG.setAttribute('transform', `translate(46,${(22 + by).toFixed(1)}) rotate(${(Math.sin(this.t * 1.3) * 7 + S.tail.value * 5).toFixed(2)})`);

    // 提燈：垂直懸掛 + 擺盪 + 亮度
    const swing = Math.sin(this.t * 1.35) * 4 + S.lanternSwing.value * 7;
    this.lanternG.setAttribute('transform', `translate(-74,${(-6 + by).toFixed(1)}) rotate(${swing.toFixed(2)},0,-22)`);
    const L = S.lantern.value;
    const flick = 1 + Math.sin(this.t * 7.3) * .07 + Math.sin(this.t * 3.1) * .05;
    this.lanternCore.setAttribute('opacity', (0.30 + L * 0.66 * flick).toFixed(3));
    this.lanternHalo.setAttribute('opacity', (0.14 + L * 0.62 * flick).toFixed(3));
    this.lanternHalo.setAttribute('r', (44 + L * 40).toFixed(1));
    this.lanternFlame.setAttribute('opacity', (0.28 + L * 0.7).toFixed(3));
    this.lanternFlame.setAttribute('ry', (7 + L * 6 * flick).toFixed(1));
    this.chestGlow.setAttribute('opacity', (0.22 + L * 0.45).toFixed(2));
    this.mark.setAttribute('opacity', (0.32 + L * 0.55 * (0.85 + 0.15 * Math.sin(this.t * 2.2))).toFixed(2));

    // 眼睛
    const pupT = `translate(${S.pupX.value.toFixed(2)},${S.pupY.value.toFixed(2)})`;
    this.eyeL.pup.setAttribute('transform', pupT);
    this.eyeR.pup.setAttribute('transform', pupT);

    // 眨眼
    this.blinkT -= dt;
    let blinking = false;
    if (this.blinkT < 0) {
      blinking = this.blinkT > -0.13;
      if (this.blinkT < -0.13) this.blinkT = 2.4 + Math.random() * 3.4;
    }
    const happy = this.mood === 'happy';
    const shut = this.mood === 'shut' || blinking;
    const showOpen = happy || shut ? 0 : 1;
    [this.eyeL, this.eyeR].forEach(e => {
      e.open.setAttribute('opacity', showOpen);
      e.happy.setAttribute('opacity', happy ? 1 : 0);
      e.shut.setAttribute('opacity', !happy && shut ? 1 : 0);
    });

    // 嘴：開心時張大，疑惑時抿成小小的一點
    if (happy) this.mouth.setAttribute('d', 'M-13,-33 C-9,-22 9,-22 13,-33 C7,-28 -7,-28 -13,-33 Z');
    else if (this.mood === 'puzzle') this.mouth.setAttribute('d', 'M-6,-31 C-2,-34 2,-34 6,-31');
    else this.mouth.setAttribute('d', 'M0,-34 C0,-27 -8,-25 -12,-29 M0,-34 C0,-27 8,-25 12,-29');
    this.mouth.setAttribute('fill', happy ? '#8A5A50' : 'none');
  }

  destroy() { this.off?.(); this.root.remove(); clearTimeout(this._moodT); }
}
