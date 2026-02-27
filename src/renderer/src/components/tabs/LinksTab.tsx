import { useEffect, useState } from 'react'
import { useHubStore } from '../../store/useHubStore'

export default function LinksTab(): JSX.Element {
  const { bookmarks, setBookmarks } = useHubStore()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')

  useEffect(() => {
    window.api.getBookmarks().then(setBookmarks)
  }, [setBookmarks])

  const handleAdd = (): void => {
    if (!newName || !newUrl) return
    const url = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`
    const updated = [...bookmarks, { name: newName, url }]
    setBookmarks(updated)
    window.api.saveBookmarks(updated)
    setNewName('')
    setNewUrl('')
    setAdding(false)
  }

  const handleDelete = (idx: number): void => {
    const updated = bookmarks.filter((_, i) => i !== idx)
    setBookmarks(updated)
    window.api.saveBookmarks(updated)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
    color: 'white', fontSize: 12, outline: 'none', fontFamily: 'Segoe UI, sans-serif',
    transition: 'border-color 0.2s'
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{
          fontSize: 10, color: 'rgba(255,255,255,0.3)',
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
        }}>
          즐겨찾기
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
          onMouseLeave={(e) => { if (!adding) e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
          {adding ? '✕' : '+'}
        </button>
      </div>

      {adding && (
        <div style={{
          padding: 12, borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(167,139,250,0.15)',
          marginBottom: 12
        }}>
          <input placeholder="이름 (예: GitHub)" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            style={{ ...inputStyle, marginBottom: 6 }} />
          <input placeholder="URL (예: github.com)" value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            style={inputStyle} />
          <button onClick={handleAdd}
            style={{
              marginTop: 8, width: '100%', padding: '8px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))',
              color: '#c4b5fd', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              transition: 'all 0.2s ease', letterSpacing: 0.3
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(96,165,250,0.3))' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))' }}>
            추가
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {bookmarks.map((bm, i) => (
          <div key={i}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.borderColor = 'rgba(96,165,250,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
            }}
            onClick={() => window.api.openUrl(bm.url)}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{bm.name}</div>
              <div style={{
                fontSize: 10, color: 'rgba(255,255,255,0.25)',
                fontFamily: 'Consolas, monospace',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {bm.url}
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(i) }}
              style={{
                fontSize: 11, color: 'rgba(255,255,255,0.15)', background: 'none',
                border: 'none', cursor: 'pointer', padding: '4px 8px',
                transition: 'color 0.15s', flexShrink: 0
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.15)' }}>
              ✕
            </button>
          </div>
        ))}
        {bookmarks.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
            즐겨찾기가 없습니다
          </div>
        )}
      </div>
    </div>
  )
}
