import { useEffect, useRef } from 'react'
import { Award, GraduationCap } from 'lucide-react'
import { onScrollFrame, progress } from '../../lib/scrollLoop'
import { certifications, education, experience, type Role } from '../../config/content'
import { useReveal } from '../../hooks/useReveal'
import { SectionHeader } from '../ui/SectionHeader'

function RoleRow({ r, i }: { r: Role; i: number }) {
  const ref = useReveal<HTMLLIElement>()
  return (
    <li ref={ref} className={`role reveal ${r.current ? 'role-now' : ''}`} style={{ '--i': i } as React.CSSProperties}>
      <span className="role-node" aria-hidden="true" />
      <p className="role-period mono">{r.period}</p>
      <div className="role-body">
        <h3>{r.title} <span className="role-org">· {r.org}</span>{r.current && <span className="role-badge mono">current</span>}</h3>
        {r.positions && (
          <ol className="role-steps">
            {r.positions.map((p, i) => (
              <li key={p.title} className={i === 0 ? 'now' : ''}>
                <span className="role-step-t">{p.title}</span>
                <span className="mono role-step-p">{p.period}</span>
              </li>
            ))}
          </ol>
        )}
        <ul>{r.points.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>
    </li>
  )
}

export function Experience() {
  const side = useReveal<HTMLDivElement>()
  const list = useRef<HTMLOListElement>(null)
  const fill = useRef<HTMLSpanElement>(null)

  // the timeline charges up with scroll; each role lights when the charge reaches it
  useEffect(() => {
    const ol = list.current
    if (!ol) return
    return onScrollFrame((_, vh) => {
      const p = progress(ol, vh, 0.62, 0.62)
      if (fill.current) fill.current.style.transform = `scaleY(${p})`
      const line = ol.getBoundingClientRect().top + p * ol.offsetHeight
      ol.querySelectorAll<HTMLElement>('.role').forEach((li) => li.classList.toggle('lit', li.getBoundingClientRect().top + 30 <= line + 1))
    })
  }, [])
  return (
    <section id="experience" className="section" aria-labelledby="exp-h">
      <div className="container">
        <SectionHeader index="04" eyebrow="Track record" id="exp-h" title="Experience" />
        <div className="exp-layout">
          <ol ref={list} className="roles">
            <span className="tl" aria-hidden="true"><span ref={fill} /></span>
            {experience.map((r, i) => <RoleRow key={r.title + r.period} r={r} i={i} />)}
          </ol>
          <div ref={side} className="exp-side reveal">
            <div className="card">
              <p className="card-k mono"><GraduationCap size={15} aria-hidden="true" /> Education</p>
              <h3>{education.degree}</h3>
              <p className="dim">{education.school}</p>
              <p className="mono card-sub">{education.period}</p>
            </div>
            <div className="card">
              <p className="card-k mono"><Award size={15} aria-hidden="true" /> Certifications</p>
              <ul className="certs">
                {certifications.map((c) => (
                  <li key={c.name}><span>{c.name}</span><span className="mono card-sub">{c.issuer}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
