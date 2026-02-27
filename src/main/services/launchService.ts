import { exec } from 'child_process'
import { join } from 'path'
import { existsSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'

export class LaunchService {
  private claudePath: string

  constructor() {
    const appDataNpm = join(process.env['APPDATA'] || '', 'npm', 'claude.cmd')
    this.claudePath = existsSync(appDataNpm) ? appDataNpm : 'claude'
  }

  launch(skillName: string, projectPath?: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const dir = (projectPath || process.env['USERPROFILE'] || 'C:\\').replace(/\//g, '\\')
      const claude = this.claudePath.replace(/\//g, '\\')

      // batch 파일로 실행하여 Windows 쉘 따옴표/인코딩 문제 방지
      const batPath = join(tmpdir(), 'sophia-launch.bat')
      const batContent = `@echo off\r\nchcp 65001 >nul 2>&1\r\nset CLAUDECODE=\r\ncd /d "${dir}"\r\n"${claude}" "/${skillName}"\r\n`
      writeFileSync(batPath, batContent, 'utf-8')

      // Windows Terminal로 실행 시도
      const wtCmd = `wt.exe new-tab --title "/${skillName}" "${batPath}"`

      exec(wtCmd, (error) => {
        if (error) {
          // wt.exe 실패 시 일반 cmd로 폴백
          exec(`start "" "${batPath}"`, (err2) => {
            if (err2) resolve({ success: false, error: err2.message })
            else resolve({ success: true })
          })
        } else {
          resolve({ success: true })
        }
      })
    })
  }
}
