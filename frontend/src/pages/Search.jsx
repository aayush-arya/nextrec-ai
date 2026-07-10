import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react'
import { searchAPI } from '../services/api'
import ItemCard from '../components/Cards/ItemCard'
import { CardGridSkeleton } from '../components/UI/Skeleton'

const DOMAINS = ['all','movies','books','music','food','courses','products']
const SORT_OPTIONS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'rating',    label: 'Top Rated' },
  { key: 'newest',    label: 'Newest' },
  { key: 'trending',  label: 'Trending' },
]

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [domain, setDomain] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  const [minRating, setMinRating] = useState(0)
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [searchType, setSearchType] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const doSearch = async (q = query) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const params = { q, sort_by: sortBy, min_rating: minRating }
      if (domain !== 'all') params.domain = domain
      const { data } = await searchAPI.search(params)
      setResults(data.results)
      setTotal(data.total)
      setSearchType(data.search_type)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setQuery(q); doSearch(q) }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setSearchParams({ q: query })
    doSearch()
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div>
        <form onSubmit={handleSubmit} className="relative">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything — movies, books, music…"
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 text-base rounded-2xl
                       pl-12 pr-14 py-4 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500
                       focus:ring-1 focus:ring-violet-500/40 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            {query && (
              <button type="button" onClick={() => { setQuery(''); setResults([]) }}
                className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                <X size={16} />
              </button>
            )}
            <button type="button" onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-colors ${showFilters ? 'bg-violet-600/20 text-violet-400' : 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </form>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4"
          >
            <div>
              <p className="text-xs font-medium text-zinc-400 mb-2">Domain</p>
              <div className="flex gap-2 flex-wrap">
                {DOMAINS.map((d) => (
                  <button key={d} onClick={() => setDomain(d)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize
                               ${domain === d ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-zinc-400 mb-2">Sort by</p>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((o) => (
                    <button key={o.key} onClick={() => setSortBy(o.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                                 ${sortBy === o.key ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-400 mb-2">Min rating: {minRating > 0 ? `${minRating}★` : 'Any'}</p>
                <input type="range" min="0" max="5" step="0.5" value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="w-full accent-violet-500" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results header */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-400">
            <span className="text-zinc-100 font-semibold">{total}</span> results for "{searchParams.get('q')}"
          </p>
          {searchType && (
            <span className={`text-xs px-2 py-1 rounded-full ${searchType.includes('semantic') ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-400'}`}>
              {searchType.includes('semantic') ? '🧠 Semantic' : '🔍 Keyword'} search
            </span>
          )}
        </div>
      )}

      {/* Results grid */}
      {loading ? <CardGridSkeleton count={12} /> : (
        results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <ItemCard item={item} showDomain />
              </motion.div>
            ))}
          </div>
        ) : query && !loading ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-zinc-400 text-lg">No results for "{query}"</p>
            <p className="text-zinc-600 text-sm mt-1">Try different keywords or broaden your search</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">✨</p>
            <p className="text-zinc-400 text-lg">Search for anything</p>
            <p className="text-zinc-600 text-sm mt-1">Movies, books, music, courses and more</p>
          </div>
        )
      )}
    </div>
  )
}
