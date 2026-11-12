import { useEffect, useRef } from 'react'
import { MatrixEngine } from '../../lib/matrix'
import { rainStore } from '../../lib/rainStore'
import { useIsMobile, useReducedMotion } from '../../hooks/useMedia'

function seen(): boolean {
  try { return sessionStorage.getItem('matrix-seen') === '1' } catch { return false }
}

/** The fixed, page-wide rain canvas plus the scroll progress line. */
export function MatrixRain() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const mobile = useIsMobile()
  const reduced = useReducedMotion()

  useEffect(() => {
    const cv = canvas.current
    if (!cv) return
    const eng = new MatrixEngine(cv, { mobile, reduced, pace: seen() ? 0.6 : 1 })
    rainStore.setEngine(eng)

    let disposed = false
    const sync = () => {
      if (disposed) return
      if (document.hidden) eng.stop()
      else eng.start()
    }
    let lastY = window.scrollY
    const onScroll = () => {
      eng.scrollBy(window.scrollY - lastY)
      lastY = window.scrollY
      eng.setScroll(window.scrollY / (window.innerHeight * 0.85))
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
    }
    onScroll()
    // arriving mid-page (reload, deep link): skip the opening
    if (window.scrollY > 40) eng.complete()

    document.fonts.ready.then(() => { if (!disposed) { eng.buildAtlases(); sync() } })
    sync()

    let rt = 0
    const onResize = () => { clearTimeout(rt); rt = window.setTimeout(() => eng.resize(), 140) }
    const onMove = (e: PointerEvent) => { if (e.pointerType !== 'touch') eng.setPointer(e.clientX) }
    const onLeave = () => eng.setPointer(null)

    // rain surges each time a new section takes over the middle of the screen
    let first = true
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !first) eng.pulse()
        first = false
      },
      { rootMargin: '-48% 0px -48% 0px' },
    )
    document.querySelectorAll('main > section').forEach((s) => io.observe(s))

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', sync)
    return () => {
      disposed = true
      eng.stop()
      io.disconnect()
      clearTimeout(rt)
      rainStore.setEngine(null)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [mobile, reduced])

  return (
    <>
      <canvas ref={canvas} className="rain" aria-hidden="true" />
      <div className="rain-fx" aria-hidden="true" />
      <div ref={bar} className="progress" aria-hidden="true" />
    </>
  )
}
