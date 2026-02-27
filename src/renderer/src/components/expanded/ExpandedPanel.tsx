import { useEffect, useCallback, useRef } from 'react'
import { useHubStore } from '../../store/useHubStore'

export default function ExpandedPanel(): JSX.Element {
  const { setMode, skills, gitStatuses, launchSkill } = useHubStore()
  const dragStart = useRef({ x: 0, y: 0 })
  const projects = skills.filter((s) => s.projectPath)

  useEffect(() => {
    projects.forEach((p) => {
      if (p.projectPath) window.api.getGitStatus(p.projectPath)
    })
  }, [])

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    dragStart.current = { x: e.screenX, y: e.screenY }
    const onMove = (me: MouseEvent): void => {
      window.api.dragWindow(me.screenX - dragStart.current.x, me.screenY - dragStart.current.y)
      dragStart.current = { x: me.screenX, y: me.screenY }
    }
    const onUp = (): void => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      window.api.savePosition()
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'move', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        onMouseDown={handleDragStart}
      >
        <span style={{ fontSize: 14, fontWeight: 700, background: 'linear-gradient(90deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          프로젝트
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setMode('hub')} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14 }}>↓</button>
          <button onClick={() => setMode('mini')} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
        {projects.map((project) => {
          const git = project.projectPath ? gitStatuses[project.projectPath] : null
          return (
            <div key={project.name} style={{ padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>/{project.name}</span>
                <button
                  onClick={() => launchSkill(project.name, project.projectPath)}
                  style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, border: 'none', background: 'rgba(167,139,250,0.2)', color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}
                >실행</button>
              </div>
              {git && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, display: 'flex', gap: 8 }}>
                  <span>🌿 {git.branch}</span>
                  {git.modified > 0 && <span style={{ color: '#fbbf24' }}>M {git.modified}</span>}
                  {git.untracked > 0 && <span style={{ color: '#fbbf24' }}>? {git.untracked}</span>}
                </div>
              )}
              {project.techStack && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{project.techStack}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
