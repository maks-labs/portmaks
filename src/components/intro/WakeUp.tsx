import { useEffect, useRef, useState } from 'react'
import { rainStore } from '../../lib/rainStore'
import { useReducedMotion } from '../../hooks/useMedia'

// The film's cold open, typed on a dead terminal. The last line is printed whole, as in the film.
const LINES = [
  { text: 'Wake up, Neo...', typed: true, hold: 1700 },
  { text: 'The Matrix has you...', typed: true, hold: 1700 },
  { text: 'Follow the white rabbit.', typed: true, hold: 1600 },
  { text: 'Knock, knock, Neo.', typed: false, hold: 1900 },
]
const SLICES = 14

function seen(): boolean {
  try { return sessionStorage.getItem('neo-seen') === '1' } catch { return false }
}

/**
 * Cold open. Plays once per session; any key, click, scroll or touch skips it.
 * When it ends, the screen glitches and breaks apart into the rain underneath.
 */
export function WakeUp() {
  const reduced = useReducedMotion()
  const [show] = useState(() => !seen() && !reduced)
  const [phase, setPhase] = useState<'type' | 'crack' | 'gone'>('type')
  const textRef = useRef<HTMLSpanElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const done = useRef(false)

  useEffect(() => {
    if (!show) { rainStore.markIntroDone(); return }
    document.documentElement.classList.add('intro-lock')
    skipRef.current?.focus({ preventScroll: true })
    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
    const el = textRef.current!

    const crack = (fast: boolean) => {
      if (done.current) return
      done.current = true
      timers.forEach(clearTimeout)
      try { sessionStorage.setItem('neo-seen', '1') } catch { /* private mode */ }
      setPhase('crack')
      document.documentElement.classList.remove('intro-lock')
      window.setTimeout(() => rainStore.markIntroDone(), fast ? 60 : 280)
      window.setTimeout(() => setPhase('gone'), fast ? 700 : 1300)
    }

    // irregular keystrokes read as a person typing, not a ticker
    // a beat of blinking cursor before anything is written, and between lines
    let t = 1200
    for (const line of LINES) {
      const start = t
      at(start, () => { el.textContent = '' })
      if (line.typed) {
        let k = start + 600
        for (let i = 1; i <= line.text.length; i++) {
          const slice = line.text.slice(0, i)
          const ch = line.text[i - 1]
          k += 60 + Math.random() * 60 + (ch === ',' ? 220 : ch === '.' ? 170 : 0)
          at(k, () => { el.textContent = slice })
        }
        t = k + line.hold
      } else {
        at(start + 900, () => { el.textContent = line.text })
        t = start + 900 + line.hold
      }
    }
    at(t, () => crack(false))

    const skip = (e: Event) => {
      if (e.type === 'keydown' && ['Shift', 'Meta', 'Alt', 'Control'].includes((e as KeyboardEvent).key)) return
      crack(true)
    }
    window.addEventListener('keydown', skip)
    window.addEventListener('wheel', skip, { passive: true })
    window.addEventListener('touchstart', skip, { passive: true })
    return () => {
      timers.forEach(clearTimeout)
      document.documentElement.classList.remove('intro-lock')
      window.removeEventListener('keydown', skip)
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchstart', skip)
    }
  }, [show])

  if (!show || phase === 'gone') return null

  return (
    <div className={`wake ${phase === 'crack' ? 'wake-crack' : ''}`} role="presentation">
      {Array.from({ length: SLICES }, (_, i) => (
        <i
          key={i}
          className="wake-slice"
          style={{
            top: `${(i * 100) / SLICES}%`,
            height: `${100 / SLICES + 0.2}%`,
            '--dx': `${(i % 2 ? 1 : -1) * (30 + ((i * 37) % 60))}vw`,
            '--dl': `${((i * 53) % 9) * 32}ms`,
          } as React.CSSProperties}
        />
      ))}
      <div className="wake-term mono" aria-hidden="true">
        <span ref={textRef} className="wake-text" /><span className="wake-cur" />
      </div>
      <i className="wake-flash" aria-hidden="true" />
      <button ref={skipRef} className="wake-skip mono" onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })) }}>
        press any key
      </button>
      <p className="sr-only" aria-live="polite">Wake up, Neo. The Matrix has you. Follow the white rabbit. Knock, knock, Neo.</p>
    </div>
  )
}
