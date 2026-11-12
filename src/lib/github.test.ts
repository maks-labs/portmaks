import { describe, expect, it, vi } from 'vitest'
import { GitHubError, fetchAllRepos, normalizeRepo, relativeTime, safeHomepage } from './github'

const raw = (i: number, extra: Record<string, unknown> = {}) => ({
  id: i, name: `repo-${i}`, description: null, language: 'Python', topics: [],
  stargazers_count: i, forks_count: 0, pushed_at: `2026-01-${String(i).padStart(2, '0')}T00:00:00Z`,
  html_url: `https://github.com/u/repo-${i}`, homepage: '', fork: false, archived: false, ...extra,
})

const res = (body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) =>
  new Response(JSON.stringify(body), { status: init.status ?? 200, headers: init.headers })

describe('fetchAllRepos', () => {
  it('follows pagination until a short page', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => raw(i + 1))
    const page2 = [raw(101)]
    const f = vi.fn().mockResolvedValueOnce(res(page1)).mockResolvedValueOnce(res(page2))
    const repos = await fetchAllRepos('u', f as unknown as typeof fetch)
    expect(repos).toHaveLength(101)
    expect(f).toHaveBeenCalledTimes(2)
    expect(String(f.mock.calls[1][0])).toContain('page=2')
  })

  it('reports rate limiting with the reset time', async () => {
    const f = vi.fn().mockResolvedValue(res({}, { status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800000000' } }))
    await expect(fetchAllRepos('u', f as unknown as typeof fetch)).rejects.toMatchObject({ status: 403, resetAt: 1800000000000 })
  })

  it('maps 404 to a clear error', async () => {
    const f = vi.fn().mockResolvedValue(res({}, { status: 404 }))
    await expect(fetchAllRepos('ghost', f as unknown as typeof fetch)).rejects.toBeInstanceOf(GitHubError)
  })
})

describe('normalizeRepo', () => {
  it('maps API fields and nulls blank homepages', () => {
    const r = normalizeRepo(raw(3, { homepage: '  ' }))
    expect(r).toMatchObject({ name: 'repo-3', stars: 3, homepage: null, updatedAt: '2026-01-03T00:00:00Z' })
  })
})

describe('helpers', () => {
  it('only accepts http(s) homepages', () => {
    expect(safeHomepage('example.com')).toBe('https://example.com/')
    expect(safeHomepage('javascript:alert(1)')).toBeNull()
    expect(safeHomepage(null)).toBeNull()
  })
  it('formats relative time', () => {
    const now = Date.parse('2026-10-18T00:00:00Z')
    expect(relativeTime('2026-10-17T23:59:30Z', now)).toBe('just now')
    expect(relativeTime('2026-10-17T22:00:00Z', now)).toBe('2 hrs ago')
    expect(relativeTime('2026-10-17T00:00:00Z', now)).toBe('1 day ago')
  })
})
