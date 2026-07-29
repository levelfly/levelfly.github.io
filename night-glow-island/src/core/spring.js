// 彈簧物理：所有「有重量、有彈性」的動作都走這裡。
// 半隱式歐拉，固定子步長，數值穩定；stiffness/damping 直接照物理直覺調。

export class Spring {
  constructor(value = 0, { stiffness = 180, damping = 16, mass = 1 } = {}) {
    this.value = value; this.target = value; this.vel = 0;
    this.k = stiffness; this.d = damping; this.m = mass;
    this.settled = true;
  }
  set(v) { this.value = this.target = v; this.vel = 0; this.settled = true; return this; }
  to(v) { this.target = v; this.settled = false; return this; }
  /** 給它一腳（衝量），做「被戳一下」的手感 */
  kick(v) { this.vel += v; this.settled = false; return this; }
  step(dt) {
    if (this.settled) return this.value;
    const steps = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const f = -this.k * (this.value - this.target) - this.d * this.vel;
      this.vel += (f / this.m) * h;
      this.value += this.vel * h;
    }
    if (Math.abs(this.vel) < 0.0015 && Math.abs(this.value - this.target) < 0.0015) {
      this.value = this.target; this.vel = 0; this.settled = true;
    }
    return this.value;
  }
}

/** 常用手感預設 */
export const FEEL = {
  soft:   { stiffness: 90,  damping: 14 },
  bouncy: { stiffness: 260, damping: 12 },
  snappy: { stiffness: 420, damping: 26 },
  jelly:  { stiffness: 340, damping: 9  },
  heavy:  { stiffness: 120, damping: 20, mass: 1.6 },
};

/* ── 補間曲線（給不需要物理的過場用） ── */
export const ease = {
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic:  t => t * t * t,
  inOut:    t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack:  t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2),
  outElastic: t => t === 0 || t === 1 ? t
    : Math.pow(2, -9 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1,
};
