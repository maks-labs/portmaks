import { createContext, useContext, type ReactNode } from 'react'
import { useRepos } from '../hooks/useRepos'

type Ctx = ReturnType<typeof useRepos>
const RepoContext = createContext<Ctx | null>(null)

/** One GitHub fetch per page load, shared by the hero stats, the archive and the capability panel. */
export function RepoProvider({ children }: { children: ReactNode }) {
  const value = useRepos()
  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>
}

export function useRepoData(): Ctx {
  const ctx = useContext(RepoContext)
  if (!ctx) throw new Error('useRepoData must be used inside <RepoProvider>')
  return ctx
}
