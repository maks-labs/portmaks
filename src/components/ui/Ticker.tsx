import { profile } from '../../config/content'

/** Slow marquee of the stack, sitting between the hero and the first section. */
export function Ticker() {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined}>
      {profile.ticker.map((t) => <li key={t}><span aria-hidden="true">◆</span>{t}</li>)}
    </ul>
  )
  return (
    <div className="ticker mono" role="group" aria-label="Core technologies">
      <div className="ticker-track">{row(false)}{row(true)}</div>
    </div>
  )
}
