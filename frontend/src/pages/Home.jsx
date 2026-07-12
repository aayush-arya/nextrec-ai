import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { TrendingUp, Sparkles, ArrowRight, Play, Star, Flame, Brain, Cpu } from 'lucide-react'
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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={18} className="text-violet-400" />}
          <h2 className="section-header">{title}</h2>
        </div>
        {seeAllTo && (
          <Link
            to={seeAllTo}
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-violet-300 transition-colors group"
          >
            See all
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {loading ? <CardGridSkeleton count={5} /> : children}
    </section>
  )
}

function HeroSection({ featuredItem }) {
  if (!featuredItem) return null
  const poster = featuredItem.poster_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(featuredItem.title)}&background=7c3aed&color=ffffff&size=800`

  return (
    <div className="relative w-full rounded-3xl overflow-hidden h-72 sm:h-96 mb-10">
      {/* Background image */}
      <img
        src={poster}
        alt={featuredItem.title}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(featuredItem.title)}&background=3f3f46&color=ffffff&size=800`
        }}
      />

      {/* Dark gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/60 via-transparent to-transparent" />

      {/* Glass info card */}
      <div className="absolute inset-0 flex items-end pb-8 px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md"
        >
          {/* Featured label */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-orange-300"
                 style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
              <Flame size={12} />
              Featured
            </div>
            {featuredItem.genres?.[0] && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium text-zinc-300"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {featuredItem.genres[0]}
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
            {featuredItem.title}
          </h2>
          <p className="text-zinc-400 text-sm line-clamp-2 mb-5">{featuredItem.description}</p>

          {/* Actions row */}
          <div className="flex items-center gap-3">
            <Link
              to={`/item/${featuredItem.id}`}
              className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all hover:shadow-glow-sm"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
            >
              <Play size={14} fill="currentColor" /> View Details
            </Link>
            <Link
              to="/discover"
              className="flex items-center gap-2 text-zinc-300 hover:text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Explore More
            </Link>
            {featuredItem.avg_rating && (
              <div className="flex items-center gap-1.5 text-yellow-400 ml-1">
                <Star size={14} fill="currentColor" />
                <span className="text-white font-semibold text-sm">{featuredItem.avg_rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function EmptyPersonalized({ isAuthenticated }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-10 text-center"
      style={{
        background: 'rgba(139,92,246,0.04)',
        border: '1px solid rgba(139,92,246,0.12)',
      }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.1))' }}
      >
        <Brain size={28} className="text-violet-400" />
      </motion.div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-1.5">Your AI is learning</h3>
      <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-5">
        {isAuthenticated
          ? 'Rate a few items and your personalised recommendations will appear here.'
          : 'Create an account to get AI recommendations that learn from your taste over time.'}
      </p>
      {!isAuthenticated && (
        <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-sm">
          <Sparkles size={15} /> Get Started Free
        </Link>
      )}
    </motion.div>
  )
}

export default function Home() {
  const { user, isAuthenticated } = useAuthStore()
  const { activeDomain, activeMood } = useUIStore()
  const [trending, setTrending]       = useState([])
  const [personalized, setPersonalized] = useState([])
  const [featured, setFeatured]       = useState(null)
  const [loadingTrending, setLoadingTrending]       = useState(true)
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
        <div className="flex items-center gap-2.5 mb-4">
          <Sparkles size={18} className="text-violet-400" />
          <h2 className="section-header">What's your mood?</h2>
        </div>
        <MoodSelector />
      </section>

      {/* For You */}
      <Section
        title={isAuthenticated ? `For You, ${user?.full_name?.split(' ')[0] || user?.username}` : 'Recommended For You'}
        icon={Cpu}
        seeAllTo="/discover"
        loading={loadingPersonalized}
      >
        {personalized.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {personalized.map((rec, i) => (
              <motion.div
                key={rec.item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <RecommendationCard rec={rec} />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyPersonalized isAuthenticated={isAuthenticated} />
        )}
      </Section>

      {/* Trending */}
      <Section title="Trending Now" icon={TrendingUp} seeAllTo="/discover" loading={loadingTrending}>
        {trending.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {trending.map((rec, i) => (
              <motion.div
                key={rec.item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <ItemCard item={rec.item} rank={i + 1} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-14 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <TrendingUp size={32} className="mx-auto mb-3 text-zinc-700" />
            <p className="text-zinc-600 text-sm">Start the backend to load trending items</p>
          </motion.div>
        )}
      </Section>

      {/* CTA for guests */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl p-10 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(99,102,241,0.06) 50%, rgba(6,182,212,0.05) 100%)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          {/* Decorative glow */}
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }}
          />
          <div className="relative z-10">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(99,102,241,0.2))' }}
            >
              <Sparkles size={24} className="text-violet-300" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Get AI-Powered Recommendations</h3>
            <p className="text-zinc-400 mb-7 max-w-md mx-auto text-sm leading-relaxed">
              Sign up to unlock personalised recommendations powered by 6 ML algorithms that learn from your taste over time.
            </p>
            <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
              <Sparkles size={16} /> Get Started Free
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
