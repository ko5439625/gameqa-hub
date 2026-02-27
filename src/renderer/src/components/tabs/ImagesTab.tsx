import { useEffect, useState } from 'react'
import { useHubStore } from '../../store/useHubStore'

export default function ImagesTab(): JSX.Element {
  const { images, setImages } = useHubStore()
  const [status, setStatus] = useState('')
  const [lastPath, setLastPath] = useState('')

  useEffect(() => {
    window.api.getImages().then(setImages)
  }, [setImages])

  useEffect(() => {
    const handlePaste = async (): Promise<void> => {
      const result = await window.api.pasteImage()
      if (result.success && result.path) {
        setStatus(`저장됨: ${result.fileName}`)
        setLastPath(result.path)
        const updated = await window.api.getImages()
        setImages(updated)
        setTimeout(() => setStatus(''), 3000)
      } else {
        setStatus('클립보드에 이미지가 없습니다')
        setTimeout(() => setStatus(''), 2000)
      }
    }

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.key === 'v') handlePaste()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [setImages])

  const handlePasteClick = async (): Promise<void> => {
    const result = await window.api.pasteImage()
    if (result.success && result.path) {
      setStatus(`저장됨: ${result.fileName}`)
      setLastPath(result.path)
      const updated = await window.api.getImages()
      setImages(updated)
      setTimeout(() => setStatus(''), 3000)
    } else {
      setStatus('클립보드에 이미지가 없습니다')
      setTimeout(() => setStatus(''), 2000)
    }
  }

  const copyPath = (path: string): void => {
    navigator.clipboard.writeText(path)
    setStatus('경로 복사됨!')
    setTimeout(() => setStatus(''), 1500)
  }

  const deleteImage = async (path: string, name: string): Promise<void> => {
    const result = await window.api.deleteImage(path)
    if (result.success) {
      setStatus(`삭제됨: ${name}`)
      const updated = await window.api.getImages()
      setImages(updated)
      if (lastPath === path) setLastPath('')
      setTimeout(() => setStatus(''), 2000)
    } else {
      setStatus('삭제 실패')
      setTimeout(() => setStatus(''), 2000)
    }
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
      {/* Paste Area */}
      <button onClick={handlePasteClick}
        style={{
          width: '100%', padding: '22px', borderRadius: 12,
          border: '1px dashed rgba(167,139,250,0.25)',
          background: 'linear-gradient(135deg, rgba(167,139,250,0.04), rgba(96,165,250,0.04))',
          color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          fontSize: 12, textAlign: 'center', marginBottom: 12,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(96,165,250,0.1))'
          e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.04), rgba(96,165,250,0.04))'
          e.currentTarget.style.borderColor = 'rgba(167,139,250,0.25)'
        }}>
        클릭하거나 Ctrl+V로 이미지 붙여넣기
        <div style={{ fontSize: 10, marginTop: 4, color: 'rgba(255,255,255,0.2)' }}>
          스크린샷 캡처 후 여기에 붙여넣으면 자동 저장
        </div>
      </button>

      {/* Status */}
      {status && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 11,
          background: status.includes('저장') ? 'rgba(52,211,153,0.1)' :
                     status.includes('삭제됨') ? 'rgba(248,113,113,0.1)' :
                     status.includes('복사') ? 'rgba(96,165,250,0.1)' :
                     'rgba(251,191,36,0.1)',
          color: status.includes('저장') ? '#34d399' :
                 status.includes('삭제됨') ? '#f87171' :
                 status.includes('복사') ? '#60a5fa' :
                 '#fbbf24',
          border: `1px solid ${
            status.includes('저장') ? 'rgba(52,211,153,0.15)' :
            status.includes('삭제됨') ? 'rgba(248,113,113,0.15)' :
            status.includes('복사') ? 'rgba(96,165,250,0.15)' :
            'rgba(251,191,36,0.15)'
          }`
        }}>
          {status}
        </div>
      )}

      {/* Last saved path */}
      {lastPath && (
        <div style={{
          padding: '10px 12px', borderRadius: 10, marginBottom: 12,
          background: 'rgba(96,165,250,0.06)',
          border: '1px solid rgba(96,165,250,0.15)'
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
            Claude에서 이 경로를 붙여넣으세요:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <code style={{
              fontSize: 10, color: '#93c5fd', flex: 1, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Consolas, monospace'
            }}>
              {lastPath}
            </code>
            <button onClick={() => copyPath(lastPath)}
              style={{
                fontSize: 9, padding: '3px 10px', borderRadius: 5, border: 'none',
                background: 'rgba(96,165,250,0.15)', color: '#93c5fd',
                cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600,
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.25)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.15)' }}>
              복사
            </button>
          </div>
        </div>
      )}

      {/* Image List */}
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
      }}>
        저장된 이미지 ({images.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {images.map((img) => (
          <div key={img.name}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.15s ease'
            }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {img.name}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
                {new Date(img.time).toLocaleString('ko-KR')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 }}>
              <button onClick={() => copyPath(img.path)}
                style={{
                  fontSize: 9, padding: '3px 8px', borderRadius: 4, border: 'none',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}>
                경로 복사
              </button>
              <button onClick={() => deleteImage(img.path, img.name)}
                style={{
                  fontSize: 9, padding: '3px 8px', borderRadius: 4, border: 'none',
                  background: 'rgba(248,113,113,0.08)', color: 'rgba(248,113,113,0.5)',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(248,113,113,0.18)'
                  e.currentTarget.style.color = '#f87171'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(248,113,113,0.08)'
                  e.currentTarget.style.color = 'rgba(248,113,113,0.5)'
                }}>
                삭제
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
            아직 저장된 이미지가 없습니다
          </div>
        )}
      </div>
    </div>
  )
}
