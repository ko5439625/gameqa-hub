import { useEffect, useState } from 'react'
import { useHubStore } from '../../store/useHubStore'
import LinksTab from './LinksTab'
import ImagesTab from './ImagesTab'

type SubPage = 'menu' | 'links' | 'images' | 'stats' | 'api-settings' | 'ideas' | 'routines'

const menuItems: Array<{ id: SubPage; icon: string; label: string; desc: string; color: string }> = [
  { id: 'links', icon: '🔗', label: 'Links', desc: '즐겨찾기 관리', color: '#60a5fa' },
  { id: 'images', icon: '🖼', label: 'Images', desc: '이미지 붙여넣기/관리', color: '#a78bfa' },
  { id: 'ideas', icon: '💡', label: '아이디어 백업', desc: '채택 아이디어 월별 자동 저장', color: '#f472b6' },
  { id: 'stats', icon: '📊', label: '통계', desc: '스킬 사용량, 활동 리포트', color: '#34d399' },
  { id: 'routines', icon: '🔄', label: '루틴', desc: '요일별 반복 작업 설정', color: '#fb923c' },
  { id: 'api-settings', icon: '🔑', label: 'API 설정', desc: 'Supabase 등 연동 관리', color: '#fbbf24' }
]

const backBtnStyle: React.CSSProperties = {
  fontSize: 11, color: 'rgba(255,255,255,0.35)', background: 'none',
  border: 'none', cursor: 'pointer', padding: '10px 16px',
  textAlign: 'left', transition: 'color 0.15s',
  borderBottom: '1px solid rgba(255,255,255,0.04)', width: '100%'
}

function SubPageWrapper({ onBack, children }: { onBack: () => void; children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <button onClick={onBack} style={backBtnStyle}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
        ← 더보기
      </button>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
    </div>
  )
}

