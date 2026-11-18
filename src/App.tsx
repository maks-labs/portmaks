import { Nav } from './components/nav/Nav'
import { MatrixRain } from './components/rain/MatrixRain'
import { Fx } from './components/fx/Fx'
import { WakeUp } from './components/intro/WakeUp'
import { MatrixHero } from './components/hero/MatrixHero'
import { Ticker } from './components/ui/Ticker'
import { Profile } from './components/about/Profile'
import { Featured } from './components/projects/Featured'
import { GithubProjects } from './components/projects/GithubProjects'
import { Experience } from './components/experience/Experience'
import { Skills } from './components/skills/Skills'
import { Contact } from './components/contact/Contact'
import { RepoProvider } from './context/RepoContext'

export default function App() {
  return (
    <RepoProvider>
      <a href="#work" className="skip-link">Skip to projects</a>
      <MatrixRain />
      <div className="grade" aria-hidden="true" />
      <Nav />
      <main id="main">
        <MatrixHero />
        <Ticker />
        <Profile />
        <Featured />
        <GithubProjects />
        <Experience />
        <Skills />
        <Contact />
      </main>
      <Fx />
      <WakeUp />
    </RepoProvider>
  )
}
