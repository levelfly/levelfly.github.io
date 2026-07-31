// 兩個年齡檔。
//
// 同一顆引擎（舞台、彈簧、粒子、程序生成美術、語音），兩套完全不同的島與玩法：
//
//   age4  小小找光      夜光島。聽數字找數字、數數量選數字。認得出來就好。
//   age6  島嶼修復師    晨風群島。把光分成幾群送出去，同一個 8 可以是 5+3 也可以是 4+4。
//
// 分開的理由不是「難度調高」——6 歲玩的是另一種動詞。4 歲在「認」，6 歲在「分配」。
//
// 這一層只講「哪個檔用哪座島、哪個關卡場景」。出題規則各自住在自己的 data/ 檔裡。

import { AREAS as GLOWISLE_AREAS } from './data/world.js';
import { SKYISLES } from './data/skyworld.js';

export const PROFILES = {
  age4: {
    id: 'age4',
    label: '小小找光',
    islandName: '夜光島',
    sub: '嚕米的數字冒險',
    ready: true,
    areas: GLOWISLE_AREAS,
    levelScene: 'level',
    mapScene: 'map',
    nestScene: 'lantern',
    intro: ['intro1', 'intro2'],
    titleScenery: 'title',
    mapScenery: 'map',
  },

  age6: {
    id: 'age6',
    label: '島嶼修復師',
    islandName: '晨風群島',
    sub: '把光分回去',
    // 玩法（分光）、航程（風與天色）、meta 層（配方／光靈／日記）都做完了才翻成 true。
    // 在那之前 ready 是假的：兩扇門的畫面不會出現，開場流程跟以前一模一樣 ——
    // 不做「按了沒反應」的門。
    ready: true,
    areas: SKYISLES,
    levelScene: 'repair',
    mapScene: 'skymap',
    nestScene: 'nest',
    intro: ['sky_intro1', 'sky_intro2'],
    titleScenery: 'skytitle',
    mapScenery: 'skymap',
  },
};

let active = PROFILES.age4;

/** 有沒有第二個檔可以選（age6 蓋好之前，整個選擇流程都不存在） */
export const hasChoice = () => Object.values(PROFILES).filter(p => p.ready).length > 1;

export const activeProfile = () => active;

/**
 * 切到某個檔。
 * @param force 開發用：允許進還沒 ready 的檔（`?profile=age6`）。
 *              正式流程一律不 force —— 沒蓋好的島不該從遊戲裡走得進去。
 */
export function setActiveProfile(id, force = false) {
  const p = PROFILES[id];
  active = (p && (p.ready || force)) ? p : PROFILES.age4;
  return active;
}

/** 當前檔的地點清單。場景不該知道地點是從哪個檔來的。 */
export const areas = () => active.areas;
export const areaByKey = k => active.areas.find(a => a.key === k);
