# GameQA Hub

Electron 기반 Game QA 워크스테이션 데스크탑 위젯. Claude Code 스킬 런처 + 워크스페이스 대시보드.

화면 우측에 항상 떠 있는 투명 패널로, 프로젝트 현황/스킬 실행/메모/Jira 이슈를 한눈에 관리한다.

## 스크린샷

```
┌──────────────────────┐
│  🎯 GameQA Hub       │  ← 드래그 가능, Alt+Space 토글
├──────────────────────┤
│ 🏠 📋 📜 📝 ···     │  ← 탭 바
├──────────────────────┤
│                      │
│  (탭 콘텐츠)          │
│                      │
└──────────────────────┘
```

## 핵심 기능

| 탭 | 내용 |
|---|---|
| **Home** | 프로젝트 Git 현황, 일일 목표, 루틴 추천, 데일리 스탠드업 |
| **Work** | Jira 이슈 현황 + 스킬 런처 + Claude Code 레퍼런스 |
| **History** | Claude 메모리 파일 뷰어 |
| **Notes** | 태그 기반 메모장 |
| **···** | 북마크, 이미지, 통계, 아이디어 백업, 루틴 설정, API 설정 |

## 기술 스택

- **Electron 34** + **React 19** + **TypeScript**
- **electron-vite** (빌드 도구)
- **Zustand** (상태 관리)
- **Tailwind CSS** (스타일)

---

# Skills 시스템 상세 가이드

GameQA Hub의 핵심은 **Claude Code Custom Skills**를 GUI에서 관리하고 원클릭 실행하는 것이다.

## 1. 스킬이란?

Claude Code의 커스텀 슬래시 커맨드. `~/.claude/skills/` 폴더에 마크다운으로 정의하면 Claude Code CLI에서 `/스킬이름`으로 호출할 수 있다.

```
~/.claude/skills/
├── 업무/
│   └── SKILL.md
├── 회고/
│   └── SKILL.md
├── QA/
│   └── SKILL.md
└── 리서치/
    └── SKILL.md
```

## 2. SKILL.md 작성법

### 기본 구조

```markdown
---
name: 스킬이름
description: 한 줄 설명
category: qa            # qa | ux | dev | analysis | research | docs | blog | more (생략 시 자동 감지)
---

여기에 시스템 프롬프트를 작성한다.
Claude Code가 이 스킬을 실행할 때 이 내용을 시스템 프롬프트로 사용한다.

## 실행 흐름
1. AskUserQuestion으로 메뉴 제시
2. 사용자 선택에 따라 분기
3. 결과물 생성/저장
```

### 프로젝트 연결 스킬

프로젝트 경로와 기술 스택을 넣으면 해당 디렉토리에서 Claude가 실행된다:

```markdown
---
name: 포폴
description: 포트폴리오 사이트 개발
category: dev
---

너는 포트폴리오 사이트 개발을 도와주는 에이전트야.

- 경로: ~/my-portfolio
- 기술 스택: Next.js, TypeScript, Tailwind CSS
```

### 업무/워크플로우 스킬

프로젝트가 없는 순수 워크플로우 스킬도 가능:

```markdown
---
name: 회고
description: 일간/주간 회고, KPT 분석
category: work
---

너는 Game QA 회고 에이전트야.

## 실행 흐름

### Step 1: 회고 유형 선택
AskUserQuestion으로 아래 선택지를 제시해:

- 옵션 1: **일간 회고** - 오늘 한 일 돌아보기
- 옵션 2: **주간 회고** - 이번 주 KPT 분석

### Step 2: 일간 회고
사용자에게 오늘 한 일을 물어본 후 정리:

## 일간 회고 - YYYY.MM.DD

### 오늘 한 일
- ...

### 잘한 점
- ...

### 내일 할 일
- ...
```

## 3. 카테고리 자동 분류 원리

스킬은 8개 카테고리로 자동 분류된다:

