// Full-viewport digital rain (Canvas 2D) that lives behind the whole site.
// Glyphs are pre-rendered into a sprite atlas per depth tier, so a dense screen costs
// drawImage calls rather than text layout. During the opening, falling streaks sweep
// over the name and leave its outline traced in locked glyphs.

const POOL =
  '0101010101010101' + '0123456789ABCDEF0123456789ABCDEF' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ' + 'λσθ∇∑∂∫≈Δπμ'
const N = POOL.length
const rnd = () => (Math.random() * N) | 0
export const glyph = () => POOL[rnd()]

const LEVELS = 10 // 0..8 green ramp, 9 = white-hot head
const levelColor = (l: number) => {
  if (l === LEVELS - 1) return '#eafff1'
  const t = l / (LEVELS - 2)
  return `rgb(${Math.round(t * 70)},${Math.round(95 + t * 160)},${Math.round(48 + t * 85)})`
}

interface Tier { size: number; speed: [number, number]; alpha: number; trail: [number, number]; pitch: number }
// far → near
const TIERS: Tier[] = [
  { size: 11, speed: [50, 90], alpha: 0.38, trail: [14, 26], pitch: 1.15 },
  { size: 14, speed: [90, 160], alpha: 0.66, trail: [14, 30], pitch: 1.5 },
  { size: 19, speed: [160, 260], alpha: 1, trail: [10, 24], pitch: 2.6 },
]
const MAX_TRAIL = 32

interface Column {
  x: number; head: number; prev: number; speed: number; trail: number; step: number; carry: number
  g: Uint8Array; o: number; tier: number
  /** >0 while the column is "pouring" for the hero reveal: falls fast, bright */
  pour: number
}


/** ms; scaled by `pace`. The rain eases back while the hero typography is being constructed. */
const T = { dimFrom: 900, dimTo: 3600 }

export interface MatrixOptions { mobile: boolean; reduced: boolean; pace: number }

export class MatrixEngine {
  private ctx: CanvasRenderingContext2D
  private w = 0
  private h = 0
  private dpr = 1
  private cols: Column[] = []
  private atlases: { canvas: HTMLCanvasElement; cell: number }[] = []
  private raf = 0
  private running = false
  private t0 = 0
  private last = 0
  private elapsed = 0
  private frameNo = 0
  private scrollK = 0
  /** smoothed scroll speed (px/frame); stretches the rain into streaks */
  private warp = 0
  private pulseV = 0
  private pointer = { x: -1e4, active: false }

  constructor(private canvas: HTMLCanvasElement, private opts: MatrixOptions) {
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('2D canvas unavailable')
    this.ctx = ctx
    this.resize()
  }

