// 一晚的航程。
//
// 這是「roguelike 風格」實際長成的樣子 —— 而重點在**風格**兩個字：
// 真 roguelike 的高懲罰、資訊不完整、隨機難度峰值全部不要，那會直接毀掉精熟學習路徑。
//
// 所以隨機性被關進籠子：
//   教學導演  決定今晚練什麼骨架、練到第幾層（見 director.js）
//   這裡      決定在哪座島、路上遇到什麼、寶箱裡是什麼
//   她        決定往哪邊走、怎麼拆、帶哪個道具
//
// 🔴 run 的結束是**風停了**，不是死亡。一晚 5～7 段風，吹完就收帆回家，
// 天色同步慢慢轉亮 —— 那是可預期、可視覺化的進度提示（降焦慮），
// 不是突然逼近的倒數計時（誘發數學焦慮）。**答錯不吹走風。**

import { SKYISLES, SKYROUTE } from './skyworld.js';
import { planNight, SKILLS } from './director.js';

const BEACON = 'beacon';
const pick = (a, rand) => a[Math.floor(rand() * a.length)];

/** 節點種類。分光是主菜，其他三種是讓一晚有呼吸的節奏。 */
export const NODE = {
  repair: { label: '有光要分', voice: 'sky_node_repair' },
  chest:  { label: '好像有東西', voice: 'sky_chest' },
  spirit: { label: '有誰在那裡', voice: 'sky_node_spirit' },
  rest:   { label: '停下來看看', voice: 'sky_rest' },
};

export function newVoyage(store, rand = Math.random) {
  return {
    plan: planNight(store, rand),
    segs: 5 + Math.floor(rand() * 3),     // 5～7 段風
    done: 0,
    here: null,
    options: [],
    visited: [],
    log: [],           // 給島嶼日記用：這一晚實際發生了什麼
    recipes: 0,        // 今晚發現了幾種新拆法
    gotTools: [],
    gotSpirit: null,
  };
}

/** 天色：0 還很早、1 天亮了。這是進度條，跟對錯無關。 */
export const dawnProgress = v => (v ? Math.min(1, v.done / v.segs) : 0);

/** 這是不是最後一段風 */
export const isLastLeg = v => v.done >= v.segs - 1;

/**
 * 這一段風可以往哪吹。
 *
 * 一次只給兩個選項（玩過三晚以上才給第三個）。大圖示、不藏資訊、不做代價陷阱 ——
 * 6 歲不需要懂機會成本，她選的是偏好，不是最佳化。
 */
export function rollOptions(v, store, rand = Math.random) {
  // 最後一段永遠是晨鐘塔：一晚要有一個看得見的頂點，鐘一敲天就亮了。
  if (isLastLeg(v)) {
    v.options = [{ key: BEACON, type: 'repair', final: true }];
    return v.options;
  }

  const n = store.nights >= 3 ? 3 : 2;
  const near = neighbours(v.here).filter(k => k !== BEACON);
  const others = SKYISLES.map(a => a.key).filter(k => k !== BEACON && k !== v.here && !near.includes(k));
  const keys = [];
  const take = arr => { while (arr.length && keys.length < n) keys.push(arr.splice(Math.floor(rand() * arr.length), 1)[0]); };

  // 今晚的焦點骨架所在的島優先出現一次 —— 但只是「比較容易遇到」，不是強迫。
  const focusIsle = SKILLS[v.plan.focus]?.isle;
  if (focusIsle && focusIsle !== BEACON && focusIsle !== v.here && rand() < .7) keys.push(focusIsle);
  take(near.filter(k => !keys.includes(k)));
  take(others.filter(k => !keys.includes(k)));

  const types = rollTypes(keys.length, v, rand);
  v.options = keys.map((key, i) => ({ key, type: types[i] }));
  return v.options;
}

/** 至少一個是分光；休息不連著出現；第一段一定是分光（先玩到東西再說）。 */
function rollTypes(n, v, rand) {
  if (v.done === 0) return Array.from({ length: n }, (_, i) => (i === 0 ? 'repair' : rand() < .5 ? 'chest' : 'repair'));
  const lastType = v.log[v.log.length - 1]?.type;
  const bag = ['repair', 'repair', 'repair', 'chest', 'spirit', 'rest'];
  const out = [];
  for (let i = 0; i < n; i++) {
    let t = pick(bag, rand);
    if (t === 'rest' && (lastType === 'rest' || out.includes('rest'))) t = 'repair';
    if (t === 'spirit' && out.includes('spirit')) t = 'chest';
    out.push(t);
  }
  if (!out.includes('repair')) out[Math.floor(rand() * out.length)] = 'repair';
  return out;
}

function neighbours(key) {
  if (!key) return ['garden', 'mill'];       // 出發點：最低的兩座島
  const out = [];
  SKYROUTE.forEach(([a, b]) => {
    if (a === key && !out.includes(b)) out.push(b);
    if (b === key && !out.includes(a)) out.push(a);
  });
  return out;
}

/** 風吹過去了。回傳的是「這一段之後還有沒有風」。 */
export function advance(v, choice) {
  v.done++;
  v.here = choice.key;
  if (!v.visited.includes(choice.key)) v.visited.push(choice.key);
  v.log.push({ key: choice.key, type: choice.type });
  return v.done < v.segs;
}

/** 這一晚的日記頁（給爸媽看的那一頁，不是成績單） */
export function diaryPage(v, store) {
  return {
    isles: v.log.map(l => l.key),
    types: v.log.map(l => l.type),
    recipes: v.recipes,
    tools: v.gotTools.slice(),
    spirit: v.gotSpirit,
    focus: v.plan.focus,
    total: store.recipeCount(),
  };
}
