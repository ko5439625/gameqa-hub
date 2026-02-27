import { useEffect } from 'react'
import { useHubStore } from './store/useHubStore'
import Dashboard from './components/Dashboard'
import './styles/globals.css'

export default function App(): JSX.Element {
  const { setSkills, setRecentSkills, setGitStatuses, setLoading } = useHubStore()

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        const [skills, recent] = await Promise.all([
          window.api.getSkills(),
          window.api.getRecentSkills()
        ])
        setSkills(skills)
        setRecentSkills(recent)
      } catch (e) {
        console.error('Init error:', e)
      }
      setLoading(false)
    }
    init()

    const unsub1 = window.api.onSkillsUpdated((skills) => setSkills(skills))
    const unsub2 = window.api.onGitStatusUpdated((statuses) => setGitStatuses(statuses))
    return () => { unsub1(); unsub2() }
  }, [setSkills, setRecentSkills, setGitStatuses, setLoading])

  return <Dashboard />
}
