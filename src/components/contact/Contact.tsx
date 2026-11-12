import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, Copy } from 'lucide-react'
import { githubProfileUrl, site } from '../../config/site'
import { useReveal } from '../../hooks/useReveal'
import { Github, Linkedin } from '../ui/icons'
import { Lines } from '../ui/Lines'
import { onScrollFrame } from '../../lib/scrollLoop'

export function Contact() {
  const ref = useReveal<HTMLDivElement>()
  const finale = useRef<HTMLDivElement>(null)

  // finale: the full-width name fills with light as the visitor reaches the very end
  useEffect(() => {
    const el = finale.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.style.setProperty('--fill', '1'); return }
    return onScrollFrame((y, vh) => {
      const max = document.documentElement.scrollHeight - vh
      const r = el.getBoundingClientRect()
      const enter = Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh * 0.35)))
      el.style.setProperty('--fill', String(max - y < 4 ? 1 : enter))
    })
  }, [])
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [log, setLog] = useState<string[]>([])
  const [sent, setSent] = useState(false)
  const timers = useRef<number[]>([])

  // a short transmission sequence, then the visitor's own mail client opens with the draft
  const transmit = (e: React.FormEvent) => {
    e.preventDefault()
    timers.current.forEach(clearTimeout)
    setSent(false)
    const steps = ['packing message…', 'opening channel → your mail client', 'transmission ready ✓']
    setLog([])
    steps.forEach((s, i) => timers.current.push(window.setTimeout(() => setLog((l) => [...l, s]), 260 * (i + 1))))
    timers.current.push(window.setTimeout(() => {
      setSent(true)
      const subject = encodeURIComponent(`Hello from ${name || 'your portfolio'}`)
      const body = encodeURIComponent(`${msg}\n\n— ${name}`)
      window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`
    }, 260 * steps.length + 200))
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied('ok')
    } catch {
      setCopied('fail')
    }
    window.setTimeout(() => setCopied(null), 2200)
  }

  return (
    <section id="contact" className="section contact" aria-labelledby="contact-h">
      <div className="contact-glow" aria-hidden="true" />
      <div ref={ref} className="container reveal">
        <p className="eyebrow mono"><span className="green">06</span><i aria-hidden="true" />Contact</p>
        <h2 id="contact-h" className="contact-title">
          Have something worth building?<br /><span className="green">Let&apos;s talk.</span>
        </h2>
        <p className="shead-lede"><Lines text="Open to AI/ML engineering roles and collaborations on agentic systems. Email is the fastest way to reach me." /></p>

        <div className="contact-row">
          <a className="contact-mail" href={`mailto:${site.email}`}>{site.email}<ArrowUpRight size={22} aria-hidden="true" /></a>
          <button className="btn btn-sm" onClick={copy} aria-live="polite">
            {copied === 'ok' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            {copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Copy failed' : 'Copy'}
          </button>
        </div>

        <form className={`tx ${sent ? 'tx-sent' : ''}`} onSubmit={transmit}>
          <div className="term-bar mono" aria-hidden="true"><i /><i /><i /><span>transmit.sh — secure channel</span></div>
          <div className="tx-body mono">
            <label><span className="green">$ from</span><input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="your name" /></label>
            <label><span className="green">$ message</span><textarea required rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="what are we building?" /></label>
            <div className="tx-row">
              <button className="btn btn-primary" type="submit">Transmit <ArrowUpRight size={15} aria-hidden="true" /></button>
              <p className="tx-note">Opens a pre-filled draft in your own email app.</p>
            </div>
            <ol className="tx-log" aria-live="polite">{log.map((l) => <li key={l}><span className="green">&gt;</span> {l}</li>)}</ol>
          </div>
          <span className="tx-burst" aria-hidden="true" />
        </form>

        <ul className="contact-links">
          <li><a href={githubProfileUrl} target="_blank" rel="noopener noreferrer"><Github size={18} aria-hidden="true" /> GitHub <ArrowUpRight size={14} aria-hidden="true" /></a></li>
          {site.linkedin && <li><a href={site.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={18} aria-hidden="true" /> LinkedIn <ArrowUpRight size={14} aria-hidden="true" /></a></li>}
        </ul>
      </div>
      <div ref={finale} className="finale" aria-hidden="true">
        <span className="finale-out">{site.name.toUpperCase()}</span>
        <span className="finale-in">{site.name.toUpperCase()}</span>
      </div>
      <footer className="container footer mono">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <span>Designed &amp; built from scratch — React · TypeScript · Canvas</span>
      </footer>
    </section>
  )
}
