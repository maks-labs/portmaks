import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useDecode } from '../../hooks/useDecode'
import { onScrollFrame } from '../../lib/scrollLoop'
import { Lines } from './Lines'

/** Section heading: ghost index numeral, eyebrow, and a title that decodes out of rain glyphs on entry. */
export function SectionHeader({ index, eyebrow, title, id, children }: { index: string; eyebrow: string; title: string; id: string; children?: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLSpanElement>(null)
  const ghost = useRef<HTMLSpanElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useDecode(titleRef, title, seen, 120)

  // the ghost numeral sits deeper than the heading: it drifts at a slower rate as you scroll
  useEffect(() => {
    const el = ref.current
    const g = ghost.current
    if (!el || !g || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    return onScrollFrame((_, vh) => {
      const r = el.getBoundingClientRect()
      if (r.bottom < -200 || r.top > vh + 200) return
      g.style.transform = `translate3d(0, ${(r.top - vh * 0.4) * -0.25}px, 0)`
    })
  }, [])

  return (
    <header ref={ref} className={`shead reveal ${seen ? 'in' : ''}`}>
      <span ref={ghost} className="shead-ghost" aria-hidden="true">{index}</span>
      <p className="eyebrow mono"><span className="green">{index}</span><i aria-hidden="true" />{eyebrow}</p>
      <h2 id={id} className="h2" aria-label={title}><span ref={titleRef} aria-hidden="true" /></h2>
      {children && <p className="shead-lede">{typeof children === 'string' ? <Lines text={children} /> : children}</p>}
    </header>
  )
}
