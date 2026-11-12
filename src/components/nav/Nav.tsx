import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Github } from '../ui/icons'
import { githubProfileUrl, site } from '../../config/site'
import { useActiveSection } from '../../hooks/useActiveSection'

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'Profile' },
  { id: 'work', label: 'Work' },
  { id: 'github', label: 'GitHub' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
]
const IDS = LINKS.map((l) => l.id)

export function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const active = useActiveSection(IDS)
  const firstLink = useRef<HTMLAnchorElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    firstLink.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); toggle.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className={`nav ${scrolled || open ? 'nav-solid' : ''}`}>
      <nav className="container nav-row" aria-label="Primary">
        <a href="#home" className="nav-brand mono" aria-label={`${site.name} — home`}>
          <span className="green">&gt;_</span> DM
        </a>
        <ul className="nav-links">
          {LINKS.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`} aria-current={active === l.id ? 'true' : undefined}>{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          <a className="nav-icon" href={githubProfileUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile (opens in a new tab)">
            <Github size={19} aria-hidden="true" />
          </a>
          <button
            ref={toggle}
            className="nav-icon nav-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
          </button>
        </div>
      </nav>
      <div id="mobile-menu" className={`mobile-menu ${open ? 'open' : ''}`} hidden={!open}>
        <ul>
          {LINKS.map((l, i) => (
            <li key={l.id}>
              <a ref={i === 0 ? firstLink : undefined} href={`#${l.id}`} onClick={() => setOpen(false)} aria-current={active === l.id ? 'true' : undefined}>
                <span className="mono green">0{i + 1}</span> {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
