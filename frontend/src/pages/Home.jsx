import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { TrendingUp, Sparkles, ArrowRight, Play, Star, Flame } from 'lucide-react'
import { recsAPI, itemsAPI } from '../services/api'
import ItemCard from '../components/Cards/ItemCard'
import RecommendationCard from '../components/Cards/RecommendationCard'
import MoodSelector from '../components/Recommendation/MoodSelector'
import { CardGridSkeleton } from '../components/UI/Skeleton'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'

function Section({ title, icon: Icon, children, seeAllTo, loading }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-violet-400" />}
          <h2 className="section-header">{title}</h2>
        </div>
        {seeAllTo && (
          <Link to={seeAllTo} className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
            See all <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {loading ? <CardGridSkeleton count={5} /> : children}
    </section>
  )
}

function HeroSection({ featuredItem }) {
  if (!featuredItem) return null
  const poster = featuredItem.poster_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(featuredItem.title)}&background=7c3aed&color=ffffff&size=800`

  return (
    <div className="relative w-full rounded-3xl overflow-hidden h-72 sm:h-96 mb-10">
      <img src={poster} alt={featuredItem.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(featuredItem.title)}&background=3f3f46&color=ffffff&size=800` }} />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
      <div className="absolute inset-0 flex items-end pb-8 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame size={14} className="text-orange-400" />
            <span className="text-orange-400 text-sm font-medium">Featured</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">{featuredItem.title}</h2>
          <p className="text-zinc-300 text-sm line-clamp-2 mb-4">{featuredItem.description}</p>
          <div className="flex items-center gap-3">
            <Link
              to={`/item/${featuredItem.id}`}
              className="flex items-center gap-2 bg-white text-zinc-900 hover:bg-zinc-100 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              <Play size={14} fill="currentColor" /> View Details
            </Link>
            <div className="flex items-center gap-1.5 text-yellow-400">
              <Star size={14} fill="currentColor" />
              <span className="text-white font-semibold text-sm">{featuredItem.avg_rating?.toFixed(1)}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function Home() {
  const { user, isAuthenticated } = useAuthStore()
  const { activeDomain, activeMood } = useUIStore()
  const [trending, setTrending] = useState([])
  const [personalized, setPersonalized] = useState([])
  const [featured, setFeatured] = useState(null)
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [loadingPersonalized, setLoadingPersonalized] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      setLoadingTrending(true)
      try {
        const { data } = await recsAPI.trending({ domain: activeDomain, n: 10 })
        setTrending(data)
        if (data.length > 0) setFeatured(data[0].item)
      } catch { /* ignore */ }
      setLoadingTrending(false)
    }
    fetchTrending()
  }, [activeDomain])

  useEffect(() => {
    const fetchPersonalized = async () => {
      setLoadingPersonalized(true)
      try {
        const { data } = await recsAPI.personalized({ domain: activeDomain, mood: activeMood || undefined, n: 10 })
        setPersonalized(data)
      } catch { /* ignore */ }
      setLoadingPersonalized(false)
    }
    fetchPersonalized()
  }, [activeDomain, activeMood, isAuthenticated])

  return (
    <div className="space-y-10">
      {/* Hero */}
      <HeroSection featuredItem={featured} />

      {/* Mood selector */}
      <section>
        <h2 className="section-header mb-3">
          <Sparkles size={18} className="text-violet-400" />
          What's your mood?
        </h2>
        <MoodSelector />
      </section>

      {/* For You */}
      <Section
        title={isAuthenticated ? `For You, ${user?.full_name?.split(' ')[0] || user?.username}` : 'Recommended For You'}
        icon={Sparkles}
        seeAllTo="/discover"
        loading={loadingPersonalized}
      >
        {personalized.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {personalized.map((rec, i) => (
              <motion.div key={rec.item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <RecommendationCard rec={rec} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-zinc-400">No recommendations yet.</p>
            {!isAuthenticated && (
              <Link to="/register" className="btn-primary inline-flex mt-3 text-sm">
                Sign up to get personalised recs
              </Link>
            )}
          </div>
        )}
      </Section>

      {/* Trending */}
      <Section title="Trending Now" icon={TrendingUp} seeAllTo="/discover" loading={loadingTrending}>
        {trending.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {trending.map((rec, i) => (
              <motion.div key={rec.item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ItemCard item={rec.item} rank={i + 1} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-600 glass rounded-2xl">
            <TrendingUp size={32} className="mx-auto mb-3 opacity-40" />
            <p>Start the backend to load trending items</p>
          </div>
        )}
      </Section>

      {/* CTA for guests */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 text-center bg-gradient-to-br from-violet-600/10 to-purple-600/5 border-violet-500/20"
        >
          <h3 className="text-2xl font-bold mb-2">Get AI-Powered Recommendations</h3>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            Sign up to unlock personalised recommendations that learn from your taste over time.
          </p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base px-8">
            <Sparkles size={16} /> Get Started Free
          </Link>
        </motion.div>
      )}
    </div>
  )
}
