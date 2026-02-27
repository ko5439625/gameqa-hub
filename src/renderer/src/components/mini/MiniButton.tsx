import { useRef, useCallback } from 'react'
import { useHubStore } from '../../store/useHubStore'

export default function MiniButton(): JSX.Element {
  const { setMode } = useHubStore()
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = false
    dragStart.current = { x: e.screenX, y: e.screenY }

    const onMove = (me: MouseEvent): void => {
      const dx = me.screenX - dragStart.current.x
      const dy = me.screenY - dragStart.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging.current = true
      window.api.dragWindow(dx, dy)
      dragStart.current = { x: me.screenX, y: me.screenY }
    }
    const onUp = (): void => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      window.api.savePosition()
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const handleClick = useCallback(() => {
    if (!isDragging.current) setMode('hub')
  }, [setMode])

  return (
    <div
      style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
        boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.15s',
      }}>
        <span style={{
          fontSize: 24, fontWeight: 'bold', color: 'white',
          userSelect: 'none'
        }}>
          G
        </span>
      </div>
    </div>
  )
}
