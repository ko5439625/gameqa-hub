import { useHubStore } from '../../store/useHubStore'

export default function RecentSkills(): JSX.Element {
  const { recentSkills, skills, launchSkill } = useHubStore()

  if (recentSkills.length === 0) {
    return (
      <div className="mt-2">
        <p className="text-[11px] text-text-muted px-1">
          최근 사용한 스킬이 없습니다. 카테고리를 선택하세요.
        </p>
      </div>
    )
  }

  const recentItems = recentSkills
    .map((name) => skills.find((s) => s.name === name))
    .filter(Boolean) as Skill[]

  return (
    <div className="mt-2 flex flex-col gap-1">
      <span className="text-[11px] text-text-muted px-1 font-medium">최근 사용</span>
      <div className="flex flex-wrap gap-1.5">
        {recentItems.map((skill) => (
          <button
            key={skill.name}
            onClick={() => launchSkill(skill.name, skill.projectPath)}
            className="text-[11px] px-2.5 py-1 rounded-full
                       bg-white/5 border border-glass-border
                       hover:bg-white/10 hover:border-accent/30
                       transition-colors cursor-pointer
                       text-text-secondary hover:text-text-primary"
          >
            /{skill.name}
          </button>
        ))}
      </div>
    </div>
  )
}
