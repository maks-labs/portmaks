import { useEffect, type RefObject } from 'react'
import { glyph } from '../lib/matrix'

/** Scrambles an element's text and resolves it left → right. Writes to the DOM directly. */
export function useDecode(ref: RefObject<HTMLElement | null>, text: string, run: boolean, delay = 0) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; return }
    if (!run) { el.textContent = ' '; return }
    let raf = 0
    let start = 0
    const duration = Math.min(1300, 360 + text.length * 16)
    const tick = (now: number) => {
      if (!start) start = now
      const k = Math.min(1, (now - start) / duration)
      const solved = Math.floor(k * text.length)
      let out = text.slice(0, solved)
      for (let i = solved; i < text.length && i < solved + 12; i++) out += text[i] === ' ' ? ' ' : glyph()
      el.textContent = out
      if (k < 1) raf = requestAnimationFrame(tick)
      else el.textContent = text
    }
    const t = window.setTimeout(() => (raf = requestAnimationFrame(tick)), delay)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [ref, text, run, delay])
}
