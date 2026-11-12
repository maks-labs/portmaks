import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GitHubError, fetchAllRepos, isFresh, loadSnapshot, readCache, writeCache,
  type DataSource, type Repo,
} from '../lib/github'
import { site } from '../config/site'

export interface RepoState {
  repos: Repo[]
  status: 'loading' | 'ready' | 'error'
  source: DataSource | null
  updatedAt: number | null
  error: string | null
  refreshing: boolean
  /** Set after a manual refresh finishes: "ok" or "failed" (for visible feedback). */
  lastRefresh: 'ok' | 'failed' | null
}

const initial: RepoState = {
  repos: [], status: 'loading', source: null, updatedAt: null, error: null, refreshing: false, lastRefresh: null,
}

function describe(e: unknown): string {
  if (e instanceof GitHubError && e.resetAt) {
    const mins = Math.max(1, Math.ceil((e.resetAt - Date.now()) / 60000))
    return `${e.message}. Resets in about ${mins} min.`
  }
  return e instanceof Error ? e.message : 'Network error'
}

/**
 * Stale-while-revalidate: show cached data instantly, refetch when older than the TTL,
 * keep showing the last good data if a refresh fails, and fall back to the build-time
 * snapshot when there is nothing else.
 */
export function useRepos(username = site.githubUsername) {
  const [state, setState] = useState<RepoState>(initial)
  const inflight = useRef<AbortController | null>(null)

  const load = useCallback(
    async (manual: boolean) => {
      inflight.current?.abort()
      const ctrl = new AbortController()
      inflight.current = ctrl
      const cached = readCache(username)

      if (!manual && cached && isFresh(cached)) {
        setState((s) => ({ ...s, repos: cached.repos, status: 'ready', source: 'cache', updatedAt: cached.fetchedAt, error: null }))
        return
      }
      setState((s) => ({
        ...s,
        refreshing: true,
        lastRefresh: null,
        ...(cached && s.repos.length === 0 ? { repos: cached.repos, status: 'ready' as const, source: 'cache' as const, updatedAt: cached.fetchedAt } : {}),
      }))

      try {
        const repos = await fetchAllRepos(username, fetch, ctrl.signal)
        writeCache(username, repos)
        setState({ repos, status: 'ready', source: 'live', updatedAt: Date.now(), error: null, refreshing: false, lastRefresh: manual ? 'ok' : null })
      } catch (e) {
        if (ctrl.signal.aborted) return
        const message = describe(e)
        if (cached) {
          setState((s) => ({ ...s, repos: cached.repos, status: 'ready', source: 'cache', updatedAt: cached.fetchedAt, error: message, refreshing: false, lastRefresh: manual ? 'failed' : null }))
          return
        }
        const snap = await loadSnapshot()
        if (snap) {
          setState({ repos: snap.repos, status: 'ready', source: 'snapshot', updatedAt: Date.parse(snap.generatedAt), error: message, refreshing: false, lastRefresh: manual ? 'failed' : null })
        } else {
          setState((s) => ({ ...s, status: 'error', error: message, refreshing: false, lastRefresh: manual ? 'failed' : null }))
        }
      }
    },
    [username],
  )

  useEffect(() => {
    void load(false)
    return () => inflight.current?.abort()
  }, [load])

  return { ...state, refresh: () => load(true), retry: () => { setState(initial); return load(true) } }
}
