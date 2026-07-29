// 視覺語言的地基：撕紙邊、紙纖維、光暈、水彩暈染。
//
// 整個遊戲沒有一張外部圖片。所有畫面都是這裡定義的濾鏡 + 程序化路徑畫出來的，
// 所以任何形狀都能動、能撕、能發光，而且直橫向重新構圖不會變形。

export const PAL = {
  night: '#0B1026', night2: '#16203F', deep: '#06091A',
  teal: '#0E2B2B', teal2: '#14413C', violet: '#241B4A',
  amber: '#FFC46B', honey: '#FFE3A3', mint: '#6FE3C4',
  coral: '#FF8B7A', cream: '#FDF6E3', sand: '#E8C89A',
  bark: '#3A2A38', moss: '#1C3B33', rock: '#2A2F52',
};

export const SVGNS = 'http://www.w3.org/2000/svg';
export const el = (tag, attrs = {}, parent = null) => {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) {
    if (k === 'text') n.textContent = attrs[k];
    else n.setAttribute(k, attrs[k]);
  }
  parent?.appendChild(n);
  return n;
};

let injected = false;

/** 一次把所有共用 <defs> 塞進文件（濾鏡是全域的，各 SVG 都能用 url(#id) 引用） */
export function injectPaperDefs() {
  if (injected) return;
  injected = true;

  const svg = el('svg', {
    width: 0, height: 0, 'aria-hidden': 'true',
    style: 'position:absolute;width:0;height:0;overflow:hidden',
  });
  const defs = el('defs', {}, svg);

  // ── 撕紙邊：三種粗細，越大的形狀用越粗的撕邊 ──
  [['torn-s', 0.042, 3.2, 1], ['torn-m', 0.021, 5.5, 2], ['torn-l', 0.011, 11, 3]]
    .forEach(([id, freq, scale, oct]) => {
      const f = el('filter', { id, x: '-12%', y: '-12%', width: '124%', height: '124%' }, defs);
      el('feTurbulence', {
        type: 'fractalNoise', baseFrequency: freq, numOctaves: oct,
        seed: id.length * 7, result: 'n',
      }, f);
      el('feDisplacementMap', {
        in: 'SourceGraphic', in2: 'n', scale, xChannelSelector: 'R', yChannelSelector: 'G',
      }, f);
    });

  // ── 紙纖維：疊在色塊上，讓平塗有材質 ──
  const fib = el('filter', { id: 'fiber', x: '0%', y: '0%', width: '100%', height: '100%' }, defs);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: 4, seed: 11, result: 'f' }, fib);
  el('feColorMatrix', { in: 'f', type: 'saturate', values: '0', result: 'g' }, fib);
  const ct = el('feComponentTransfer', { in: 'g', result: 'a' }, fib);
  el('feFuncA', { type: 'linear', slope: '0.20', intercept: '0' }, ct);
  el('feComposite', { in: 'a', in2: 'SourceGraphic', operator: 'in' }, fib);

  // ── 柔光暈：發光體都掛這個 ──
  [['glow-s', 2.2], ['glow-m', 5], ['glow-l', 11], ['glow-xl', 22]].forEach(([id, dev]) => {
    const f = el('filter', { id, x: '-160%', y: '-160%', width: '420%', height: '420%' }, defs);
    el('feGaussianBlur', { stdDeviation: dev, result: 'b' }, f);
    const m = el('feMerge', {}, f);
    el('feMergeNode', { in: 'b' }, m);
    el('feMergeNode', { in: 'b' }, m);
    el('feMergeNode', { in: 'SourceGraphic' }, m);
  });

  // ── 水彩暈染（給果實、貝殼內裡） ──
  const wc = el('filter', { id: 'wash', x: '-25%', y: '-25%', width: '150%', height: '150%' }, defs);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.05 0.08', numOctaves: 3, seed: 5, result: 'w' }, wc);
  el('feDisplacementMap', { in: 'SourceGraphic', in2: 'w', scale: 6, xChannelSelector: 'R', yChannelSelector: 'B' }, wc);
  el('feGaussianBlur', { stdDeviation: 0.7 }, wc);

  // ── 通用漸層 ──
  const rg = (id, stops, cx = '50%', cy = '50%', r = '50%') => {
    const g = el('radialGradient', { id, cx, cy, r }, defs);
    stops.forEach(([o, c, a = 1]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g));
  };
  rg('g-warm', [['0%', PAL.cream, 1], ['35%', PAL.honey, .85], ['70%', PAL.amber, .35], ['100%', PAL.amber, 0]]);
  rg('g-mint', [['0%', '#EAFFF7', 1], ['38%', PAL.mint, .8], ['100%', PAL.mint, 0]]);
  rg('g-coral', [['0%', '#FFE7DF', 1], ['40%', PAL.coral, .8], ['100%', PAL.coral, 0]]);

  document.body.appendChild(svg);
}

/** 產生一段「手撕」的水平邊界路徑（用於地面、水面、雲層） */
export function tornEdge(x0, x1, y, amp = 8, step = 26, rnd = Math.random) {
  const pts = [];
  for (let x = x0; x <= x1; x += step) {
    pts.push([x, y + (rnd() - 0.5) * amp * 2 + Math.sin(x * 0.013) * amp * 0.6]);
  }
  pts.push([x1, y]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i];
    d += ` Q${px + (cx - px) * .5},${py} ${cx},${cy}`;
  }
  return d;
}

/** 有機的圓形（雲、樹冠、石頭）：由 n 個控制點推出的封閉曲線 */
export function blob(cx, cy, r, { n = 9, wob = 0.22, squash = 1, rnd = Math.random, rot = 0 } = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const rr = r * (1 - wob / 2 + rnd() * wob);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squash]);
  }
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (i === 0) d += `M${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)}`
       + ` ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)}`
       + ` ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

/** 在色塊上疊一層更亮的「紙的受光面」，立刻有厚度 */
export function paperLayer(parent, d, fill, { lit = null, litOp = .22, filter = 'torn-m', shadow = true } = {}) {
  const g = el('g', {}, parent);
  if (shadow) el('path', { d, fill: '#04060F', opacity: .38, transform: 'translate(0,4)', filter: `url(#${filter})` }, g);
  el('path', { d, fill, filter: `url(#${filter})` }, g);
  if (lit) el('path', { d, fill: lit, opacity: litOp, filter: `url(#${filter})`, transform: 'translate(0,-3)', style: 'mix-blend-mode:screen' }, g);
  return g;
}

/** 給 body 用的紙紋 data-uri（CSS 疊在整個舞台上） */
export function grainDataUrl(size = 180) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const img = x.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + (Math.random() - .5) * 74;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 26;
  }
  x.putImageData(img, 0, 0);
  return `url(${c.toDataURL()})`;
}
