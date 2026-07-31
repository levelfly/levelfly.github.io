// 晨風群島的五座島。
//
// 跟夜光島的五個地點對照著看，差別不在難度而在動詞：
// 那邊每個地方都在問「這是幾」，這裡每座島問的是「這些光要怎麼分」。
//
// 每座島綁一種數學骨架（見 skill）。真正出什麼題由教學導演決定（階段 4），
// 這裡只講「這座島是什麼、長在哪、什麼顏色」。
//
// chart 是航線圖上的位置。它們排成一條由低往高的航道 ——
// 從花園出發，最後爬到晨鐘塔。風每晚只夠吹幾段，所以走哪幾座是她選的。

export const SKYISLES = [
  {
    key: 'garden', name: '雲上花園', voice: 'sky_garden',
    tint: '#8FDCB4', motif: 'petal',
    skill: 'bond',        // 10 的合成分解：8 可以是 5+3、6+2、4+4
    questions: 5,
    lampAt: { x: .18, y: .74 },
  },
  {
    key: 'mill', name: '風車島', voice: 'sky_mill',
    tint: '#FFD9A8', motif: 'seed',
    skill: 'inverse',     // 加減互逆：拿走多少、剩下多少
    questions: 5,
    lampAt: { x: .44, y: .60 },
  },
  {
    key: 'falls', name: '水瀑島', voice: 'sky_falls',
    tint: '#BEE9F5', motif: 'drop',
    skill: 'diff',        // 比較與差量：多幾個、少幾個
    questions: 5,
    lampAt: { x: .74, y: .68 },
  },
  {
    key: 'market', name: '晨風市集', voice: 'sky_market',
    tint: '#FFE9A8', motif: 'coin',
    skill: 'coin',        // 1／5／10 的換算（對到一年級課綱的錢幣單元）
    questions: 5,
    lampAt: { x: .68, y: .40 },
  },
  {
    key: 'beacon', name: '晨鐘塔', voice: 'sky_beacon',
    tint: '#FFF3D6', motif: 'bell',
    skill: 'makeTen',     // 湊十與十幾＝10＋幾
    questions: 6,
    lampAt: { x: .34, y: .22 },
    final: true,
  },
];

export const skyIsleByKey = k => SKYISLES.find(a => a.key === k);

/** 航線：哪兩座島之間有雲橋。順序也決定了地圖上那條航道怎麼畫。 */
export const SKYROUTE = [
  ['garden', 'mill'],
  ['mill', 'falls'],
  ['falls', 'market'],
  ['market', 'beacon'],
  ['mill', 'beacon'],     // 一條抄捷徑的橋，讓航線不是一條直線
];
