// 聲音是這個遊戲的一半。
//
// 三條匯流排：music（程序化配樂）/ ambient（環境底噪）/ sfx（互動音效）/ voice（語音）。
// 語音一開口，其餘三條自動 duck 下去，講完淡回來——小朋友永遠聽得清楚題目。
//
// 語音走預先合成的 mp3（assets/voice/），manifest 對照 id → 檔案；
// 檔案不存在時自動退回瀏覽器語音合成，所以日後換成真人錄音只要換檔案。

import { store } from './store.js';

const A = {
  ctx: null, ready: false, unlocked: false,
  bus: {}, buffers: new Map(), manifest: null,
  voiceNode: null, voiceSeq: 0,
  musicHandle: null, ambientHandle: null,
  ttsVoice: null,
  warned: false,
};

/* ───────────────────────── 基礎 ───────────────────────── */

export function initAudio() {
  if (A.ctx) return A.ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    if (!A.warned) { A.warned = true; console.warn('[audio] Web Audio API not available'); }
    A.ready = false;
    return null;
  }
  try {
    const ctx = A.ctx = new Ctx({ latencyHint: 'interactive' });

    const master = ctx.createGain();
    master.gain.value = store.muted ? 0 : 0.9;
    master.connect(ctx.destination);

    // 一層很輕的壓縮，避免同時多音爆掉小喇叭
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 22;
    comp.ratio.value = 3.2; comp.attack.value = 0.006; comp.release.value = 0.22;
    comp.connect(master);

    const mk = v => { const g = ctx.createGain(); g.gain.value = v; g.connect(comp); return g; };
    A.bus = {
      master, comp,
      music:   mk(0.30),
      ambient: mk(0.34),
      sfx:     mk(0.62),
      voice:   mk(1.0),
    };

    // 共用殘響：一點點空間感，讓木琴不乾
    A.bus.verb = ctx.createConvolver();
    A.bus.verb.buffer = makeImpulse(ctx, 1.9, 2.6);
    const verbGain = ctx.createGain(); verbGain.gain.value = 0.28;
    A.bus.verb.connect(verbGain); verbGain.connect(comp);
    A.bus.verbGain = verbGain;

    A.ready = true;
    return ctx;
  } catch (e) {
    console.warn('[audio] init failed', e);
    A.ctx = null;
    A.ready = false;
    return null;
  }
}

