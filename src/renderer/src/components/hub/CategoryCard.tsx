import { motion } from 'framer-motion'
import { useHubStore } from '../../store/useHubStore'

interface CategoryCardProps {
  id: 'qa' | 'ux' | 'dev' | 'analysis' | 'research' | 'docs' | 'blog' | 'more'
  label: string
  icon: string
  color: string
  onClick: () => void
}

const BG_MAP: Record<string, string> = {
  'text-cat-qa': 'bg-cat-qa/10 border-cat-qa/20 hover:bg-cat-qa/20',
  'text-cat-ux': 'bg-cat-ux/10 border-cat-ux/20 hover:bg-cat-ux/20',
  'text-cat-dev': 'bg-cat-dev/10 border-cat-dev/20 hover:bg-cat-dev/20',
  'text-cat-analysis': 'bg-cat-analysis/10 border-cat-analysis/20 hover:bg-cat-analysis/20',
  'text-cat-research': 'bg-cat-research/10 border-cat-research/20 hover:bg-cat-research/20',
  'text-cat-docs': 'bg-cat-docs/10 border-cat-docs/20 hover:bg-cat-docs/20',
  'text-cat-blog': 'bg-cat-blog/10 border-cat-blog/20 hover:bg-cat-blog/20',
  'text-cat-more': 'bg-cat-more/10 border-cat-more/20 hover:bg-cat-more/20'
}

export default function CategoryCard({
  id,
  label,
  icon,
  color,
  onClick
}: CategoryCardProps): JSX.Element {
  const skills = useHubStore((s) => s.skills.filter((sk) => sk.category === id))

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`rounded-xl border p-3 cursor-pointer
                  transition-colors duration-150
                  flex flex-col items-start gap-1
                  ${BG_MAP[color] || 'bg-glass border-glass-border hover:bg-glass-hover'}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className={`text-sm font-semibold ${color}`}>{label}</span>
      </div>
      <span className="text-[11px] text-text-muted">{skills.length}개 스킬</span>
    </motion.button>
  )
}
