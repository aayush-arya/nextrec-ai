import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore'

const MOODS = [
  { key: 'happy',        label: 'Happy',      emoji: '😊', glow: 'rgba(250,204,21,0.35)',  border: 'rgba(250,204,21,0.5)',  bg: 'rgba(250,204,21,0.1)' },
  { key: 'funny',        label: 'Funny',      emoji: '😂', glow: 'rgba(167,139,250,0.35)', border: 'rgba(167,139,250,0.5)', bg: 'rgba(167,139,250,0.1)' },
  { key: 'romantic',     label: 'Romantic',   emoji: '❤️', glow: 'rgba(244,114,182,0.35)', border: 'rgba(244,114,182,0.5)', bg: 'rgba(244,114,182,0.1)' },
  { key: 'emotional',    label: 'Emotional',  emoji: '😢', glow: 'rgba(96,165,250,0.35)',  border: 'rgba(96,165,250,0.5)',  bg: 'rgba(96,165,250,0.1)' },
  { key: 'thriller',     label: 'Thriller',   emoji: '😱', glow: 'rgba(248,113,113,0.35)', border: 'rgba(248,113,113,0.5)', bg: 'rgba(248,113,113,0.1)' },
  { key: 'motivational', label: 'Motivated',  emoji: '💪', glow: 'rgba(251,146,60,0.35)',  border: 'rgba(251,146,60,0.5)',  bg: 'rgba(251,146,60,0.1)' },
  { key: 'adventure',    label: 'Adventure',  emoji: '🌍', glow: 'rgba(52,211,153,0.35)',  border: 'rgba(52,211,153,0.5)',  bg: 'rgba(52,211,153,0.1)' },
  { key: 'relaxed',      label: 'Relaxed',    emoji: '😴', glow: 'rgba(45,212,191,0.35)',  border: 'rgba(45,212,191,0.5)',  bg: 'rgba(45,212,191,0.1)' },
  { key: 'energetic',    label: 'Energetic',  emoji: '⚡', glow: 'rgba(163,230,53,0.35)',  border: 'rgba(163,230,53,0.5)',  bg: 'rgba(163,230,53,0.1)' },
  { key: 'chill',        label: 'Chill',      emoji: '🌊', glow: 'rgba(56,189,248,0.35)',  border: 'rgba(56,189,248,0.5)',  bg: 'rgba(56,189,248,0.1)' },
  { key: 'nostalgic',    label: 'Nostalgic',  emoji: '🕰️', glow: 'rgba(251,191,36,0.35)',  border: 'rgba(251,191,36,0.5)',  bg: 'rgba(251,191,36,0.1)' },
  { key: 'epic',         label: 'Epic',       emoji: '🔥', glow: 'rgba(239,68,68,0.35)',   border: 'rgba(239,68,68,0.5)',   bg: 'rgba(239,68,68,0.1)' },
  { key: 'focused',      label: 'Focused',    emoji: '🎯', glow: 'rgba(34,211,238,0.35)',  border: 'rgba(34,211,238,0.5)',  bg: 'rgba(34,211,238,0.1)' },
  { key: 'curious',      label: 'Curious',    emoji: '🔭', glow: 'rgba(129,140,248,0.35)', border: 'rgba(129,140,248,0.5)', bg: 'rgba(129,140,248,0.1)' },
  { key: 'dreamy',       label: 'Dreamy',     emoji: '🌙', glow: 'rgba(192,132,252,0.35)', border: 'rgba(192,132,252,0.5)', bg: 'rgba(192,132,252,0.1)' },
  { key: 'dark',         label: 'Dark',       emoji: '🌑', glow: 'rgba(148,163,184,0.25)', border: 'rgba(148,163,184,0.4)', bg: 'rgba(148,163,184,0.08)' },
]

export default function MoodSelector() {
  const { activeMood, setActiveMood } = useUIStore()

  return (
    <div className="flex gap-2 flex-wrap">
      {MOODS.map((mood) => {
        const isActive = activeMood === mood.key
        return (
          <motion.button
            key={mood.key}
            whileTap={{ scale: 0.9 }}
            whileHover={{ y: -2, scale: 1.04 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => setActiveMood(activeMood === mood.key ? null : mood.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200"
            style={{
              background: isActive ? mood.bg : 'rgba(255,255,255,0.04)',
              border: isActive
                ? `1px solid ${mood.border}`
                : '1px solid rgba(255,255,255,0.07)',
              color: isActive ? '#f4f4f5' : '#a1a1aa',
              boxShadow: isActive
                ? `0 0 14px ${mood.glow}, 0 0 32px ${mood.glow.replace('0.35', '0.12')}`
                : 'none',
              animation: isActive ? 'pulse-glow 2.5s ease-in-out infinite' : 'none',
            }}
          >
            <motion.span
              animate={isActive ? { rotate: [0, -8, 8, 0], scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              {mood.emoji}
            </motion.span>
            <span>{mood.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
