import { useEffect, useRef } from 'react'
import { hero } from '../../config/content'
import { onScrollFrame } from '../../lib/scrollLoop'
import { useReducedMotion } from '../../hooks/useMedia'

/**
 * Two rows of oversized outlined type that travel in opposite directions as the page scrolls,
 * leaning into the motion with scroll speed. The words are the four focus areas from the hero.
 */
export function Marquee() {
  const wrap = useRef<HTMLDivElement>(null)
  const rows = useRef<(HTMLDivElement | null)[]>([])
  const reduced = useReducedMotion()
  const words = hero.focus.map((f) => f.k)

  useEffect(() => {
    const el = wrap.current
    if (!el || reduced) return
    let lastY = window.scrollY
    let skew = 0
    return onScrollFrame((y) => {
      const r = el.getBoundingClientRect()
      const v = y - lastY
      lastY = y
      skew += (Math.max(-12, Math.min(12, v * 0.35)) - skew) * 0.3
      const base = r.top * 0.6
      rows.current.forEach((row, i) => {
        if (!row) return
        const dir = i % 2 ? 1 : -1
        row.style.transform = `translate3d(${dir * base - (i % 2 ? 900 : 0)}px, 0, 0) skewX(${-skew * dir}deg)`
      })
    })
  }, [reduced])

  const line = (filled: number) => (
    <>
      {[0, 1, 2].flatMap((rep) => words.map((w, i) => (
        <span key={`${rep}-${i}`} className={i === filled ? 'mq-fill' : ''}>{w}<i aria-hidden="true">✦</i></span>
      )))}
    </>
  )

  return (
    <div ref={wrap} className="mq" aria-label={words.join(', ')} role="img">
      <div ref={(el) => { rows.current[0] = el }} className="mq-row">{line(0)}</div>
      <div ref={(el) => { rows.current[1] = el }} className="mq-row">{line(2)}</div>
    </div>
  )
}
