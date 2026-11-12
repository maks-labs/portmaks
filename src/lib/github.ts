export interface Repo {
  id: number
  name: string
  description: string | null
  language: string | null
  topics: string[]
  stars: number
  forks: number
  updatedAt: string
  url: string
  homepage: string | null
  fork: boolean
  archived: boolean
}

export type DataSource = 'live' | 'cache' | 'snapshot'

export interface Snapshot {
  username: string
  generatedAt: string
  repos: Repo[]
}

interface CacheEntry {
  repos: Repo[]
  fetchedAt: number
}

export class GitHubError extends Error {
  constructor(message: string, public status: number, public resetAt?: number) {
    super(message)
    this.name = 'GitHubError'
  }
}

export const CACHE_TTL_MS = 15 * 60 * 1000
const PAGE_SIZE = 100
const MAX_PAGES = 10

const cacheKey = (user: string) => `gh-repos:v1:${user.toLowerCase()}`

type RawRepo = Record<string, unknown>

export function normalizeRepo(r: RawRepo): Repo {
  return {
    id: Number(r.id),
    name: String(r.name),
    description: (r.description as string | null) ?? null,
    language: (r.language as string | null) ?? null,
    topics: Array.isArray(r.topics) ? (r.topics as string[]) : [],
    stars: Number(r.stargazers_count ?? r.stars ?? 0),
    forks: Number(r.forks_count ?? r.forks ?? 0),
    updatedAt: String(r.pushed_at ?? r.updatedAt ?? r.updated_at),
    url: String(r.html_url ?? r.url),
    homepage: typeof r.homepage === 'string' && r.homepage.trim() ? r.homepage.trim() : null,
    fork: Boolean(r.fork),
    archived: Boolean(r.archived),
  }
}

/** Fetch every public, owner-type repository, following pagination. */
export async function fetchAllRepos(
  username: string,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<Repo[]> {
  const all: Repo[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=${PAGE_SIZE}&page=${page}&sort=updated&type=owner`
    const res = await fetchImpl(url, { headers: { Accept: 'application/vnd.github+json' }, signal })
    if (!res.ok) {
      const remaining = res.headers.get('x-ratelimit-remaining')
      const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000 || undefined
      if (res.status === 403 || res.status === 429) {
        throw new GitHubError(
          remaining === '0' ? 'GitHub API rate limit reached' : 'GitHub API refused the request',
          res.status,
          reset,
        )
      }
      if (res.status === 404) throw new GitHubError(`GitHub user "${username}" not found`, 404)
      throw new GitHubError(`GitHub API error ${res.status}`, res.status)
    }
    const batch = (await res.json()) as RawRepo[]
    all.push(...batch.map(normalizeRepo))
    if (batch.length < PAGE_SIZE) break
  }
  return all
}

export function readCache(user: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(user))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    return Array.isArray(parsed.repos) ? parsed : null
  } catch {
    return null
  }
}

export function writeCache(user: string, repos: Repo[]): void {
  try {
    localStorage.setItem(cacheKey(user), JSON.stringify({ repos, fetchedAt: Date.now() } satisfies CacheEntry))
  } catch {
    /* storage unavailable or full — caching is best-effort */
  }
}

export const isFresh = (entry: CacheEntry, now = Date.now()) => now - entry.fetchedAt < CACHE_TTL_MS

/** Static snapshot produced by scripts/sync-repos.mjs — last-resort fallback. */
export async function loadSnapshot(fetchImpl: typeof fetch = fetch): Promise<Snapshot | null> {
  try {
    const res = await fetchImpl(`${import.meta.env.BASE_URL}data/repos.json`)
    if (!res.ok) return null
    const data = (await res.json()) as Snapshot
    return Array.isArray(data.repos) ? data : null
  } catch {
    return null
  }
}

/** Only http(s) homepages are treated as demo links. */
export function safeHomepage(url: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null
  } catch {
    return null
  }
}

export function relativeTime(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  const units: [number, string][] = [[60, 'min'], [3600, 'hr'], [86400, 'day'], [2592000, 'mo'], [31536000, 'yr']]
  let label = 'min', div = 60
  for (const [d, l] of units) if (s >= d) { div = d; label = l }
  const n = Math.floor(s / div)
  return `${n} ${label}${n === 1 || label === 'mo' ? '' : 's'} ago`
}
