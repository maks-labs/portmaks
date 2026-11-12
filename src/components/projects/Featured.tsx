import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Star } from 'lucide-react'
import { featured, type Featured as F } from '../../config/content'
import { repoUrl } from '../../config/site'
import { useRepoData } from '../../context/RepoContext'
import { relativeTime, type Repo } from '../../lib/github'
import { useReducedMotion } from '../../hooks/useMedia'
import { SectionHeader } from '../ui/SectionHeader'
import { SystemDiagram } from './SystemDiagram'
import { Lines } from '../ui/Lines'
import { Decode } from '../ui/Decode'
import { rentacrowd, supermaks } from './diagrams'

const SPECS = { RentACrowd: rentacrowd, Super_Maks: supermaks } as const

function System({ f, repo, i }: { f: F; repo?: Repo; i: number }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [inView, setInView] = useState(false)
  const [shown, setShown] = useState(false)
  // packets only animate while the diagram is on screen
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { setInView(e.isIntersecting); if (e.isIntersecting) setShown(true) }, { threshold: 0.08 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const href = repo?.url ?? repoUrl(f.repo)

  return (
    <article ref={ref} className={`sysp reveal ${shown ? 'in' : ''}`}>
      <div className="sysp-text">
        <div>
          <p className="mono sysp-no">SYSTEM {String(i + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')}</p>
          <h3 className="sysp-title">
            <a href={href} target="_blank" rel="noopener noreferrer">{f.title}<ArrowUpRight size={28} aria-hidden="true" /><span className="sr-only"> on GitHub (opens in a new tab)</span></a>
          </h3>
          <p className="mono sysp-kind">{f.kind}</p>
          <p className="sysp-sum"><Lines text={f.summary} /></p>
          <div className="sysp-foot">
            <a className="btn btn-primary" href={href} target="_blank" rel="noopener noreferrer">View repository <ArrowUpRight size={16} aria-hidden="true" /></a>
            {repo && <p className="mono sysp-meta"><Star size={12} aria-hidden="true" /> {repo.stars} · {repo.language} · updated {relativeTime(repo.updatedAt)}</p>}
          </div>
        </div>
        <div>
          <ul className="sysp-points">{f.points.map((p) => <li key={p}>{p}</li>)}</ul>
          <ul className="chips" aria-label="Technologies">{f.stack.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      </div>
      <dl className="sysp-stats">
        {f.stats.map((s, j) => <div key={s.k}><dd><Decode text={s.v} delay={j * 120} /></dd><dt className="mono">{s.k}</dt></div>)}
      </dl>
      <div className="sysp-diagram">
        <div className="sysp-dbar mono" aria-hidden="true"><span className="dot" />{f.repo.toLowerCase()} / architecture.map<span className="sysp-hint">swipe →</span><span className="sysp-dlive">{reduced ? 'static' : 'live trace'}</span></div>
        <div className="sysp-scroll" tabIndex={0} role="group" aria-label={`${f.title} architecture diagram, scrollable`}>
          <SystemDiagram spec={SPECS[f.repo as keyof typeof SPECS]} animate={inView && !reduced} assemble={!reduced} />
        </div>
      </div>
    </article>
  )
}

export function Featured() {
  const { repos } = useRepoData()
  const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]))
  return (
    <section id="work" className="section" aria-labelledby="work-h">
      <div className="container">
        <SectionHeader index="02" eyebrow="Featured systems" id="work-h" title="What I've Built">
          Two multi-agent systems, designed and built end to end. The diagrams trace each one&apos;s real architecture.
        </SectionHeader>
        <div className="sysps">
          {featured.map((f, i) => <System key={f.repo} f={f} repo={byName.get(f.repo.toLowerCase())} i={i} />)}
        </div>
      </div>
    </section>
  )
}
