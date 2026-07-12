import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Navbar from './components/Layout/Navbar'
import Sidebar from './components/Layout/Sidebar'
import Home from './pages/Home'
import Discover from './pages/Discover'
import ItemDetail from './pages/ItemDetail'
import Search from './pages/Search'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Register from './pages/Register'
import useAuthStore from './store/authStore'

const AUTH_ROUTES = ['/login', '/register']

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user?.is_admin) return <Navigate to="/" replace />
  return children
}

function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Primary violet blob — top left */}
      <div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full animate-float"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }}
      />
      {/* Indigo blob — top right */}
      <div
        className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full animate-float-slow"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)' }}
      />
      {/* Cyan accent — middle right */}
      <div
        className="absolute top-1/2 -right-32 w-[400px] h-[400px] rounded-full animate-float-slower"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)' }}
      />
      {/* Purple blob — bottom left */}
      <div
        className="absolute bottom-0 -left-20 w-[450px] h-[450px] rounded-full animate-float-slow"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)' }}
      />
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)' }}
      />
    </div>
  )
}

function PageLayout({ children }) {
  const location = useLocation()
  const isAuth = AUTH_ROUTES.includes(location.pathname)

  if (isAuth) return children

  return (
    <div className="relative flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-56 pt-16">
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const isAuth = AUTH_ROUTES.includes(location.pathname)

  return (
    <>
      <BackgroundBlobs />
      {!isAuth && <Navbar />}
      <PageLayout>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/discover"  element={<Discover />} />
          <Route path="/item/:id"  element={<ItemDetail />} />
          <Route path="/search"    element={<Search />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin"     element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </PageLayout>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(24,24,27,0.95)',
            color: '#f4f4f5',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            borderRadius: '14px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#8b5cf6', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  )
}
