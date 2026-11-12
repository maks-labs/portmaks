import { useEffect, useRef, useState } from 'react'
import { useDecode } from '../../hooks/useDecode'

/** A value that resolves out of random glyphs the first time it scrolls into view. */
export function Decode({ text, delay = 0 }: { text: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useDecode(ref, text, seen, delay)
  return (
    <>
      <span ref={ref} aria-hidden="true" />
      <span className="sr-only">{text}</span>
    </>
  )
}
