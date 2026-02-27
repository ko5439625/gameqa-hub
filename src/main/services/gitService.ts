import { exec } from 'child_process'
import { existsSync } from 'fs'

export type GitStatus = {
  projectPath: string
  branch: string
  modified: number
  untracked: number
  ahead: number
  behind: number
  lastCommitTime?: number
}

type Project = {
  name: string
  path: string
  techStack: string
}

export class GitService {
  private timer: ReturnType<typeof setInterval> | null = null

  async getStatus(projectPath: string): Promise<GitStatus | null> {
    if (!existsSync(projectPath)) return null

    return new Promise((resolve) => {
      exec(
        'git status --porcelain -b',
        { cwd: projectPath, timeout: 10000 },
        (error, stdout) => {
          if (error) {
            resolve(null)
            return
          }

          const lines = stdout.trim().split('\n')
          const branchLine = lines[0] || ''

          let branch = 'unknown'
          let ahead = 0
          let behind = 0

          const branchMatch = branchLine.match(/^## (.+?)(?:\.\.\.|$)/)
          if (branchMatch) branch = branchMatch[1]

          const aheadMatch = branchLine.match(/ahead (\d+)/)
          if (aheadMatch) ahead = parseInt(aheadMatch[1])

          const behindMatch = branchLine.match(/behind (\d+)/)
          if (behindMatch) behind = parseInt(behindMatch[1])

          let modified = 0
          let untracked = 0

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i]
            if (!line) continue
            if (line.startsWith('??')) {
              untracked++
            } else {
              modified++
            }
          }

          // Get last commit time
          exec(
            'git log -1 --format=%ct',
            { cwd: projectPath, timeout: 5000 },
            (logError, logStdout) => {
              let lastCommitTime: number | undefined
              if (!logError && logStdout.trim()) {
                lastCommitTime = parseInt(logStdout.trim(), 10)
              }
              resolve({ projectPath, branch, modified, untracked, ahead, behind, lastCommitTime })
            }
          )
        }
      )
    })
  }

  startPolling(
    callback: (statuses: Record<string, GitStatus>) => void,
    projects: Project[]
  ): void {
    const poll = async (): Promise<void> => {
      const statuses: Record<string, GitStatus> = {}
      for (const project of projects) {
        const status = await this.getStatus(project.path)
        if (status) {
          statuses[project.path] = status
        }
      }
      callback(statuses)
    }

    poll()
    this.timer = setInterval(poll, 30000)
  }

  stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  async getRecentCommits(
    projectPath: string,
    since: string // e.g. "yesterday", "2 days ago"
  ): Promise<Array<{ hash: string; message: string; time: string }>> {
    if (!existsSync(projectPath)) return []

    return new Promise((resolve) => {
      exec(
        `git log --since="${since}" --format="%h|%s|%ar" --no-merges`,
        { cwd: projectPath, timeout: 10000 },
        (error, stdout) => {
          if (error || !stdout.trim()) {
            resolve([])
            return
          }
          const commits = stdout
            .trim()
            .split('\n')
            .filter(Boolean)
            .map((line) => {
              const [hash, message, time] = line.split('|')
              return { hash: hash || '', message: message || '', time: time || '' }
            })
          resolve(commits)
        }
      )
    })
  }
}