// --- Stats Sub-page ---
function StatsPage(): JSX.Element {
  const [logs, setLogs] = useState<Array<{ skill: string; time: number }>>([])

  useEffect(() => {
    window.api.getSkillLogs().then(setLogs)
  }, [])

  // Calculate weekly stats
  const weekAgo = Date.now() - 7 * 86400000
  const weekLogs = logs.filter((l) => l.time >= weekAgo)

  const skillCounts: Record<string, number> = {}
  for (const log of weekLogs) {
    skillCounts[log.skill] = (skillCounts[log.skill] || 0) + 1
  }

  const sorted = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])
  const maxCount = sorted.length > 0 ? sorted[0][1] : 1

  // Daily activity (last 7 days)
  const dailyCounts: number[] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0); dayStart.setDate(dayStart.getDate() - i)
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1)
    dailyCounts.push(logs.filter((l) => l.time >= dayStart.getTime() && l.time < dayEnd.getTime()).length)
  }
  const maxDaily = Math.max(...dailyCounts, 1)
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']
  const todayIdx = new Date().getDay()

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 12,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
      }}>
        이번 주 스킬 사용량
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          아직 사용 기록이 없습니다
          <div style={{ fontSize: 10, marginTop: 4, color: 'rgba(255,255,255,0.12)' }}>
            스킬을 실행하면 자동으로 기록됩니다
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {sorted.map(([skill, count]) => (
            <div key={skill}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>/{skill}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{count}회</span>
              </div>
              <div style={{
                height: 6, borderRadius: 3,
                background: 'rgba(255,255,255,0.04)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${(count / maxCount) * 100}%`,
                  background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Daily activity chart */}
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 12,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
      }}>
        일별 활동
      </div>
      <div style={{
        display: 'flex', gap: 6, alignItems: 'flex-end', height: 80,
        padding: '0 4px'
      }}>
        {dailyCounts.map((count, i) => {
          const dayIdx = (todayIdx - 6 + i + 7) % 7
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>{count || ''}</span>
              <div style={{
                width: '100%', borderRadius: 3,
                height: `${Math.max((count / maxDaily) * 50, count > 0 ? 4 : 0)}px`,
                background: count > 0
                  ? 'linear-gradient(180deg, #a78bfa, #60a5fa)'
                  : 'rgba(255,255,255,0.04)',
                transition: 'height 0.3s ease'
              }} />
              <span style={{
                fontSize: 9,
                color: i === 6 ? '#c4b5fd' : 'rgba(255,255,255,0.25)'
              }}>
                {dayLabels[dayIdx]}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{
        marginTop: 16, padding: '10px 12px', borderRadius: 8,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center'
      }}>
        총 {logs.length}건 기록 · 이번 주 {weekLogs.length}건
      </div>
    </div>
  )
}

// --- API Settings Sub-page ---
function ApiSettingsPage(): JSX.Element {
  const [config, setConfig] = useState<Record<string, Record<string, string>>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.getStore('apiConfig').then((data) => {
      if (data && typeof data === 'object') setConfig(data as Record<string, Record<string, string>>)
    })
  }, [])

  const updateField = (service: string, field: string, value: string): void => {
    setConfig((prev) => ({
      ...prev,
      [service]: { ...(prev[service] || {}), [field]: value }
    }))
  }

  const handleSave = (): void => {
    window.api.setStore('apiConfig', config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
    color: 'white', fontSize: 11, outline: 'none', fontFamily: 'Segoe UI, sans-serif',
    transition: 'border-color 0.2s'
  }

  const services = [
    {
      id: 'supabase', label: 'Supabase', icon: '🟢', color: '#34d399',
      fields: [
        { key: 'url', label: 'URL', placeholder: 'https://xxx.supabase.co' },
        { key: 'anonKey', label: 'Anon Key', placeholder: 'eyJ...', secret: true }
      ]
    }
  ]

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 12,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
      }}>
        API 연동 설정
      </div>

      {services.map((svc) => (
        <div key={svc.id} style={{
          padding: 14, borderRadius: 12, marginBottom: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>{svc.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: svc.color }}>{svc.label}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {svc.fields.map((f) => (
              <div key={f.key}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>{f.label}</div>
                <input
                  type={f.secret ? 'password' : 'text'}
                  placeholder={f.placeholder}
                  value={config[svc.id]?.[f.key] || ''}
                  onChange={(e) => updateField(svc.id, f.key, e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = `${svc.color}50` }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleSave}
        style={{
          width: '100%', padding: '10px', borderRadius: 8, border: 'none',
          background: saved
            ? 'rgba(52,211,153,0.15)'
            : 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))',
          color: saved ? '#34d399' : '#c4b5fd',
          cursor: 'pointer', fontSize: 11, fontWeight: 600,
          transition: 'all 0.2s ease', letterSpacing: 0.3
        }}
        onMouseEnter={(e) => { if (!saved) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(96,165,250,0.3))' }}
        onMouseLeave={(e) => { if (!saved) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))' }}>
        {saved ? '✓ 저장됨!' : '저장'}
      </button>

      <div style={{
        marginTop: 10, fontSize: 9, color: 'rgba(255,255,255,0.15)', textAlign: 'center', lineHeight: 1.5
      }}>
        설정은 로컬에 안전하게 저장됩니다 (Git 미포함)
      </div>
    </div>
  )
}

// --- Ideas Backup Sub-page ---
function IdeasPage(): JSX.Element {
  const [files, setFiles] = useState<Array<{ name: string; month: string }>>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    window.api.getIdeaFiles().then((f) => {
      setFiles(f)
      if (f.length > 0) {
        setSelectedFile(f[0].name)
        window.api.getIdeaContent(f[0].name).then(setContent)
      }
    })
  }, [])

  const selectFile = (name: string): void => {
    setSelectedFile(name)
    window.api.getIdeaContent(name).then(setContent)
  }

  // Parse markdown ideas from content
  const ideas = content.split('---').map((s) => s.trim()).filter(Boolean)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 12,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
      }}>
        아이디어 히스토리
      </div>

      {files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          아직 저장된 아이디어가 없습니다
          <div style={{ fontSize: 10, marginTop: 4, color: 'rgba(255,255,255,0.12)' }}>
            /아이디어 스킬에서 채택 시 자동 저장됩니다
          </div>
        </div>
      ) : (
        <>
          {/* Month tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {files.map((f) => (
              <button key={f.name} onClick={() => selectFile(f.name)}
                style={{
                  fontSize: 11, padding: '4px 12px', borderRadius: 16,
                  background: selectedFile === f.name
                    ? 'linear-gradient(135deg, rgba(244,114,182,0.2), rgba(167,139,250,0.2))'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedFile === f.name ? 'rgba(244,114,182,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  color: selectedFile === f.name ? '#f472b6' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s'
                }}>
                {f.month}
              </button>
            ))}
          </div>

          {/* Ideas list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ideas.map((block, i) => {
              const lines = block.split('\n').filter(Boolean)
              const title = lines.find((l) => l.startsWith('###'))?.replace(/^###\s*/, '') || `아이디어 ${i + 1}`
              const desc = lines.find((l) => l.includes('**설명**'))?.replace(/.*\*\*설명\*\*:\s*/, '') || ''
              const date = lines.find((l) => l.includes('**날짜**'))?.replace(/.*\*\*날짜\*\*:\s*/, '') || ''
              const difficulty = lines.find((l) => l.includes('**난이도**'))?.replace(/.*\*\*난이도\*\*:\s*/, '') || ''
              const stack = lines.find((l) => l.includes('**기술 스택**'))?.replace(/.*\*\*기술 스택\*\*:\s*/, '') || ''

              return (
                <div key={i} style={{
                  padding: 12, borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f472b6', marginBottom: 4 }}>
                    {title}
                  </div>
                  {desc && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 6, lineHeight: 1.5 }}>{desc}</div>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {date && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{date}</span>}
                    {difficulty && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{difficulty}</span>}
                    {stack && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{stack}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// --- Routines Sub-page ---
type Routine = {
  id: string
  name: string
  days: number[] // 0=일 ~ 6=토
  skill: string
  startHour: number // 시작 시간 (0~23)
  endHour: number   // 종료 시간 (0~23)
  enabled: boolean
}

function RoutinesPage(): JSX.Element {
  const { skills } = useHubStore()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [newStartHour, setNewStartHour] = useState(8)
  const [newEndHour, setNewEndHour] = useState(10)
  const [saved, setSaved] = useState(false)

  // 카테고리별 스킬 그룹핑
  const categoryLabels: Record<string, string> = { qa: 'QA', ux: 'UX', dev: '개발', analysis: '분석', research: '시장조사', docs: '문서생성', blog: '블로그', more: '더보기' }
  const skillsByCategory = skills.reduce<Record<string, typeof skills>>((acc, s) => {
    const cat = s.category || 'more'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  useEffect(() => {
    window.api.getStore('routines').then((data) => {
      if (Array.isArray(data)) setRoutines(data as Routine[])
    })
  }, [])

  const saveRoutines = (updated: Routine[]): void => {
    setRoutines(updated)
    window.api.setStore('routines', updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const addRoutine = (): void => {
    if (!newName.trim() || !newSkill.trim()) return
    const routine: Routine = {
      id: Date.now().toString(),
      name: newName.trim(),
      days: newDays,
      skill: newSkill.trim().replace(/^\//, ''),
      startHour: newStartHour,
      endHour: newEndHour,
      enabled: true
    }
    saveRoutines([...routines, routine])
    setNewName('')
    setNewSkill('')
    setNewDays([1, 2, 3, 4, 5])
    setNewStartHour(8)
    setNewEndHour(10)
    setAdding(false)
  }

  const toggleRoutine = (id: string): void => {
    saveRoutines(routines.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const deleteRoutine = (id: string): void => {
    saveRoutines(routines.filter((r) => r.id !== id))
  }

  const toggleDay = (day: number): void => {
    setNewDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort())
  }

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토']
  const hourOptions = Array.from({ length: 24 }, (_, i) => i)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
    color: 'white', fontSize: 11, outline: 'none', fontFamily: 'Segoe UI, sans-serif'
  }

  const selectStyle: React.CSSProperties = {
    padding: '5px 8px', borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
    color: 'white', fontSize: 11, outline: 'none', fontFamily: 'Segoe UI, sans-serif',
    cursor: 'pointer'
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12
      }}>
        <div style={{
          fontSize: 10, color: 'rgba(255,255,255,0.3)',
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
        }}>
          루틴 설정
        </div>
        {saved && <span style={{ fontSize: 10, color: '#34d399' }}>저장됨!</span>}
      </div>

      {/* Existing routines */}
      {routines.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          설정된 루틴이 없습니다
          <div style={{ fontSize: 10, marginTop: 4, color: 'rgba(255,255,255,0.12)' }}>
            요일+시간별 반복 작업을 등록하면 홈 추천에 표시됩니다
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {routines.map((r) => (
          <div key={r.id} style={{
            padding: 12, borderRadius: 10,
            background: r.enabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
            border: `1px solid ${r.enabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)'}`,
            opacity: r.enabled ? 1 : 0.5
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{r.name}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => toggleRoutine(r.id)}
                  style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 10, border: 'none',
                    background: r.enabled ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
                    color: r.enabled ? '#34d399' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer'
                  }}>
                  {r.enabled ? 'ON' : 'OFF'}
                </button>
                <button onClick={() => deleteRoutine(r.id)}
                  style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 10, border: 'none',
                    background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer'
                  }}>
                  삭제
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              {dayLabels.map((label, idx) => (
                <span key={idx} style={{
                  fontSize: 9, padding: '1px 5px', borderRadius: 4,
                  background: r.days.includes(idx) ? 'rgba(251,146,60,0.15)' : 'transparent',
                  color: r.days.includes(idx) ? '#fb923c' : 'rgba(255,255,255,0.15)'
                }}>
                  {label}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>/{r.skill}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
                {String(r.startHour ?? 0).padStart(2, '0')}:00 ~ {String(r.endHour ?? 23).padStart(2, '0')}:00
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add new routine */}
      {adding ? (
        <div style={{
          padding: 14, borderRadius: 12,
          background: 'rgba(251,146,60,0.04)',
          border: '1px solid rgba(251,146,60,0.15)'
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>루틴 이름</div>
          <input value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="예: 출근 루틴" style={{ ...inputStyle, marginBottom: 8 }} />

          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>실행 스킬</div>
          <select value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
            style={{ ...selectStyle, width: '100%', marginBottom: 8 }}>
            <option value="" style={{ background: '#1e1e2e', color: 'rgba(255,255,255,0.4)' }}>스킬 선택...</option>
            {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
              <optgroup key={cat} label={`── ${categoryLabels[cat] || cat} ──`} style={{ background: '#1e1e2e', color: 'rgba(255,255,255,0.5)' }}>
                {catSkills.map((s) => (
                  <option key={s.name} value={s.name} style={{ background: '#1e1e2e', color: 'white' }}>
                    /{s.name} - {s.description}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>반복 요일</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {dayLabels.map((label, idx) => (
              <button key={idx} onClick={() => toggleDay(idx)}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: 6, border: 'none',
                  background: newDays.includes(idx) ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.04)',
                  color: newDays.includes(idx) ? '#fb923c' : 'rgba(255,255,255,0.25)',
                  cursor: 'pointer', fontSize: 10, fontWeight: 600
                }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>표시 시간대</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <select value={newStartHour} onChange={(e) => setNewStartHour(Number(e.target.value))} style={selectStyle}>
              {hourOptions.map((h) => (
                <option key={h} value={h} style={{ background: '#1e1e2e', color: 'white' }}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>~</span>
            <select value={newEndHour} onChange={(e) => setNewEndHour(Number(e.target.value))} style={selectStyle}>
              {hourOptions.map((h) => (
                <option key={h} value={h} style={{ background: '#1e1e2e', color: 'white' }}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addRoutine}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(244,114,182,0.2))',
                color: '#fb923c', cursor: 'pointer', fontSize: 11, fontWeight: 600
              }}>
              추가
            </button>
            <button onClick={() => setAdding(false)}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer', fontSize: 11
              }}>
              취소
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{
            width: '100%', padding: '10px', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer', fontSize: 11, transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,146,60,0.3)'; e.currentTarget.style.color = '#fb923c' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
          + 루틴 추가
        </button>
      )}

      <div style={{
        marginTop: 12, fontSize: 9, color: 'rgba(255,255,255,0.15)', textAlign: 'center', lineHeight: 1.5
      }}>
        등록된 루틴은 해당 요일+시간대에만 홈 추천에 표시됩니다
      </div>
    </div>
  )
}

// --- Main MoreTab ---
export default function MoreTab(): JSX.Element {
  const [subPage, setSubPage] = useState<SubPage>('menu')

  if (subPage !== 'menu') {
    const pageMap: Record<Exclude<SubPage, 'menu'>, JSX.Element> = {
      links: <LinksTab />,
      images: <ImagesTab />,
      stats: <StatsPage />,
      'api-settings': <ApiSettingsPage />,
      ideas: <IdeasPage />,
      routines: <RoutinesPage />
    }
    return (
      <SubPageWrapper onBack={() => setSubPage('menu')}>
        {pageMap[subPage]}
      </SubPageWrapper>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 10,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
      }}>
        더보기
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {menuItems.map((item) => (
          <button key={item.id} onClick={() => setSubPage(item.id)}
            style={{
              textAlign: 'left', padding: '14px 14px', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 12, width: '100%'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.borderColor = `${item.color}25`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
            }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{item.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
