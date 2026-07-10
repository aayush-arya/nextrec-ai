import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, User, LogOut, Settings, Menu, X, Sparkles, LayoutDashboard } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import { searchAPI } from '../../services/api'

function SearchBar() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await searchAPI.autocomplete(query)
        setSuggestions(data.slice(0, 5))
        setOpen(true)
      } catch { /* ignore */ }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query)}`); setOpen(false) }
  }

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, books, music…"
            className="w-full bg-zinc-800/80 border border-zinc-700 text-zinc-100 text-sm rounded-xl
                       pl-9 pr-4 py-2 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500
                       focus:ring-1 focus:ring-violet-500/40 transition-all"
          />
        </div>
      </form>
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => { navigate(`/item/${s.id}`); setOpen(false); setQuery('') }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-700 overflow-hidden flex-shrink-0">
                  {s.poster_url && <img src={s.poster_url} className="w-full h-full object-cover" alt="" />}
                </div>
                <div>
                  <p className="text-sm text-zinc-200 font-medium">{s.title}</p>
                  <p className="text-xs text-zinc-500 capitalize">{s.domain}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (!profileRef.current?.contains(e.target)) setProfileOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60">
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center gap-4">

        {/* Hamburger (mobile) */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">
            Next<span className="gradient-text">Rec</span>
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-sm mx-4 hidden md:block">
          <SearchBar />
        </div>

        <div className="flex-1" />

        {/* Nav actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <button
            onClick={() => navigate('/search')}
            className="md:hidden p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <Search size={18} />
          </button>

          {isAuthenticated ? (
            <>
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
                    {user?.full_name?.[0] || user?.username?.[0] || 'U'}
                  </div>
                  <span className="text-sm text-zinc-300 hidden sm:block max-w-[80px] truncate">
                    {user?.full_name || user?.username}
                  </span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-zinc-800">
                        <p className="text-sm font-semibold text-zinc-100">{user?.full_name || user?.username}</p>
                        <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                      </div>
                      {[
                        { to: '/profile',   icon: User,            label: 'Profile' },
                        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                        ...(user?.is_admin ? [{ to: '/admin', icon: Settings, label: 'Admin Panel' }] : []),
                      ].map(({ to, icon: Icon, label }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors text-sm"
                        >
                          <Icon size={15} /> {label}
                        </Link>
                      ))}
                      <div className="border-t border-zinc-800">
                        <button
                          onClick={() => { logout(); navigate('/login') }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 text-red-400 transition-colors text-sm"
                        >
                          <LogOut size={15} /> Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm text-zinc-400 hover:text-zinc-100 px-3 py-1.5 transition-colors">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm !py-1.5 !px-4">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
