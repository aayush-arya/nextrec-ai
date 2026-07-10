import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Compass, Filter, ChevronDown } from 'lucide-react'
import { itemsAPI } from '../services/api'
import ItemCard from '../components/Cards/ItemCard'
import { CardGridSkeleton } from '../components/UI/Skeleton'
import useUIStore from '../store/uiStore'

const DOMAINS = [
  { key: 'all',      label: 'All',      icon: '🌐' },
  { key: 'movies',   label: 'Movies',   icon: '🎬' },
  { key: 'books',    label: 'Books',    icon: '📚' },
  { key: 'music',    label: 'Music',    icon: '🎵' },
  { key: 'food',     label: 'Food',     icon: '🍕' },
  { key: 'courses',  label: 'Courses',  icon: '🎓' },
  { key: 'products', label: 'Products', icon: '🛍️' },
]

const SORT_OPTIONS = [
  { key: 'popularity', label: 'Most Popular' },
  { key: 'rating',     label: 'Top Rated' },
  { key: 'newest',     label: 'Newest First' },
]

export default function Discover() {
  const { activeDomain, setActiveDomain } = useUIStore()
  const [items, setItems] = useState([])
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [sortBy, setSortBy] = useState('popularity')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    setPage(1)
    setItems([])
    fetchItems(1, true)
    fetchGenres()
  }, [activeDomain, selectedGenre, sortBy])

  const fetchItems = async (p = 1, reset = false) => {
    setLoading(true)
    try {
      const params = { page: p, limit: 20 }
      if (activeDomain !== 'all') params.domain = activeDomain
      if (selectedGenre) params.genre = selectedGenre
      const { data } = await itemsAPI.list(params)
      // sort client-side
      const sorted = [...data].sort((a, b) => {
        if (sortBy === 'rating') return b.avg_rating - a.avg_rating
        if (sortBy === 'newest') return (b.release_year || 0) - (a.release_year || 0)
        return b.popularity_score - a.popularity_score
      })
      setItems((prev) => reset ? sorted : [...prev, ...sorted])
      setHasMore(data.length === 20)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const fetchGenres = async () => {
    try {
      const domain = activeDomain !== 'all' ? activeDomain : undefined
      const { data } = await itemsAPI.genres(domain)
      setGenres(data.slice(0, 15))
    } catch { /* ignore */ }
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchItems(next, false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
          <Compass size={20} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Discover</h1>
          <p className="text-zinc-400 text-sm">Explore across all categories</p>
        </div>
      </div>

      {/* Domain tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {DOMAINS.map((d) => (
          <button
            key={d.key}
            onClick={() => { setActiveDomain(d.key); setSelectedGenre('') }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                       ${activeDomain === d.key
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'}`}
          >
            <span>{d.icon}</span>{d.label}
          </button>
        ))}
      </div>

      {/* Genre filter & sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
          <button
            onClick={() => setSelectedGenre('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                       ${!selectedGenre ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          >
            All Genres
          </button>
          {genres.map((g) => (
            <button
              key={g.genre}
              onClick={() => setSelectedGenre(g.genre)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                         ${selectedGenre === g.genre ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
            >
              {g.genre} <span className="text-zinc-600 ml-1">{g.count}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-xl px-4 py-2 pr-8 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {/* Grid */}
      {loading && items.length === 0 ? (
        <CardGridSkeleton count={20} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}>
                <ItemCard item={item} showDomain={activeDomain === 'all'} />
              </motion.div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="text-center py-16 text-zinc-500">
              <p className="text-lg">No items found</p>
              <p className="text-sm mt-1">Try a different domain or genre</p>
            </div>
          )}

          {hasMore && items.length > 0 && (
            <div className="flex justify-center pt-4">
              <button onClick={loadMore} disabled={loading}
                className="btn-secondary flex items-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" /> : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
