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

export const PROFILES = {
  age4: {
    id: 'age4',
    label: '小小找光',
    islandName: '夜光島',
    sub: '嚕米的數字冒險',
    ready: true,
    areas: GLOWISLE_AREAS,
    levelScene: 'level',
    titleScenery: 'title',
    mapScenery: 'map',
  },

  age6: {
    id: 'age6',
    label: '島嶼修復師',
    islandName: '晨風群島',
    sub: '把光分回去',
    // 階段 3～5 才會把這座島蓋起來。ready 是假的時候，兩扇門的畫面不會出現，
    // 開場流程跟以前一模一樣 —— 不做「按了沒反應」的門。
    ready: false,
    areas: [],
    levelScene: 'repair',
    titleScenery: 'skytitle',
    mapScenery: 'skymap',
  },
};

let active = PROFILES.age4;

/** 有沒有第二個檔可以選（age6 蓋好之前，整個選擇流程都不存在） */
export const hasChoice = () => Object.values(PROFILES).filter(p => p.ready).length > 1;

export const activeProfile = () => active;
export function setActiveProfile(id) {
  active = (PROFILES[id] && PROFILES[id].ready) ? PROFILES[id] : PROFILES.age4;
  return active;
}

/** 當前檔的地點清單。場景不該知道地點是從哪個檔來的。 */
export const areas = () => active.areas;
export const areaByKey = k => active.areas.find(a => a.key === k);
