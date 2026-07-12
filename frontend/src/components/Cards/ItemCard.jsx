import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Bookmark, BookmarkCheck, Play, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ratingsAPI } from '../../services/api'
import { toast } from 'react-hot-toast'
import Badge from '../UI/Badge'

const DOMAIN_COLORS = {
  movies: 'purple', books: 'blue', music: 'green',
  food: 'orange', courses: 'gold', products: 'red',
}

const DOMAIN_ICONS = {
  movies: '🎬', books: '📚', music: '🎵', food: '🍕', courses: '🎓', products: '🛍️',
}

export default function ItemCard({ item, showDomain = false, rank = null }) {
  const navigate = useNavigate()
  const [bookmarked, setBookmarked]   = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [hovered, setHovered]         = useState(false)

  const handleBookmark = async (e) => {
    e.stopPropagation()
    if (isBookmarking) return
    setIsBookmarking(true)
    try {
      const { data } = await ratingsAPI.bookmark(item.id)
      setBookmarked(data.bookmarked)
      toast.success(data.bookmarked ? 'Bookmarked!' : 'Removed from bookmarks')
    } catch {
      toast.error('Login to bookmark items')
    } finally {
      setIsBookmarking(false)
    }
  }

  const posterFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=7c3aed&color=ffffff&size=400`

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => navigate(`/item/${item.id}`)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: hovered ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: hovered
          ? '0 20px 60px rgba(0,0,0,0.55), 0 0 30px rgba(139,92,246,0.1)'
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Rank badge */}
      {rank && (
        <div
          className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', boxShadow: '0 2px 12px rgba(124,58,237,0.5)' }}
        >
          {rank}
        </div>
      )}

      {/* Bookmark */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        onClick={handleBookmark}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-zinc-400 hover:text-violet-400 transition-colors"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      >
        {bookmarked
          ? <BookmarkCheck size={16} className="text-violet-400" />
          : <Bookmark size={16} />
        }
      </motion.button>

      {/* Poster */}
      <div className="relative overflow-hidden bg-zinc-900 aspect-[2/3]">
        <img
          src={item.poster_url || posterFallback}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.src = posterFallback }}
          loading="lazy"
        />

        {/* Hover overlay */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-end p-3"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }}
        >
          <button
            className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-2 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(99,102,241,0.85))', backdropFilter: 'blur(8px)' }}
          >
            <Play size={14} fill="currentColor" /> View Details
          </button>
        </motion.div>

        {/* Trending badge */}
        {item.is_trending && (
          <div
            className="absolute top-3 left-3 text-white text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(249,115,22,0.85)', backdropFilter: 'blur(8px)' }}
          >
            🔥 Trending
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-zinc-100 leading-tight line-clamp-2 group-hover:text-violet-300 transition-colors">
            {item.title}
          </h3>
          {showDomain && (
            <span className="text-base flex-shrink-0" title={item.domain}>
              {DOMAIN_ICONS[item.domain] || '⭐'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(item.genres?.[0] || item.genre) && (
            <Badge variant={DOMAIN_COLORS[item.domain] || 'zinc'} className="text-xs">
              {item.genres?.[0] || item.genre}
            </Badge>
          )}
          {item.release_year && (
            <span className="text-zinc-600 text-xs">{item.release_year}</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star size={12} fill="currentColor" />
            <span className="font-semibold text-zinc-300">{item.avg_rating?.toFixed(1)}</span>
            <span className="text-zinc-600">({item.total_ratings})</span>
          </div>
          {item.duration && (
            <div className="flex items-center gap-1 text-zinc-600">
              <Clock size={10} />
              <span>{item.duration}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
