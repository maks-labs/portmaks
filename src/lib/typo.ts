// Hero typography engine — the background rain reveals the text.
//
// The name and intro copy start invisible. When the cold open ends, the rain "pours" through the
// hero; every rain column (in the page-wide MatrixEngine) is watched, and wherever a falling head
// passes over a letter, that part of the letter lights up and stays lit:
//   • the name is rasterised into glyph cells; a head crossing a cell flashes it white, then it
//     settles into green code (edges bright, interiors dim);
//   • each character of the intro copy switches on as a head passes over it.
// Once most of the name has been lit, its contour fades in so the shape reads crisply. When the
// reveal completes, the code texture dissolves away and hands over to the solid DOM lettering.
import { glyph } from './matrix'

export interface LineSpec { text: string; left: number; baseline: number; font: string; fontPx: number; letterSpacing: number; color: string; dim: string }
export interface CharTarget { el: HTMLElement; x: number; y: number; group: number }
/** iterate the live rain columns, in viewport coordinates */
export type RainSource = (fn: (x: number, prev: number, head: number, size: number) => void) => void

interface Loop { pts: Float32Array; cum: Float32Array; len: number; line: number }
interface Cell { x: number; y: number; line: number; edge: boolean }

/** Rasterise the lines and walk the pixel boundary into smoothed closed loops. */
function extract(lines: LineSpec[], w: number, h: number, sc: number) {
  const W = Math.ceil(w * sc)
  const H = Math.ceil(h * sc)
  const off = document.createElement('canvas')
  off.width = W
  off.height = H
  const o = off.getContext('2d', { willReadFrequently: true })!
  o.scale(sc, sc)
  o.fillStyle = '#fff'
  o.textBaseline = 'alphabetic'
  for (const l of lines) {
    o.font = l.font
    if ('letterSpacing' in o) (o as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${l.letterSpacing}px`
    o.fillText(l.text, l.left, l.baseline)
  }
  const data = o.getImageData(0, 0, W, H).data
  const g = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) g[i] = data[i * 4 + 3] > 127 ? 1 : 0
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : g[y * W + x])

  const VW = W + 1
  const next = new Map<number, number[]>()
  const add = (a: number, b: number) => { const e = next.get(a); if (e) e.push(b); else next.set(a, [b]) }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!g[y * W + x]) continue
      if (!at(x, y - 1)) add(y * VW + x, y * VW + x + 1)
      if (!at(x + 1, y)) add(y * VW + x + 1, (y + 1) * VW + x + 1)
      if (!at(x, y + 1)) add((y + 1) * VW + x + 1, (y + 1) * VW + x)
      if (!at(x - 1, y)) add((y + 1) * VW + x, y * VW + x)
    }
  }
  const split = lines.length > 1 ? lines[1].baseline - lines[1].fontPx * 0.8 : Infinity
  const loops: Loop[] = []
  for (const startKey of [...next.keys()]) {
    const first = next.get(startKey)
    if (!first || !first.length) continue
    const raw: number[] = []
    let cur = startKey
    for (let guard = 0; guard < 200000; guard++) {
      const outs = next.get(cur)
      if (!outs || !outs.length) break
      raw.push(cur)
      cur = outs.pop()!
      if (cur === startKey) break
    }
    if (raw.length < 24 * sc) continue
    const n = raw.length
    const step = Math.max(2, Math.round(2 * sc))
    const m = Math.floor(n / step)
    const pts = new Float32Array(m * 2)
    let cy = 0
    for (let i = 0; i < m; i++) {
      let sx = 0
      let sy = 0
      for (let k = -3; k <= 3; k++) { const v = raw[(i * step + k + n) % n]; sx += v % VW; sy += (v / VW) | 0 }
      pts[i * 2] = sx / 7 / sc
      pts[i * 2 + 1] = sy / 7 / sc
      cy += pts[i * 2 + 1]
    }
    const cum = new Float32Array(m + 1)
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % m
      cum[i + 1] = cum[i] + Math.hypot(pts[j * 2] - pts[i * 2], pts[j * 2 + 1] - pts[i * 2 + 1])
    }
    loops.push({ pts, cum, len: cum[m], line: cy / m < split ? 0 : 1 })
  }
  const inside = (x: number, y: number) => at(Math.round(x * sc), Math.round(y * sc)) === 1
  return { loops, inside }
}

/** indices sorted by x, for "which targets lie under this rain column" lookups */
function byX(xs: number[]) {
  const order = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b])
  return { order, keys: order.map((i) => xs[i]) }
}
function lowerBound(a: number[], v: number) {
  let lo = 0, hi = a.length
  while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < v) lo = m + 1; else hi = m }
  return lo
}

export interface TypoOptions { mobile: boolean; reduced: boolean; pace: number; onDone: () => void; rain: RainSource; pour: (x0: number, x1: number, top: number, stagger: number) => void }

export class TypoEngine {
  private ctx: CanvasRenderingContext2D
  private w = 0
  private h = 0
  private dpr = 1
  private lines: LineSpec[] = []
  private cells: Cell[] = []
  private litAt = new Float32Array(0)
  private cellIdx = { order: [] as number[], keys: [] as number[] }
  private chars: CharTarget[] = []
  private charOn: Uint8Array = new Uint8Array(0)
  private charIdx = { order: [] as number[], keys: [] as number[] }
  private litCount = 0
  private charCount = 0
  private box = { x: 0, y: 0, w: 1, h: 1 }
  private ink!: HTMLCanvasElement
  private cell = 8
  private raf = 0
  private running = false
  private t0 = 0
  private e = 0
  private revealAt = Infinity
  private outlineK = 0
  private doneFired = false
  private settleAt = Infinity
  private built = false

  constructor(private canvas: HTMLCanvasElement, private opts: TypoOptions) {
    this.ctx = canvas.getContext('2d')!
  }

  private ms(v: number) { return v * this.opts.pace }

  build(lines: LineSpec[], chars: CharTarget[], w: number, h: number) {
    const wasDone = this.doneFired
    this.w = w
    this.h = h
    this.dpr = Math.min(window.devicePixelRatio || 1, this.opts.mobile ? 1.5 : 2)
    this.canvas.width = Math.round(w * this.dpr)
    this.canvas.height = Math.round(h * this.dpr)
    this.lines = lines
    const fontPx = lines[0]?.fontPx ?? 100
    const { loops, inside } = extract(lines, w, h, fontPx < 110 ? 2 : 1)

    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const l of loops) for (let i = 0; i < l.pts.length; i += 2) {
      x0 = Math.min(x0, l.pts[i]); x1 = Math.max(x1, l.pts[i]); y0 = Math.min(y0, l.pts[i + 1]); y1 = Math.max(y1, l.pts[i + 1])
    }
    if (!loops.length) { x0 = y0 = 0; x1 = y1 = 1 }
    const pad = 16
    this.box = { x: Math.floor(x0 - pad), y: Math.floor(y0 - pad), w: Math.ceil(x1 - x0 + pad * 2), h: Math.ceil(y1 - y0 + pad * 2) }
    this.ink = document.createElement('canvas')
    this.ink.width = Math.round(this.box.w * this.dpr)
    this.ink.height = Math.round(this.box.h * this.dpr)
    const k = this.ink.getContext('2d')!
    k.setTransform(this.dpr, 0, 0, this.dpr, -this.box.x * this.dpr, -this.box.y * this.dpr)
    k.lineJoin = 'round'
    // the contour, pre-rendered once (glow + crisp line); revealed at the end of the downpour
    for (const [lw, a] of [[9, 0.1], [4, 0.2], [this.opts.mobile ? 1.2 : 1.6, 1]] as const) {
      k.lineWidth = lw
      k.globalAlpha = a
      for (const l of loops) {
        k.strokeStyle = lines[l.line]?.color ?? '#00ff66'
        k.beginPath()
        for (let i = 0; i < l.pts.length; i += 2) (i ? k.lineTo : k.moveTo).call(k, l.pts[i], l.pts[i + 1])
        k.closePath()
        k.stroke()
      }
    }

    // glyph cells covering the letterforms
    this.cell = Math.max(5, Math.min(9, Math.round(fontPx / 19)))
    const c = this.cell
    const on = (x: number, y: number) => inside(x, y)
    const split = lines.length > 1 ? lines[1].baseline - lines[1].fontPx * 0.8 : Infinity
    this.cells = []
    for (let y = this.box.y + c / 2; y < this.box.y + this.box.h; y += c)
      for (let x = this.box.x + c / 2; x < this.box.x + this.box.w; x += c)
        if (on(x, y)) this.cells.push({ x, y, line: y < split ? 0 : 1, edge: !on(x - c, y) || !on(x + c, y) || !on(x, y - c) || !on(x, y + c) })
    this.cellGlyphs = this.cells.map(() => glyph())
    this.litAt = new Float32Array(this.cells.length).fill(Infinity)
    this.cellIdx = byX(this.cells.map((q) => q.x))
    this.litCount = 0

    this.chars = chars
    this.charOn = new Uint8Array(chars.length)
    this.charIdx = byX(chars.map((q) => q.x))
    this.charCount = 0
    this.outlineK = 0
    this.built = true
    if (wasDone || this.opts.reduced) this.finish()
    else this.revealAt = Infinity
    if (!this.running) this.draw()
  }
  private cellGlyphs: string[] = []

  /** start the downpour: the rain is sent through the hero and starts revealing */
  reveal() {
    if (!this.built || this.doneFired) return
    const r = this.canvas.getBoundingClientRect()
    let x0 = this.box.x
    let x1 = this.box.x + this.box.w
    for (const ch of this.chars) { x0 = Math.min(x0, ch.x); x1 = Math.max(x1, ch.x) }
    this.revealAt = this.e + this.ms(350)
    window.setTimeout(() => this.opts.pour(r.left + x0, r.left + x1, r.top + this.box.y, 1100 * this.opts.pace), this.ms(350))
  }

  complete() { if (this.built) this.finish() }

  private finish() {
    const now = this.e
    for (let i = 0; i < this.cells.length; i++) if (this.litAt[i] === Infinity) this.litAt[i] = now - 1000
    this.litCount = this.cells.length
    this.chars.forEach((ch, i) => { if (!this.charOn[i]) { this.charOn[i] = 1; ch.el.classList.add('on') } })
    this.charCount = this.chars.length
    this.outlineK = 1
    // hand over: the code texture dissolves while the solid lettering fades in (CSS)
    this.settleAt = this.opts.reduced ? -Infinity : now
    if (!this.doneFired) { this.doneFired = true; this.opts.onDone() }
    if (!this.running) this.draw()
  }

  start() {
    if (this.running || !this.built) return
    if (this.opts.reduced) { this.draw(); return }
    this.running = true
    const now = performance.now()
    this.t0 = this.t0 ? now - this.e : now
    this.raf = requestAnimationFrame(this.frame)
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf) }

  private frame = (now: number) => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.frame)
    this.e = now - this.t0
    this.step()
    this.draw()
    if (this.e - this.settleAt > 1400) this.stop()
  }

  /** the core of the effect: watch every falling rain head and light whatever it passes over */
  private catchRain() {
    const r = this.canvas.getBoundingClientRect()
    const ox = r.left
    const oy = r.top
    const now = this.e
    this.opts.rain((x, prev, head, size) => {
      if (head <= prev) return
      const lx = x - ox
      const half = size * 0.62
      // name cells under this column
      if (this.litCount < this.cells.length && lx > this.box.x - half && lx < this.box.x + this.box.w + half) {
        const { order, keys } = this.cellIdx
        for (let j = lowerBound(keys, lx - half); j < keys.length && keys[j] <= lx + half; j++) {
          const i = order[j]
          if (this.litAt[i] !== Infinity) continue
          const cy = this.cells[i].y + oy
          if (cy > prev - 2 && cy <= head + 2) { this.litAt[i] = now; this.litCount++ }
        }
      }
      // intro copy characters under this column
      if (this.charCount < this.chars.length) {
        const { order, keys } = this.charIdx
        const hw = Math.max(half, 7)
        for (let j = lowerBound(keys, lx - hw); j < keys.length && keys[j] <= lx + hw; j++) {
          const i = order[j]
          if (this.charOn[i]) continue
          const cy = this.chars[i].y + oy
          if (cy > prev - 4 && cy <= head + 4) { this.charOn[i] = 1; this.charCount++; this.chars[i].el.classList.add('on') }
        }
      }
    })
  }

  private step() {
    const e = this.e
    if (!this.doneFired && e >= this.revealAt) {
      this.catchRain()
      const k = this.cells.length ? this.litCount / this.cells.length : 1
      // the contour sharpens as the rain fills the letters in
      this.outlineK = Math.max(this.outlineK, Math.min(1, Math.max(0, (k - 0.55) / 0.4)))
      // safety net: anything the rain has missed after the downpour gets swept in from the top
      const late = e - this.revealAt - this.ms(5200)
      if (late > 0) {
        const r = this.canvas.getBoundingClientRect()
        const sweepY = this.box.y + (late / this.ms(500)) * (this.h - this.box.y)
        for (let i = 0; i < this.cells.length; i++) if (this.litAt[i] === Infinity && this.cells[i].y < sweepY) { this.litAt[i] = e; this.litCount++ }
        this.chars.forEach((ch, i) => { if (!this.charOn[i] && ch.y + r.top < sweepY + r.top) { this.charOn[i] = 1; this.charCount++; ch.el.classList.add('on') } })
      }
      if (this.litCount >= this.cells.length && this.charCount >= this.chars.length) this.finish()
    }

    for (let k = 0; k < 4; k++) { const i = (Math.random() * this.cellGlyphs.length) | 0; this.cellGlyphs[i] = glyph() }
  }

  private draw() {
    const { ctx, dpr } = this
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, this.w, this.h)
    if (!this.built) return
    const e = this.e
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const c = this.cell
    ctx.font = `700 ${Math.round(c * 1.15)}px "JetBrains Mono Variable", ui-monospace, monospace`
    const fadeOut = 1 - Math.min(1, Math.max(0, (e - this.settleAt) / 1200))
    if (fadeOut <= 0) return

    // letters made of the code the rain left behind
    for (let i = 0; i < this.cells.length; i++) {
      const lit = this.litAt[i]
      if (lit === Infinity) continue
      const q = this.cells[i]
      const d = e - lit
      const col = this.lines[q.line]
      if (d < 260) {
        ctx.globalAlpha = fadeOut
        ctx.fillStyle = '#ffffff'
        ctx.fillText(glyph(), q.x, q.y)
      } else {
        // edges settle bright, interiors dim; both fade toward the crisp contour as it arrives
        const settle = Math.min(1, (d - 260) / 700)
        ctx.globalAlpha = (q.edge ? 0.95 - this.outlineK * 0.35 : (0.75 - settle * 0.35) * (1 - this.outlineK * 0.25)) * fadeOut
        ctx.fillStyle = q.edge ? (col?.color ?? '#00ff66') : (col?.dim ?? '#0f8a47')
        ctx.fillText(this.cellGlyphs[i], q.x, q.y)
      }
    }

    if (this.outlineK > 0) {
      const b = this.box
      ctx.globalAlpha = this.outlineK * fadeOut
      ctx.drawImage(this.ink, b.x, b.y, b.w, b.h)
    }

    ctx.globalAlpha = 1
  }
}
