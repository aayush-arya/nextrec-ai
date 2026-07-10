import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Compass, LayoutDashboard, User, Search, ShieldCheck, X, TrendingUp } from 'lucide-react'
import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'

const DOMAINS = [
  { key: 'movies',   label: 'Movies',   icon: '🎬' },
  { key: 'books',    label: 'Books',    icon: '📚' },
  { key: 'music',    label: 'Music',    icon: '🎵' },
  { key: 'food',     label: 'Food',     icon: '🍕' },
  { key: 'courses',  label: 'Courses',  icon: '🎓' },
  { key: 'products', label: 'Products', icon: '🛍️' },
]

const NAV_ITEMS = [
  { to: '/',          icon: Home,          label: 'Home' },
  { to: '/discover',  icon: Compass,       label: 'Discover' },
  { to: '/search',    icon: Search,        label: 'Search' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile',   icon: User,          label: 'Profile' },
]

function SidebarContent() {
  const { activeDomain, setActiveDomain, closeSidebar } = useUIStore()
  const { user } = useAuthStore()

  return (
    <div className="h-full flex flex-col py-4 overflow-y-auto scrollbar-hide">
      {/* Nav */}
      <nav className="px-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
               ${isActive
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70'}`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}

        {user?.is_admin && (
          <NavLink
            to="/admin"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
               ${isActive
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70'}`
            }
          >
            <ShieldCheck size={17} />
            Admin
          </NavLink>
        )}
      </nav>

      {/* Domains */}
      <div className="mt-6 px-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">
          Domains
        </p>
        {DOMAINS.map((d) => (
          <button
            key={d.key}
            onClick={() => { setActiveDomain(d.key); closeSidebar() }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all
                       ${activeDomain === d.key
                        ? 'bg-violet-600/20 text-violet-300'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70'}`}
          >
            <span className="text-base">{d.icon}</span>
            {d.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Version */}
      <div className="px-6 py-3 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">NextRec v1.0 · AI Powered</p>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { sidebarOpen, closeSidebar } = useUIStore()

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-56 fixed left-0 top-16 bottom-0 bg-zinc-950 border-r border-zinc-800/60 z-30">
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-zinc-900 border-r border-zinc-800 z-50"
            >
              <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-800">
                <span className="font-bold text-lg">Next<span className="gradient-text">Rec</span></span>
                <button onClick={closeSidebar} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400">
                  <X size={18} />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
