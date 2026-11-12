// Writes a public snapshot of GitHub repo metadata to public/data/repos.json.
// Used as (a) the offline/rate-limit fallback for the live client fetch and
// (b) the artefact refreshed by the scheduled GitHub Action.
// Only public data is requested. GITHUB_TOKEN (optional, provided automatically
// in Actions) only raises the rate limit; it is never written to the output.
import { writeFile, mkdir } from 'node:fs/promises'

const user = process.env.VITE_GITHUB_USERNAME || process.env.GITHUB_USERNAME || 'maks-labs'
const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

const repos = []
for (let page = 1; page < 20; page++) {
  const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&type=owner&sort=updated&page=${page}`, { headers })
  if (!res.ok) {
    console.error(`GitHub API ${res.status} ${res.statusText}`)
    process.exit(process.env.CI ? 1 : 0) // locally keep the old snapshot; in CI fail loudly
  }
  const batch = await res.json()
  repos.push(...batch)
  if (batch.length < 100) break
}

const out = {
  username: user,
  generatedAt: new Date().toISOString(),
  repos: repos.map((r) => ({
    id: r.id, name: r.name, description: r.description, language: r.language,
    topics: r.topics ?? [], stars: r.stargazers_count, forks: r.forks_count,
    updatedAt: r.pushed_at ?? r.updated_at, url: r.html_url,
    homepage: r.homepage || null, fork: r.fork, archived: r.archived,
  })),
}
await mkdir('public/data', { recursive: true })
await writeFile('public/data/repos.json', JSON.stringify(out, null, 2) + '\n')
console.log(`Wrote ${out.repos.length} repos for ${user}`)
