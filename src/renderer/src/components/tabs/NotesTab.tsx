import { useEffect, useState } from 'react'
import { useHubStore } from '../../store/useHubStore'

const sectionLabel: React.CSSProperties = {
  fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8,
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
  color: 'white', fontSize: 12, outline: 'none', fontFamily: 'Segoe UI, sans-serif',
  transition: 'border-color 0.2s'
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function formatTimeAgo(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
  return `${Math.floor(diff / 86400000)}일 전`
}

export default function NotesTab(): JSX.Element {
  const { notes, setNotes } = useHubStore()
  const [adding, setAdding] = useState(false)
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  useEffect(() => {
    window.api.getNotes().then(setNotes)
  }, [setNotes])

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).sort()

  const filteredNotes = activeFilter
    ? notes.filter((n) => n.tags.includes(activeFilter))
    : notes

  const handleAdd = (): void => {
    if (!content.trim()) return
    const tags = tagInput
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean)
    const note: Note = {
      id: generateId(),
      content: content.trim(),
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    const updated = [note, ...notes]
    setNotes(updated)
    window.api.saveNotes(updated)
    setContent('')
    setTagInput('')
    setAdding(false)
  }

  const handleDelete = (id: string): void => {
    const updated = notes.filter((n) => n.id !== id)
    setNotes(updated)
    window.api.saveNotes(updated)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={sectionLabel}>Notes ({notes.length})</span>
        <button onClick={() => setAdding(!adding)}
          style={{
            fontSize: 16, color: adding ? '#f87171' : 'rgba(255,255,255,0.3)',
            background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1,
            transition: 'color 0.2s', width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6
          }}
          onMouseEnter={(e) => { if (!adding) e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
          onMouseLeave={(e) => { if (!adding) e.currentTarget.style.color = adding ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
          {adding ? '✕' : '+'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{
          padding: 12, borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(167,139,250,0.15)',
          marginBottom: 12
        }}>
          <textarea
            placeholder="메모 내용..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            style={{
              ...inputStyle, resize: 'vertical', marginBottom: 6,
              fontFamily: 'Segoe UI, sans-serif', lineHeight: 1.5
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          <input
            placeholder="태그 (쉼표로 구분: 업무, 아이디어, TIL)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          <button onClick={handleAdd}
            style={{
              marginTop: 8, width: '100%', padding: '8px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))',
              color: '#c4b5fd', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              transition: 'all 0.2s ease', letterSpacing: 0.3
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(96,165,250,0.3))' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))' }}>
            저장
          </button>
        </div>
      )}

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          <button
            onClick={() => setActiveFilter(null)}
            style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 12,
              background: !activeFilter ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${!activeFilter ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: !activeFilter ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.15s'
            }}>
            전체
          </button>
          {allTags.map((tag) => (
            <button key={tag}
              onClick={() => setActiveFilter(activeFilter === tag ? null : tag)}
              style={{
                fontSize: 10, padding: '3px 10px', borderRadius: 12,
                background: activeFilter === tag ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeFilter === tag ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)'}`,
                color: activeFilter === tag ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', transition: 'all 0.15s'
              }}>
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Notes list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filteredNotes.map((note) => (
          <div key={note.id}
            style={{
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.15s ease'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{
                fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5,
                flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
              }}>
                {note.content}
              </p>
              <button onClick={() => handleDelete(note.id)}
                style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.12)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '2px 6px',
                  transition: 'color 0.15s', flexShrink: 0, marginLeft: 8
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.12)' }}>
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {note.tags.map((tag) => (
                  <span key={tag} style={{
                    fontSize: 9, padding: '1px 8px', borderRadius: 8,
                    background: 'rgba(167,139,250,0.1)',
                    color: 'rgba(167,139,250,0.7)', fontWeight: 500
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>
                {formatTimeAgo(note.createdAt)}
              </span>
            </div>
          </div>
        ))}
        {filteredNotes.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
            {activeFilter ? `#${activeFilter} 태그의 메모가 없습니다` : '메모가 없습니다'}
          </div>
        )}
      </div>
    </div>
  )
}
