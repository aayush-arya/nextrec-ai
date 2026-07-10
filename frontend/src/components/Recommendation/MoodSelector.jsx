import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore'

const MOODS = [
  // Row 1 — original
  { key: 'happy',        label: 'Happy',        emoji: '😊', color: 'hover:border-yellow-400/60 hover:bg-yellow-500/10 data-[active=true]:border-yellow-400 data-[active=true]:bg-yellow-500/10' },
  { key: 'funny',        label: 'Funny',        emoji: '😂', color: 'hover:border-violet-400/60 hover:bg-violet-500/10 data-[active=true]:border-violet-400 data-[active=true]:bg-violet-500/10' },
  { key: 'romantic',     label: 'Romantic',     emoji: '❤️',  color: 'hover:border-pink-400/60 hover:bg-pink-500/10 data-[active=true]:border-pink-400 data-[active=true]:bg-pink-500/10' },
  { key: 'emotional',    label: 'Emotional',    emoji: '😢', color: 'hover:border-blue-400/60 hover:bg-blue-500/10 data-[active=true]:border-blue-400 data-[active=true]:bg-blue-500/10' },
  { key: 'thriller',     label: 'Thriller',     emoji: '😱', color: 'hover:border-red-400/60 hover:bg-red-500/10 data-[active=true]:border-red-400 data-[active=true]:bg-red-500/10' },
  { key: 'motivational', label: 'Motivated',    emoji: '💪', color: 'hover:border-orange-400/60 hover:bg-orange-500/10 data-[active=true]:border-orange-400 data-[active=true]:bg-orange-500/10' },
  { key: 'adventure',    label: 'Adventure',    emoji: '🌍', color: 'hover:border-emerald-400/60 hover:bg-emerald-500/10 data-[active=true]:border-emerald-400 data-[active=true]:bg-emerald-500/10' },
  { key: 'relaxed',      label: 'Relaxed',      emoji: '😴', color: 'hover:border-teal-400/60 hover:bg-teal-500/10 data-[active=true]:border-teal-400 data-[active=true]:bg-teal-500/10' },
  // Row 2 — new
  { key: 'energetic',    label: 'Energetic',    emoji: '⚡', color: 'hover:border-lime-400/60 hover:bg-lime-500/10 data-[active=true]:border-lime-400 data-[active=true]:bg-lime-500/10' },
  { key: 'chill',        label: 'Chill',        emoji: '🌊', color: 'hover:border-sky-400/60 hover:bg-sky-500/10 data-[active=true]:border-sky-400 data-[active=true]:bg-sky-500/10' },
  { key: 'nostalgic',    label: 'Nostalgic',    emoji: '🕰️', color: 'hover:border-amber-400/60 hover:bg-amber-500/10 data-[active=true]:border-amber-400 data-[active=true]:bg-amber-500/10' },
  { key: 'epic',         label: 'Epic',         emoji: '🔥', color: 'hover:border-red-500/60 hover:bg-red-500/10 data-[active=true]:border-red-500 data-[active=true]:bg-red-500/10' },
  { key: 'focused',      label: 'Focused',      emoji: '🎯', color: 'hover:border-cyan-400/60 hover:bg-cyan-500/10 data-[active=true]:border-cyan-400 data-[active=true]:bg-cyan-500/10' },
  { key: 'curious',      label: 'Curious',      emoji: '🔭', color: 'hover:border-indigo-400/60 hover:bg-indigo-500/10 data-[active=true]:border-indigo-400 data-[active=true]:bg-indigo-500/10' },
  { key: 'dreamy',       label: 'Dreamy',       emoji: '🌙', color: 'hover:border-purple-400/60 hover:bg-purple-500/10 data-[active=true]:border-purple-400 data-[active=true]:bg-purple-500/10' },
  { key: 'dark',         label: 'Dark',         emoji: '🌑', color: 'hover:border-slate-400/60 hover:bg-slate-500/10 data-[active=true]:border-slate-400 data-[active=true]:bg-slate-500/10' },
]

export default function MoodSelector() {
  const { activeMood, setActiveMood } = useUIStore()

  return (
    <div className="flex gap-2 flex-wrap">
      {MOODS.map((mood) => (
        <motion.button
          key={mood.key}
          whileTap={{ scale: 0.92 }}
          whileHover={{ y: -1 }}
          data-active={activeMood === mood.key}
          onClick={() => setActiveMood(activeMood === mood.key ? null : mood.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-700
                     text-xs font-medium text-zinc-300 transition-all duration-200 ${mood.color}`}
        >
          <span>{mood.emoji}</span>
          <span>{mood.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
