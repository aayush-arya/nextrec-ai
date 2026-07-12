import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Compass, LayoutDashboard, User, Search, ShieldCheck, X } from 'lucide-react'
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
  { to: '/',          icon: Home,            label: 'Home' },
  { to: '/discover',  icon: Compass,         label: 'Discover' },
  { to: '/search',    icon: Search,          label: 'Search' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profile',   icon: User,            label: 'Profile' },
]

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
         ${isActive
          ? 'text-violet-300'
          : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.04]'}`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.08) 100%)',
                border: '1px solid rgba(139,92,246,0.25)',
                boxShadow: '0 0 16px rgba(139,92,246,0.08)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
          )}
          <span className={`relative z-10 transition-all duration-200 ${isActive ? 'text-violet-400' : ''}`}>
            <Icon size={17} />
          </span>
          <span className="relative z-10">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function SidebarContent() {
  const { activeDomain, setActiveDomain, closeSidebar } = useUIStore()
  const { user } = useAuthStore()

  return (
    <div className="h-full flex flex-col py-4 overflow-y-auto scrollbar-hide">
      {/* Nav */}
      <nav className="px-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavItem key={to} to={to} icon={icon} label={label} onClick={closeSidebar} />
        ))}
        {user?.is_admin && (
          <NavItem to="/admin" icon={ShieldCheck} label="Admin" onClick={closeSidebar} />
        )}
      </nav>

      {/* Domains */}
      <div className="mt-6 px-3">
        <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest px-3 mb-2">
          Domains
        </p>
        {DOMAINS.map((d) => {
          const isActive = activeDomain === d.key
          return (
            <button
              key={d.key}
              onClick={() => { setActiveDomain(d.key); closeSidebar() }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200
                         ${isActive
                          ? 'text-violet-300 bg-violet-500/10 border border-violet-500/20'
                          : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.04] border border-transparent'}`}
            >
              <span className="text-base">{d.icon}</span>
              {d.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1" />

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-zinc-600">NextRec v1.0 · AI Powered</p>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const { sidebarOpen, closeSidebar } = useUIStore()

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className="hidden lg:flex flex-col w-56 fixed left-0 top-16 bottom-0 z-30"
        style={{
          background: 'rgba(9,9,11,0.7)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
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
              className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50"
              style={{
                background: 'rgba(9,9,11,0.95)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.05]">
                <span className="font-bold text-lg">Next<span className="gradient-text">Rec</span></span>
                <button onClick={closeSidebar} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 transition-colors">
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
