import { useEffect, useState } from 'react'

export default function HistoryTab(): JSX.Element {
  const [files, setFiles] = useState<Array<{ name: string; label: string }>>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    window.api.getMemoryFiles().then((f) => {
      setFiles(f)
      if (f.length > 0) {
        const first = f.find((x) => x.name === 'brainstorming.md') || f[0]
        setSelectedFile(first.name)
        window.api.getMemoryContent(first.name).then(setContent)
      }
    })
  }, [])

  const selectFile = (name: string): void => {
    setSelectedFile(name)
    window.api.getMemoryContent(name).then(setContent)
  }

  // 마크다운 테이블/헤딩을 간단히 렌더링
  const renderContent = (text: string): JSX.Element[] => {
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let tableRows: string[][] = []
    let tableHeaders: string[] = []
    let inTable = false

    const flushTable = (): void => {
      if (tableHeaders.length === 0) return
      elements.push(
        <div key={`tbl-${elements.length}`} style={{
          overflowX: 'auto', marginBottom: 12, borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr>
                {tableHeaders.map((h, i) => (
                  <th key={i} style={{
                    padding: '6px 8px', textAlign: 'left',
                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: '5px 8px', color: 'rgba(255,255,255,0.6)',
                      borderBottom: '1px solid rgba(255,255,255,0.03)'
                    }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      tableHeaders = []
      tableRows = []
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const cells = line.split('|').slice(1, -1).map((c) => c.trim())
        if (cells.every((c) => /^[-:]+$/.test(c))) { inTable = true; continue }
        if (!inTable) {
          tableHeaders = cells
          inTable = true
        } else {
          tableRows.push(cells)
        }
        continue
      }

      if (inTable) { flushTable(); inTable = false }

      if (line.startsWith('### ')) {
        elements.push(
          <div key={i} style={{ fontSize: 12, fontWeight: 600, color: '#22d3ee', marginTop: 14, marginBottom: 6 }}>
            {line.replace('### ', '')}
          </div>
        )
      } else if (line.startsWith('## ')) {
        elements.push(
          <div key={i} style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: 16, marginBottom: 8 }}>
            {line.replace('## ', '')}
          </div>
        )
      } else if (line.startsWith('# ')) {
        elements.push(
          <div key={i} style={{
            fontSize: 14, fontWeight: 700, marginBottom: 10,
            background: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            {line.replace('# ', '')}
          </div>
        )
      } else if (line.startsWith('- ')) {
        elements.push(
          <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', paddingLeft: 10, lineHeight: 1.7 }}>
            {'• ' + line.slice(2)}
          </div>
        )
      } else if (line.trim()) {
        elements.push(
          <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            {line}
          </div>
        )
      }
    }
    if (inTable) flushTable()
    return elements
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
      <div style={{
        fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 12,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
      }}>
        히스토리
      </div>

      {files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          메모리 기록이 없습니다
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {files.map((f) => (
              <button key={f.name} onClick={() => selectFile(f.name)}
                style={{
                  fontSize: 10, padding: '4px 10px', borderRadius: 16,
                  background: selectedFile === f.name
                    ? 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(167,139,250,0.2))'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedFile === f.name ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  color: selectedFile === f.name ? '#22d3ee' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s'
                }}>
                {f.label}
              </button>
            ))}
          </div>
          <div>{renderContent(content)}</div>
        </>
      )}
    </div>
  )
}