function makeImpulse(ctx, sec, decay) {
  const len = Math.floor(ctx.sampleRate * sec);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

/** iOS/Android 都要一次真實使用者手勢才會出聲 */
export async function unlockAudio() {
  initAudio();
  if (!A.ctx || A.unlocked) return;
  try {
    if (A.ctx.state !== 'running') await A.ctx.resume();
    const b = A.ctx.createBuffer(1, 1, 22050);
    const s = A.ctx.createBufferSource();
    s.buffer = b; s.connect(A.ctx.destination); s.start(0);
    A.unlocked = A.ctx.state === 'running';
  } catch (e) { console.warn('[audio] unlock', e); }
}

export function setMuted(m) {
  store.setMuted(m);
  if (!A.ctx) return;
  const t = A.ctx.currentTime;
  A.bus.master.gain.cancelScheduledValues(t);
  A.bus.master.gain.linearRampToValueAtTime(m ? 0 : 0.9, t + 0.25);
}
export const isMuted = () => store.muted;

/* ───────────────────────── 語音 ───────────────────────── */

export async function loadVoices(onProgress) {
  initAudio();
  if (!A.ctx) { onProgress?.(1); return false; }
  let man;
  try {
    man = await (await fetch('assets/voice/manifest.json')).json();
  } catch { onProgress?.(1); return false; }
  A.manifest = man;

  const ids = Object.keys(man.lines);
  let done = 0;
  const CONC = 8;
  let idx = 0;
  const worker = async () => {
    while (idx < ids.length) {
      const id = ids[idx++];
      try {
        // 手機走隧道／弱網、或 Safari 的 decodeAudioData 在 suspended context 上卡住時，
        // 單一檔案可能吊死。整段（下載 + 解碼）給 12 秒，逾時就跳過這一句。
        // 少一句話只是退回瀏覽器語音，但整個載入不能因為一個檔案永遠停在那裡。
        const ac = new AbortController();
        const load = (async () => {
          const r = await fetch('assets/voice/' + man.lines[id].file, { signal: ac.signal });
          if (!r.ok) return;
          const ab = await r.arrayBuffer();
          const buf = await new Promise((res, rej) => {
            const p = A.ctx.decodeAudioData(ab, res, rej);   // callback 版：舊 Safari 的 promise 形式不穩
            if (p?.then) p.then(res, rej);
          });
          A.buffers.set(id, buf);
        })();
        let to;
        await Promise.race([load, new Promise(r => { to = setTimeout(() => { ac.abort(); r(); }, 12000); })]);
        clearTimeout(to);
      } catch { /* 缺一句不致命，退回瀏覽器語音 */ }
      done++; onProgress?.(done / ids.length, done, ids.length);
    }
  };
  await Promise.all(Array.from({ length: CONC }, worker));
  return A.buffers.size > 0;
}

function duck(on) {
  if (!A.ctx) return;
  const t = A.ctx.currentTime;
  const set = (g, v) => { g.gain.cancelScheduledValues(t); g.gain.linearRampToValueAtTime(v, t + (on ? 0.12 : 0.5)); };
  set(A.bus.music, on ? 0.10 : 0.30);
  set(A.bus.ambient, on ? 0.15 : 0.34);
  set(A.bus.sfx, on ? 0.42 : 0.62);
}

export function stopVoice() {
  A.voiceSeq++;
  if (A.voiceNode) { try { A.voiceNode.stop(); } catch {} A.voiceNode = null; }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  duck(false);
}

/**
 * 講一句話。預設會打斷上一句（小朋友點很快，最新的指令最重要）。
 * @returns Promise 於播完（或被打斷）時 resolve
 */
export function say(id, { interrupt = true, delay = 0 } = {}) {
  initAudio();
  if (interrupt) stopVoice();
  const seq = ++A.voiceSeq;

  // 沒有 Web Audio 時仍要讓遊戲流程繼續：用語音合成備援，並在短時間後結束。
  if (!A.ctx) {
    const text = A.manifest?.lines?.[id]?.text || '';
    if (text && window.speechSynthesis) {
      return speak(text, seq).then(() => true).catch(() => false);
    }
    return Promise.resolve(false);
  }

  return new Promise(resolve => {
    // 遊戲流程會 await 這個 Promise，所以它一定要在有限時間內結束。
    // 音訊被瀏覽器節流、分頁跑到背景、檔案缺席、使用者靜音——任何一種都不能讓關卡卡住。
    let done = false;
    let guard = 0;
    const finish = ok => { if (done) return; done = true; clearTimeout(guard); resolve(ok); };
    const armGuard = sec => { clearTimeout(guard); guard = setTimeout(() => finish(false), sec * 1000); };

    const start = () => {
      if (seq !== A.voiceSeq) return finish(false);
      const buf = A.buffers.get(id);
      if (buf) {
        const src = A.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(A.bus.voice);
        // 一點點殘響，跟環境黏在一起
        const send = A.ctx.createGain(); send.gain.value = 0.10;
        src.connect(send); send.connect(A.bus.verb);
        src.onended = () => { if (seq === A.voiceSeq) { A.voiceNode = null; duck(false); } finish(true); };
        duck(true);
        A.voiceNode = src;
        try { src.start(); } catch { return finish(false); }
        armGuard(buf.duration + 0.6);
      } else {
        const text = A.manifest?.lines?.[id]?.text || '';
        armGuard(Math.max(1.4, text.length * 0.28));
        speak(text, seq).then(() => finish(true));
      }
    };
    if (delay > 0) { armGuard(delay + 6); setTimeout(start, delay * 1000); }
    else start();
  });
}

/** 檔案缺席時的備援：瀏覽器語音合成 */
function speak(text, seq) {
  return new Promise(resolve => {
    if (!text || !window.speechSynthesis) return resolve(false);
    if (!A.ttsVoice) {
      const vs = speechSynthesis.getVoices();
      A.ttsVoice = vs.find(v => /zh[-_]TW|zh[-_]HK/i.test(v.lang))
                || vs.find(v => /^zh/i.test(v.lang)) || null;
    }
    const u = new SpeechSynthesisUtterance(text);
    if (A.ttsVoice) u.voice = A.ttsVoice;
    u.lang = 'zh-TW'; u.rate = 0.92; u.pitch = 1.15;
    u.onend = u.onerror = () => { if (seq === A.voiceSeq) duck(false); resolve(true); };
    duck(true);
    speechSynthesis.speak(u);
  });
}

const CN_KEY = n => `n${n}`;
export const sayNumber = n => say(CN_KEY(n));
export const sayFind = (n, alt = false) => say(alt ? `findb_${n}` : `find_${n}`);
export const sayIs = n => say(`is_${n}`);
export const sayOneOf = ids => say(ids[Math.floor(Math.random() * ids.length)]);

/* ───────────────────────── 音效合成 ───────────────────────── */

const now = () => A.ctx.currentTime;

function env(node, { a = 0.004, d = 0.4, peak = 1, hold = 0 } = {}) {
  const g = A.ctx.createGain(), t = now();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  if (hold) g.gain.setValueAtTime(peak, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + d);
  node.connect(g);
  return { g, end: t + a + hold + d };
}

function out(g, { bus = 'sfx', verb = 0.22, pan = 0 } = {}) {
  let node = g;
  if (pan) { const p = A.ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); node = p; }
  node.connect(A.bus[bus]);
  if (verb > 0) { const s = A.ctx.createGain(); s.gain.value = verb; node.connect(s); s.connect(A.bus.verb); }
}

