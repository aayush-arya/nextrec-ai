import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, RefreshCw, Users, Database, Activity, CheckCircle, AlertCircle, Cpu, BarChart2 } from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { adminAPI } from '../services/api'
import { toast } from 'react-hot-toast'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const CHART_OPTS = {
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#27272a', titleColor: '#fff', bodyColor: '#a1a1aa' } },
  scales: { x: { ticks: { color: '#71717a' }, grid: { color: '#27272a' } }, y: { ticks: { color: '#71717a' }, grid: { color: '#27272a' } } },
}

export default function Admin() {
  const [stats, setStats] = useState(null)
  const [training, setTraining] = useState(false)
  const [logs, setLogs] = useState([])
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    adminAPI.stats().then(({ data }) => setStats(data)).catch(() => toast.error('Failed to load admin stats'))
    adminAPI.logs(20).then(({ data }) => setLogs(data)).catch(() => {})
  }, [])

  const handleTrain = async () => {
    setTraining(true)
    try {
      const { data } = await adminAPI.train()
      toast.success(`Training complete! ${data.items_count} items, ${data.ratings_count} ratings`)
      const { data: newStats } = await adminAPI.stats()
      setStats(newStats)
    } catch { toast.error('Training failed') }
    setTraining(false)
  }

  const domainChart = {
    labels: stats?.domain_distribution?.map((d) => d.domain) || [],
    datasets: [{ label: 'Items', data: stats?.domain_distribution?.map((d) => d.count) || [], backgroundColor: '#7c3aed', borderRadius: 6 }],
  }

  const modelStatus = stats?.model_status || {}

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
            <ShieldCheck size={20} className="text-violet-400" />
          </div>
          <div><h1 className="text-2xl font-bold">Admin Panel</h1><p className="text-zinc-400 text-sm">System management & analytics</p></div>
        </div>
        <button onClick={handleTrain} disabled={training}
          className="btn-primary flex items-center gap-2">
          <RefreshCw size={16} className={training ? 'animate-spin' : ''} />
          {training ? 'Training…' : 'Retrain Models'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 w-fit">
        {['overview','models','users','logs'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
                       ${tab === t ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Users,    label: 'Users',        value: stats.total_users,        color: 'blue' },
              { icon: Database, label: 'Items',         value: stats.total_items,        color: 'violet' },
              { icon: BarChart2,label: 'Ratings',       value: stats.total_ratings,      color: 'orange' },
              { icon: Activity, label: 'Interactions',  value: stats.total_interactions, color: 'green' },
            ].map(({ icon: Icon, label, value, color }) => {
              const c = { blue:'text-blue-400 bg-blue-500/10', violet:'text-violet-400 bg-violet-500/10', orange:'text-orange-400 bg-orange-500/10', green:'text-emerald-400 bg-emerald-500/10' }[color]
              return (
                <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className={`w-9 h-9 rounded-xl ${c.split(' ')[1]} flex items-center justify-center mb-3`}>
                    <Icon size={18} className={c.split(' ')[0]} />
                  </div>
                  <p className="text-2xl font-bold">{value?.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
                </div>
              )
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="font-semibold text-zinc-300 mb-4">Items by Domain</h3>
              <Bar data={domainChart} options={CHART_OPTS} />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="font-semibold text-zinc-300 mb-4">Top Genres</h3>
              <div className="space-y-2">
                {stats.top_genres?.slice(0, 8).map((g) => (
                  <div key={g.genre} className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400 w-28 truncate">{g.genre}</span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${(g.count / (stats.top_genres[0]?.count || 1)) * 100}%` }}
                        className="h-full bg-violet-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-8 text-right">{g.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'models' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-semibold text-zinc-300 mb-5 flex items-center gap-2"><Cpu size={16} className="text-violet-400" />Model Status</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: 'content_filter_trained',        label: 'Content-Based Filter',     detail: 'TF-IDF + Cosine Similarity' },
                { key: 'collaborative_filter_trained',  label: 'Collaborative Filter',      detail: 'SVD Matrix Factorisation' },
                { key: 'semantic_neural_mode',          label: 'Semantic Search',           detail: modelStatus.semantic_neural_mode ? 'Neural (sentence-transformers)' : 'TF-IDF fallback' },
                { key: 'trending_trained',              label: 'Trending Engine',           detail: 'Time-decay scoring' },
                { key: 'cold_start_ready',              label: 'Cold-Start Solver',         detail: 'Genre-preference based' },
                { key: 'is_ready',                      label: 'Pipeline Overall',          detail: `${modelStatus.items_in_cache || 0} items cached` },
              ].map(({ key, label, detail }) => (
                <div key={key} className="flex items-start gap-3 bg-zinc-800/50 rounded-xl p-3">
                  {modelStatus[key]
                    ? <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    : <AlertCircle size={16} className="text-zinc-600 mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{label}</p>
                    <p className="text-xs text-zinc-500">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
            {modelStatus.last_trained && (
              <p className="text-xs text-zinc-600 mt-4">Last trained: {new Date(modelStatus.last_trained).toLocaleString()}</p>
            )}
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
            <Activity size={14} className="text-violet-400" />
            <h3 className="font-medium text-zinc-300 text-sm">Recent Interactions</h3>
          </div>
          <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-800/50 transition-colors">
                <span className="text-xs text-zinc-500 w-6 text-right">{log.id}</span>
                <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full capitalize">{log.type}</span>
                <span className="text-xs text-zinc-400">User #{log.user_id}</span>
                <span className="text-xs text-zinc-500">→</span>
                <span className="text-xs text-zinc-400">Item #{log.item_id}</span>
                <span className="text-xs text-zinc-600 ml-auto">{log.at ? new Date(log.at).toLocaleTimeString() : ''}</span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-center text-zinc-600 py-8 text-sm">No logs yet</p>}
          </div>
        </div>
      )}
    </div>
  )
}
