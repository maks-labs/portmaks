// Identity, links and data sources. Empty strings are hidden from the UI.
export const site = {
  name: 'Devaansh Makhijani',
  role: 'AI/ML Engineer',
  githubUsername: import.meta.env.VITE_GITHUB_USERNAME || 'maks-labs',
  email: 'devaanshmakhijani@gmail.com',
  linkedin: 'https://www.linkedin.com/in/devaansh-makhijani-a923a6285/',
} as const

export const githubProfileUrl = `https://github.com/${site.githubUsername}`
export const repoUrl = (name: string) => `${githubProfileUrl}/${name}`
/** served from public/; BASE_URL keeps it working under the GitHub Pages sub-path */
export const cvUrl = `${import.meta.env.BASE_URL}CV.pdf`