/** 木琴：溫暖、有木頭感，是這個世界的主要「聲音材質」 */
export function pluck(freq, { gain = 0.5, decay = 0.55, pan = 0, bus = 'sfx' } = {}) {
  if (!A.ready) return;
  const t = now();
  const o1 = A.ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
  const o2 = A.ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq * 2.01;
  const o3 = A.ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = freq * 3.03;
  const mix = A.ctx.createGain();
  const g2 = A.ctx.createGain(); g2.gain.value = 0.16;
  const g3 = A.ctx.createGain(); g3.gain.value = 0.07;
  o1.connect(mix); o2.connect(g2); g2.connect(mix); o3.connect(g3); g3.connect(mix);
  // 一點點起音噪，像槌子敲到木頭
  const lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass';
  lp.frequency.setValueAtTime(freq * 6, t); lp.frequency.exponentialRampToValueAtTime(freq * 1.6, t + decay * .6);
  mix.connect(lp);
  const { g, end } = env(lp, { a: 0.004, d: decay, peak: gain });
  out(g, { pan, verb: 0.3, bus });
  [o1, o2, o3].forEach(o => { o.start(t); o.stop(end + 0.05); });
}

/** 玻璃風鈴：獎勵、稀有、發現 */
export function chime(freq, { gain = 0.35, decay = 1.5, pan = 0 } = {}) {
  if (!A.ready) return;
  const t = now();
  const car = A.ctx.createOscillator(); car.type = 'sine'; car.frequency.value = freq;
  const mod = A.ctx.createOscillator(); mod.type = 'sine'; mod.frequency.value = freq * 2.7;
  const mg = A.ctx.createGain(); mg.gain.setValueAtTime(freq * 2.2, t);
  mg.gain.exponentialRampToValueAtTime(1, t + decay * 0.5);
  mod.connect(mg); mg.connect(car.frequency);
  const { g, end } = env(car, { a: 0.003, d: decay, peak: gain });
  out(g, { pan, verb: 0.5 });
  car.start(t); mod.start(t); car.stop(end + .05); mod.stop(end + .05);
}

/** 泡泡：戳、冒出、消失 */
export function bubble({ up = true, gain = 0.3, pan = 0 } = {}) {
  if (!A.ready) return;
  const t = now();
  const o = A.ctx.createOscillator(); o.type = 'sine';
  const f0 = up ? 420 : 900, f1 = up ? 1180 : 300;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + 0.13);
  const { g, end } = env(o, { a: 0.005, d: 0.14, peak: gain });
  out(g, { pan, verb: 0.18 });
  o.start(t); o.stop(end + .03);
}

/** 柔和的「不是這個喔」：兩個下行音，大調、不刺耳、絕不像錯誤提示音 */
export function nudge({ pan = 0 } = {}) {
  if (!A.ready) return;
  pluck(392, { gain: 0.32, decay: 0.32, pan });
  setTimeout(() => pluck(311.1, { gain: 0.26, decay: 0.5, pan }), 105);
}

/** 答對：上行五聲琶音 + 光暈 */
export function sparkle({ pan = 0, n = 5, root = 523.25 } = {}) {
  if (!A.ready) return;
  const scale = [0, 2, 4, 7, 9, 12, 14, 16];
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      pluck(root * Math.pow(2, scale[i % scale.length] / 12), { gain: 0.34, decay: 0.7, pan: pan + (i - n / 2) * 0.08 });
    }, i * 62);
  }
}