| 카테고리 | 조건 | 키워드 예시 |
|---------|------|-----------|
| **qa** | QA 키워드 2개+ | `테스트`, `버그`, `QA`, `체크리스트`, `회귀`, `탐색`, `TC`, `리포트` |
| **ux** | UX 키워드 2개+ | `사용성`, `휴리스틱`, `플레이테스트`, `UX`, `UI`, `피드백`, `유저` |
| **dev** | 개발 키워드 2개+ | `도구`, `스크립트`, `자동화`, `매크로`, `코드`, `빌드`, `python`, `git` |
| **analysis** | 분석 키워드 2개+ | `분석`, `로그`, `크래시`, `데이터`, `통계`, `패턴`, `비교` |
| **research** | 리서치 키워드 2개+ | `리서치`, `조사`, `트렌드`, `경쟁`, `벤치마크`, `시장` |
| **docs** | 문서 키워드 2개+ | `문서`, `발표`, `리포트`, `보고서`, `포트폴리오`, `회의록` |
| **blog** | 블로그 키워드 2개+ | `블로그`, `포스팅`, `TIL`, `회고`, `정리` |
| **more** | 위 조건 미충족 | (기본값) |

**분류 우선순위:**
1. YAML frontmatter의 `category:` 필드 (있으면 최우선)
2. 키워드 기반 점수 매칭
3. `경로:` 필드가 있으면 → dev
4. 모두 해당 없으면 → more

## 4. 스킬 실행 흐름

```
[사용자가 Hub에서 스킬 클릭]
        │
        ▼
[Renderer] launchSkill(name, projectPath)
        │  IPC invoke
        ▼
[Main Process] launch-skill 핸들러
        │  1. recentSkills 업데이트 (최근 8개 유지)
        │  2. skillLogs에 사용 기록 추가
        │  3. LaunchService.launch() 호출
        ▼
[LaunchService]
        │  1. Claude CLI 경로 탐지 (%APPDATA%/npm/claude.cmd)
        │  2. 임시 .bat 파일 생성:
        │     ┌─────────────────────────────┐
        │     │ @echo off                    │
        │     │ chcp 65001 >nul 2>&1        │  ← UTF-8 설정
        │     │ set CLAUDECODE=              │  ← 재귀 방지
        │     │ cd /d "프로젝트경로"           │  ← 작업 디렉토리
        │     │ "claude.cmd" "/스킬이름"      │  ← 스킬 실행
        │     └─────────────────────────────┘
        │  3. Windows Terminal 실행 시도 (wt.exe)
        │  4. 실패 시 CMD 폴백 (start "")
        ▼
[Windows Terminal / CMD]
   새 탭에서 Claude Code CLI가 해당 스킬로 시작됨
```

## 5. 스킬 핫 리로드

`~/.claude/skills/` 폴더를 `fs.watch`로 감시한다.
SKILL.md 파일이 변경되면:

1. 전체 스킬 목록 재로딩 (`loadSkills()`)
2. IPC 이벤트 발신 (`skills-updated`)
3. React 컴포넌트 자동 업데이트

→ Hub를 재시작하지 않아도 스킬 추가/수정이 즉시 반영된다.

## 6. 스킬 활용 팁

### 스킬 간 연계
스킬 안에서 다른 스킬을 참조할 수 있다:
```markdown
### Step 3: 연계
"이전으로" 선택 시 → `/시작` 스킬 흐름을 다시 실행해.
완료 후 → `/회고` 일간 회고로 연계.
```

### AskUserQuestion 패턴
사용자에게 선택지를 제시하는 가장 효과적인 패턴:
```markdown
AskUserQuestion으로 아래 선택지를 제시해:

**"무엇을 할까요?"**
- 옵션 1: **작업 A** - 설명
- 옵션 2: **작업 B** - 설명
- 옵션 3: **이전으로** - 메인 메뉴로 돌아가기
```

