import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Text that rises into view line by line from behind a mask. Words are measured after layout and
 * grouped into visual lines, so the stagger follows the real line breaks at any width.
 */
export function Lines({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(false)
  const words = text.split(' ')

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const index = () => {
      let line = -1
      let top = -Infinity
      el.querySelectorAll<HTMLElement>('.ln-w').forEach((w) => {
        if (w.offsetTop > top + 2) { line++; top = w.offsetTop }
        w.style.setProperty('--ln', String(line))
      })
    }
    index()
    const ro = new ResizeObserver(index)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <span ref={ref} className={`ln ${shown ? 'in' : ''} ${className ?? ''}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={i}><span className="ln-w"><span>{w}</span></span>{i < words.length - 1 ? ' ' : ''}</Fragment>
        ))}
      </span>
    </span>
  )
}
