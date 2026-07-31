// 分光關卡 —— 晨風群島的核心玩法。
//
// 目前是施工中的佔位場景。真正的玩法（把 N 顆光拖成幾群送出去，
// 8 可以是 5+3 也可以是 4+4，每發現一種新拆法就記進配方圖鑑）在階段 4 才進來。
//
// 為什麼先放一個空殼而不是等做完再接上：
// 航線圖已經可以點了，沒有這個場景就是點下去一片空白、小孩沒有路回去。
// 一個看得懂、會自己走回航線圖的畫面，比一個 TypeError 誠實得多。

import { app, setScenery, placeLumi, hudMode, go, A, paperCard, mapScene } from '../game.js';
import { areaByKey } from '../profiles.js';
import { setAmbientMotes } from '../art/particles.js';
import { stage } from '../core/stage.js';

let timer = 0;

export const repair = {
  async enter({ areaKey }) {
    const area = areaByKey(areaKey);
    setScenery(area?.key || 'garden');
    setAmbientMotes(.5, area?.tint || '#FFE9A8');
    hudMode('level');
    placeLumi(stage.portrait ? { x: .16, y: 1.00, s: .78 } : { x: .10, y: .99, s: .84 });
    app.lumi.setLantern(0.3);

    paperCard(app.layers.overlay,
      `<div class="pc-line">${area?.name || '這座島'}</div>
       <div class="pc-sub">還在蓋，我們先回航線上</div>`,
      { dur: 3.2 });
    A.say(area?.voice || 'sky_pick');
    app.lumi.tilt();

    clearTimeout(timer);
    timer = setTimeout(() => go(mapScene()), 3400);
  },

  onResize() {
    placeLumi(stage.portrait ? { x: .16, y: 1.00, s: .78 } : { x: .10, y: .99, s: .84 });
  },

  exit() { clearTimeout(timer); timer = 0; },
};
