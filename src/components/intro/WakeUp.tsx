import { useEffect, useRef, useState } from 'react'
import { rainStore } from '../../lib/rainStore'
import { useReducedMotion } from '../../hooks/useMedia'

// The film's cold open, typed on a dead terminal. The last line is printed whole, as in the film.
const LINES = [
  { text: 'Wake up, Neo...', typed: true, hold: 1700 },
  { text: 'The Matrix has you...', typed: true, hold: 1700 },
  { text: 'Follow the white rabbit.', typed: true, hold: 1600 },
  { text: 'Knock, knock, Neo.', typed: false, hold: 1500 },
]
const SLICES = 14
const pad = (n: number) => String(n).padStart(2, '0')

function seen(): boolean {
  try { return sessionStorage.getItem('neo-seen') === '1' } catch { return false }
}

/**
 * Cold open, once per session:
 *   1. the trace — "Call trans opt: received." stamped with the visitor's own date and time,
 *      then "Trace program: running" while numbers race;
 *   2. "Wake up, Neo…" — and on "Knock, knock, Neo." the screen cracks apart into the rain.
 * Any key, click, scroll or touch skips straight to the crack.
 */
export function WakeUp() {
  const reduced = useReducedMotion()
  const [show] = useState(() => !seen() && !reduced)
  const [phase, setPhase] = useState<'trace' | 'wake' | 'crack' | 'gone'>('trace')
  const textRef = useRef<HTMLSpanElement>(null)
  const numsRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const timers = useRef<number[]>([])
  const now = useRef(new Date())

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))

  const crack = (fast: boolean) => {
    if (phaseRef.current === 'crack' || phaseRef.current === 'gone') return
    clear()
    try { sessionStorage.setItem('neo-seen', '1') } catch { /* private mode */ }
    document.documentElement.classList.remove('intro-lock')
    setPhase('crack')
    window.setTimeout(() => rainStore.markIntroDone(), fast ? 80 : 280)
    window.setTimeout(() => setPhase('gone'), 1300)
  }

  useEffect(() => {
    if (!show) { rainStore.markIntroDone(); return }
    document.documentElement.classList.add('intro-lock')

    // 1. the trace
    const nums = numsRef.current!
    let raf = 0
    const runNums = () => {
      raf = requestAnimationFrame(runNums)
      let s = ''
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 26; c++) s += (Math.random() * 10) | 0
        s += '\n'
      }
      nums.textContent = s
    }
    at(1500, () => { raf = requestAnimationFrame(runNums) })
    at(3700, () => { cancelAnimationFrame(raf); setPhase('wake') })

    // 2. "Wake up, Neo"; irregular keystrokes read as a person typing
    const el = textRef.current!
    let t = 4500
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

    const onKey = (e: KeyboardEvent) => {
      if (['Shift', 'Meta', 'Alt', 'Control', 'Tab'].includes(e.key)) return
      crack(true)
    }
    const onSkip = () => crack(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onSkip, { passive: true })
    window.addEventListener('touchstart', onSkip, { passive: true })
    return () => {
      clear()
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('intro-lock')
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onSkip)
      window.removeEventListener('touchstart', onSkip)
    }
    // crack only touches refs and stable setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  if (!show || phase === 'gone') return null
  const d = now.current
  const stamp = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${String(d.getFullYear()).slice(2)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

  return (
    <div className={`wake is-${phase}`} role="presentation">
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

      <div className="wake-trace mono" aria-hidden="true">
        <p className="wt-1">Call trans opt: received. {stamp} REC:Log&gt;<span className="wake-cur" /></p>
        <p className="wt-2">Trace program: running</p>
        <div ref={numsRef} className="wt-nums" />
      </div>

      <div className="wake-term mono" aria-hidden="true">
        <span ref={textRef} className="wake-text" /><span className="wake-cur" />
      </div>

      <i className="wake-flash" aria-hidden="true" />
      {(phase === 'trace' || phase === 'wake') && (
        <button className="wake-skip mono" onClick={(e) => { e.stopPropagation(); crack(true) }}>press any key</button>
      )}
      <p className="sr-only" aria-live="polite">
        Wake up, Neo. The Matrix has you. Follow the white rabbit. Knock, knock, Neo.
      </p>
    </div>
  )
}
