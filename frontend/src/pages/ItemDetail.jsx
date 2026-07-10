import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Bookmark, BookmarkCheck, ArrowLeft, Clock, Calendar, Brain, Users, TrendingUp, Sparkles } from 'lucide-react'
import { itemsAPI, recsAPI, ratingsAPI } from '../services/api'
import ItemCard from '../components/Cards/ItemCard'
import { Skeleton } from '../components/UI/Skeleton'
import Badge from '../components/UI/Badge'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'

function StarRating({ onRate }) {
  const [hover, setHover] = useState(0)
  const [selected, setSelected] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((n) => (
        <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => { setSelected(n); onRate(n) }}
          className="transition-colors">
          <Star size={22} fill={(hover || selected) >= n ? 'currentColor' : 'none'}
            className={(hover || selected) >= n ? 'text-yellow-400' : 'text-zinc-600'} />
        </button>
      ))}
    </div>
  )
}

const REASON_ICON_MAP = {
  content: Brain, collaborative: Users, trending: TrendingUp, popularity: Star,
  semantic_match: Sparkles, user_history: Brain, genre_match: Sparkles,
}

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [item, setItem] = useState(null)
  const [similar, setSimilar] = useState([])
  const [explanation, setExplanation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookmarked, setBookmarked] = useState(false)
  const [userRating, setUserRating] = useState(0)

  useEffect(() => {
    setLoading(true)
    const itemId = parseInt(id)
    Promise.all([
      itemsAPI.get(itemId),
      recsAPI.similar(itemId, 6),
      isAuthenticated ? recsAPI.explain(itemId).catch(() => null) : Promise.resolve(null),
    ]).then(([itemRes, simRes, explainRes]) => {
      setItem(itemRes.data)
      setSimilar(simRes.data)
      if (explainRes) setExplanation(explainRes.data)
    }).catch(() => toast.error('Failed to load item')).finally(() => setLoading(false))
  }, [id, isAuthenticated])

  const handleRate = async (rating) => {
    if (!isAuthenticated) { toast.error('Login to rate items'); return }
    try {
      await ratingsAPI.rate({ item_id: parseInt(id), rating })
      setUserRating(rating)
      toast.success(`Rated ${rating}★`)
    } catch { toast.error('Failed to rate') }
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) { toast.error('Login to bookmark'); return }
    try {
      const { data } = await ratingsAPI.bookmark(parseInt(id))
      setBookmarked(data.bookmarked)
      toast.success(data.bookmarked ? 'Bookmarked!' : 'Removed')
    } catch { toast.error('Failed') }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <div className="space-y-3"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /></div>
      </div>
    )
  }
  if (!item) return <div className="text-center py-20 text-zinc-500">Item not found</div>

  const posterFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=7c3aed&color=ffffff&size=800`
  const meta = item.metadata_json || {}

  return (
    <div className="space-y-10 pb-10">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden h-72 sm:h-96">
        <img src={item.backdrop_url || item.poster_url || posterFallback} alt={item.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = posterFallback }} />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: poster */}
        <div className="hidden lg:block">
          <div className="rounded-2xl overflow-hidden aspect-[2/3] bg-zinc-800">
            <img src={item.poster_url || posterFallback} alt={item.title} className="w-full h-full object-cover"
              onError={(e) => { e.target.src = posterFallback }} />
          </div>
        </div>

        {/* Right: details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-zinc-100">{item.title}</h1>
              <button onClick={handleBookmark}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-violet-400 transition-all flex-shrink-0">
                {bookmarked ? <BookmarkCheck size={20} className="text-violet-400" /> : <Bookmark size={20} />}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              {item.genres?.map((g) => <Badge key={g} variant="purple">{g}</Badge>)}
              {item.release_year && (
                <span className="flex items-center gap-1 text-zinc-400 text-sm"><Calendar size={13} />{item.release_year}</span>
              )}
              {item.duration && (
                <span className="flex items-center gap-1 text-zinc-400 text-sm"><Clock size={13} />{item.duration}</span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Star size={18} className="text-yellow-400" fill="currentColor" />
              <span className="text-2xl font-bold">{item.avg_rating?.toFixed(1)}</span>
              <span className="text-zinc-500 text-sm">/ 5 · {item.total_ratings} ratings</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-zinc-300 leading-relaxed">{item.description}</p>

          {/* Metadata */}
          {Object.keys(meta).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(meta).filter(([k]) => !['mood'].includes(k)).slice(0, 6).map(([k, v]) => (
                <div key={k} className="bg-zinc-900 rounded-xl p-3">
                  <p className="text-xs text-zinc-500 capitalize mb-0.5">{k}</p>
                  <p className="text-sm text-zinc-200 font-medium line-clamp-1">
                    {Array.isArray(v) ? v.slice(0, 3).join(', ') : String(v)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Rate it */}
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <p className="text-sm font-medium text-zinc-300 mb-3">Rate this {item.domain.slice(0, -1)}</p>
            <StarRating onRate={handleRate} />
            {userRating > 0 && <p className="text-xs text-zinc-500 mt-2">You rated this {userRating}★</p>}
          </div>

          {/* AI Explanation */}
          {explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-violet-600/10 to-purple-600/5 border border-violet-500/20 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-violet-400" />
                <h3 className="font-semibold text-violet-300">Why this is recommended for you</h3>
              </div>
              <div className="space-y-3">
                {explanation.reasons?.map((r, i) => {
                  const Icon = REASON_ICON_MAP[r.type] || Brain
                  return (
                    <div key={i} className="flex items-start gap-3 bg-black/20 rounded-xl p-3">
                      <Icon size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{r.label}</p>
                        {r.detail && <p className="text-xs text-zinc-400 mt-0.5">{r.detail}</p>}
                      </div>
                      <div className="ml-auto text-xs text-violet-400 font-semibold">{Math.round((r.confidence || 0.5) * 100)}%</div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-zinc-500 mt-3">{explanation.summary}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Similar items */}
      {similar.length > 0 && (
        <section>
          <h2 className="section-header mb-4"><Sparkles size={18} className="text-violet-400" />Similar {item.domain}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {similar.map((sim) => <ItemCard key={sim.id} item={sim} />)}
          </div>
        </section>
      )}
    </div>
  )
}