  private ms(k: keyof typeof T) { return T[k] * this.opts.pace }
  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, this.opts.mobile ? 1.5 : 2)
    this.w = window.innerWidth
    this.h = window.innerHeight
    this.canvas.width = Math.round(this.w * this.dpr)
    this.canvas.height = Math.round(this.h * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.buildAtlases()
    this.buildColumns()
    if (!this.running) this.draw()
  }

  /** Call again once web fonts are ready so the sprites use the real typeface. */
  buildAtlases() {
    this.atlases = TIERS.map((tier) => {
      const cell = Math.ceil(tier.size * 1.3)
      const px = Math.ceil(cell * this.dpr)
      const c = document.createElement('canvas')
      c.width = px * N
      c.height = px * LEVELS
      const a = c.getContext('2d')!
      a.font = `${tier.size * this.dpr}px "JetBrains Mono Variable", ui-monospace, monospace`
      a.textAlign = 'center'
      a.textBaseline = 'middle'
      for (let l = 0; l < LEVELS; l++) {
        a.fillStyle = levelColor(l)
        if (l === LEVELS - 1) { a.shadowColor = '#6dffa8'; a.shadowBlur = 6 * this.dpr }
        for (let i = 0; i < N; i++) a.fillText(POOL[i], px * i + px / 2, px * l + px / 2)
      }
      return { canvas: c, cell }
    })
  }

  private spawn(c: Column, scatter: boolean) {
    const tier = TIERS[c.tier]
    c.trail = Math.round(tier.trail[0] + Math.random() * (tier.trail[1] - tier.trail[0]))
    c.speed = tier.speed[0] + Math.random() * (tier.speed[1] - tier.speed[0])
    c.head = scatter ? Math.random() * (this.h + c.trail * c.step) : -Math.random() * this.h * 0.35
    c.prev = c.head
    c.pour = 0
  }

  forEachHead(fn: (x: number, prev: number, head: number, size: number) => void) {
    for (const c of this.cols) fn(c.x, c.prev, c.head, TIERS[c.tier].size)
  }

  /**
   * Send a downpour through a band of the screen: every column over [x0, x1] restarts just above
   * `top`, staggered, and falls fast until it leaves the screen.
   */
  pour(x0: number, x1: number, top: number, stagger: number) {
    for (const c of this.cols) {
      if (c.x < x0 - 20 || c.x > x1 + 20) continue
      c.head = top - 20 - Math.random() * stagger
      c.prev = c.head
      c.pour = 1
      c.speed = Math.max(c.speed, 300 + Math.random() * 260)
      c.trail = Math.max(c.trail, 18)
    }
  }

  private buildColumns() {
    const density = this.opts.mobile ? 0.7 : 1
    this.cols = []
    TIERS.forEach((tier, ti) => {
      const pitch = (tier.size * tier.pitch) / density
      for (let x = pitch / 2; x < this.w + pitch / 2; x += pitch) {
        const g = new Uint8Array(MAX_TRAIL)
        for (let i = 0; i < MAX_TRAIL; i++) g[i] = rnd()
        const c: Column = { x: x + (Math.random() - 0.5) * pitch * 0.3, head: 0, prev: 0, speed: 0, trail: 0, step: tier.size * 1.1, carry: 0, g, o: 0, tier: ti, pour: 0 }
        this.spawn(c, true)
        this.cols.push(c)
      }
    })
  }

  setScroll(k: number) { this.scrollK = Math.min(1, Math.max(0, k)) }
  /** scroll parallax: nearer tiers slide further than far ones, giving the rain depth */
  scrollBy(dy: number) {
    if (this.opts.reduced) return
    this.warp = Math.max(this.warp, Math.min(1, Math.abs(dy) / 260))
    const f = [0.05, 0.14, 0.3]
    const d = Math.max(-400, Math.min(400, dy))
    for (const c of this.cols) c.head -= d * f[c.tier]
  }
  /** brief surge of brightness and speed, used when the visitor crosses into a new section */
  pulse() { this.pulseV = 1 }
  setPointer(x: number | null) { this.pointer.active = x !== null; if (x !== null) this.pointer.x = x }

  /** restart the opening timeline: full wall of rain, then ease back (used when the cold open ends) */
  restart() {
    this.t0 = performance.now()
    this.elapsed = 0
  }

  /** skip the opening: jump straight to the settled brightness */
  complete() {
    const target = this.ms('dimTo') + 1
    if (this.elapsed < target) { this.t0 -= target - this.elapsed; this.elapsed = target }
  }

  start() {
    if (this.running) return
    if (this.opts.reduced) {
      this.elapsed = this.ms('dimTo') + 1
      for (let i = 0; i < 60; i++) this.update(1 / 30)
      this.draw()
      return
    }
    this.running = true
    const now = performance.now()
    this.t0 = this.t0 ? now - this.elapsed : now
    this.last = now
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() { this.running = false; cancelAnimationFrame(this.raf) }

  private frame = (now: number) => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.frame)
    // once it is pure background (past the hero, no surge), half the frame rate is plenty
    if (this.scrollK >= 1 && this.pulseV < 0.02 && this.warp < 0.02 && this.frameNo++ % 2) return
    const dt = Math.min(0.066, (now - this.last) / 1000)
    this.last = now
    this.elapsed = now - this.t0
    this.pulseV *= Math.exp(-dt * 2.6)
    this.warp *= Math.exp(-dt * 4.5)
    this.update(dt)
    this.draw()
  }

  private update(dt: number) {
    const boost = 1 + this.pulseV * 1.6
    for (const c of this.cols) {
      let speed = c.speed * boost
      if (this.pointer.active && Math.abs(c.x - this.pointer.x) < 110) speed *= 1.45
      const move = speed * dt
      c.prev = c.head
      c.head += move
      c.carry += move
      while (c.carry >= c.step) {
        c.carry -= c.step
        c.o = (c.o + MAX_TRAIL - 1) % MAX_TRAIL
        c.g[c.o] = rnd()
      }
      if (Math.random() < 0.06) c.g[(Math.random() * MAX_TRAIL) | 0] = rnd()
      if (c.head - c.trail * c.step > this.h) this.spawn(c, false)
    }
  }

  private brightness(): number {
    // full wall of rain → eases back once the name has formed → recedes further behind content
    const a = this.ms('dimFrom')
    const k = Math.min(1, Math.max(0, (this.elapsed - a) / (this.ms('dimTo') - a)))
    const hero = 1 - k * (this.opts.mobile ? 0.62 : 0.58)
    const rest = this.opts.reduced ? 0.22 : 0.34
    return Math.min(1, hero + (rest - hero) * this.scrollK + this.pulseV * 0.45)
  }

  private draw() {
    const { ctx, w, h } = this
    ctx.globalAlpha = 1
    ctx.fillStyle = '#020403'
    ctx.fillRect(0, 0, w, h)
    const dim = this.brightness()
    for (const c of this.cols) {
      const at = this.atlases[c.tier]
      const cell = at.cell
      const px = at.canvas.width / N
      const near = this.pointer.active ? Math.max(0, 1 - Math.abs(c.x - this.pointer.x) / 110) : 0
      ctx.globalAlpha = c.pour ? Math.max(0.75, TIERS[c.tier].alpha) : Math.min(1, TIERS[c.tier].alpha * dim * (1 + near * 0.6))
      const x = c.x - cell / 2
      // warp: glyph spacing stretches with scroll speed (near tiers stretch most)
      const stretch = 1 + this.warp * (0.6 + c.tier * 0.9)
      if (this.warp > 0.02) ctx.globalAlpha = Math.min(1, ctx.globalAlpha * (1 + this.warp * 0.8))
      for (let i = 0; i < c.trail; i++) {
        const y = c.head - i * c.step * stretch
        if (y < -cell || y > h + cell) continue
        const level = i === 0 ? LEVELS - 1 : Math.round(Math.pow(1 - i / c.trail, 1.5) * (LEVELS - 2))
        ctx.drawImage(at.canvas, c.g[(c.o + i) % MAX_TRAIL] * px, level * px, px, px, x, y - cell / 2, cell, cell)
      }
    }
    ctx.globalAlpha = 1
  }
}
