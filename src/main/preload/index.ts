import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getSkills: () => ipcRenderer.invoke('get-skills'),
  launchSkill: (name: string, projectPath?: string) => ipcRenderer.invoke('launch-skill', name, projectPath),
  getRecentSkills: () => ipcRenderer.invoke('get-recent-skills'),
  setMode: (mode: string) => ipcRenderer.invoke('set-mode', mode),
  getGitStatus: (path: string) => ipcRenderer.invoke('get-git-status', path),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  dragWindow: (dx: number, dy: number) => ipcRenderer.invoke('drag-window', dx, dy),
  savePosition: () => ipcRenderer.invoke('save-position'),
  getStore: (key: string) => ipcRenderer.invoke('get-store', key),
  setStore: (key: string, val: unknown) => ipcRenderer.invoke('set-store', key, val),

  // 새 기능
  openUrl: (url: string) => ipcRenderer.invoke('open-url', url),
  pasteImage: () => ipcRenderer.invoke('paste-image'),
  getImages: () => ipcRenderer.invoke('get-images'),
  deleteImage: (path: string) => ipcRenderer.invoke('delete-image', path),
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  saveBookmarks: (b: Array<{ name: string; url: string }>) => ipcRenderer.invoke('save-bookmarks', b),
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNotes: (notes: Array<{ id: string; content: string; tags: string[]; createdAt: number; updatedAt: number }>) => ipcRenderer.invoke('save-notes', notes),
  getRecentCommits: (projectPath: string, since: string) => ipcRenderer.invoke('get-recent-commits', projectPath, since),
  getSkillLogs: () => ipcRenderer.invoke('get-skill-logs'),
  getIdeaFiles: () => ipcRenderer.invoke('get-idea-files'),
  getIdeaContent: (fileName: string) => ipcRenderer.invoke('get-idea-content', fileName),
  getMemoryFiles: () => ipcRenderer.invoke('get-memory-files'),
  getMemoryContent: (fileName: string) => ipcRenderer.invoke('get-memory-content', fileName),
  setOpacity: (value: number) => ipcRenderer.invoke('set-opacity', value),
  getJiraIssues: (projectKeys: string[]) => ipcRenderer.invoke('get-jira-issues', projectKeys),

  onSkillsUpdated: (cb: (skills: unknown[]) => void) => {
    const h = (_e: unknown, s: unknown[]) => cb(s)
    ipcRenderer.on('skills-updated', h as never)
    return () => ipcRenderer.removeListener('skills-updated', h as never)
  },
  onGitStatusUpdated: (cb: (s: Record<string, unknown>) => void) => {
    const h = (_e: unknown, s: Record<string, unknown>) => cb(s)
    ipcRenderer.on('git-status-updated', h as never)
    return () => ipcRenderer.removeListener('git-status-updated', h as never)
  }
}

contextBridge.exposeInMainWorld('api', api)
