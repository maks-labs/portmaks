import { useEffect, useRef } from 'react'
import { FxEngine } from '../../lib/fx'
import { Cursor } from './Cursor'
import { useActiveSection } from '../../hooks/useActiveSection'
import { useFinePointer, useReducedMotion } from '../../hooks/useMedia'

const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'Profile' },
  { id: 'work', label: 'Work' },
  { id: 'github', label: 'GitHub' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
]
const IDS = SECTIONS.map((s) => s.id)

/** Foreground layer: glyph cursor trail, magnetic buttons and the section rail. */
export function Fx() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const active = useActiveSection(IDS)
  const idx = Math.max(0, IDS.indexOf(active))

  useEffect(() => {
    const cv = canvas.current
    if (!cv || !fine || reduced) return
    const e = new FxEngine(cv)
    const onMove = (ev: PointerEvent) => { if (ev.pointerType !== 'touch') e.pointer(ev.clientX, ev.clientY) }
    const onResize = () => e.resize()

    // magnetic interactive elements
    let mag: HTMLElement | null = null
    const onMag = (ev: PointerEvent) => {
      if (ev.pointerType === 'touch') return
      const t = (ev.target as HTMLElement).closest<HTMLElement>('.btn, .nav-icon, .rail a')
      if (mag && mag !== t) { mag.style.translate = ''; mag = null }
      if (!t) return
      const r = t.getBoundingClientRect()
      const dx = ev.clientX - (r.left + r.width / 2)
      const dy = ev.clientY - (r.top + r.height / 2)
      t.style.translate = `${Math.max(-7, Math.min(7, dx * 0.18))}px ${Math.max(-5, Math.min(5, dy * 0.3))}px`
      mag = t
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointermove', onMag, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      e.stop()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointermove', onMag)
      window.removeEventListener('resize', onResize)
      if (mag) mag.style.translate = ''
    }
  }, [fine, reduced])

  return (
    <>
      <canvas ref={canvas} className="fx" aria-hidden="true" />
      <Cursor />
      <nav className={`rail ${active === 'github' ? 'rail-off' : ''}`} aria-label="Section progress">
        <ol>
          {SECTIONS.map((s, i) => (
            <li key={s.id} className={i === idx ? 'on' : i < idx ? 'past' : ''}>
              <a href={`#${s.id}`} aria-current={i === idx ? 'true' : undefined}>
                <span className="mono">{String(i).padStart(2, '0')}</span>
                <em>{s.label}</em>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
