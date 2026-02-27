import { useState } from 'react'
import { useHubStore } from '../store/useHubStore'
import HomeTab from './tabs/HomeTab'
import WorkTab from './tabs/WorkTab'
import HistoryTab from './tabs/HistoryTab'
import NotesTab from './tabs/NotesTab'
import MoreTab from './tabs/MoreTab'

const TABS: Array<{ id: 'home' | 'work' | 'history' | 'notes' | 'more'; label: string; icon: string }> = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'work', label: 'Work', icon: '📋' },
  { id: 'history', label: 'History', icon: '📜' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'more', label: '···', icon: '' }
]

export default function Dashboard(): JSX.Element {
  const { activeTab, setActiveTab } = useHubStore()
  const [showOpacity, setShowOpacity] = useState(false)
  const [opacity, setOpacity] = useState(70)

  const handleOpacity = (val: number): void => {
    setOpacity(val)
    document.documentElement.style.setProperty('--bg-opacity', String(val / 100))
  }

  return (
    <div style={{
      width: '100%', height: '100vh',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Segoe UI', sans-serif", color: 'rgba(255,255,255,0.92)'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        WebkitAppRegion: 'drag' as never,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="data:image/png;base64,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"
            alt="데굴"
            style={{ width: 28, height: 28, borderRadius: 14 }}
          />
          <span style={{
            fontSize: 15, fontWeight: 700, letterSpacing: -0.3,
            background: 'linear-gradient(135deg, #c4b5fd, #93c5fd)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Sophia Hub
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, WebkitAppRegion: 'no-drag' as never }}>
          {/* Opacity toggle */}
          <button onClick={() => setShowOpacity(!showOpacity)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: showOpacity ? '#c4b5fd' : 'rgba(255,255,255,0.2)',
              padding: '2px 4px', transition: 'color 0.2s'
            }}
            title="배경 투명도 조절">
            ◐
          </button>
          <span style={{
            fontSize: 9, color: 'rgba(255,255,255,0.2)',
            letterSpacing: 0.5, textTransform: 'uppercase'
          }}>
            Alt+Space
          </span>
        </div>
        {/* Bottom gradient line */}
        <div style={{
          position: 'absolute', bottom: 0, left: 20, right: 20, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.3), rgba(96,165,250,0.3), transparent)'
        }} />
      </div>

      {/* Opacity slider */}
      {showOpacity && (
        <div style={{
          padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>배경</span>
          <input type="range" min={10} max={100} value={opacity}
            onChange={(e) => handleOpacity(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#a78bfa', height: 3, cursor: 'pointer' }} />
          <span style={{ fontSize: 10, color: '#c4b5fd', minWidth: 28, textAlign: 'right' }}>{opacity}%</span>
        </div>
      )}

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: 2,
        padding: '8px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '7px 0', border: 'none',
                borderRadius: 8,
                background: isActive
                  ? 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(96,165,250,0.15))'
                  : 'transparent',
                cursor: 'pointer',
                color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.35)',
                fontSize: 10, fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s ease',
                letterSpacing: 0.2,
                position: 'relative'
              }}
            >
              {tab.icon && <span style={{ fontSize: 11 }}>{tab.icon}</span>}
              {tab.icon && ' '}
              <span>{tab.label}</span>
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: -1, left: '25%', right: '25%', height: 2,
                  borderRadius: 1,
                  background: 'linear-gradient(90deg, #a78bfa, #60a5fa)'
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'work' && <WorkTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'notes' && <NotesTab />}
        {activeTab === 'more' && <MoreTab />}
      </div>
    </div>
  )
}
