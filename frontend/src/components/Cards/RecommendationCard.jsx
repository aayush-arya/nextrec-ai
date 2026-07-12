import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Zap, ChevronDown, ChevronUp, TrendingUp, Users, Brain, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Badge from '../UI/Badge'

const REASON_ICONS = {
  content:         { icon: Brain,      color: 'text-violet-400', bg: 'bg-violet-500/10' },
  collaborative:   { icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  trending:        { icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  popularity:      { icon: Star,       color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  semantic_match:  { icon: Sparkles,   color: 'text-pink-400',   bg: 'bg-pink-500/10' },
  cold_start:      { icon: Zap,        color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
  user_history:    { icon: Brain,      color: 'text-violet-400', bg: 'bg-violet-500/10' },
  genre_match:     { icon: Zap,        color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
}

/* Maps the dominant reason type → algorithm badge label + style class */
const ALGO_BADGE = {
  content:       { label: 'Content AI',   cls: 'algo-content' },
  collaborative: { label: 'Collab AI',    cls: 'algo-collaborative' },
  trending:      { label: 'Trending',     cls: 'algo-trending' },
  semantic_match:{ label: 'Semantic AI',  cls: 'algo-semantic' },
  cold_start:    { label: 'Discovery',    cls: 'algo-cold' },
  popularity:    { label: 'Popular',      cls: 'algo-trending' },
  user_history:  { label: 'Hybrid AI',    cls: 'algo-hybrid' },
  genre_match:   { label: 'Genre Match',  cls: 'algo-content' },
}

function ConfidenceBar({ value }) {
  return (
    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
      />
    </div>
  )
}

export default function RecommendationCard({ rec }) {
  const { item, reasons = [], match_percentage } = rec
  const navigate = useNavigate()
  const [showReasons, setShowReasons] = useState(false)
  const [hovered, setHovered] = useState(false)

  const posterFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=7c3aed&color=ffffff&size=400`

  /* Pick the dominant reason for the algorithm badge */
  const dominantReason = reasons[0]?.type
  const algoBadge = dominantReason ? ALGO_BADGE[dominantReason] : ALGO_BADGE.user_history

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: hovered ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: hovered
          ? '0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(139,92,246,0.1)'
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Match % pill — top left */}
      <div className="absolute top-3 left-3 z-10">
        <div
          className="text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(109,40,217,0.85))',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 12px rgba(124,58,237,0.4)',
          }}
        >
          <Zap size={10} fill="currentColor" />
          {match_percentage}%
        </div>
      </div>

      {/* Algorithm badge — top right */}
      {algoBadge && (
        <div className="absolute top-3 right-3 z-10">
          <span className={`algo-badge ${algoBadge.cls}`}>
            {algoBadge.label}
          </span>
        </div>
      )}

      {/* Poster */}
      <div
        className="relative aspect-[16/10] overflow-hidden cursor-pointer bg-zinc-900"
        onClick={() => navigate(`/item/${item.id}`)}
      >
        <img
          src={item.poster_url || posterFallback}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.src = posterFallback }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="cursor-pointer" onClick={() => navigate(`/item/${item.id}`)}>
          <h3 className="font-semibold text-zinc-100 leading-tight line-clamp-1 group-hover:text-violet-300 transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {item.genres?.[0] && (
              <Badge variant="purple" className="text-xs">{item.genres[0]}</Badge>
            )}
            <span className="text-zinc-600 text-xs">{item.release_year}</span>
            <div className="flex items-center gap-1 text-yellow-400 ml-auto">
              <Star size={11} fill="currentColor" />
              <span className="text-xs font-medium text-zinc-300">{item.avg_rating?.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* AI Explanation toggle */}
        <button
          onClick={() => setShowReasons(!showReasons)}
          className="w-full flex items-center justify-between text-xs text-zinc-500 hover:text-violet-300 transition-colors py-1 border-t border-white/[0.05]"
        >
          <span className="flex items-center gap-1.5">
            <Brain size={12} className="text-violet-500" />
            Why recommended?
          </span>
          <motion.div animate={{ rotate: showReasons ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} />
          </motion.div>
        </button>

        <AnimatePresence>
          {showReasons && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden space-y-2"
            >
              {reasons.slice(0, 3).map((reason, i) => {
                const cfg = REASON_ICONS[reason.type] || REASON_ICONS.content
                const Icon = cfg.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`rounded-xl p-2.5 ${cfg.bg}`}
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <Icon size={13} className={`${cfg.color} mt-0.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-200 leading-tight">{reason.label}</p>
                        {reason.detail && (
                          <p className="text-xs text-zinc-400 mt-0.5">{reason.detail}</p>
                        )}
                      </div>
                    </div>
                    <ConfidenceBar value={reason.confidence || 0.5} />
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
