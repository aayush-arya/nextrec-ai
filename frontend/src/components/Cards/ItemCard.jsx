import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Bookmark, BookmarkCheck, Play, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ratingsAPI } from '../../services/api'
import { toast } from 'react-hot-toast'
import Badge from '../UI/Badge'

const DOMAIN_COLORS = {
  movies:   'purple',
  books:    'blue',
  music:    'green',
  food:     'orange',
  courses:  'gold',
  products: 'red',
}

const DOMAIN_ICONS = {
  movies: '🎬', books: '📚', music: '🎵', food: '🍕', courses: '🎓', products: '🛍️',
}

export default function ItemCard({ item, showDomain = false, rank = null }) {
  const navigate = useNavigate()
  const [bookmarked, setBookmarked] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)

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
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={() => navigate(`/item/${item.id}`)}
      className="group relative bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer
                 border border-zinc-800 hover:border-violet-500/50
                 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10"
    >
      {/* Rank badge */}
      {rank && (
        <div className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
          {rank}
        </div>
      )}

      {/* Bookmark */}
      <button
        onClick={handleBookmark}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 backdrop-blur-sm
                   text-zinc-400 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100"
      >
        {bookmarked ? <BookmarkCheck size={16} className="text-violet-400" /> : <Bookmark size={16} />}
      </button>

      {/* Poster */}
      <div className="relative overflow-hidden bg-zinc-800 aspect-[2/3]">
        <img
          src={item.poster_url || posterFallback}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.src = posterFallback }}
          loading="lazy"
        />
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <button className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500
                             text-white text-sm font-semibold py-2 rounded-xl transition-colors">
            <Play size={14} fill="currentColor" /> View Details
          </button>
        </div>

        {/* Trending badge */}
        {item.is_trending && (
          <div className="absolute top-3 left-3 bg-orange-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded-full">
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

        {/* Genre & Year */}
        <div className="flex items-center gap-2 flex-wrap">
          {(item.genres?.[0] || item.genre) && (
            <Badge variant={DOMAIN_COLORS[item.domain] || 'zinc'} className="text-xs">
              {item.genres?.[0] || item.genre}
            </Badge>
          )}
          {item.release_year && (
            <span className="text-zinc-500 text-xs">{item.release_year}</span>
          )}
        </div>

        {/* Rating & Duration */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star size={12} fill="currentColor" />
            <span className="font-semibold text-zinc-300">{item.avg_rating?.toFixed(1)}</span>
            <span className="text-zinc-600">({item.total_ratings})</span>
          </div>
          {item.duration && (
            <div className="flex items-center gap-1 text-zinc-500">
              <Clock size={10} />
              <span>{item.duration}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
