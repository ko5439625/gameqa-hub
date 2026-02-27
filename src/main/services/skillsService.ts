import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { watch, FSWatcher } from 'fs'
import { homedir } from 'os'

export type Skill = {
  name: string
  description: string
  category: 'qa' | 'ux' | 'dev' | 'analysis' | 'research' | 'docs' | 'blog' | 'more'
  projectPath?: string
  techStack?: string
}

type Project = {
  name: string
  path: string
  techStack: string
}

const SKILLS_DIR = join(homedir(), '.claude', 'skills')

// Game QA 스킬 매핑 (폴백)
const CATEGORY_MAP: Record<string, Skill['category']> = {
  시작: 'more',
  신규도구: 'dev',
  개선: 'dev',
  매크로: 'dev',
  테스트설계: 'qa',
  버그리포트: 'qa',
  QA체크리스트: 'qa',
  탐색적테스트: 'qa',
  회귀테스트: 'qa',
  로컬분석: 'analysis',
  유저행동: 'analysis',
  빌드비교: 'analysis',
  경쟁작분석: 'research',
  트렌드: 'research',
  발표: 'docs',
  체크리스트: 'docs',
  포트폴리오: 'docs',
  테스트리포트: 'docs',
  문서기타: 'docs',
  사용성평가: 'ux',
  플레이테스트: 'ux',
  피드백정리: 'ux',
  블로그: 'blog',
  프로젝트등록: 'dev',
}

// SKILL.md 내용 기반 자동 분류
const DEV_KEYWORDS = ['도구', '스크립트', '자동화', '매크로', '코드', '개발', '빌드', 'python', 'node', 'git']
const QA_KEYWORDS = ['테스트', '버그', 'QA', '체크리스트', '회귀', '탐색', '케이스', 'TC', '리포트', '검증']
const UX_KEYWORDS = ['사용성', '휴리스틱', '플레이테스트', 'UX', 'UI', '피드백', '유저', '접근성', '온보딩']
const ANALYSIS_KEYWORDS = ['분석', '로그', '크래시', '데이터', '통계', '패턴', '비교', '빌드']
const RESEARCH_KEYWORDS = ['리서치', '조사', '트렌드', '경쟁', '벤치마크', '시장']
const DOCS_KEYWORDS = ['문서', '발표', '리포트', '보고서', '포트폴리오', '회의록', '제안서']
const BLOG_KEYWORDS = ['블로그', '포스팅', 'TIL', '회고', '정리']

function autoDetectCategory(name: string, content: string): Skill['category'] {
  // 1. 하드코딩 맵에 있으면 그걸 사용
  if (CATEGORY_MAP[name]) return CATEGORY_MAP[name]

  // 2. frontmatter에 category 필드가 있으면 사용
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (fmMatch) {
    const catMatch = fmMatch[1].match(/category:\s*(qa|ux|dev|analysis|research|docs|blog|more)/)
    if (catMatch) return catMatch[1] as Skill['category']
  }

  // 3. 내용 기반 키워드 분류 (QA 우선 - QA 워크스테이션)
  const lower = content.toLowerCase()
  const qaScore = QA_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).length
  const uxScore = UX_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).length
  const devScore = DEV_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).length
  const analysisScore = ANALYSIS_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).length
  const researchScore = RESEARCH_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).length
  const docsScore = DOCS_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).length
  const blogScore = BLOG_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).length

  // Priority: qa > ux > analysis > dev > research > docs > blog
  const scores: Array<[Skill['category'], number]> = [
    ['qa', qaScore],
    ['ux', uxScore],
    ['analysis', analysisScore],
    ['dev', devScore],
    ['research', researchScore],
    ['docs', docsScore],
    ['blog', blogScore],
  ]

  const best = scores.sort((a, b) => b[1] - a[1])[0]
  if (best[1] >= 2) return best[0]

  // 4. projectPath가 있으면 dev
  if (content.match(/^-\s*경로:/m)) return 'dev'

  return 'more'
}

export class SkillsService {
  private skills: Skill[] = []
  private projects: Project[] = []
  private watcher: FSWatcher | null = null

  async init(): Promise<void> {
    await this.loadSkills()
  }

  private async loadSkills(): Promise<void> {
    try {
      const entries = await readdir(SKILLS_DIR)
      const dirs: string[] = []
      for (const entry of entries) {
        const s = await stat(join(SKILLS_DIR, entry))
        if (s.isDirectory()) dirs.push(entry)
      }

      const skills: Skill[] = []
      const projects: Project[] = []

      for (const name of dirs) {
        const skillFile = join(SKILLS_DIR, name, 'SKILL.md')
        let content: string
        try {
          content = await readFile(skillFile, 'utf-8')
        } catch {
          continue
        }

        // frontmatter에서 description 파싱
        let description = name
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
        if (fmMatch) {
          const descMatch = fmMatch[1].match(/description:\s*(.+)/)
          if (descMatch) description = descMatch[1].trim()
        }

        const lines = content.split('\n')
        const category = autoDetectCategory(name, content)

        let projectPath: string | undefined
        let techStack: string | undefined

        for (const line of lines) {
          const pathMatch = line.match(/^-\s*경로:\s*(.+)/)
          if (pathMatch) {
            projectPath = pathMatch[1].trim().replace(/~/, homedir()).replace(/\/$/, '')
          }

          const techMatch = line.match(/^-\s*기술 스택:\s*(.+)/)
          if (techMatch) {
            techStack = techMatch[1].trim()
          }
        }

        if (!techStack) {
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/기술 스택/)) {
              const stackLines: string[] = []
              for (let j = i + 1; j < lines.length && j < i + 6; j++) {
                const stackItem = lines[j].match(/^\s*-\s*(.+)/)
                if (stackItem) {
                  stackLines.push(stackItem[1].trim())
                } else if (lines[j].trim() === '') {
                  continue
                } else {
                  break
                }
              }
              if (stackLines.length > 0) {
                techStack = stackLines.join(', ')
              }
              break
            }
          }
        }

        skills.push({ name, description, category, projectPath, techStack })

        if (projectPath) {
          projects.push({ name, path: projectPath, techStack: techStack || '' })
        }
      }

      this.skills = skills
      this.projects = projects
    } catch {
      this.skills = []
      this.projects = []
    }
  }

  getSkills(): Skill[] {
    return this.skills
  }

  getProjects(): Project[] {
    return this.projects
  }

  watch(callback: (skills: Skill[]) => void): void {
    try {
      this.watcher = watch(SKILLS_DIR, { recursive: true }, async (eventType, filename) => {
        if (filename?.endsWith('.md')) {
          await this.loadSkills()
          callback(this.skills)
        }
      })
    } catch {
      // skills dir may not exist
    }
  }

  dispose(): void {
    this.watcher?.close()
    this.watcher = null
  }
}
