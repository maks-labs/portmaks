// One rAF-batched scroll/resize loop shared by every scroll-driven effect, so the page never
// stacks dozens of listeners and every effect reads layout in the same frame.
type Fn = (y: number, vh: number) => void
const subs = new Set<Fn>()
let queued = false
let bound = false

const run = () => {
  queued = false
  const y = window.scrollY
  const vh = window.innerHeight
  subs.forEach((f) => f(y, vh))
}
const kick = () => {
  if (queued) return
  queued = true
  requestAnimationFrame(run)
}

export function onScrollFrame(fn: Fn): () => void {
  subs.add(fn)
  if (!bound) {
    bound = true
    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', kick)
  }
  kick()
  return () => { subs.delete(fn) }
}

/** Progress (0..1) of an element moving from `start` to `end`, both measured as fractions of viewport height from the top. */
export function progress(el: Element, vh: number, start = 1, end = 0): number {
  const r = el.getBoundingClientRect()
  const from = vh * start
  const to = vh * end - r.height
  return Math.min(1, Math.max(0, (from - r.top) / (from - to || 1)))
}
