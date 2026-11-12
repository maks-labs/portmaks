import { useSyncExternalStore } from 'react'
import type { MatrixEngine } from './matrix'

// Tiny store shared by the cold open, the page-wide rain and the hero.
let engine: MatrixEngine | null = null
let formed = false
let introDone = false
let version = 0
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }

export const rainStore = {
  get engine() { return engine },
  get introDone() { return introDone },
  setEngine(e: MatrixEngine | null) { engine = e; version++; emit() },
  markFormed() { formed = true; emit() },
  /** the "Wake up, Neo" cold open has finished (or was skipped / not shown) */
  markIntroDone() {
    if (introDone) return
    introDone = true
    engine?.restart()
    emit()
  },
}

export const useRainFormed = () => useSyncExternalStore(subscribe, () => formed, () => false)
export const useIntroDone = () => useSyncExternalStore(subscribe, () => introDone, () => false)
export const useRainVersion = () => useSyncExternalStore(subscribe, () => version, () => 0)
