import { useEffect, useState } from 'react'
import { useHubStore } from '../../store/useHubStore'

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

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ background: 'rgba(167,139,250,0.3)', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  )
}

// 태그별 색상
const TAG_COLORS = [
  '#a78bfa', '#60a5fa', '#34d399', '#f59e0b', '#ec4899',
  '#ef4444', '#8b5cf6', '#10b981', '#f97316', '#06b6d4'
]
function tagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export default function NotesTab(): JSX.Element {
  const { notes, setNotes } = useHubStore()
  const [adding, setAdding] = useState(false)
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [expandedNote, setExpandedNote] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTagInput, setEditTagInput] = useState('')

  useEffect(() => {
    window.api.getNotes().then(setNotes)
  }, [setNotes])

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).sort()

  const filteredNotes = notes.filter((n) => {
    if (activeFilter && !n.tags.includes(activeFilter)) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return n.content.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q))
    }
    return true
  })

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

  const startEdit = (note: Note): void => {
    setEditContent(note.content)
    setEditTagInput(note.tags.join(', '))
    setEditing(true)
  }

  const handleSaveEdit = (id: string): void => {
    if (!editContent.trim()) return
    const tags = editTagInput
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean)
    const updated = notes.map((n) =>
      n.id === id ? { ...n, content: editContent.trim(), tags, updatedAt: Date.now() } : n
    )
    setNotes(updated)
    window.api.saveNotes(updated)
    setEditing(false)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{
          fontSize: 10, color: 'rgba(255,255,255,0.3)',
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
        }}>
          Notes ({notes.length})
        </span>
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

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <span style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 12, color: 'rgba(255,255,255,0.2)', pointerEvents: 'none'
        }}>
          🔍
        </span>
        <input
          placeholder="노트 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            ...inputStyle, paddingLeft: 30,
            background: 'rgba(255,255,255,0.03)'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
        {search && (
          <button onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              fontSize: 10, color: 'rgba(255,255,255,0.25)', background: 'none',
              border: 'none', cursor: 'pointer', padding: '2px 4px'
            }}>
            ✕
          </button>
        )}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
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
          {allTags.map((tag) => {
            const c = tagColor(tag)
            return (
              <button key={tag}
                onClick={() => setActiveFilter(activeFilter === tag ? null : tag)}
                style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 12,
                  background: activeFilter === tag ? `${c}25` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${activeFilter === tag ? `${c}50` : 'rgba(255,255,255,0.06)'}`,
                  color: activeFilter === tag ? c : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                #{tag}
              </button>
            )
          })}
        </div>
      )}

      {/* Search result count */}
      {search.trim() && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>
          {filteredNotes.length}개 결과
        </div>
      )}

      {/* Expanded note detail */}
      {expandedNote && (() => {
        const note = filteredNotes.find((n) => n.id === expandedNote)
        if (!note) return null
        return (
          <div style={{
            padding: '14px', borderRadius: 12, marginBottom: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(167,139,250,0.2)',
            animation: 'fadeIn 0.15s ease'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <button onClick={() => { setExpandedNote(null); setEditing(false) }}
                style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.35)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '2px 4px',
                  transition: 'color 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
                ← 돌아가기
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                {!editing && (
                  <button onClick={() => startEdit(note)}
                    style={{
                      fontSize: 10, color: 'rgba(255,255,255,0.25)', background: 'none',
                      border: 'none', cursor: 'pointer', padding: '2px 6px',
                      transition: 'color 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}>
                    수정
                  </button>
                )}
                <button onClick={() => { handleDelete(note.id); setExpandedNote(null); setEditing(false) }}
                  style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.15)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: '2px 6px',
                    transition: 'color 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.15)' }}>
                  삭제
                </button>
              </div>
            </div>

            {/* Edit mode */}
            {editing ? (
              <div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={5}
                  style={{
                    ...inputStyle, resize: 'vertical', marginBottom: 6,
                    fontFamily: 'Segoe UI, sans-serif', lineHeight: 1.6
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                />
                <input
                  placeholder="태그 (쉼표로 구분)"
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={() => setEditing(false)}
                    style={{
                      flex: 1, padding: '7px', borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
                      color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 11, fontWeight: 500,
                      transition: 'all 0.15s'
                    }}>
                    취소
                  </button>
                  <button onClick={() => handleSaveEdit(note.id)}
                    style={{
                      flex: 1, padding: '7px', borderRadius: 8, border: 'none',
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(96,165,250,0.25))',
                      color: '#c4b5fd', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.35), rgba(96,165,250,0.35))' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(96,165,250,0.25))' }}>
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Read mode */}
                <p style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {highlightMatch(note.content, search)}
                </p>
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {note.tags.map((tag) => (
                      <span key={tag} style={{
                        fontSize: 9, padding: '2px 8px', borderRadius: 8,
                        background: `${tagColor(tag)}15`,
                        color: `${tagColor(tag)}cc`, fontWeight: 500
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
                    {formatTimeAgo(note.createdAt)}
                  </span>
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* Notes card grid */}
      {!expandedNote && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8
        }}>
          {filteredNotes.map((note) => {
            const preview = note.content.length > 80
              ? note.content.slice(0, 80) + '…'
              : note.content
            return (
              <div key={note.id}
                onClick={() => setExpandedNote(note.id)}
                style={{
                  padding: '10px 11px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.15s ease',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 80, cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = 'rgba(167,139,250,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                }}>
                {/* Delete button */}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    fontSize: 9, color: 'rgba(255,255,255,0.08)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: '2px 4px',
                    transition: 'color 0.15s', lineHeight: 1
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.08)' }}>
                  ✕
                </button>

                {/* Content */}
                <p style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5,
                  wordBreak: 'break-word', paddingRight: 14
                }}>
                  {highlightMatch(preview, search)}
                </p>

                {/* Footer: tags + time */}
                <div style={{ marginTop: 8 }}>
                  {note.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
                      {note.tags.map((tag) => (
                        <span key={tag}
                          onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === tag ? null : tag) }}
                          style={{
                            fontSize: 8, padding: '1px 6px', borderRadius: 6,
                            background: `${tagColor(tag)}15`,
                            color: `${tagColor(tag)}cc`, fontWeight: 500,
                            cursor: 'pointer', transition: 'opacity 0.15s'
                          }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.12)' }}>
                    {formatTimeAgo(note.createdAt)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!expandedNote && filteredNotes.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          {search.trim()
            ? `"${search}" 검색 결과가 없습니다`
            : activeFilter
              ? `#${activeFilter} 태그의 메모가 없습니다`
              : '메모가 없습니다'
          }
        </div>
      )}
    </div>
  )
}
