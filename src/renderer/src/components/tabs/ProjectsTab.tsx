import { useEffect } from 'react'
import { useHubStore } from '../../store/useHubStore'

function getDaysAgo(unixSeconds: number): number {
  return Math.floor((Date.now() / 1000 - unixSeconds) / 86400)
}

function formatTimeAgo(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000 - unixSeconds)
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  const days = Math.floor(diff / 86400)
  return `${days}일 전`
}

function getStatusInfo(lastCommitTime?: number): { icon: string; color: string; label: string } {
  if (!lastCommitTime) return { icon: '⚪', color: 'rgba(255,255,255,0.3)', label: '정보 없음' }
  const days = getDaysAgo(lastCommitTime)
  if (days <= 3) return { icon: '🟢', color: '#34d399', label: '활발' }
  if (days <= 7) return { icon: '🟡', color: '#fbbf24', label: '주의' }
  return { icon: '🔴', color: '#f87171', label: '방치' }
}

export default function ProjectsTab(): JSX.Element {
  const { skills, gitStatuses, launchSkill } = useHubStore()
  const projects = skills.filter((s) => s.projectPath)

  useEffect(() => {
    projects.forEach((p) => {
      if (p.projectPath) window.api.getGitStatus(p.projectPath)
    })
  }, [])

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 10,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
      }}>
        프로젝트 ({projects.length})
      </div>
      {projects.map((project) => {
        const git = project.projectPath ? gitStatuses[project.projectPath] : null
        const hasChanges = git && (git.modified > 0 || git.untracked > 0)
        const status = getStatusInfo(git?.lastCommitTime)
        const isStale = git?.lastCommitTime && getDaysAgo(git.lastCommitTime) >= 7

        return (
          <div key={project.name} style={{
            padding: 14, borderRadius: 12,
            border: `1px solid ${isStale ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.06)'}`,
            background: isStale
              ? 'rgba(248,113,113,0.03)'
              : 'rgba(255,255,255,0.03)',
            marginBottom: 8, transition: 'all 0.2s ease'
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12 }}>{status.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>/{project.name}</span>
              </div>
              <button onClick={() => launchSkill(project.name, project.projectPath)}
                style={{
                  fontSize: 10, padding: '4px 14px', borderRadius: 6, border: 'none',
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))',
                  color: '#c4b5fd', cursor: 'pointer', fontWeight: 600, letterSpacing: 0.3,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(96,165,250,0.3))' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))' }}>
                실행
              </button>
            </div>

            {/* Git info row */}
            {git && (
              <div style={{ display: 'flex', gap: 8, fontSize: 10, marginBottom: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ color: '#34d399', fontSize: 12 }}>&#9671;</span> {git.branch}
                </span>
                {hasChanges && (
                  <span style={{
                    color: '#fbbf24', background: 'rgba(251,191,36,0.1)',
                    padding: '1px 6px', borderRadius: 4
                  }}>
                    {git.modified + git.untracked} changes
                  </span>
                )}
                {git.ahead > 0 && <span style={{ color: '#60a5fa' }}>↑{git.ahead}</span>}
                {!hasChanges && !git.ahead && (
                  <span style={{
                    color: '#34d399', background: 'rgba(52,211,153,0.1)',
                    padding: '1px 6px', borderRadius: 4
                  }}>
                    clean
                  </span>
                )}
              </div>
            )}

            {/* Last commit time */}
            {git?.lastCommitTime && (
              <div style={{
                fontSize: 10, marginBottom: 2,
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>
                  최근 커밋: <span style={{ color: status.color }}>{formatTimeAgo(git.lastCommitTime)}</span>
                </span>
                {isStale && (
                  <span style={{
                    fontSize: 9, color: '#f87171',
                    background: 'rgba(248,113,113,0.1)',
                    padding: '1px 6px', borderRadius: 4
                  }}>
                    ⚠️ 방치
                  </span>
                )}
              </div>
            )}

            {/* Tech stack */}
            {project.techStack && (
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{project.techStack}</p>
            )}

            {/* Path */}
            <p style={{
              fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 4,
              fontFamily: 'Consolas, monospace', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {project.projectPath}
            </p>
          </div>
        )
      })}
      {projects.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          프로젝트가 없습니다
        </div>
      )}
    </div>
  )
}
