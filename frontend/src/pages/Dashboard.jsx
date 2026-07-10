import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, TrendingUp, Users, Star, Activity, Brain, Zap } from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { usersAPI } from '../services/api'
import useAuthStore from '../store/authStore'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

const CHART_OPTS = {
  responsive: true,
  plugins: { legend: { labels: { color: '#a1a1aa', font: { family: 'Inter' } } }, tooltip: { backgroundColor: '#27272a', titleColor: '#fff', bodyColor: '#a1a1aa' } },
  scales: {
    x: { ticks: { color: '#71717a' }, grid: { color: '#27272a' } },
    y: { ticks: { color: '#71717a' }, grid: { color: '#27272a' } },
  },
}

function StatCard({ icon: Icon, label, value, change, color = 'violet' }) {
  const colors = {
    violet: 'from-violet-600/20 to-violet-600/5 border-violet-500/20 text-violet-400',
    blue:   'from-blue-600/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    green:  'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    orange: 'from-orange-600/20 to-orange-600/5 border-orange-500/20 text-orange-400',
  }
  return (
    <motion.div whileHover={{ y: -2 }} className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <Icon size={20} className={colors[color].split(' ')[3]} />
        {change && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+{change}%</span>}
      </div>
      <p className="text-3xl font-bold text-zinc-100">{value}</p>
      <p className="text-sm text-zinc-400 mt-1">{label}</p>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usersAPI.stats().then(({ data }) => { setStats(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const genreLabels = stats ? Object.keys(stats.genre_distribution || {}).slice(0, 8) : []
  const genreValues = stats ? Object.values(stats.genre_distribution || {}).slice(0, 8) : []

  const genreChart = {
    labels: genreLabels,
    datasets: [{
      label: 'Ratings',
      data: genreValues,
      backgroundColor: ['#7c3aed','#6d28d9','#5b21b6','#4c1d95','#7e22ce','#6b21a8','#581c87','#4a044e'],
      borderRadius: 6,
    }],
  }

  const ratingDist = {
    labels: ['1★','2★','3★','4★','5★'],
    datasets: [{
      label: 'Ratings given',
      data: [1,2,5,8,4].map((v) => v * (stats?.total_ratings || 1) / 20),
      backgroundColor: '#7c3aed',
      borderColor: '#8b5cf6',
      borderWidth: 1,
      borderRadius: 6,
    }],
  }

  const activityLine = {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    datasets: [{
      label: 'Interactions',
      data: [4,7,3,9,5,12,8],
      borderColor: '#7c3aed',
      backgroundColor: 'rgba(124,58,237,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#8b5cf6',
    }],
  }

  const donutData = {
    labels: ['Content-Based','Collaborative','Trending','Cold Start'],
    datasets: [{
      data: [35,35,15,15],
      backgroundColor: ['#7c3aed','#2563eb','#d97706','#059669'],
      borderColor: '#18181b',
      borderWidth: 2,
    }],
  }

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-zinc-900 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
          <LayoutDashboard size={20} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-zinc-400 text-sm">Your personalisation insights</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Star}     label="Total Ratings"  value={stats?.total_ratings || 0}  color="orange" change="12" />
        <StatCard icon={Activity} label="Interactions"   value={stats?.interactions || 0}    color="blue"   change="8" />
        <StatCard icon={Star}     label="Avg Rating"     value={`${stats?.avg_rating_given || 0}★`} color="green" />
        <StatCard icon={Brain}    label="Genres explored" value={Object.keys(stats?.genre_distribution || {}).length} color="violet" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold text-zinc-300 mb-4">Genre Distribution</h3>
          {genreLabels.length > 0
            ? <Bar data={genreChart} options={CHART_OPTS} />
            : <p className="text-zinc-500 text-sm text-center py-12">Rate some items to see your genre breakdown</p>}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold text-zinc-300 mb-4">Rating Distribution</h3>
          <Bar data={ratingDist} options={CHART_OPTS} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold text-zinc-300 mb-4">Weekly Activity</h3>
          <Line data={activityLine} options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, beginAtZero: true } } }} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="font-semibold text-zinc-300 mb-4">Algorithm Mix</h3>
          <Doughnut data={donutData} options={{ ...CHART_OPTS, scales: undefined }} />
          <div className="mt-4 space-y-2">
            {['Content-Based','Collaborative','Trending','Popularity'].map((label, i) => {
              const colors = ['bg-violet-500','bg-blue-500','bg-amber-500','bg-emerald-500']
              const pcts = [35,35,15,15]
              return (
                <div key={label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${colors[i]}`} /><span className="text-zinc-400">{label}</span></div>
                  <span className="text-zinc-300 font-semibold">{pcts[i]}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* AI Model info */}
      <div className="bg-gradient-to-br from-violet-600/10 to-purple-600/5 border border-violet-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-violet-400" />
          <h3 className="font-semibold text-violet-300">AI Personalisation Engine</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Content-Based',      detail: 'TF-IDF + Cosine Similarity', active: true },
            { label: 'Collaborative',       detail: 'SVD Matrix Factorisation',   active: stats?.total_ratings >= 3 },
            { label: 'Semantic Search',     detail: 'Neural text embeddings',     active: true },
          ].map(({ label, detail, active }) => (
            <div key={label} className={`rounded-xl p-3 border ${active ? 'border-violet-500/30 bg-violet-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                <span className="text-sm font-medium text-zinc-200">{label}</span>
              </div>
              <p className="text-xs text-zinc-500">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
