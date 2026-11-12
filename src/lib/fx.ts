// Foreground effects canvas: a short-lived trail of glyphs that follows the cursor.
import { glyph } from './matrix'

interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; g: string; size: number; hot: boolean }

export class FxEngine {
  private ctx: CanvasRenderingContext2D
  private w = 0
  private h = 0
  private dpr = 1
  private parts: P[] = []
  private raf = 0
  private running = false
  private last = 0
  private lastPtr = { x: -1, y: -1 }

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    this.resize()
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.w = window.innerWidth
    this.h = window.innerHeight
    this.canvas.width = Math.round(this.w * this.dpr)
    this.canvas.height = Math.round(this.h * this.dpr)
  }

  pointer(x: number, y: number) {
    const dx = x - this.lastPtr.x
    const dy = y - this.lastPtr.y
    const dist = Math.hypot(dx, dy)
    if (this.lastPtr.x < 0) { this.lastPtr = { x, y }; return }
    if (dist < 16) return
    const n = Math.min(3, Math.floor(dist / 16))
    for (let i = 0; i < n; i++) {
      const k = (i + 1) / n
      this.spawn(this.lastPtr.x + dx * k, this.lastPtr.y + dy * k, i === n - 1)
    }
    this.lastPtr = { x, y }
    this.kick()
  }

  private spawn(x: number, y: number, hot: boolean) {
    if (this.parts.length > 140) this.parts.shift()
    const max = 0.55 + Math.random() * 0.5
    this.parts.push({ x: x + (Math.random() - 0.5) * 8, y, vx: (Math.random() - 0.5) * 14, vy: 25 + Math.random() * 45, life: max, max, g: glyph(), size: 9 + Math.random() * 5, hot })
  }

  stop() { this.running = false; cancelAnimationFrame(this.raf) }

  private kick() {
    if (this.running || document.hidden) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  // runs only while there are particles to draw
  private frame = (now: number) => {
    if (!this.running) return
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i]
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; p.life -= dt
      if (Math.random() < 0.08) p.g = glyph()
      if (p.life <= 0) this.parts.splice(i, 1)
    }
    const { ctx, dpr } = this
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, this.w, this.h)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const p of this.parts) {
      ctx.globalAlpha = (p.life / p.max) * (p.hot ? 0.95 : 0.7)
      ctx.fillStyle = p.hot ? '#eafff1' : '#2fe07f'
      ctx.font = `600 ${p.size.toFixed(0)}px "JetBrains Mono Variable", ui-monospace, monospace`
      ctx.fillText(p.g, p.x, p.y)
    }
    ctx.globalAlpha = 1
    if (!this.parts.length) { this.running = false; return }
    this.raf = requestAnimationFrame(this.frame)
  }
}
