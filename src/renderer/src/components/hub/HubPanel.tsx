import { useHubStore } from '../../store/useHubStore'
import { useRef, useCallback } from 'react'

const CATEGORIES = [
  { id: 'qa' as const,       label: 'QA',       icon: '🎯', color: '#ef4444' },
  { id: 'ux' as const,       label: 'UX',       icon: '👁', color: '#8b5cf6' },
  { id: 'dev' as const,      label: '개발',      icon: '⌨',  color: '#60a5fa' },
  { id: 'analysis' as const, label: '분석',      icon: '📊', color: '#f59e0b' },
  { id: 'research' as const, label: '시장조사',   icon: '🔍', color: '#10b981' },
  { id: 'docs' as const,     label: '문서생성',   icon: '📋', color: '#34d399' },
  { id: 'blog' as const,     label: '블로그',    icon: '✏',  color: '#ec4899' },
  { id: 'more' as const,     label: '더보기',    icon: '⚡', color: '#a78bfa' },
]

export default function HubPanel(): JSX.Element {
  const { setMode, selectedCategory, setSelectedCategory, skills, launchSkill } = useHubStore()
  const dragStart = useRef({ x: 0, y: 0 })

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    dragStart.current = { x: e.screenX, y: e.screenY }
    const handleMouseMove = (me: MouseEvent): void => {
      const dx = me.screenX - dragStart.current.x
      const dy = me.screenY - dragStart.current.y
      window.api.dragWindow(dx, dy)
      dragStart.current = { x: me.screenX, y: me.screenY }
    }
    const handleMouseUp = (): void => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      window.api.savePosition()
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  const filteredSkills = selectedCategory
    ? skills.filter((s) => s.category === selectedCategory)
    : []

  const panelStyle: React.CSSProperties = {
    pointerEvents: 'auto',
    width: 400,
    height: 500,
    background: 'rgba(15, 15, 30, 0.92)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    color: 'white',
    fontFamily: "'Segoe UI', sans-serif"
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', cursor: 'move', borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
        onMouseDown={handleDragStart}
      >
        <span style={{
          fontSize: 14, fontWeight: 700,
          background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          GameQA Hub
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setMode('expanded')}
            style={{
              width: 28, height: 28, border: 'none', borderRadius: 6,
              background: 'transparent', color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            ↑
          </button>
          <button
            onClick={() => { setSelectedCategory(null); setMode('mini') }}
            style={{
              width: 28, height: 28, border: 'none', borderRadius: 6,
              background: 'transparent', color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 12, overflow: 'auto' }}>
        {!selectedCategory ? (
          <>
            {/* Category Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const count = skills.filter((s) => s.category === cat.id).length
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '14px 12px', borderRadius: 12, border: `1px solid ${cat.color}33`,
                      background: `${cat.color}15`, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${cat.color}25` }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${cat.color}15` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{cat.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: cat.color }}>{cat.label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{count}개 스킬</span>
                  </button>
                )
              })}
            </div>

            {/* Recent */}
            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingLeft: 4 }}>최근 사용</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {useHubStore.getState().recentSkills.map((name) => {
                  const skill = skills.find((s) => s.name === name)
                  if (!skill) return null
                  return (
                    <button
                      key={name}
                      onClick={() => launchSkill(skill.name, skill.projectPath)}
                      style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 20,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)', cursor: 'pointer'
                      }}
                    >
                      /{name}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Back */}
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'none',
                border: 'none', cursor: 'pointer', marginBottom: 8, padding: '2px 4px'
              }}
            >
              ← 뒤로
            </button>

            {/* Skill List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredSkills.map((skill) => (
                <button
                  key={skill.name}
                  onClick={() => launchSkill(skill.name, skill.projectPath)}
                  style={{
                    textAlign: 'left', padding: 12, borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer', transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                      /{skill.name}
                    </span>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4,
                      background: 'rgba(167,139,250,0.2)', color: '#a78bfa'
                    }}>
                      실행
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {skill.description}
                  </p>
                  {skill.techStack && (
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                      {skill.techStack}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
