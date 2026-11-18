import { useEffect, useRef } from 'react'
import { glyph } from '../../lib/matrix'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { hero } from '../../config/content'
import { githubProfileUrl, site } from '../../config/site'
import { TypoEngine, type CharTarget, type LineSpec } from '../../lib/typo'
import { rainStore, useIntroDone, useRainFormed } from '../../lib/rainStore'
import { onScrollFrame } from '../../lib/scrollLoop'
import { useIsMobile, useReducedMotion } from '../../hooks/useMedia'
import { Github } from '../ui/icons'
import { RainText } from './RainText'

const [FIRST, LAST] = site.name.toUpperCase().split(' ')
const letters = (word: string) => [...word].map((c, i) => <span key={i} className="nl-c">{c}</span>)
const INK = [
  { color: '#eafff1', dim: '#3f8f66' },
  { color: '#00ff66', dim: '#0f8a47' },
]

function seen(): boolean {
  try { return sessionStorage.getItem('matrix-seen') === '1' } catch { return false }
}

export function MatrixHero() {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const nameRef = useRef<HTMLHeadingElement>(null)
  const engine = useRef<TypoEngine | null>(null)
  const revealed = useRef(false)
  const formed = useRainFormed()
  const introDone = useIntroDone()
  const mobile = useIsMobile()
  const reduced = useReducedMotion()

  useEffect(() => {
    const sec = section.current
    const cv = canvas.current
    const h1 = nameRef.current
    // built early (during the cold open) so the heavy outline tracing never lands on the transition;
    // the reveal itself starts when the cold open ends
    if (!sec || !cv || !h1) return
    let disposed = false
    const eng = new TypoEngine(cv, {
      mobile,
      reduced,
      pace: seen() ? 0.6 : 1,
      // the page-wide rain is the source of the reveal
      rain: (fn) => rainStore.engine?.forEachHead(fn),
      pour: (x0, x1, top, stagger) => rainStore.engine?.pour(x0, x1, top, stagger),
      onDone: () => {
        rainStore.engine?.pulse()
        rainStore.markFormed()
        try { sessionStorage.setItem('matrix-seen', '1') } catch { /* private mode */ }
      },
    })

    // Measure the invisible <h1> and every character slot, in the canvas's own coordinates.
    const build = () => {
      if (disposed) return
      const base = cv.getBoundingClientRect()
      const cs = getComputedStyle(h1)
      const fontPx = parseFloat(cs.fontSize)
      const font = `${cs.fontWeight} ${fontPx}px ${cs.fontFamily}`
      const probe = document.createElement('canvas').getContext('2d')!
      probe.font = font
      const m = probe.measureText('DM')
      const asc = m.fontBoundingBoxAscent ?? fontPx * 0.8
      const desc = m.fontBoundingBoxDescent ?? fontPx * 0.2
      const lines: LineSpec[] = [...h1.querySelectorAll<HTMLElement>('.name-line')].map((span, i) => {
        const r = span.getBoundingClientRect()
        return {
          text: span.textContent ?? '', left: r.left - base.left, baseline: r.top - base.top + (r.height - (asc + desc)) / 2 + asc,
          font, fontPx, letterSpacing: parseFloat(cs.letterSpacing) || 0, ...INK[i % INK.length],
        }
      })
      const chars: CharTarget[] = [...sec.querySelectorAll<HTMLElement>('.rt-c')].map((el) => {
        const r = el.getBoundingClientRect()
        return { el, x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2, group: Number(el.closest<HTMLElement>('.rt')?.dataset.g ?? 0) }
      })
      eng.build(lines, chars, base.width, base.height)
      if (window.scrollY > 40) eng.complete()
      else if (rainStore.introDone && !revealed.current) { revealed.current = true; eng.reveal() }
      sync()
    }

    let visible = true
    const sync = () => {
      if (disposed) return
      if (visible && !document.hidden) eng.start()
      else eng.stop()
    }
    const idle = (fn: () => void) => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout: 1200 })
      else setTimeout(fn, 60)
    }
    document.fonts.ready.then(() => idle(build))
    engine.current = eng

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync() })
    io.observe(sec)
    document.addEventListener('visibilitychange', sync)
    let rt = 0
    let lastW = window.innerWidth
    const onResize = () => {
      if (window.innerWidth === lastW) return // ignore mobile URL-bar height changes
      lastW = window.innerWidth
      clearTimeout(rt)
      rt = window.setTimeout(build, 180)
    }
    window.addEventListener('resize', onResize)

    // leaving the hero: the name drifts up and fades back into the rain
    const inner = sec.querySelector<HTMLElement>('.hero-inner')
    const offScroll = reduced ? () => {} : onScrollFrame((y, vh) => {
      const k = Math.min(1, y / (vh * 0.9))
      cv.style.transform = `translate3d(0, ${-k * 90}px, 0) scale(${1 + k * 0.06})`
      cv.style.opacity = String(1 - k)
      if (inner) { inner.style.transform = `translate3d(0, ${-k * 50}px, 0)`; inner.style.opacity = String(1 - k * 1.15) }
    })

    return () => {
      disposed = true
      offScroll()
      eng.dispose()
      io.disconnect()
      clearTimeout(rt)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('resize', onResize)
      engine.current = null
      sec.querySelectorAll('.rt-c.on').forEach((el) => el.classList.remove('on'))
    }
  }, [mobile, reduced])

  // The cold open has ended: send the rain through. Skipping is armed only after a beat, so the key
  // that skipped the cold open doesn't also instantly complete the name.
  useEffect(() => {
    if (!introDone) return
    const eng = engine.current
    if (eng?.isBuilt && !revealed.current) { revealed.current = true; eng.reveal() }
    const skip = () => { engine.current?.complete(); rainStore.engine?.complete() }
    const arm = window.setTimeout(() => {
      window.addEventListener('wheel', skip, { passive: true, once: true })
      window.addEventListener('touchmove', skip, { passive: true, once: true })
      window.addEventListener('keydown', skip, { once: true })
    }, 700)
    return () => {
      clearTimeout(arm)
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchmove', skip)
      window.removeEventListener('keydown', skip)
    }
  }, [introDone])

  // Once revealed, the name stays alive: letters near the cursor flicker into code and resolve back,
  // and the heading drifts slightly in depth with the pointer.
  useEffect(() => {
    const sec = section.current
    const h1 = nameRef.current
    if (!formed || reduced || mobile || !sec || !h1) return
    const chars = [...h1.querySelectorAll<HTMLElement>('.nl-c')]
    let centres: { x: number; y: number }[] = []
    const measure = () => { centres = chars.map((c) => { const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }) }
    measure()
    const busy = new Set<HTMLElement>()
    const glitch = (el: HTMLElement) => {
      if (busy.has(el)) return
      busy.add(el)
      el.classList.add('scr')
      let n = 0
      const tick = () => {
        el.dataset.g = glyph()
        if (++n < 6) window.setTimeout(tick, 55)
        else { el.classList.remove('scr'); busy.delete(el) }
      }
      tick()
    }
    let raf = 0
    let px = 0, py = 0
    const onMove = (e: PointerEvent) => {
      const r = sec.getBoundingClientRect()
      px = (e.clientX - r.left) / r.width - 0.5
      py = (e.clientY - r.top) / r.height - 0.5
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => { h1.style.transform = `translate3d(${px * -14}px, ${py * -8}px, 0)` })
      for (let i = 0; i < chars.length; i++) {
        const c = centres[i]
        if (Math.hypot(c.x - e.clientX, c.y - e.clientY) < 70 && Math.random() < 0.35) glitch(chars[i])
      }
    }
    const onLeave = () => { h1.style.transform = '' }
    const onScroll = () => measure()
    sec.addEventListener('pointermove', onMove)
    sec.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      sec.removeEventListener('pointermove', onMove)
      sec.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      h1.style.transform = ''
    }
  }, [formed, reduced, mobile])

  return (
    <section id="home" ref={section} className={`hero ${formed ? 'is-formed' : ''}`} aria-labelledby="hero-name">
      <div className="hero-scrim" aria-hidden="true" />
      <canvas ref={canvas} className="hero-typo" aria-hidden="true" />

      <div className="container hero-inner">
        {/* the rain reveals the name on the canvas, then hands over to this real, solid heading */}
        <h1 id="hero-name" ref={nameRef} className="hero-name" aria-label={site.name}>
          <span className="name-line" data-text={FIRST} aria-hidden="true">{letters(FIRST)}</span>
          <span className="name-line name-accent" data-text={LAST} aria-hidden="true">{letters(LAST)}</span>
        </h1>

        <p className="hero-role mono">
          <span className="green rise" aria-hidden="true">&gt;_ </span>
          <RainText text={hero.role} group={0} />
        </p>

        <div className="hero-grid">
          <div className="hero-who">
            <p className="label mono"><RainText text="Who I am" group={1} /></p>
            <p className="hero-intro"><RainText text={hero.intro} group={1} /></p>
            <p className="hero-now mono"><span className="dot rise" aria-hidden="true" /><RainText text={hero.now} group={3} /></p>
          </div>
          <div className="hero-what">
            <p className="label mono"><RainText text="What I do" group={2} /></p>
            <ul>
              {hero.focus.map((f, i) => (
                <li key={f.k}>
                  <span className="mono idx"><RainText text={`0${i + 1}`} group={2} /></span>
                  <span><strong><RainText text={f.k} group={2} /></strong><span className="dim"> <RainText text={`— ${f.v}`} group={3} /></span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hero-cta rise">
          <a className="btn btn-primary" href="#work">Enter the work <ArrowDown size={16} aria-hidden="true" /></a>
          <a className="btn" href={githubProfileUrl} target="_blank" rel="noopener noreferrer">
            <Github size={16} aria-hidden="true" /> GitHub <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <a className="btn btn-ghost" href="#contact">Get in touch</a>
        </div>
      </div>
      <a href="#about" className="hero-cue mono rise" aria-label="Scroll to the next section"><span>scroll</span><i aria-hidden="true" /></a>
    </section>
  )
}
