import { motion } from 'framer-motion'
import { useHubStore } from '../../store/useHubStore'

interface SkillListProps {
  category: Skill['category']
  onBack: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  dev: 'border-cat-dev/30',
  idea: 'border-cat-idea/30',
  work: 'border-cat-work/30',
  more: 'border-cat-more/30'
}

export default function SkillList({ category, onBack }: SkillListProps): JSX.Element {
  const skills = useHubStore((s) => s.skills.filter((sk) => sk.category === category))
  const launchSkill = useHubStore((s) => s.launchSkill)

  return (
    <motion.div
      className="flex-1 flex flex-col gap-2 overflow-hidden"
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -30, opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-text-muted hover:text-text-primary
                   transition-colors text-xs self-start px-1"
      >
        ← 뒤로
      </button>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {skills.map((skill, i) => (
          <motion.button
            key={skill.name}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => launchSkill(skill.name, skill.projectPath)}
            className={`w-full text-left rounded-lg border p-3
                       bg-white/5 hover:bg-white/10
                       transition-colors duration-150 cursor-pointer
                       ${CATEGORY_COLORS[category] || 'border-glass-border'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">
                /{skill.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted">
                실행
              </span>
            </div>
            <p className="text-[11px] text-text-secondary mt-1 line-clamp-1">
              {skill.description}
            </p>
            {skill.techStack && (
              <p className="text-[10px] text-text-muted mt-1">
                {skill.techStack}
              </p>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
