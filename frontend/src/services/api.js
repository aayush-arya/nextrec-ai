import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nextrec_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global 401 handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nextrec_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// ─── Items ────────────────────────────────────────────────────────────────────
export const itemsAPI = {
  list: (params) => api.get('/items', { params }),
  get: (id) => api.get(`/items/${id}`),
  similar: (id, n = 10) => api.get(`/items/${id}/similar`, { params: { n } }),
  domains: () => api.get('/items/domains'),
  genres: (domain) => api.get('/items/genres', { params: { domain } }),
}

// ─── Recommendations ──────────────────────────────────────────────────────────
export const recsAPI = {
  personalized: (params) => api.get('/recommendations/personalized', { params }),
  trending: (params) => api.get('/recommendations/trending', { params }),
  similar: (id, n = 10) => api.get(`/recommendations/similar/${id}`, { params: { n } }),
  explain: (id) => api.get(`/recommendations/explain/${id}`),
  chat: (data) => api.post('/recommendations/chat', data),
}

// ─── Search ───────────────────────────────────────────────────────────────────
export const searchAPI = {
  search: (params) => api.get('/search', { params }),
  autocomplete: (q, domain) => api.get('/search/autocomplete', { params: { q, domain } }),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersAPI = {
  profile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  onboarding: (data) => api.post('/users/onboarding', data),
  ratings: () => api.get('/users/ratings'),
  bookmarks: () => api.get('/users/bookmarks'),
  history: (limit = 30) => api.get('/users/history', { params: { limit } }),
  stats: () => api.get('/users/stats'),
}

// ─── Ratings ──────────────────────────────────────────────────────────────────
export const ratingsAPI = {
  rate: (data) => api.post('/ratings', data),
  delete: (itemId) => api.delete(`/ratings/${itemId}`),
  bookmark: (itemId) => api.post(`/ratings/bookmark/${itemId}`),
  interact: (data) => api.post('/ratings/interact', data),
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  train: () => api.post('/admin/train/sync'),
  users: (page = 1) => api.get('/admin/users', { params: { page } }),
  modelStatus: () => api.get('/admin/model/status'),
  logs: (limit = 50) => api.get('/admin/logs', { params: { limit } }),
}
