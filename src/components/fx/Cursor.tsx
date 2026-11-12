import { useEffect, useRef } from 'react'
import { useFinePointer, useReducedMotion } from '../../hooks/useMedia'
import { onScrollFrame } from '../../lib/scrollLoop'

/**
 * Precision cursor for fine pointers: a dot that tracks exactly and a ring that trails it.
 * Over interactive elements the ring grows; over project cards it becomes an "open" lens.
 * Text fields keep the native caret. Touch devices and reduced motion keep the native cursor.
 */
export function Cursor() {
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!fine || reduced) return
    const r = ring.current!
    const d = dot.current!
    const root = document.documentElement
    root.classList.add('has-cursor')
    let x = -100, y = -100, rx = -100, ry = -100
    let raf = 0
    let running = false
    let state = ''

    const loop = () => {
      rx += (x - rx) * 0.2
      ry += (y - ry) * 0.2
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (Math.abs(x - rx) + Math.abs(y - ry) < 0.3) { running = false; return }
      raf = requestAnimationFrame(loop)
    }
    const wake = () => { if (!running) { running = true; raf = requestAnimationFrame(loop) } }

    const set = (s: string, text = '') => {
      if (s === state) return
      state = s
      r.dataset.state = s
      d.dataset.state = s
      if (label.current) label.current.textContent = text
    }

    // what is under the pointer decides the cursor's form (re-checked on scroll, when content moves under a still pointer)
    const classify = (t: Element | null) => {
      if (!t) return set('')
      if (t.closest('input, textarea, [contenteditable]')) set('text')
      else if (t.closest('.gh, .sysp-diagram')) set('lens', t.closest('.sysp-diagram') ? 'trace' : 'open ↗')
      else if (t.closest('a, button, [role="tab"], .sk-item, summary, label')) set('link')
      else set('')
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      x = e.clientX
      y = e.clientY
      r.classList.add('on')
      d.classList.add('on')
      classify(e.target as Element)
      wake()
    }
    const offScroll = onScrollFrame(() => { if (x > 0) classify(document.elementFromPoint(x, y)) })
    const onDown = () => r.classList.add('down')
    const onUp = () => r.classList.remove('down')
    const onLeave = () => { r.classList.remove('on'); d.classList.remove('on') }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    root.addEventListener('pointerleave', onLeave)
    return () => {
      offScroll()
      cancelAnimationFrame(raf)
      root.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      root.removeEventListener('pointerleave', onLeave)
    }
  }, [fine, reduced])

  if (!fine || reduced) return null
  return (
    <>
      <div ref={ring} className="cur-ring" aria-hidden="true"><span ref={label} className="mono" /></div>
      <div ref={dot} className="cur-dot" aria-hidden="true" />
    </>
  )
}
