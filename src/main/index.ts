import { app, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu, nativeImage, clipboard, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { tmpdir, homedir } from 'os'
import { existsSync, rmSync, mkdirSync, writeFileSync, unlinkSync, readdirSync, readFileSync } from 'fs'

// GPU 캐시 에러 방지
const sessionPath = join(tmpdir(), 'gameqa-hub-session')
app.setPath('sessionData', sessionPath)
const gpuCache = join(app.getPath('userData'), 'GPUCache')
if (existsSync(gpuCache)) {
  try { rmSync(gpuCache, { recursive: true, force: true }) } catch { /* ignore */ }
}
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

import { SkillsService } from './services/skillsService'
import { LaunchService } from './services/launchService'
import { GitService } from './services/gitService'
import { StoreService } from './services/storeService'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
const skillsService = new SkillsService()
const launchService = new LaunchService()
const gitService = new GitService()
const storeService = new StoreService()

// 이미지 저장 폴더
const IMAGE_DIR = join(homedir(), '.claude', 'images')
if (!existsSync(IMAGE_DIR)) mkdirSync(IMAGE_DIR, { recursive: true })

function createWindow(): void {
  const display = screen.getPrimaryDisplay()
  const { width: screenW, height: screenH } = display.workAreaSize

  const panelW = 420
  const panelX = screenW - panelW

  mainWindow = new BrowserWindow({
    width: panelW,
    height: screenH,
    x: panelX,
    y: 0,
    frame: false,
    resizable: false,
    skipTaskbar: false,
    alwaysOnTop: true,
    maximizable: false,
    minimizable: true,
    transparent: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

function setupIPC(): void {
  ipcMain.handle('get-skills', () => skillsService.getSkills())

  ipcMain.handle('launch-skill', (_e, skillName: string, projectPath?: string) => {
    const recentSkills = (storeService.get('recentSkills') as string[]) || []
    const updated = [skillName, ...recentSkills.filter((s) => s !== skillName)].slice(0, 8)
    storeService.set('recentSkills', updated)

    // Log skill usage
    const logs = (storeService.get('skillLogs') as Array<{ skill: string; time: number }>) || []
    logs.push({ skill: skillName, time: Date.now() })
    // Keep last 500 entries
    storeService.set('skillLogs', logs.slice(-500))

    return launchService.launch(skillName, projectPath)
  })

  ipcMain.handle('get-recent-skills', () => {
    return (storeService.get('recentSkills') as string[]) || []
  })

  // set-mode은 이제 사용 안 하지만 호환성 유지
  ipcMain.handle('set-mode', () => true)

  ipcMain.handle('get-git-status', (_e, projectPath: string) => {
    return gitService.getStatus(projectPath)
  })

  ipcMain.handle('get-projects', () => skillsService.getProjects())

  ipcMain.handle('open-url', (_e, url: string) => {
    shell.openExternal(url)
  })

  // 이미지 클립보드에서 붙여넣기
  ipcMain.handle('paste-image', () => {
    const image = clipboard.readImage()
    if (image.isEmpty()) return { success: false, error: 'No image in clipboard' }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const fileName = `capture-${timestamp}.png`
    const filePath = join(IMAGE_DIR, fileName)
    writeFileSync(filePath, image.toPNG())

    return { success: true, path: filePath, fileName }
  })

  // 이미지 목록 가져오기
  ipcMain.handle('get-images', () => {
    try {
      const { readdirSync, statSync } = require('fs')
      const files = readdirSync(IMAGE_DIR)
        .filter((f: string) => f.endsWith('.png') || f.endsWith('.jpg'))
        .map((f: string) => ({
          name: f,
          path: join(IMAGE_DIR, f),
          time: statSync(join(IMAGE_DIR, f)).mtime.getTime()
        }))
        .sort((a: { time: number }, b: { time: number }) => b.time - a.time)
        .slice(0, 20)
      return files
    } catch {
      return []
    }
  })

  // 이미지 삭제
  ipcMain.handle('delete-image', (_e, filePath: string) => {
    try {
      if (existsSync(filePath) && filePath.startsWith(IMAGE_DIR)) {
        unlinkSync(filePath)
        return { success: true }
      }
      return { success: false, error: 'File not found or invalid path' }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // 북마크 저장/불러오기
  ipcMain.handle('get-bookmarks', () => {
    return (storeService.get('bookmarks') as Array<{ name: string; url: string }>) || [
      { name: 'Claude', url: 'https://claude.ai' },
      { name: 'GitHub', url: 'https://github.com' }
    ]
  })

  ipcMain.handle('save-bookmarks', (_e, bookmarks: Array<{ name: string; url: string }>) => {
    storeService.set('bookmarks', bookmarks)
  })

  // Notes
  ipcMain.handle('get-notes', () => {
    return (storeService.get('notes') as Array<{ id: string; content: string; tags: string[]; createdAt: number; updatedAt: number }>) || []
  })

  ipcMain.handle('save-notes', (_e, notes: Array<{ id: string; content: string; tags: string[]; createdAt: number; updatedAt: number }>) => {
    storeService.set('notes', notes)
  })

  ipcMain.handle('get-store', (_e, key: string) => storeService.get(key))
  ipcMain.handle('set-store', (_e, key: string, value: unknown) => storeService.set(key, value))

  ipcMain.handle('set-opacity', (_e, value: number) => {
    if (mainWindow) mainWindow.setOpacity(Math.max(0.2, Math.min(1, value)))
  })

  // Recent commits for Daily Standup
  ipcMain.handle('get-recent-commits', (_e, projectPath: string, since: string) => {
    return gitService.getRecentCommits(projectPath, since)
  })

  // Skill usage logs
  ipcMain.handle('get-skill-logs', () => {
    return (storeService.get('skillLogs') as Array<{ skill: string; time: number }>) || []
  })

  // 아이디어 히스토리 - ~/.claude/ideas/ 폴더 읽기
  const IDEAS_DIR = join(homedir(), '.claude', 'ideas')

  ipcMain.handle('get-idea-files', () => {
    try {
      if (!existsSync(IDEAS_DIR)) return []
      return readdirSync(IDEAS_DIR)
        .filter((f: string) => f.endsWith('.md'))
        .sort((a: string, b: string) => b.localeCompare(a))
        .map((f: string) => ({ name: f, month: f.replace('.md', '') }))
    } catch {
      return []
    }
  })

  ipcMain.handle('get-idea-content', (_e, fileName: string) => {
    try {
      const filePath = join(IDEAS_DIR, fileName)
      if (!existsSync(filePath) || !filePath.startsWith(IDEAS_DIR)) return ''
      return readFileSync(filePath, 'utf-8')
    } catch {
      return ''
    }
  })

  // 매크로 파일 스캔 (~/.claude/macros/)
  const MACROS_DIR = join(homedir(), '.claude', 'macros')
  if (!existsSync(MACROS_DIR)) mkdirSync(MACROS_DIR, { recursive: true })

  const MACRO_EXTS = ['.ahk', '.ps1', '.bat', '.cmd', '.py', '.js', '.vbs']
  const EXT_LABELS: Record<string, string> = {
    '.ahk': 'AutoHotkey', '.ps1': 'PowerShell', '.bat': 'Batch',
    '.cmd': 'Batch', '.py': 'Python', '.js': 'Node.js', '.vbs': 'VBScript'
  }

  ipcMain.handle('get-macros', () => {
    try {
      const { statSync } = require('fs')
      const files = readdirSync(MACROS_DIR)
        .filter((f: string) => MACRO_EXTS.some((ext) => f.toLowerCase().endsWith(ext)))
        .map((f: string) => {
          const filePath = join(MACROS_DIR, f)
          const ext = '.' + f.split('.').pop()!.toLowerCase()
          // 첫 줄에서 설명 추출 (# 또는 ; 또는 // 또는 REM 주석)
          let description = EXT_LABELS[ext] || ext
          try {
            const firstLines = readFileSync(filePath, 'utf-8').split('\n').slice(0, 3)
            for (const line of firstLines) {
              const match = line.match(/^(?:#|;|\/\/|REM)\s*(.+)/)
              if (match) { description = match[1].trim(); break }
            }
          } catch { /* ignore */ }
          return {
            name: f,
            path: filePath,
            ext,
            description,
            modifiedTime: statSync(filePath).mtime.getTime()
          }
        })
        .sort((a: { modifiedTime: number }, b: { modifiedTime: number }) => b.modifiedTime - a.modifiedTime)
      return files
    } catch {
      return []
    }
  })

  ipcMain.handle('run-macro', (_e, filePath: string) => {
    try {
      if (!filePath.startsWith(MACROS_DIR)) {
        return { success: false, error: 'Invalid macro path' }
      }
      const ext = '.' + filePath.split('.').pop()!.toLowerCase()
      const { execFile } = require('child_process')

      const runners: Record<string, [string, string[]]> = {
        '.ahk': ['cmd.exe', ['/c', 'start', '', filePath]],
        '.ps1': ['powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', filePath]],
        '.bat': ['cmd.exe', ['/c', filePath]],
        '.cmd': ['cmd.exe', ['/c', filePath]],
        '.py': ['python', [filePath]],
        '.js': ['node', [filePath]],
        '.vbs': ['cscript.exe', [filePath]]
      }

      const runner = runners[ext]
      if (!runner) return { success: false, error: `Unsupported extension: ${ext}` }

      execFile(runner[0], runner[1], { cwd: MACROS_DIR })
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // 프로젝트 등록/관리
  ipcMain.handle('get-registered-projects', () => {
    return (storeService.get('registeredProjects') as Array<{ id: string; name: string; path: string; techStack: string; createdAt: number }>) || []
  })

  ipcMain.handle('save-registered-projects', (_e, projects: Array<{ id: string; name: string; path: string; techStack: string; createdAt: number }>) => {
    storeService.set('registeredProjects', projects)
  })

  // 메모리 히스토리 - ~/.claude/projects/*/memory/ 폴더 읽기
  const MEMORY_DIRS = (() => {
    const projectsDir = join(homedir(), '.claude', 'projects')
    if (!existsSync(projectsDir)) return []
    const dirs: string[] = []
    try {
      for (const proj of readdirSync(projectsDir)) {
        const memDir = join(projectsDir, proj, 'memory')
        if (existsSync(memDir)) dirs.push(memDir)
      }
    } catch { /* ignore */ }
    return dirs
  })()

  const MEMORY_LABELS: Record<string, string> = {
    'MEMORY.md': '워크스페이스 요약',
    'brainstorming.md': '브레인스토밍 기록',
    'worklog.md': '작업 로그',
    'debugging.md': '디버깅 노트',
    'patterns.md': '패턴/컨벤션'
  }

  ipcMain.handle('get-memory-files', () => {
    const files: Array<{ name: string; label: string }> = []
    const seen = new Set<string>()
    for (const dir of MEMORY_DIRS) {
      try {
        for (const f of readdirSync(dir)) {
          if (f.endsWith('.md') && !seen.has(f)) {
            seen.add(f)
            files.push({ name: f, label: MEMORY_LABELS[f] || f.replace('.md', '') })
          }
        }
      } catch { /* ignore */ }
    }
    return files
  })

  ipcMain.handle('get-memory-content', (_e, fileName: string) => {
    for (const dir of MEMORY_DIRS) {
      const filePath = join(dir, fileName)
      if (existsSync(filePath) && filePath.startsWith(dir)) {
        try { return readFileSync(filePath, 'utf-8') } catch { /* ignore */ }
      }
    }
    return ''
  })
}

function setupTray(): void {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFPklEQVR4nO1XTWhcVRT+7r3vb97MZNLoykI3I9plQdCNdtHWlRvpFPyHgsSFxSQ0KTVWUFQoJUntpETFbLop3Vhw46o/i6qgrroUoZuCOy1Im5n3c3/k3Pvey/wk2ja6EDyPw0xu7rvnO+fc850zwP+yQ5k5fGVH77MHMta5OuXxoMO5d4AzsY8xtgeMxWCmZ5i5raFuasjr0mSXVy8euvOPAZg7cm13GMSLgR8dE9wHYwLGMGhtwDiD4QZgBhrKqkIOpbO1XCenuxcO/bojACdf/X46rjXORWEt9r0QQnhgENAGUNogVwpSKweAaRgLQEKZDFKnvVwlc2fX968/FID33vhxqVlvLsS1BqIwgu+HEFwA4FAApNLIpESaS+RKwhAApqEtgBySQKgUmeotr3z27IkHArD4+g9LrebkQqPeRD2uFwACCMFgGKAMkEtY40mWo5+mUEaNRCGnKCBXCTK5sbxyfhwE28r4wkvfTk+2pr5sNVtoNhyAWiQQhAD3AGO9B1IJJBmQpBq9NEM/zUai4FJBAHLVR5rfe+tsdzgdbNT4bOfa7onGrl8mW7viEkCj7iGuA2EECA82/FlhvJ8C/QToJQobCUXBARiPQh9ZvtFLsrtPdLubF5NfWspeHATgi2gx8Gtx4EcIghBh4FnDtRioN4H6BByYGmxE/ADwrAp4vgcuuFNPQHieU9+H5wfwgjD2g2hx2wjMdK5O1YLW75OtKUxOtNCamECz6aE5ATRIm8CTz+NWuf/GV2hv9Ml7oDO9ud493Wu7NJSpsBWBTPaRZvfQT/94ZHXF8YQ3CIBIhuqcM2GVMQ7G7aXHU4c3DZSy/8j4mk3jYmzXP12+12aGgxk6z4OAB2F8eDroAFgfS4FlOCozw2HAocHsbZcaDyVEUsymg4NZFTY13PMOVDZfORF8Xf3BxD7yXGtHMlJr5Ao4eHTI098GFH+1Pne8fosJBsa5A2LVgthX2cQgYsftUCCG08ilsrd9R8IZYEGwwe97qn9fKlJguxpjcbmxZLgkG4v/o48/9twz9Hk/6+UdcloBiWdOXRmvgpOv/bQRRs04CGL4QWRLpxZHCGoB3nyXuzSsfHO0emH+hQvV9y3Wu5/32lUlaEdIWd5Dmt7tnTn1dJ32DFUBtVQws5caiyk0yXNICzMaNfpzoeNgqvjaUwHjzqJz7dnG3C63eIP7XT9Xey2fV2osx69+1G+Dc8y8H5YXcu8QgAFZ/SJto3jXPSU9a2itSG9uA0Be11AvE43aF5gGswdxexjjBufPpO0yn+AovpdKHrrPQeP0WBDOOLSW14eCVApNMnaYgLR5K4EMKx1eGBtRWqfhZGg/GaYuqekeSCiVQ8rs8pYAVi8eukOTDFEnNZHtgICXQIYVo4bthLRpWMmMdG31k81xjWNEaIyiSUaWIKilWiB0mEuLDelQRIocV/xPj3LvKgklrdeQedrL8+T0oD0+CoBmOBqjaJKhBlJFw+TWG21KMA6Q89IZdOr22HcKr6VMyTjyPJnrfjw8IzJsI/Nvf7cUhPUFywdBaFsqtVZmqZSaFLesVl3AIhK2goxyYbeep8izBFm6sbzywX1ORKXMv0Mg4gUCQKREIDgNpQRAEIhNAFUqbKlVl816nqW9LY2T/O1UfHz2xrQfROdomBAEgqJAHU3wohRJy7HclZrzvsr53NkPH3IqLmV29tpummSEHxyzUbAARNVkSpYrSKbM/RpduNGc7+yX0fzVKc8POtTPqaXarsaLX0bG3CaGI5KhOh8stX9VZoqu9p+VPwEJdF/RxcM0twAAAABJRU5ErkJggg=='
  )
  tray = new Tray(icon)
  tray.setToolTip('GameQA Hub')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show/Hide', click: () => { mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show() } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  tray.setContextMenu(contextMenu)
  tray.on('click', () => { mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show() })
}

app.whenReady().then(async () => {
  setupIPC()
  createWindow()
  setupTray()

  globalShortcut.register('Alt+Space', () => {
    if (!mainWindow) return
    mainWindow.isVisible() ? mainWindow.hide() : (mainWindow.show(), mainWindow.focus())
  })

  await skillsService.init()
  skillsService.watch((skills) => { mainWindow?.webContents.send('skills-updated', skills) })

  // Git polling: 스킬 기반 프로젝트 + 등록된 프로젝트 모두 포함
  const registeredProjects = (storeService.get('registeredProjects') as Array<{ id: string; name: string; path: string; techStack: string; createdAt: number }>) || []
  const allProjects = [
    ...skillsService.getProjects(),
    ...registeredProjects.map((p) => ({ name: p.name, path: p.path, techStack: p.techStack }))
  ]
  // 경로 중복 제거
  const uniqueProjects = allProjects.filter((p, i, arr) => arr.findIndex((x) => x.path === p.path) === i)
  gitService.startPolling((statuses) => { mainWindow?.webContents.send('git-status-updated', statuses) }, uniqueProjects)
})

app.on('will-quit', () => { globalShortcut.unregisterAll(); gitService.stopPolling() })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
