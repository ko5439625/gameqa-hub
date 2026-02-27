import { useEffect, useState } from 'react'
import { useHubStore } from '../../store/useHubStore'

type CommitsByProject = { project: string; commits: Array<{ hash: string; message: string; time: string }> }

const glassCard: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 12,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)'
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8,
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function getDateStr(): string {
  const d = new Date()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} (${days[d.getDay()]})`
}

function getDaysAgo(unixSeconds: number): number {
  return Math.floor((Date.now() / 1000 - unixSeconds) / 86400)
}

function formatTimeAgo(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000 - unixSeconds)
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  const days = Math.floor(diff / 86400)
  return `${days}일 전`
}

type Recommendation = {
  icon: string
  text: string
  color: string
  priority: number
  action?: () => void
}

type Goal = {
  id: string
  text: string
  done: boolean
  weekStart: number
}

type Routine = {
  id: string
  name: string
  days: number[]
  skill: string
  startHour: number
  endHour: number
  enabled: boolean
}

function getWeekStart(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d.getTime()
}

export default function HomeTab(): JSX.Element {
  const { skills, gitStatuses, recentSkills, launchSkill } = useHubStore()

  // Registered projects (독립 관리)
  const [registeredProjects, setRegisteredProjects] = useState<Project[]>([])

  // Daily Standup - fetch yesterday's commits
  const [standupData, setStandupData] = useState<CommitsByProject[]>([])
  const [standupCopied, setStandupCopied] = useState(false)

  // Goal Tracker
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoalText, setNewGoalText] = useState('')
  const [addingGoal, setAddingGoal] = useState(false)

  // Routines
  const [routines, setRoutines] = useState<Routine[]>([])

  // Load registered projects
  useEffect(() => {
    window.api.getRegisteredProjects().then((p) => setRegisteredProjects(p))
  }, [])

  useEffect(() => {
    const fetchCommits = async (): Promise<void> => {
      const results: CommitsByProject[] = []
      for (const p of registeredProjects) {
        const commits = await window.api.getRecentCommits(p.path, 'yesterday')
        if (commits.length > 0) {
          results.push({ project: p.name, commits })
        }
      }
      setStandupData(results)
    }
    if (registeredProjects.length > 0) fetchCommits()
  }, [registeredProjects.length])

  // Load goals
  useEffect(() => {
    window.api.getStore('goals').then((data) => {
      if (Array.isArray(data)) {
        const weekStart = getWeekStart()
        const currentGoals = (data as Goal[]).filter((g) => g.weekStart >= weekStart)
        setGoals(currentGoals)
      }
    })
  }, [])

  // Load routines
  useEffect(() => {
    window.api.getStore('routines').then((data) => {
      if (Array.isArray(data)) setRoutines(data as Routine[])
    })
  }, [])

  const saveGoals = (updated: Goal[]): void => {
    setGoals(updated)
    window.api.setStore('goals', updated)
  }

  const addGoal = (): void => {
    if (!newGoalText.trim()) return
    const goal: Goal = { id: Date.now().toString(), text: newGoalText.trim(), done: false, weekStart: getWeekStart() }
    saveGoals([...goals, goal])
    setNewGoalText('')
    setAddingGoal(false)
  }

  const toggleGoal = (id: string): void => {
    saveGoals(goals.map((g) => g.id === id ? { ...g, done: !g.done } : g))
  }

  const deleteGoal = (id: string): void => {
    saveGoals(goals.filter((g) => g.id !== id))
  }

  const deleteProject = (id: string): void => {
    const updated = registeredProjects.filter((p) => p.id !== id)
    setRegisteredProjects(updated)
    window.api.saveRegisteredProjects(updated)
  }

  const standupText = standupData.length > 0
    ? '어제 한 일:\n' + standupData.map((p) =>
        `• ${p.project}: ${p.commits.map((c) => c.message).join(', ')}`
      ).join('\n')
    : ''

  const copyStandup = (): void => {
    if (!standupText) return
    navigator.clipboard.writeText(standupText)
    setStandupCopied(true)
    setTimeout(() => setStandupCopied(false), 2000)
  }

  // Build smart recommendations
  const recommendations: Recommendation[] = []

  // Rule: Stale projects (7+ days)
  for (const project of registeredProjects) {
    const git = gitStatuses[project.path]
    if (!git?.lastCommitTime) continue
    const days = getDaysAgo(git.lastCommitTime)
    if (days >= 7) {
      recommendations.push({
        icon: '🔴',
        text: `${project.name} ${days}일째 방치`,
        color: '#f87171',
        priority: days >= 14 ? 0 : 1
      })
    } else if (days >= 3) {
      recommendations.push({
        icon: '🟡',
        text: `${project.name} ${days}일째 미작업`,
        color: '#fbbf24',
        priority: 2
      })
    }
  }

  // Rule: Unpushed changes
  for (const project of registeredProjects) {
    const git = gitStatuses[project.path]
    if (!git) continue
    if (git.ahead > 0) {
      recommendations.push({
        icon: '⬆️',
        text: `${project.name}에 push 안 된 커밋 ${git.ahead}개`,
        color: '#60a5fa',
        priority: 3
      })
    }
  }

  // Rule: Routine-based recommendations (요일 + 시간 필터)
  const todayDayIdx = new Date().getDay()
  const currentHour = new Date().getHours()
  for (const routine of routines) {
    if (!routine.enabled || !routine.days.includes(todayDayIdx)) continue
    const start = routine.startHour ?? 0
    const end = routine.endHour ?? 23
    if (currentHour < start || currentHour >= end) continue
    const skill = skills.find((s) => s.name === routine.skill)
    recommendations.push({
      icon: '🔄',
      text: `${routine.name} (/${routine.skill})`,
      color: '#fb923c',
      priority: 3,
      action: skill ? () => launchSkill(skill.name, skill.projectPath) : undefined
    })
  }

  // Rule: Goal progress warning
  const doneCount = goals.filter((g) => g.done).length
  const totalGoals = goals.length
  if (totalGoals > 0) {
    const dayOfWeek = new Date().getDay()
    const progressPct = doneCount / totalGoals
    if (dayOfWeek >= 4 && progressPct < 0.5) {
      recommendations.push({
        icon: '🎯',
        text: `주간 목표 ${Math.round(progressPct * 100)}% - 마감이 다가옵니다`,
        color: '#f59e0b',
        priority: 2
      })
    }
  }

  // Rule: Day-based habit
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const today = dayNames[new Date().getDay()]
  if (recentSkills.length > 0 && today !== '토' && today !== '일') {
    recommendations.push({
      icon: '🔵',
      text: `최근 자주 사용: /${recentSkills[0]}`,
      color: '#818cf8',
      priority: 5,
      action: () => {
        const skill = skills.find((s) => s.name === recentSkills[0])
        if (skill) launchSkill(skill.name, skill.projectPath)
      }
    })
  }

  recommendations.sort((a, b) => a.priority - b.priority)

  // Project summary - only count registered projects with actual git data
  const projectsWithGit = registeredProjects.filter((p) => {
    const git = gitStatuses[p.path]
    return git?.lastCommitTime
  })
  const activeCount = projectsWithGit.filter((p) => getDaysAgo(gitStatuses[p.path].lastCommitTime!) <= 3).length
  const cautionCount = projectsWithGit.filter((p) => {
    const days = getDaysAgo(gitStatuses[p.path].lastCommitTime!)
    return days > 3 && days <= 7
  }).length
  const staleCount = projectsWithGit.filter((p) => getDaysAgo(gitStatuses[p.path].lastCommitTime!) > 7).length

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontSize: 16, fontWeight: 700, letterSpacing: -0.3,
          background: 'linear-gradient(135deg, #c4b5fd, #93c5fd)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          {getGreeting()}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          {getDateStr()}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{
          ...glassCard, padding: '10px 12px', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(52,211,153,0.06), rgba(52,211,153,0.02))',
          border: '1px solid rgba(52,211,153,0.1)'
        }} title="3일 이내 커밋이 있는 프로젝트">
          <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>{activeCount}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>🟢 활발</div>
        </div>
        <div style={{
          ...glassCard, padding: '10px 12px', textAlign: 'center',
          background: cautionCount + staleCount > 0
            ? 'linear-gradient(135deg, rgba(251,191,36,0.06), rgba(251,191,36,0.02))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          border: `1px solid ${cautionCount + staleCount > 0 ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.06)'}`
        }} title="3~7일 미작업 프로젝트">
          <div style={{ fontSize: 18, fontWeight: 700, color: cautionCount > 0 ? '#fbbf24' : 'rgba(255,255,255,0.2)' }}>
            {cautionCount}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>🟡 주의</div>
        </div>
        <div style={{
          ...glassCard, padding: '10px 12px', textAlign: 'center',
          background: staleCount > 0
            ? 'linear-gradient(135deg, rgba(248,113,113,0.06), rgba(248,113,113,0.02))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          border: `1px solid ${staleCount > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)'}`
        }} title="7일 이상 방치된 프로젝트">
          <div style={{ fontSize: 18, fontWeight: 700, color: staleCount > 0 ? '#f87171' : 'rgba(255,255,255,0.2)' }}>
            {staleCount}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>🔴 방치</div>
        </div>
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={sectionLabel}>오늘의 추천</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recommendations.slice(0, 4).map((rec, i) => (
              <button key={i} onClick={rec.action}
                style={{
                  ...glassCard, display: 'flex', alignItems: 'center', gap: 10,
                  cursor: rec.action ? 'pointer' : 'default',
                  width: '100%', textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.borderColor = `${rec.color}30`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                }}>
                <span style={{ fontSize: 14 }}>{rec.icon}</span>
                <span style={{ fontSize: 12, color: rec.color, fontWeight: 500 }}>{rec.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Goal Tracker */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={sectionLabel}>주간 목표</div>
          {totalGoals > 0 && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
              {doneCount}/{totalGoals}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {totalGoals > 0 && (
          <div style={{
            height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)',
            overflow: 'hidden', marginBottom: 10
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${(doneCount / totalGoals) * 100}%`,
              background: doneCount === totalGoals
                ? 'linear-gradient(90deg, #34d399, #22d3ee)'
                : 'linear-gradient(90deg, #a78bfa, #60a5fa)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}

        {/* Goal items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {goals.map((goal) => (
            <div key={goal.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <button onClick={() => toggleGoal(goal.id)}
                style={{
                  width: 16, height: 16, borderRadius: 4, border: 'none',
                  background: goal.done
                    ? 'linear-gradient(135deg, #a78bfa, #60a5fa)'
                    : 'rgba(255,255,255,0.08)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: 'white', flexShrink: 0
                }}>
                {goal.done ? '✓' : ''}
              </button>
              <span style={{
                flex: 1, fontSize: 11, color: goal.done ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
                textDecoration: goal.done ? 'line-through' : 'none'
              }}>
                {goal.text}
              </span>
              <button onClick={() => deleteGoal(goal.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 10, color: 'rgba(255,255,255,0.15)', padding: '0 2px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.15)' }}>
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add goal */}
        {addingGoal ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addGoal(); if (e.key === 'Escape') setAddingGoal(false) }}
              placeholder="목표 입력..."
              autoFocus
              style={{
                flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: 11,
                border: '1px solid rgba(167,139,250,0.3)', background: 'rgba(255,255,255,0.04)',
                color: 'white', outline: 'none', fontFamily: 'Segoe UI, sans-serif'
              }} />
            <button onClick={addGoal}
              style={{
                padding: '5px 10px', borderRadius: 6, border: 'none',
                background: 'rgba(167,139,250,0.2)', color: '#c4b5fd',
                cursor: 'pointer', fontSize: 10, fontWeight: 600
              }}>
              추가
            </button>
          </div>
        ) : (
          <button onClick={() => setAddingGoal(true)}
            style={{
              marginTop: 6, width: '100%', padding: '5px', borderRadius: 6,
              border: '1px dashed rgba(255,255,255,0.08)', background: 'transparent',
              color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 10,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'; e.currentTarget.style.color = '#c4b5fd' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}>
            + 목표 추가
          </button>
        )}
      </div>

      {/* Daily Standup */}
      {standupData.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={sectionLabel}>Daily Standup</div>
          <div style={{
            ...glassCard,
            background: 'linear-gradient(135deg, rgba(96,165,250,0.04), rgba(167,139,250,0.04))',
            border: '1px solid rgba(96,165,250,0.1)'
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>어제 한 일:</div>
            {standupData.map((p) => (
              <div key={p.project} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: '#93c5fd', fontWeight: 600, marginBottom: 2 }}>
                  • {p.project}
                </div>
                {p.commits.map((c) => (
                  <div key={c.hash} style={{
                    fontSize: 10.5, color: 'rgba(255,255,255,0.55)',
                    paddingLeft: 14, lineHeight: 1.6
                  }}>
                    {c.message}
                  </div>
                ))}
              </div>
            ))}
            <button onClick={copyStandup}
              style={{
                marginTop: 8, width: '100%', padding: '6px', borderRadius: 6, border: 'none',
                background: standupCopied
                  ? 'rgba(52,211,153,0.15)'
                  : 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(167,139,250,0.15))',
                color: standupCopied ? '#34d399' : '#93c5fd',
                cursor: 'pointer', fontSize: 10, fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { if (!standupCopied) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(96,165,250,0.25), rgba(167,139,250,0.25))' }}
              onMouseLeave={(e) => { if (!standupCopied) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(167,139,250,0.15))' }}>
              {standupCopied ? '✓ 복사됨!' : '📋 슬랙에 붙여넣기용 복사'}
            </button>
          </div>
        </div>
      )}

      {/* Project Status Overview */}
      <div style={{ marginBottom: 16 }}>
        <div style={sectionLabel}>프로젝트 현황</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {registeredProjects.length === 0 && (
            <div style={{ textAlign: 'center', padding: '16px 12px', color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
              등록된 프로젝트가 없습니다
              <div style={{ fontSize: 10, marginTop: 4, color: 'rgba(255,255,255,0.12)' }}>
                Claude Code에서 /프로젝트등록 으로 추가하세요
              </div>
            </div>
          )}
          {registeredProjects.map((project) => {
            const git = gitStatuses[project.path]
            const days = git?.lastCommitTime ? getDaysAgo(git.lastCommitTime) : null
            const statusIcon = days === null ? '⚪' : days <= 3 ? '🟢' : days <= 7 ? '🟡' : '🔴'
            const timeStr = git?.lastCommitTime ? formatTimeAgo(git.lastCommitTime) : '-'
            return (
              <div key={project.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 10 }}>{statusIcon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{project.name}</div>
                    {project.techStack && (
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {project.techStack}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{timeStr}</span>
                  {git && git.modified + git.untracked > 0 && (
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                      {git.modified + git.untracked}
                    </span>
                  )}
                  <button onClick={() => deleteProject(project.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 10, color: 'rgba(255,255,255,0.1)', padding: '0 2px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.1)' }}>
                    ×
                  </button>
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* Quick Launch - Recent Skills */}
      {recentSkills.length > 0 && (
        <div>
          <div style={sectionLabel}>빠른 실행</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {recentSkills.slice(0, 6).map((name) => {
              const skill = skills.find((s) => s.name === name)
              if (!skill) return null
              return (
                <button key={name} onClick={() => launchSkill(skill.name, skill.projectPath)}
                  style={{
                    fontSize: 11, padding: '5px 14px', borderRadius: 20,
                    background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(96,165,250,0.1))',
                    border: '1px solid rgba(167,139,250,0.2)', color: '#c4b5fd',
                    cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(96,165,250,0.1))' }}>
                  /{name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
