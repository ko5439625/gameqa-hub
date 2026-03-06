import { useEffect, useState } from 'react'
import { useHubStore } from '../../store/useHubStore'

const CATEGORIES: Array<{id: Skill['category']; label: string; icon: string; color: string}> = [
  { id: 'qa',       label: 'QA',       icon: '🎯', color: '#ef4444' },
  { id: 'ux',       label: 'UX',       icon: '👁', color: '#8b5cf6' },
  { id: 'dev',      label: '개발',      icon: '⌨',  color: '#60a5fa' },
  { id: 'analysis', label: '분석',      icon: '📊', color: '#f59e0b' },
  { id: 'research', label: '시장조사',   icon: '🔍', color: '#10b981' },
  { id: 'docs',     label: '문서생성',   icon: '📋', color: '#34d399' },
  { id: 'blog',     label: '블로그',    icon: '✏',  color: '#ec4899' },
  { id: 'more',     label: '더보기',    icon: '⚡', color: '#a78bfa' },
]

// 스킬별 초보자용 설명 (마우스 오버 툴팁)
const SKILL_TOOLTIPS: Record<string, string> = {
  시작: '어떤 스킬을 쓸지 모를 때 여기서 시작하세요. 카테고리별로 안내해줍니다.',
  신규도구: 'QA 업무에 필요한 새로운 도구나 프로그램을 처음부터 만들어줍니다.',
  개선: '이미 만들어둔 도구나 스크립트의 성능/기능/사용성을 개선합니다.',
  매크로: '반복되는 수동 작업을 자동화하는 스크립트를 만들어줍니다. (클릭, 키입력 등)',
  테스트설계: '게임 기능에 대한 테스트 케이스(TC)와 시나리오를 체계적으로 설계합니다.',
  버그리포트: '발견한 버그를 재현 절차, 심각도 포함한 정식 리포트로 작성합니다.',
  QA체크리스트: '빌드 검증, 릴리즈 전 점검 등 상황별 QA 체크리스트를 생성합니다.',
  탐색적테스트: '정해진 TC 없이 자유롭게 탐색하며 버그를 찾는 세션을 설계합니다.',
  회귀테스트: '코드 변경 후 기존 기능이 깨지지 않았는지 확인할 범위를 산정합니다.',
  로컬분석: '로그 파일, 크래시 덤프, 테스트 데이터를 분석해서 원인을 파악합니다.',
  유저행동: '유저의 플레이 패턴, 이탈 구간, 세션 데이터를 분석합니다.',
  빌드비교: '이전 빌드와 현재 빌드의 변경점을 비교하고 테스트 우선순위를 정합니다.',
  경쟁작분석: '경쟁 게임의 QA 품질, UX, 유저 반응을 조사하고 벤치마크합니다.',
  트렌드: '게임 QA 업계의 최신 도구, 방법론, AI 활용 트렌드를 리서치합니다.',
  발표: '팀 회의, 리뷰 등에 쓸 발표 자료의 구조와 초안을 작성합니다.',
  체크리스트: '업무 절차, 준비물, 학습 로드맵 등 범용 체크리스트를 만듭니다.',
  포트폴리오: 'QA 경력과 프로젝트 경험을 정리한 포트폴리오/케이스스터디를 작성합니다.',
  테스트리포트: '테스트 실행 결과를 Pass/Fail 수치, 주요 이슈 포함한 보고서로 정리합니다.',
  문서기타: '회의록, 제안서, 기안서 등 정형화된 업무 문서를 작성합니다.',
  사용성평가: '게임 UI/UX를 휴리스틱 평가 기법으로 체계적으로 점검합니다.',
  플레이테스트: '유저 플레이테스트 세션을 설계하고, 관찰 결과를 기록/분석합니다.',
  피드백정리: '스토어 리뷰, 커뮤니티, 플레이테스트 피드백을 분류하고 우선순위를 매깁니다.',
  블로그: '현재 작업 내용이나 QA 경험을 블로그 포스팅 형식으로 정리합니다.',
  프로젝트등록: '개발 중인 프로젝트를 Hub 홈 화면의 프로젝트 현황에 등록합니다.',
}

