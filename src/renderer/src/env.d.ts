/// <reference types="vite/client" />

type Skill = {
  name: string
  description: string
  category: 'dev' | 'idea' | 'work' | 'more'
  projectPath?: string
  techStack?: string
}

type GitStatus = {
  projectPath: string
  branch: string
  modified: number
  untracked: number
  ahead: number
  behind: number
  lastCommitTime?: number // unix timestamp (seconds)
}

type Note = {
  id: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

type ImageFile = {
  name: string
  path: string
  time: number
}

type Bookmark = {
  name: string
  url: string
}

type JiraIssue = {
  key: string
  summary: string
  status: string
  statusCategory: 'new' | 'indeterminate' | 'done'
  priority: string
}

interface HubAPI {
  getSkills(): Promise<Skill[]>
  launchSkill(name: string, projectPath?: string): Promise<{ success: boolean; error?: string }>
  getRecentSkills(): Promise<string[]>
  setMode(mode: string): Promise<boolean>
  getGitStatus(path: string): Promise<GitStatus>
  getProjects(): Promise<Array<{ name: string; path: string; techStack: string }>>
  dragWindow(dx: number, dy: number): Promise<void>
  savePosition(): Promise<void>
  getStore(key: string): Promise<unknown>
  setStore(key: string, value: unknown): Promise<void>
  openUrl(url: string): Promise<void>
  pasteImage(): Promise<{ success: boolean; path?: string; fileName?: string; error?: string }>
  getImages(): Promise<ImageFile[]>
  deleteImage(path: string): Promise<{ success: boolean; error?: string }>
  getBookmarks(): Promise<Bookmark[]>
  saveBookmarks(bookmarks: Bookmark[]): Promise<void>
  getNotes(): Promise<Note[]>
  saveNotes(notes: Note[]): Promise<void>
  getRecentCommits(projectPath: string, since: string): Promise<Array<{ hash: string; message: string; time: string }>>
  getSkillLogs(): Promise<Array<{ skill: string; time: number }>>
  getIdeaFiles(): Promise<Array<{ name: string; month: string }>>
  getIdeaContent(fileName: string): Promise<string>
  getMemoryFiles(): Promise<Array<{ name: string; label: string }>>
  getMemoryContent(fileName: string): Promise<string>
  setOpacity(value: number): Promise<void>
  getJiraIssues(projectKeys: string[]): Promise<JiraIssue[]>
  onSkillsUpdated(cb: (skills: Skill[]) => void): () => void
  onGitStatusUpdated(cb: (statuses: Record<string, GitStatus>) => void): () => void
}

declare global {
  interface Window { api: HubAPI }
}
export {}