/** 光綻放：低頻的溫暖膨脹，答對時和 sparkle 疊在一起 */
export function bloom({ gain = 0.4 } = {}) {
  if (!A.ready) return;
  const t = now();
  const n = A.ctx.createBufferSource(); n.buffer = noiseBuf();
  const bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
  bp.frequency.setValueAtTime(240, t);
  bp.frequency.exponentialRampToValueAtTime(2600, t + 0.55);
  n.connect(bp);
  const { g, end } = env(bp, { a: 0.09, d: 0.75, peak: gain });
  out(g, { verb: 0.55 });
  n.start(t); n.stop(end + .05);
}

let _noise = null;
function noiseBuf() {
  if (_noise) return _noise;
  const len = A.ctx.sampleRate * 2;
  const b = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return (_noise = b);
}

/** 軟軟的落地/放下 */
export function thud({ gain = 0.4, pan = 0 } = {}) {
  if (!A.ready) return;
  const t = now();
  const o = A.ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(52, t + 0.18);
  const { g, end } = env(o, { a: 0.004, d: 0.2, peak: gain });
  out(g, { pan, verb: 0.1 });
  o.start(t); o.stop(end + .03);
}

/** 咻——過場、飛行 */
export function whoosh({ gain = 0.3, dur = 0.6, up = true } = {}) {
  if (!A.ready) return;
  const t = now();
  const n = A.ctx.createBufferSource(); n.buffer = noiseBuf();
  const bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3.5;
  bp.frequency.setValueAtTime(up ? 300 : 2400, t);
  bp.frequency.exponentialRampToValueAtTime(up ? 2400 : 300, t + dur);
  n.connect(bp);
  const { g, end } = env(bp, { a: dur * .35, d: dur * .65, peak: gain });
  out(g, { verb: 0.35 });
  n.start(t); n.stop(end + .05);
}

/** 數數用的爬升音：第 i 個物件比第 i-1 個高，數到最後一個特別亮 */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
export function countTone(i, total) {
  const semi = PENTA[Math.min(i, PENTA.length - 1)];
  pluck(392 * Math.pow(2, semi / 12), { gain: 0.42, decay: i === total - 1 ? 0.9 : 0.45 });
  if (i === total - 1) chime(784 * Math.pow(2, semi / 12), { gain: 0.14, decay: 1.2 });
}

/* ───────────────────────── 程序化配樂 ───────────────────────── */
// 沒有 loop 檔。一組緩慢的五聲和聲墊 + 隨機灑落的木琴音，
// 每個場景換根音與音色，所以「音樂」永遠不會重複到讓人煩。

const PADS = {
  title:  { root: 130.81, chords: [[0, 7, 12], [-3, 4, 9], [2, 7, 14], [-5, 2, 7]], bright: 900 },
  map:    { root: 146.83, chords: [[0, 7, 16], [2, 9, 14], [-3, 4, 12], [0, 5, 12]], bright: 1100 },
  marsh:  { root: 110.00, chords: [[0, 7, 14], [-2, 5, 12], [0, 9, 16], [-4, 3, 10]], bright: 700 },
  cove:   { root: 164.81, chords: [[0, 7, 12], [4, 9, 16], [0, 5, 12], [2, 7, 14]], bright: 1400 },
  grove:  { root: 130.81, chords: [[0, 4, 11], [-3, 7, 12], [2, 9, 14], [0, 7, 16]], bright: 850 },
  cliff:  { root: 98.00,  chords: [[0, 12, 19], [4, 16, 23], [-3, 9, 16], [2, 14, 21]], bright: 1600 },
  light:  { root: 123.47, chords: [[0, 7, 12], [-5, 2, 9], [3, 10, 15], [0, 5, 14]], bright: 1000 },
  finale: { root: 174.61, chords: [[0, 4, 7], [2, 7, 11], [5, 9, 12], [0, 7, 16]], bright: 1900 },
};