interface CmdItem { cmd: string; desc: string; usage: string }

const COMMAND_SECTIONS: Array<{
  id: string; title: string; icon: string; desc: string; color: string; commands: CmdItem[]
}> = [
  {
    id: 'slash', title: '슬래시 커맨드', icon: '/', desc: '인터랙티브 모드에서 사용', color: '#60a5fa',
    commands: [
      { cmd: '/add-dir', desc: '작업 디렉토리 추가', usage: '현재 세션에 다른 폴더를 추가 참조. 멀티 프로젝트 동시 작업 시 유용' },
      { cmd: '/bug', desc: '버그 리포트', usage: 'Claude Code 자체의 버그를 Anthropic에 리포트' },
      { cmd: '/clear', desc: '대화 초기화', usage: '현재 대화 컨텍스트를 완전히 비우고 새로 시작' },
      { cmd: '/compact', desc: '컨텍스트 압축', usage: '긴 대화를 AI가 요약해서 토큰 절약. 대화 길어질 때 필수' },
      { cmd: '/config', desc: '설정 관리', usage: 'Claude Code 설정 확인/변경. set, get, list 서브커맨드 지원' },
      { cmd: '/cost', desc: '비용 확인', usage: '현재 세션의 토큰 사용량과 예상 비용 실시간 확인' },
      { cmd: '/diff', desc: '변경사항 보기', usage: 'Claude가 수정한 파일의 diff를 한눈에 확인' },
      { cmd: '/doctor', desc: '환경 진단', usage: '시스템 환경, 의존성, 설정 문제를 자동으로 진단/수정' },
      { cmd: '/fast', desc: '빠른 모드 토글', usage: '같은 모델이지만 더 빠른 출력. 간단한 작업에 적합' },
      { cmd: '/help', desc: '도움말', usage: '사용 가능한 모든 커맨드 목록과 설명 확인' },
      { cmd: '/init', desc: 'CLAUDE.md 생성', usage: '프로젝트 루트에 CLAUDE.md 생성. 프로젝트 규칙/컨벤션 정의' },
      { cmd: '/listen', desc: '음성 입력', usage: '마이크로 음성 인식하여 텍스트 입력으로 변환' },
      { cmd: '/login', desc: '로그인', usage: 'Anthropic 계정 로그인 또는 API 키 설정' },
      { cmd: '/logout', desc: '로그아웃', usage: '현재 세션에서 로그아웃' },
      { cmd: '/mcp', desc: 'MCP 서버 관리', usage: 'Model Context Protocol 서버 추가/제거/상태 확인' },
      { cmd: '/memory', desc: '메모리 편집', usage: 'CLAUDE.md 직접 편집. 프로젝트 규칙/패턴을 영구 저장' },
      { cmd: '/model', desc: '모델 변경', usage: 'opus / sonnet / haiku 선택. 비용-성능 트레이드오프' },
      { cmd: '/permissions', desc: '권한 설정', usage: '파일 읽기/쓰기, Bash 실행 등 도구별 권한 관리' },
      { cmd: '/pr-comments', desc: 'PR 코멘트 확인', usage: '현재 브랜치 PR의 리뷰 코멘트를 가져와서 확인' },
      { cmd: '/release-notes', desc: '릴리즈 노트', usage: 'Git 커밋 히스토리 기반 릴리즈 노트 자동 생성' },
      { cmd: '/review', desc: 'PR/코드 리뷰', usage: 'Git diff 분석하여 코드 리뷰 수행. 버그/개선점 제안' },
      { cmd: '/status', desc: '상태 확인', usage: '모델, 컨텍스트 크기, 비용, 권한 등 세션 전체 상태' },
      { cmd: '/terminal-setup', desc: '터미널 설정', usage: '터미널 키 바인딩과 테마 최적화 설정' },
      { cmd: '/vim', desc: 'Vim 모드', usage: 'Vim 키 바인딩 토글. hjkl 이동, i/a/o 입력 모드' }
    ]
  },
  {
    id: 'cli', title: 'CLI 실행 옵션', icon: '>_', desc: '터미널에서 claude 실행 시 플래그', color: '#34d399',
    commands: [
      { cmd: 'claude "프롬프트"', desc: '초기 프롬프트', usage: '인터랙티브 모드 시작 + 첫 메시지 자동 입력' },
      { cmd: '-p, --print', desc: '비인터랙티브', usage: '결과만 출력하고 종료. 스크립트/CI에서 활용' },
      { cmd: '-c, --continue', desc: '이전 대화 이어하기', usage: '마지막 세션의 대화를 이어서 진행' },
      { cmd: '--resume <id>', desc: '특정 대화 복원', usage: '대화 ID를 지정하여 특정 세션 복원' },
      { cmd: '--model <model>', desc: '모델 지정', usage: 'opus, sonnet, haiku 중 선택' },
      { cmd: '-v, --verbose', desc: '상세 출력', usage: '디버깅용 상세 로그. API 호출, 도구 실행 확인' },
      { cmd: '--max-turns <n>', desc: '최대 턴 수', usage: '에이전트 자동 실행 최대 턴 제한 (-p와 함께)' },
      { cmd: '--allowedTools', desc: '허용 도구', usage: '특정 도구만 허용. 예: --allowedTools "Read,Grep"' },
      { cmd: '--disallowedTools', desc: '차단 도구', usage: '특정 도구 차단. 예: --disallowedTools "Bash"' },
      { cmd: '--add-dir <path>', desc: '디렉토리 추가', usage: '추가 작업 디렉토리. 여러 번 사용 가능' },
      { cmd: '--output-format', desc: '출력 형식', usage: 'json / text / stream-json. 자동화에 활용' },
      { cmd: '--system-prompt', desc: '시스템 프롬프트', usage: '-p와 함께 사용. 커스텀 시스템 프롬프트 지정' },
      { cmd: '--append-system-prompt', desc: '시스템 프롬프트 추가', usage: '기존 시스템 프롬프트에 내용 추가' },
      { cmd: '--no-auto-compact', desc: '자동 압축 끄기', usage: '컨텍스트 길어져도 자동 압축 비활성화' },
      { cmd: '--skip-permissions', desc: '권한 스킵 (CI용)', usage: 'CI/CD 전용. 모든 권한 확인 생략. 주의!' },
      { cmd: 'claude config list', desc: '설정 목록', usage: '모든 설정값과 현재 값 표시' },
      { cmd: 'claude config set <k> <v>', desc: '설정 변경', usage: '예: claude config set model opus' },
      { cmd: 'claude mcp add', desc: 'MCP 서버 추가', usage: 'MCP 서버 등록. stdio/sse 프로토콜 지원' },
      { cmd: 'claude mcp list', desc: 'MCP 목록', usage: '등록된 MCP 서버와 상태 확인' },
      { cmd: 'claude update', desc: '업데이트', usage: 'Claude Code를 최신 버전으로 업데이트' }
    ]
  },
  {
    id: 'keys', title: '키보드 단축키', icon: '⌨', desc: '인터랙티브 모드 단축키', color: '#f59e0b',
    commands: [
      { cmd: 'Ctrl+C', desc: '응답 중단', usage: 'Claude 응답 중 즉시 중단. 입력 중이면 내용 초기화' },
      { cmd: 'Ctrl+D', desc: '세션 종료', usage: 'Claude Code 세션 완전 종료' },
      { cmd: 'Escape', desc: '입력 취소', usage: '현재 입력 취소. 멀티라인 입력 취소에도 사용' },
      { cmd: 'Up / Down', desc: '히스토리 탐색', usage: '이전에 입력했던 프롬프트를 위/아래로 탐색' },
      { cmd: 'Tab', desc: '자동 완성', usage: '파일명, 경로, 커맨드명 자동 완성' },
      { cmd: 'Shift+Enter', desc: '여러줄 입력', usage: '줄바꿈하면서 계속 입력. 긴 프롬프트 작성용' },
      { cmd: 'Ctrl+L', desc: '화면 지우기', usage: '터미널 화면 초기화 (대화 컨텍스트는 유지)' },
      { cmd: 'Ctrl+J', desc: '줄바꿈 (대안)', usage: 'Shift+Enter와 동일. 터미널 호환성용' }
    ]
  }
]