### 결과 저장 패턴
```markdown
AskUserQuestion:
**"결과를 어떻게 할까요?"**
- 옵션 1: **파일로 저장** - Desktop에 마크다운으로 저장
- 옵션 2: **계속 업데이트** - 대화 중 진행
- 옵션 3: **여기서 끝** - 화면 확인만
```

---

# 아키텍처

## 프로세스 구조

```
┌─ Main Process (Node.js) ──────────────────────┐
│                                                │
│  SkillsService   ~/.claude/skills/ 로딩+감시    │
│  LaunchService   .bat 생성 → wt.exe/cmd 실행   │
│  GitService      30초 간격 git status 폴링      │
│  StoreService    JSON 파일 key-value 저장소     │
│                                                │
│  IPC Handlers    get-skills, launch-skill, ...  │
│                                                │
└────────── ipcMain.handle ──────────────────────┘
                    │
                    │ contextBridge (보안 격리)
                    │
┌─ Preload ─────────┴────────────────────────────┐
│  window.api = {                                 │
│    getSkills, launchSkill, getJiraIssues, ...   │
│  }                                              │
└────────── ipcRenderer.invoke ──────────────────┘
                    │
┌─ Renderer (React) ┴────────────────────────────┐
│                                                │
│  App.tsx          초기화 + 이벤트 구독           │
│  useHubStore.ts   Zustand 상태 관리            │
│  Dashboard.tsx    탭 레이아웃                   │
│  WorkTab.tsx      Jira + 스킬 + 레퍼런스        │
│  HomeTab.tsx      프로젝트 현황 + 목표           │
│  NotesTab.tsx     메모장                        │
│  MoreTab.tsx      설정/통계/루틴                │
│                                                │
└────────────────────────────────────────────────┘
```

## 데이터 저장 위치

| 데이터 | 위치 | 형식 |
|--------|------|------|
| 스킬 정의 | `~/.claude/skills/*/SKILL.md` | Markdown + YAML frontmatter |
| 앱 설정/상태 | `%APPDATA%/gameqa-hub/store.json` | JSON key-value |
| 클립보드 이미지 | `~/.claude/images/` | PNG |
| 아이디어 백업 | `~/.claude/ideas/` | Markdown |
| 메모리 파일 | `~/.claude/projects/*/memory/` | Markdown |

## Jira 연동

Work 탭에서 Jira 이슈를 실시간으로 조회한다.

**설정:**
1. ··· → API 설정 → Jira 섹션
2. URL, Email, API Token, 프로젝트 키 입력

**동작:**
- REST API v3 (`/rest/api/3/search/jql`)
- JQL: `(assignee=currentUser() OR reporter=currentUser()) AND statusCategory != Done`
- Basic Auth (email:apiToken → base64)
- 새로고침 버튼으로 수동 갱신

---

# 설치 & 빌드

## 요구사항

- Node.js 18+
- Claude Code CLI (`npm i -g @anthropic-ai/claude-code`)
- Windows 10/11 (Windows Terminal 권장)

## 설치

```bash
git clone https://github.com/ko5439625/gameqa-hub.git
cd gameqa-hub
npm install
```

## 개발

```bash
npm run dev
```

## 빌드

```bash
npm run dist
```

→ `release/win-unpacked/GameQA Hub.exe`

## 스킬 디렉토리 초기 설정

```bash
mkdir -p ~/.claude/skills
```

스킬 추가 예시:
```bash
mkdir ~/.claude/skills/내스킬
cat > ~/.claude/skills/내스킬/SKILL.md << 'EOF'
---
name: 내스킬
description: 내 커스텀 스킬 설명
category: qa
---

너는 OO을 도와주는 에이전트야.

## 실행 흐름
1. ...
EOF
```

Hub에서 자동으로 인식된다 (핫 리로드).

## 단축키

| 키 | 동작 |
|---|---|
| `Alt+Space` | Hub 표시/숨기기 토글 |

---

# 라이선스

MIT
