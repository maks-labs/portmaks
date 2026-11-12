import { skills, type Skill, type SkillGroup } from '../../config/content'
import { useReveal } from '../../hooks/useReveal'
import { SectionHeader } from '../ui/SectionHeader'
import { brandIcons } from './brandIcons'

/** Brand colour on hover, unless it is too dark to read on black. */
function hoverColor(hex: string): string {
  const n = parseInt(hex, 16)
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
  return lum < 0.32 ? '#f3fff7' : `#${hex}`
}

function Item({ s }: { s: Skill }) {
  const icon = s.icon ? brandIcons[s.icon] : undefined
  return (
    <li className="sk-item" style={icon ? ({ '--brand': hoverColor(icon.hex) } as React.CSSProperties) : undefined}>
      <span className="sk-ico" aria-hidden="true">
        {icon ? <svg viewBox="0 0 24 24"><path d={icon.path} /></svg> : <span className="mono">{s.mono}</span>}
      </span>
      <span className="sk-name">{s.name}</span>
    </li>
  )
}

function Panel({ g, i }: { g: SkillGroup; i: number }) {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} className="sk-panel reveal" style={{ '--i': i } as React.CSSProperties} aria-labelledby={`sk-${i}`}>
      <header className="sk-head">
        <span className="mono sk-idx">{String(i + 1).padStart(2, '0')}</span>
        <h3 id={`sk-${i}`}>{g.label}</h3>
        <span className="mono sk-count">{String(g.items.length).padStart(2, '0')}</span>
      </header>
      <p className="mono sk-note">{g.note}</p>
      <ul className="sk-list">{g.items.map((s) => <Item key={s.name} s={s} />)}</ul>
    </section>
  )
}

export function Skills() {
  const total = skills.reduce((n, g) => n + g.items.length, 0)
  return (
    <section id="skills" className="section" aria-labelledby="skills-h">
      <div className="container">
        <SectionHeader index="05" eyebrow="Stack" id="skills-h" title="Technical Skills">
          The languages, frameworks and infrastructure I build with day to day.
        </SectionHeader>
        <p className="mono sk-sum" aria-hidden="true"><span className="dot" />{total} technologies · {skills.length} areas</p>
        <div className="sk-grid">
          {skills.map((g, i) => <Panel key={g.label} g={g} i={i} />)}
        </div>
      </div>
    </section>
  )
}