const EXT_ICONS: Record<string, string> = {
  '.ahk': '🎮', '.ps1': '💠', '.bat': '📦', '.cmd': '📦',
  '.py': '🐍', '.js': '🟨', '.vbs': '📜'
}
const EXT_COLORS: Record<string, string> = {
  '.ahk': '#34d399', '.ps1': '#60a5fa', '.bat': '#f59e0b', '.cmd': '#f59e0b',
  '.py': '#a78bfa', '.js': '#fbbf24', '.vbs': '#fb923c'
}

// Shared styles
const sectionLabel: React.CSSProperties = {
  fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8,
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5
}

const glassCard = (hover = false): React.CSSProperties => ({
  padding: '10px 12px', borderRadius: 10,
  background: hover ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  transition: 'all 0.2s ease'
})

// --- Collapsible Section ---
function CollapsibleSection({ title, icon, color, defaultOpen, badge, onRefresh, children }: {
  title: string; icon: string; color: string; defaultOpen: boolean
  badge?: string; onRefresh?: () => void; children: React.ReactNode
}): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{
      marginBottom: 14, borderRadius: 12, overflow: 'hidden',
      border: `1px solid ${open ? color + '25' : 'rgba(255,255,255,0.06)'}`,
      transition: 'border-color 0.2s ease'
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', textAlign: 'left', padding: '11px 14px',
        background: `linear-gradient(135deg, ${color}10, ${color}06)`,
        borderBottom: open ? `1px solid ${color}18` : 'none',
        border: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.2s ease'
      }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${color}18, ${color}0c)` }}
        onMouseLeave={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${color}10, ${color}06)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{title}</span>
          {badge && (
            <span style={{
              fontSize: 9, padding: '1px 7px', borderRadius: 10,
              background: `${color}20`, color, fontWeight: 600
            }}>{badge}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onRefresh && open && (
            <span onClick={(e) => { e.stopPropagation(); onRefresh() }}
              style={{
                fontSize: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.25)',
                padding: '2px 4px', transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = color }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
              title="새로고침">
              ↻
            </span>
          )}
          <span style={{
            fontSize: 10, color: 'rgba(255,255,255,0.2)', transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>▼</span>
        </div>
      </button>
      {open && <div style={{ padding: '10px 12px' }}>{children}</div>}
    </div>
  )
}

// --- Macro Section ---
function MacroSection({ refreshKey }: { refreshKey: number }): JSX.Element {
  const [macros, setMacros] = useState<MacroFile[]>([])
  const [loading, setLoading] = useState(false)
  const [runningMacro, setRunningMacro] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    window.api.getMacros().then((data) => {
      setMacros(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [refreshKey])

  const handleRun = async (macro: MacroFile): Promise<void> => {
    setRunningMacro(macro.name)
    try {
      await window.api.runMacro(macro.path)
    } catch { /* ignore */ }
    setTimeout(() => setRunningMacro(null), 1500)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
        매크로 로딩 중...
      </div>
    )
  }

  if (macros.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '20px 12px', color: 'rgba(255,255,255,0.2)', fontSize: 11
      }}>
        등록된 매크로가 없습니다
        <div style={{ fontSize: 10, marginTop: 4, color: 'rgba(255,255,255,0.12)' }}>
          ~/.claude/macros/ 폴더에 스크립트를 넣으세요
        </div>
        <div style={{ fontSize: 9, marginTop: 6, color: 'rgba(255,255,255,0.1)' }}>
          지원: .ahk .ps1 .bat .py .js .vbs
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {macros.map((macro) => {
        const isRunning = runningMacro === macro.name
        const color = EXT_COLORS[macro.ext] || '#60a5fa'
        return (
          <button key={macro.name} onClick={() => handleRun(macro)}
            style={{
              padding: '8px 12px', borderRadius: 8, width: '100%',
              background: isRunning ? `${color}12` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isRunning ? `${color}30` : 'rgba(255,255,255,0.06)'}`,
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}25` }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isRunning ? `${color}12` : 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = isRunning ? `${color}30` : 'rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>
              {EXT_ICONS[macro.ext] || '📄'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {macro.name}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                {macro.description}
              </div>
            </div>
            <span style={{
              fontSize: 9, padding: '2px 8px', borderRadius: 10, flexShrink: 0,
              background: isRunning ? `rgba(52,211,153,0.15)` : `${color}15`,
              color: isRunning ? '#34d399' : color,
              fontWeight: 600, transition: 'all 0.15s'
            }}>
              {isRunning ? '실행됨!' : '실행'}
            </span>
          </button>
        )
      })}
      <div style={{
        textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 4
      }}>
        {macros.length}개 매크로 · ~/.claude/macros/
      </div>
    </div>
  )
}

// --- Main WorkTab ---
export default function WorkTab(): JSX.Element {
  const { skills, recentSkills, selectedCategory, setSelectedCategory, launchSkill } = useHubStore()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)
  const [macroRefreshKey, setMacroRefreshKey] = useState(0)
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null)

  const copyCommand = (cmd: string): void => {
    navigator.clipboard.writeText(cmd)
    setCopiedCmd(cmd)
    setTimeout(() => setCopiedCmd(null), 1500)
  }

  const filteredSkills = selectedCategory
    ? skills.filter((s) => s.category === selectedCategory)
    : []

  const toggleSection = (id: string): void => {
    setExpandedSection(expandedSection === id ? null : id)
  }

  // Skill drill-down view
  if (selectedCategory) {
    return (
      <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>
        <button onClick={() => setSelectedCategory(null)}
          style={{
            fontSize: 11, color: 'rgba(255,255,255,0.35)', background: 'none',
            border: 'none', cursor: 'pointer', marginBottom: 10, padding: '2px 4px',
            transition: 'color 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
          ← 뒤로
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredSkills.map((skill) => {
            const isHovered = hoveredSkill === skill.name
            const tooltip = SKILL_TOOLTIPS[skill.name]
            return (
              <div key={skill.name} style={{ position: 'relative' }}>
                <button onClick={() => launchSkill(skill.name, skill.projectPath)}
                  style={{
                    textAlign: 'left', padding: 12, borderRadius: 10, width: '100%',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.borderColor = 'rgba(167,139,250,0.2)'
                    setHoveredSkill(skill.name)
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                    setHoveredSkill(null)
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>/{skill.name}</span>
                    <span style={{
                      fontSize: 9, padding: '3px 10px', borderRadius: 6,
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))',
                      color: '#c4b5fd', fontWeight: 600, letterSpacing: 0.5
                    }}>
                      실행
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {skill.description}
                  </p>
                  {skill.techStack && (
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{skill.techStack}</p>
                  )}
                </button>
                {isHovered && tooltip && (
                  <div style={{
                    position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 10,
                    marginTop: 4, padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(30,30,46,0.95)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(167,139,250,0.2)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5,
                    animation: 'fadeIn 0.15s ease'
                  }}>
                    {tooltip}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 16px' }}>

      {/* ▾ 매크로 섹션 (위에 배치) */}
      <CollapsibleSection title="매크로" icon="⚡" color="#34d399" defaultOpen={false}
        onRefresh={() => setMacroRefreshKey((k) => k + 1)}>
        <MacroSection refreshKey={macroRefreshKey} />
      </CollapsibleSection>

      {/* ▾ 스킬 섹션 */}
      <CollapsibleSection title="스킬" icon="⚡" color="#a78bfa" defaultOpen={false}>
        {/* 최근 사용 */}
        {recentSkills.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={sectionLabel}>최근 사용</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {recentSkills.map((name) => {
                const skill = skills.find((s) => s.name === name)
                if (!skill) return null
                return (
                  <button key={name} onClick={() => launchSkill(skill.name, skill.projectPath)}
                    style={{
                      fontSize: 11, padding: '5px 14px', borderRadius: 20,
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(96,165,250,0.1))',
                      border: '1px solid rgba(167,139,250,0.2)', color: '#c4b5fd',
                      cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.2))' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(96,165,250,0.1))' }}>
                    /{name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 카테고리 그리드 */}
        <div style={sectionLabel}>커스텀 스킬</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {CATEGORIES.map((cat) => {
            const count = skills.filter((s) => s.category === cat.id).length
            return (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '14px 12px', borderRadius: 12,
                  border: `1px solid ${cat.color}22`,
                  background: `linear-gradient(135deg, ${cat.color}08, ${cat.color}04)`,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${cat.color}18, ${cat.color}10)`
                  e.currentTarget.style.borderColor = `${cat.color}40`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${cat.color}08, ${cat.color}04)`
                  e.currentTarget.style.borderColor = `${cat.color}22`
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{cat.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: cat.color }}>{cat.label}</span>
                </div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{count}개 스킬</span>
              </button>
            )
          })}
        </div>

        {/* Claude Code 레퍼런스 */}
        <div style={sectionLabel}>Claude Code 레퍼런스</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {COMMAND_SECTIONS.map((section) => {
            const isOpen = expandedSection === section.id
            return (
              <div key={section.id}>
                <button onClick={() => toggleSection(section.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                    background: isOpen
                      ? `linear-gradient(135deg, ${section.color}12, ${section.color}08)`
                      : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isOpen ? section.color + '30' : 'rgba(255,255,255,0.05)'}`,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{
                        fontSize: 12, color: section.color, fontWeight: 700,
                        fontFamily: 'Consolas, monospace',
                        background: `${section.color}15`, padding: '1px 6px', borderRadius: 4
                      }}>
                        {section.icon}
                      </code>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                        {section.title}
                      </span>
                      <span style={{
                        fontSize: 9, color: 'rgba(255,255,255,0.25)',
                        background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 3
                      }}>
                        {section.commands.length}
                      </span>
                    </div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{section.desc}</p>
                  </div>
                  <span style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.2)', transition: 'transform 0.2s ease',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4, marginBottom: 8 }}>
                    {section.commands.map((c) => (
                      <button key={c.cmd} onClick={() => copyCommand(c.cmd)}
                        style={{
                          ...glassCard(copiedCmd === c.cmd),
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          position: 'relative', transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                          e.currentTarget.style.borderColor = `${section.color}25`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = copiedCmd === c.cmd ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)'
                          e.currentTarget.style.borderColor = copiedCmd === c.cmd ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <code style={{
                            fontSize: 10.5, color: copiedCmd === c.cmd ? '#34d399' : section.color, fontWeight: 600,
                            fontFamily: 'Consolas, monospace', flexShrink: 0,
                            transition: 'color 0.15s'
                          }}>
                            {c.cmd}
                          </code>
                          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', flex: 1 }}>{c.desc}</span>
                          {copiedCmd === c.cmd ? (
                            <span style={{ fontSize: 9, color: '#34d399', flexShrink: 0, fontWeight: 600 }}>복사됨!</span>
                          ) : (
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', flexShrink: 0 }}>복사</span>
                          )}
                        </div>
                        <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.25)', marginTop: 2, lineHeight: 1.4 }}>
                          {c.usage}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CollapsibleSection>

    </div>
  )
}
