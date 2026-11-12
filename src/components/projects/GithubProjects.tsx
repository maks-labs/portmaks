import { useEffect, useRef } from 'react'
import { ArrowUpRight, GitFork, Star } from 'lucide-react'
import { repoNotes } from '../../config/content'
import { githubProfileUrl, repoUrl, site } from '../../config/site'
import { useRepoData } from '../../context/RepoContext'
import { relativeTime } from '../../lib/github'
import { onScrollFrame } from '../../lib/scrollLoop'
import { useMediaQuery, useReducedMotion } from '../../hooks/useMedia'
import { useReveal } from '../../hooks/useReveal'
import { SectionHeader } from '../ui/SectionHeader'

interface Item { name: string; url: string; blurb: string; stack: string[]; language?: string | null; stars?: number; forks?: number; updatedAt?: string }

function Card({ r, i, total }: { r: Item; i: number; total: number }) {
  const ref = useReveal<HTMLLIElement>()
  return (
    <li ref={ref} className="gh reveal" style={{ '--i': i % 3 } as React.CSSProperties}>
      <span className="gh-scan" aria-hidden="true" />
      <p className="gh-path mono">
        <span>{site.githubUsername} /</span>
        <span className="gh-no">{String(i + 1).padStart(2, '0')}<i>/{String(total).padStart(2, '0')}</i></span>
      </p>
      <h3 className="gh-name">
        <a href={r.url} target="_blank" rel="noopener noreferrer">{r.name}<span className="sr-only"> on GitHub (opens in a new tab)</span></a>
        <ArrowUpRight size={18} aria-hidden="true" />
      </h3>
      <p className="gh-blurb">{r.blurb}</p>
      {r.stack.length > 0 && <ul className="chips chips-sm" aria-label="Technologies">{r.stack.map((s) => <li key={s}>{s}</li>)}</ul>}
      <p className="gh-meta mono">
        {r.language && <span><i aria-hidden="true" />{r.language}</span>}
        {r.stars !== undefined && <span><Star size={11} aria-hidden="true" />{r.stars}</span>}
        {r.forks !== undefined && <span><GitFork size={11} aria-hidden="true" />{r.forks}</span>}
        {r.updatedAt && <span>{relativeTime(r.updatedAt)}</span>}
      </p>
    </li>
  )
}

// one delegated listener: hover spotlight + a gentle 3D tilt toward the pointer
function track(e: React.PointerEvent<HTMLElement>) {
  const card = (e.target as HTMLElement).closest<HTMLElement>('.gh')
  if (!card) return
  const r = card.getBoundingClientRect()
  const x = e.clientX - r.left
  const y = e.clientY - r.top
  card.style.setProperty('--mx', `${x}px`)
  card.style.setProperty('--my', `${y}px`)
  card.style.setProperty('--ry', `${((x / r.width) - 0.5) * 9}deg`)
  card.style.setProperty('--rx', `${(0.5 - y / r.height) * 7}deg`)
}
function untrack(e: React.PointerEvent<HTMLElement>) {
  const card = (e.target as HTMLElement).closest<HTMLElement>('.gh')
  card?.style.setProperty('--rx', '0deg')
  card?.style.setProperty('--ry', '0deg')
}

export function GithubProjects() {
  const { repos, status, source } = useRepoData()
  const reduced = useReducedMotion()
  const wide = useMediaQuery('(min-width: 1000px) and (hover: hover) and (pointer: fine)')
  const horizontal = wide && !reduced
  const notes = new Map(repoNotes.map((n) => [n.repo.toLowerCase(), n]))
  // live list when available; otherwise the curated list so the section never renders empty
  const items: Item[] = repos.length
    ? repos.filter((r) => !r.fork).map((r) => {
        const n = notes.get(r.name.toLowerCase())
        return { name: r.name, url: r.url, blurb: n?.blurb ?? r.description ?? 'No description provided.', stack: n?.stack ?? r.topics.slice(0, 4), language: r.language, stars: r.stars, forks: r.forks, updatedAt: r.updatedAt }
      })
    : repoNotes.map((n) => ({ name: n.repo, url: repoUrl(n.repo), blurb: n.blurb, stack: n.stack }))

  const wrap = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLUListElement>(null)
  const counter = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)

  // Vertical scroll → horizontal travel. The wrapper is made exactly as tall as the extra width,
  // so native scrolling keeps working and nothing is hijacked.
  useEffect(() => {
    const w = wrap.current
    const r = rail.current
    if (!horizontal || !w || !r) return
    let travel = 0
    const size = () => {
      travel = Math.max(0, r.scrollWidth - window.innerWidth + 64)
      w.style.height = `${window.innerHeight + travel}px`
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(r)
    const off = onScrollFrame((_, vh) => {
      const top = w.getBoundingClientRect().top
      const p = Math.min(1, Math.max(0, -top / (w.offsetHeight - vh || 1)))
      r.style.transform = `translate3d(${-p * travel}px,0,0)`
      if (bar.current) bar.current.style.transform = `scaleX(${p})`
      if (counter.current) counter.current.textContent = String(Math.min(items.length, 1 + Math.floor(p * items.length * 0.999))).padStart(2, '0')
    })
    return () => { off(); ro.disconnect(); w.style.height = ''; r.style.transform = '' }
  }, [horizontal, items.length])

  const foot = (
    <div className="pfoot">
      <p className="mono dim">
        <span className="dot" aria-hidden="true" />
        {status === 'loading' ? 'syncing with github…' : source === 'live' || source === 'cache' ? `${items.length} repositories · synced from github.com/${site.githubUsername}` : `${items.length} repositories · github.com/${site.githubUsername}`}
      </p>
      <a className="btn" href={githubProfileUrl} target="_blank" rel="noopener noreferrer">Open GitHub profile <ArrowUpRight size={15} aria-hidden="true" /></a>
    </div>
  )

  return (
    <section id="github" className={`section ${horizontal ? 'gh-h' : ''}`} aria-labelledby="gh-h">
      <div className="container">
        <SectionHeader index="03" eyebrow="Open source" id="gh-h" title="GitHub Projects">
          Everything public on my GitHub. Each card opens its repository.
        </SectionHeader>
      </div>
      {horizontal ? (
        <div ref={wrap} className="ghx">
          <div className="ghx-pin">
            <div className="container ghx-hud mono" aria-hidden="true">
              <span>repository <b ref={counter}>01</b> / {String(items.length).padStart(2, '0')}</span>
              <span className="ghx-track"><span ref={bar} /></span>
              <span>scroll ↓ to travel →</span>
            </div>
            <ul ref={rail} className="ghx-rail" onPointerMove={track} onPointerOut={untrack} aria-busy={status === 'loading'}>
              {items.map((r, i) => <Card key={r.name} r={r} i={i} total={items.length} />)}
            </ul>
            <div className="container">{foot}</div>
          </div>
        </div>
      ) : (
        <div className="container">
          <ul className="ghgrid" onPointerMove={track} onPointerOut={untrack} aria-busy={status === 'loading'}>
            {items.map((r, i) => <Card key={r.name} r={r} i={i} total={items.length} />)}
          </ul>
          {foot}
        </div>
      )}
    </section>
  )
}
