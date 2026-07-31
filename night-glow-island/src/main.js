// 進入點。
//
// 流程：量舞台 → 建外殼 → 載語音 → 等一次真實的觸碰（瀏覽器要求）→ 開場。
// 那一次觸碰不是「請按開始」，是把提燈點亮——第一個動作就已經在玩了。

import { initStage } from './core/stage.js';
import { bootShell, registerScene, go, app } from './game.js';
import { loadVoices, unlockAudio, stopVoice, chime, sparkle, initAudio, audioCtx } from './core/audio.js';
import { newSkill } from './data/world.js';
import { setActiveProfile, hasChoice } from './profiles.js';
import { store } from './core/store.js';
import { agepick } from './scenes/agepick.js';
import { title } from './scenes/title.js';
import { map } from './scenes/map.js';
import { level } from './scenes/level.js';
import { lantern } from './scenes/lantern.js';
import { finale } from './scenes/finale.js';

// 防止 iPad Safari 快速連點時的雙擊放大（CSS touch-action 的備援）
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = performance.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

const loader = document.getElementById('loader');
const fill = document.getElementById('loaderFill');

async function boot() {
  const stageEl = document.getElementById('stage');
  const canvas = document.getElementById('fx');
  initStage(stageEl, canvas);
  bootShell();

  registerScene('agepick', agepick);
  registerScene('title', title);
  registerScene('map', map);
  registerScene('level', level);
  registerScene('lantern', lantern);
  registerScene('finale', finale);

  // 先決定在哪個年齡檔，store 的所有 getter 才知道要回哪一份進度。
  // ?profile=age4|age6 是開發捷徑，正常走的是上次她自己選的那個。
  const forced = new URLSearchParams(location.search).get('profile');
  app.profile = setActiveProfile(forced || store.profileId);
  store.setProfile(app.profile.id);

  app.run = { lit: new Set(), skill: newSkill(), seed: (Math.random() * 1e6) | 0 };

  initAudio();
  let loaded = 0, total = 0;
  await loadVoices((p, d, t) => {
    fill.style.width = (p * 100).toFixed(0) + '%';
    loaded = d; total = t;
    status(`載入聲音 ${d}／${t}`);
  });
  fill.style.width = '100%';

  // 等一次真的觸碰：瀏覽器規定，也剛好是遊戲的第一個動作
  loader.classList.add('ready');
  const prompt = document.createElement('div');
  prompt.className = 'loader-tap';
  prompt.innerHTML = `<span></span>`;
  loader.appendChild(prompt);
  status(loaded < total ? `點一下提燈開始（聲音 ${loaded}／${total}）` : '點一下提燈開始');

  // 開發用捷徑：?go=marsh|cove|grove|cliff|light|map|lantern|finale 直接跳場景
  const jump = new URLSearchParams(location.search).get('go');

  let started = false;
  const start = async () => {
    if (started) return;
    started = true;
    status('開燈中…');
    // 解鎖音訊「盡量做」，但絕不擋路：
    // iOS Safari 的 AudioContext.resume() 偶爾不會 resolve，等下去就是永遠停在這一頁。
    try {
      await Promise.race([unlockAudio(), new Promise(r => setTimeout(r, 1500))]);
    } catch { /* 沒聲音也要能玩 */ }
    try { chime(880, { gain: .4, decay: 2.0 }); sparkle({ n: 4 }); } catch {}

    loader.classList.add('gone');
    setTimeout(() => loader.remove(), 800);

    try {
      app.run.lit = new Set(new URLSearchParams(location.search).get('lit')?.split(',').filter(Boolean) || []);
      // 有兩座島可以去的時候才問她想去哪；只有一座就別多按一下。
      if (!jump) await go(hasChoice() ? 'agepick' : 'title');
      else if (['agepick', 'map', 'lantern', 'finale', 'title'].includes(jump)) await go(jump);
      else await go(app.profile.levelScene, { areaKey: jump });
    } catch (e) { fail(e); }
  };
  // pointerdown 為主，click / touchend 兜底：舊 WebView 與少數瀏覽器不一定送 pointer events
  ['pointerdown', 'click', 'touchend'].forEach(ev => loader.addEventListener(ev, start, { passive: true }));
  loader.style.cursor = 'pointer';
}

/** 載入畫面上的一行狀態字。卡住的時候，手機上看得到卡在哪一步。 */
function status(text) {
  let s = document.getElementById('loaderStatus');
  if (!s) {
    s = document.createElement('div');
    s.id = 'loaderStatus';
    s.className = 'loader-status';
    loader.appendChild(s);
  }
  s.textContent = text;
}

function fail(e) {
  console.error(e);
  loader?.classList.remove('gone');
  loader.innerHTML = `<div class="loader-title">咦？出了一點小狀況</div>
    <div class="loader-status" style="max-width:80vw">${String(e && (e.message || e))}</div>`;
}

window.__glow = app;   // 除錯／自動化走查用的把手

// 任何沒接住的錯誤都要看得見——手機上沒有 console 可以開
window.addEventListener('error', e => fail(e.error || e.message));
window.addEventListener('unhandledrejection', e => fail(e.reason));

boot().catch(fail);

// 切到背景就閉嘴（小朋友常常按到 home，回來不該接著講一半的話）；
// 回到前景要把 AudioContext 叫醒，否則 iOS 會讓它一直停在 suspended。
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopVoice();
  else audioCtx()?.resume?.().catch(() => {});
});