export function setMusic(sceneKey) {
  initAudio();
  if (!A.ctx) return;
  const cfg = PADS[sceneKey] || PADS.map;
  if (A.musicHandle?.key === sceneKey) return;
  A.musicHandle?.stop();

  const ctx = A.ctx;
  const gate = ctx.createGain(); gate.gain.value = 0; gate.connect(A.bus.music);
  gate.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.2);

  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
  lp.frequency.value = cfg.bright; lp.Q.value = 0.6; lp.connect(gate);

  // 三顆持續振盪器 = 和聲墊
  const voices = [0, 1, 2].map(i => {
    const o = ctx.createOscillator();
    o.type = i === 0 ? 'triangle' : 'sine';
    const g = ctx.createGain(); g.gain.value = i === 0 ? 0.16 : 0.10;
    const p = ctx.createStereoPanner(); p.pan.value = (i - 1) * 0.45;
    o.connect(g); g.connect(p); p.connect(lp);
    o.start();
    return o;
  });
  // 一點點慢速抖動，避免電子感
  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.07;
  const lfoG = ctx.createGain(); lfoG.gain.value = cfg.bright * 0.22;
  lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();

  let ci = 0;
  const stepChord = () => {
    const ch = cfg.chords[ci % cfg.chords.length]; ci++;
    const t = ctx.currentTime;
    voices.forEach((o, i) => {
      const f = cfg.root * Math.pow(2, ch[i] / 12);
      o.frequency.cancelScheduledValues(t);
      o.frequency.setValueAtTime(o.frequency.value, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 3.4);
    });
  };
  stepChord();
  const chordTimer = setInterval(stepChord, 9000);

  // 稀疏的木琴光點
  let sparkTimer = 0;
  const scheduleSpark = () => {
    sparkTimer = setTimeout(() => {
      const ch = cfg.chords[ci % cfg.chords.length];
      const semi = ch[Math.floor(Math.random() * ch.length)] + (Math.random() < .4 ? 12 : 24);
      pluck(cfg.root * Math.pow(2, semi / 12), {
        gain: 0.10 + Math.random() * 0.07, decay: 1.6,
        pan: Math.random() * 1.4 - 0.7, bus: 'music',
      });
      scheduleSpark();
    }, 2200 + Math.random() * 5200);
  };
  scheduleSpark();

  A.musicHandle = {
    key: sceneKey,
    stop() {
      clearInterval(chordTimer); clearTimeout(sparkTimer);
      const t = ctx.currentTime;
      gate.gain.cancelScheduledValues(t);
      gate.gain.linearRampToValueAtTime(0, t + 1.4);
      setTimeout(() => { voices.forEach(o => { try { o.stop(); } catch {} }); try { lfo.stop(); } catch {} }, 1700);
    },
  };
}

/* ───────────────────────── 環境底噪 ───────────────────────── */
const AMB = {
  marsh:  { lo: 90,  hi: 620,  rate: 0.09, gain: 0.30 },  // 濕氣、遠處蛙鳴的空氣
  cove:   { lo: 140, hi: 1500, rate: 0.13, gain: 0.42 },  // 浪
  grove:  { lo: 110, hi: 900,  rate: 0.07, gain: 0.26 },  // 葉子
  cliff:  { lo: 200, hi: 2000, rate: 0.05, gain: 0.22 },  // 高處的風
  light:  { lo: 120, hi: 1200, rate: 0.11, gain: 0.34 },
  map:    { lo: 130, hi: 800,  rate: 0.06, gain: 0.18 },
  title:  { lo: 130, hi: 800,  rate: 0.06, gain: 0.20 },
  finale: { lo: 150, hi: 1600, rate: 0.10, gain: 0.30 },
};

export function setAmbient(key) {
  initAudio();
  if (!A.ctx) return;
  const cfg = AMB[key] || AMB.map;
  if (A.ambientHandle?.key === key) return;
  A.ambientHandle?.stop();

  const ctx = A.ctx;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
  bp.frequency.value = (cfg.lo + cfg.hi) / 2;
  const g = ctx.createGain(); g.gain.value = 0;
  src.connect(bp); bp.connect(g); g.connect(A.bus.ambient);
  g.gain.linearRampToValueAtTime(cfg.gain, ctx.currentTime + 2.0);

  // 用一顆慢 LFO 掃 bandpass，浪/風就有了呼吸
  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = cfg.rate;
  const lg = ctx.createGain(); lg.gain.value = (cfg.hi - cfg.lo) / 2;
  lfo.connect(lg); lg.connect(bp.frequency);
  src.start(); lfo.start();

  A.ambientHandle = {
    key,
    stop() {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.linearRampToValueAtTime(0, t + 1.2);
      setTimeout(() => { try { src.stop(); lfo.stop(); } catch {} }, 1500);
    },
  };
}

export const audioCtx = () => A.ctx;
