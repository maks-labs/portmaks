import { certifications, experience, profile } from '../../config/content'
import { site } from '../../config/site'
import { useRepoData } from '../../context/RepoContext'
import { useReveal } from '../../hooks/useReveal'
import { SectionHeader } from '../ui/SectionHeader'
import { Decode } from '../ui/Decode'

export function Profile() {
  const { repos, status } = useRepoData()
  const term = useReveal<HTMLDivElement>()
  const grid = useReveal<HTMLDListElement>()
  const own = repos.filter((r) => !r.fork)
  const live = status === 'ready'
  const stats = [
    { v: live ? String(own.length).padStart(2, '0') : '—', k: 'public repositories', s: 'live from GitHub' },
    { v: live ? String(own.reduce((n, r) => n + r.stars, 0)).padStart(2, '0') : '—', k: 'GitHub stars', s: 'live from GitHub' },
    { v: String(experience.length).padStart(2, '0'), k: 'industry roles', s: 'Wittybrains · LetsAI' },
    { v: String(certifications.length).padStart(2, '0'), k: 'certifications', s: 'Oracle GenAI · AWS' },
  ]

  return (
    <section id="about" className="section" aria-labelledby="about-h">
      <div className="container">
        <SectionHeader index="01" eyebrow="Profile" id="about-h" title="System Profile" />
        <div className="profile">
          <div ref={term} className="term reveal">
            <div className="term-bar mono" aria-hidden="true">
              <i /><i /><i /><span>devaansh@matrix: ~</span>
            </div>
            <div className="term-body mono">
              {profile.lines.map((l, i) => (
                <div className="term-line" key={l.cmd} style={{ '--i': i } as React.CSSProperties}>
                  <p className="term-cmd"><span className="green" aria-hidden="true">$ </span>{l.cmd}</p>
                  <p className="term-out">{l.out}</p>
                </div>
              ))}
              <p className="term-cmd"><span className="green" aria-hidden="true">$ </span><span className="caret" aria-hidden="true" /></p>
            </div>
          </div>
          <dl ref={grid} className="stats reveal">
            {stats.map((s) => (
              <div key={s.k}>
                <dd className="stat-v"><Decode text={s.v} /></dd>
                <dt>{s.k}<span className="mono">{s.s}</span></dt>
              </div>
            ))}
          </dl>
        </div>
        <p className="sr-only">{site.name}, {site.role}</p>
      </div>
    </section>
  )
}
