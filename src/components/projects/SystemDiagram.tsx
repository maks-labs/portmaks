import { useEffect, useMemo, useRef } from 'react'
import { onScrollFrame, progress } from '../../lib/scrollLoop'
import type { DNode, DSpec } from './diagrams'

const W = 780
const H = 540
const hOf = (n: DNode) => (n.kind === 'mini' ? 20 : n.sub ? 36 : 24)

/** Cubic connector between the facing sides of two boxes. */
function route(a: DNode, b: DNode): string {
  const ah = hOf(a), bh = hOf(b)
  const ax = a.x + a.w / 2, ay = a.y + ah / 2, bx = b.x + b.w / 2, by = b.y + bh / 2
  const dx = bx - ax, dy = by - ay
  const gapX = dx > 0 ? b.x - (a.x + a.w) : a.x - (b.x + b.w)
  if (gapX > 6 && Math.abs(dx) > Math.abs(dy) * 0.6) {
    const x1 = dx > 0 ? a.x + a.w : a.x, x2 = dx > 0 ? b.x : b.x + b.w
    const mx = (x1 + x2) / 2
    return `M${x1} ${ay} C${mx} ${ay} ${mx} ${by} ${x2} ${by}`
  }
  const y1 = dy > 0 ? a.y + ah : a.y, y2 = dy > 0 ? b.y : b.y + bh
  const my = (y1 + y2) / 2
  return `M${ax} ${y1} C${ax} ${my} ${bx} ${my} ${bx} ${y2}`
}

// When each element switches on as the diagram scrolls into view: sweeps left → right, top → bottom.
const at = (x: number, y: number) => Math.min(0.92, (x / W) * 0.62 + (y / H) * 0.3)

export function SystemDiagram({ spec, animate, assemble }: { spec: DSpec; animate: boolean; assemble: boolean }) {
  const svg = useRef<SVGSVGElement>(null)
  const { paths, nodeT } = useMemo(() => {
    const byId = new Map(spec.nodes.map((n) => [n.id, n]))
    const nodeT = new Map(spec.nodes.map((n) => [n.id, at(n.x, n.y)]))
    const paths = spec.edges.map((e, i) => ({ ...e, i, d: route(byId.get(e.a)!, byId.get(e.b)!), t: Math.max(nodeT.get(e.a)!, nodeT.get(e.b)!) }))
    return { paths, nodeT }
  }, [spec])

  // scroll position drives assembly: a single CSS variable, no React renders
  useEffect(() => {
    const el = svg.current
    if (!el) return
    if (!assemble) { el.style.setProperty('--p', '1'); return }
    return onScrollFrame((_, vh) => el.style.setProperty('--p', progress(el, vh, 0.95, 0.75).toFixed(3)))
  }, [assemble])

  return (
    <svg ref={svg} className="sys" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={spec.title}>
      <defs>
        <pattern id={`grid-${spec.nodes[0].id}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" className="sys-grid" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#grid-${spec.nodes[0].id})`} />

      {spec.groups.map((g) => (
        <g key={g.label} className="sys-g" style={{ '--t': at(g.x, g.y) * 0.8 } as React.CSSProperties}>
          <rect className="sys-group" x={g.x} y={g.y} width={g.w} height={g.h} />
          <text className="sys-glabel" x={g.x + 10} y={g.y + 15}>{g.label}</text>
        </g>
      ))}

      {paths.map((p) => (
        <path key={p.i} id={`${spec.nodes[0].id}-e${p.i}`} d={p.d} pathLength={1} className={`sys-edge ${p.kind ?? ''}`} style={{ '--t': p.t } as React.CSSProperties} />
      ))}
      {animate && paths.map((p) => (
        <circle key={p.i} r={p.kind === 'fan' ? 1.6 : 2.1} className={`sys-pkt ${p.kind ?? ''}`}>
          <animateMotion dur={`${1.8 + (p.i % 5) * 0.45}s`} begin={`${(p.i * 0.37) % 2.4}s`} repeatCount="indefinite" path={p.d} />
        </circle>
      ))}
      {paths.filter((p) => p.label).map((p) => (
        <text key={p.i} className="sys-elabel" dy={-3}>
          <textPath href={`#${spec.nodes[0].id}-e${p.i}`} startOffset="50%" textAnchor="middle">{p.label}</textPath>
        </text>
      ))}

      {spec.nodes.map((n) => {
        const h = hOf(n)
        return (
          <g key={n.id} className={`sys-node ${n.kind ?? ''}`} style={{ '--t': nodeT.get(n.id) } as React.CSSProperties}>
            <rect x={n.x} y={n.y} width={n.w} height={h} />
            {n.kind !== 'mini' && <path className="sys-tick" d={`M${n.x} ${n.y + 6}V${n.y}H${n.x + 6}`} />}
            <text className="sys-label" x={n.x + n.w / 2} y={n.y + (n.sub ? 15 : h / 2 + 3.2)} textAnchor="middle">{n.label}</text>
            {n.sub && <text className="sys-sub" x={n.x + n.w / 2} y={n.y + 27} textAnchor="middle">{n.sub}</text>}
          </g>
        )
      })}
    </svg>
  )
}
