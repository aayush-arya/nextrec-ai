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

function PageLayout({ children }) {
  const location = useLocation()
  const isAuth = AUTH_ROUTES.includes(location.pathname)

  if (isAuth) return children

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-56 pt-16">
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
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
          style: { background: '#27272a', color: '#f4f4f5', border: '1px solid #3f3f46' },
          success: { iconTheme: { primary: '#7c3aed', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  )
}
