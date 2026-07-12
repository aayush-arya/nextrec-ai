import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, LogOut, Settings, Menu, Sparkles, LayoutDashboard, Command } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import { searchAPI } from '../../services/api'

function SearchBar() {
  const [query, setQuery]           = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen]             = useState(false)
  const [focused, setFocused]       = useState(false)
  const navigate = useNavigate()
  const ref      = useRef(null)
  const inputRef = useRef(null)

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ⌘K / Ctrl+K shortcut */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
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
          {/* Animated focus ring */}
          <motion.div
            animate={{ opacity: focused ? 1 : 0, scale: focused ? 1 : 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ boxShadow: '0 0 0 2px rgba(139,92,246,0.4), 0 0 16px rgba(139,92,246,0.1)' }}
          />

          {/* Sparkle icon — pulses when focused */}
          <motion.div
            animate={{ scale: focused ? 1.15 : 1, rotate: focused ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            {focused
              ? <Sparkles size={14} className="text-violet-400" />
              : <Search   size={14} className="text-zinc-500" />
            }
          </motion.div>

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search movies, books, music…"
            className="w-full text-zinc-100 text-sm rounded-xl pl-9 pr-20 py-2 transition-all duration-200 focus:outline-none placeholder:text-zinc-600"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: focused ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.07)',
            }}
          />

          {/* ⌘K badge */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-zinc-600"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Command size={9} />K
            </kbd>
          </div>
        </div>
      </form>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'rgba(18,18,20,0.96)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
            }}
          >
            {suggestions.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { navigate(`/item/${s.id}`); setOpen(false); setQuery('') }}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left group"
                style={{ '&:hover': { background: 'rgba(255,255,255,0.04)' } }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,92,246,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
                  {s.poster_url && <img src={s.poster_url} className="w-full h-full object-cover" alt="" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 font-medium truncate">{s.title}</p>
                  <p className="text-xs text-zinc-500 capitalize">{s.domain}</p>
                </div>
                <Sparkles size={12} className="text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
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
  const navigate  = useNavigate()
  const profileRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (!profileRef.current?.contains(e.target)) setProfileOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 h-16"
      style={{
        background: 'rgba(9,9,11,0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center gap-4">

        {/* Hamburger (mobile) */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl transition-colors text-zinc-400 hover:text-zinc-100"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-glow-sm"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)' }}
          >
            <Sparkles size={15} className="text-white" />
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

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <button
            onClick={() => navigate('/search')}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <Search size={18} />
          </button>

          {isAuthenticated ? (
            <div ref={profileRef} className="relative">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all duration-200"
                style={{ background: profileOpen ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
                >
                  {user?.full_name?.[0] || user?.username?.[0] || 'U'}
                </div>
                <span className="text-sm text-zinc-300 hidden sm:block max-w-[80px] truncate">
                  {user?.full_name || user?.username}
                </span>
              </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50"
                    style={{
                      background: 'rgba(14,14,16,0.97)',
                      backdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div className="px-4 py-3 border-b border-white/[0.05]">
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
                        className="flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Icon size={15} /> {label}
                      </Link>
                    ))}
                    <div className="border-t border-white/[0.05]">
                      <button
                        onClick={() => { logout(); navigate('/login') }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 transition-colors text-sm"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
