import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Star, Bookmark, Activity, Edit3, Check, X, Camera, Upload, RotateCcw } from 'lucide-react'
import { usersAPI } from '../services/api'
import ItemCard from '../components/Cards/ItemCard'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'

const DOMAINS = ['movies','books','music','food','courses','products']
const GENRES  = ['Action','Adventure','Comedy','Drama','Horror','Romance','Sci-Fi','Thriller',
                 'Fantasy','Mystery','Documentary','Animation','Biography','History','Sport',
                 'Music','Rock','Pop','Hip-Hop','Programming','Data Science','Self-Help']
const MOODS   = [
  { key: 'happy',        emoji: '😊' }, { key: 'funny',        emoji: '😂' },
  { key: 'romantic',     emoji: '❤️'  }, { key: 'emotional',    emoji: '😢' },
  { key: 'thriller',     emoji: '😱' }, { key: 'motivational', emoji: '💪' },
  { key: 'adventure',    emoji: '🌍' }, { key: 'relaxed',      emoji: '😴' },
  { key: 'energetic',    emoji: '⚡' }, { key: 'chill',        emoji: '🌊' },
  { key: 'nostalgic',    emoji: '🕰️' }, { key: 'epic',         emoji: '🔥' },
  { key: 'focused',      emoji: '🎯' }, { key: 'curious',      emoji: '🔭' },
  { key: 'dreamy',       emoji: '🌙' }, { key: 'dark',         emoji: '🌑' },
]

function StatCard({ icon: Icon, label, value, color = 'violet' }) {
  const colors = {
    violet: 'bg-violet-500/10 text-violet-400',
    blue:   'bg-blue-500/10 text-blue-400',
    green:  'bg-emerald-500/10 text-emerald-400',
    orange: 'bg-orange-500/10 text-orange-400',
  }
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-100">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </div>
  )
}

function AvatarPickerModal({ onClose, onSave }) {
  const [mode, setMode] = useState('pick')   // 'pick' | 'camera' | 'preview'
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  const resizeImage = (dataUrl) =>
    new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 300
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = dataUrl
    })

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const resized = await resizeImage(ev.target.result)
      setPreview(resized)
      setMode('preview')
    }
    reader.readAsDataURL(file)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      setMode('camera')
      // wait for video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 100)
    } catch {
      toast.error('Camera access denied or not available')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const capturePhoto = async () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    stopCamera()
    const resized = await resizeImage(canvas.toDataURL())
    setPreview(resized)
    setMode('preview')
  }

  const retake = () => {
    setPreview(null)
    setMode('pick')
  }

  const save = async () => {
    if (!preview) return
    setSaving(true)
    await onSave(preview)
    setSaving(false)
  }

  const close = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={close}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">Update Profile Photo</h3>
          <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Pick mode */}
        {mode === 'pick' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-zinc-700 hover:border-violet-500 hover:bg-violet-500/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Upload size={22} className="text-violet-400" />
              </div>
              <span className="text-sm font-medium">From Gallery</span>
            </button>
            <button
              onClick={startCamera}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-zinc-700 hover:border-violet-500 hover:bg-violet-500/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Camera size={22} className="text-violet-400" />
              </div>
              <span className="text-sm font-medium">Take Photo</span>
            </button>
          </div>
        )}

        {/* Camera mode */}
        {mode === 'camera' && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-zinc-800 aspect-square">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute inset-0 border-2 border-violet-500/40 rounded-2xl pointer-events-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { stopCamera(); setMode('pick') }} className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1.5">
                <X size={14} /> Cancel
              </button>
              <button onClick={capturePhoto} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5">
                <Camera size={14} /> Capture
              </button>
            </div>
          </div>
        )}

        {/* Preview mode */}
        {mode === 'preview' && preview && (
          <div className="space-y-5">
            <div className="flex justify-center">
              <img src={preview} alt="Preview" className="w-36 h-36 rounded-2xl object-cover ring-4 ring-violet-500/30" />
            </div>
            <div className="flex gap-2">
              <button onClick={retake} className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1.5">
                <RotateCcw size={14} /> Retake
              </button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
                {saving ? (
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</span>
                ) : (
                  <><Check size={14} /> Save Photo</>
                )}
              </button>
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </motion.div>
    </div>
  )
}

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [history, setHistory] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [tab, setTab] = useState('bookmarks')
  const [avatarModal, setAvatarModal] = useState(false)
  const [form, setForm] = useState({
    full_name: '', bio: '',
    preferred_domains: [], preferred_genres: [], preferred_moods: [],
  })

  useEffect(() => {
    if (user) setForm({
      full_name: user.full_name || '',
      bio: user.bio || '',
      preferred_domains: user.preferred_domains || [],
      preferred_genres: user.preferred_genres || [],
      preferred_moods: user.preferred_moods || [],
    })
    Promise.all([usersAPI.stats(), usersAPI.bookmarks(), usersAPI.history(20)])
      .then(([s, b, h]) => { setStats(s.data); setBookmarks(b.data); setHistory(h.data) })
      .catch(() => {})
  }, [user])

  const saveProfile = async () => {
    try {
      const { data } = await usersAPI.updateProfile(form)
      setUser(data)
      setEditMode(false)
      toast.success('Profile updated!')
    } catch { toast.error('Failed to update') }
  }

  const saveAvatar = async (base64) => {
    try {
      const { data } = await usersAPI.updateProfile({ avatar_url: base64 })
      setUser(data)
      setAvatarModal(false)
      toast.success('Profile photo updated!')
    } catch { toast.error('Failed to update photo') }
  }

  const toggle = (key, val) =>
    setForm((p) => ({
      ...p,
      [key]: p[key].includes(val) ? p[key].filter((x) => x !== val) : [...p[key], val],
    }))

  if (!user) return null

  const initials = (user.full_name || user.username)?.[0]?.toUpperCase()

  return (
    <div className="space-y-8 pb-10">
      {/* Profile header */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {/* Avatar with camera overlay */}
            <div className="relative group flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || user.username}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-3xl font-bold text-white select-none">
                  {initials}
                </div>
              )}
              <button
                onClick={() => setAvatarModal(true)}
                className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1"
              >
                <Camera size={18} className="text-white" />
                <span className="text-white text-[10px] font-medium">Edit</span>
              </button>
            </div>

            <div>
              {editMode ? (
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  className="input-field text-xl font-bold !py-1 !px-2 w-48"
                />
              ) : (
                <h1 className="text-2xl font-bold">{user.full_name || user.username}</h1>
              )}
              <p className="text-zinc-500 text-sm">@{user.username}</p>
              <p className="text-zinc-400 text-sm mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {editMode ? (
              <>
                <button onClick={saveProfile} className="btn-primary flex items-center gap-1.5 text-sm !py-2">
                  <Check size={14} /> Save
                </button>
                <button onClick={() => setEditMode(false)} className="btn-secondary flex items-center gap-1.5 text-sm !py-2">
                  <X size={14} /> Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)} className="btn-secondary flex items-center gap-1.5 text-sm !py-2">
                <Edit3 size={14} /> Edit
              </button>
            )}
          </div>
        </div>

        {editMode && (
          <div className="mt-4">
            <textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              className="input-field resize-none"
              rows={2}
              placeholder="Tell us about yourself…"
            />
          </div>
        )}
        {!editMode && user.bio && <p className="mt-3 text-zinc-400 text-sm">{user.bio}</p>}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Star}     label="Ratings given"  value={stats.total_ratings}               color="orange" />
          <StatCard icon={Bookmark} label="Bookmarks"      value={stats.bookmarks}                   color="blue" />
          <StatCard icon={Activity} label="Interactions"   value={stats.interactions}                color="green" />
          <StatCard icon={Star}     label="Avg rating"     value={`${stats.avg_rating_given}★`}      color="violet" />
        </div>
      )}

      {/* Preferences (edit mode) */}
      {editMode && (
        <div className="space-y-5 glass rounded-2xl p-5">
          <h2 className="section-header"><User size={16} className="text-violet-400" /> Preferences</h2>

          {/* Domains */}
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-2">Domains</p>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((opt) => (
                <button key={opt} onClick={() => toggle('preferred_domains', opt)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize
                             ${form.preferred_domains.includes(opt) ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Genres */}
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-2">Genres</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.slice(0, 16).map((opt) => (
                <button key={opt} onClick={() => toggle('preferred_genres', opt)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all
                             ${form.preferred_genres.includes(opt) ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Moods */}
          <div>
            <p className="text-sm font-medium text-zinc-400 mb-2">Moods</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(({ key, emoji }) => (
                <button key={key} onClick={() => toggle('preferred_moods', key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize flex items-center gap-1
                             ${form.preferred_moods.includes(key) ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>
                  <span>{emoji}</span> {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div>
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 w-fit mb-6">
          {['bookmarks', 'history'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize
                         ${tab === t ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'bookmarks' && (
          bookmarks.length > 0
            ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {bookmarks.map((item) => <ItemCard key={item.id} item={item} />)}
              </div>
            : <div className="text-center py-12 text-zinc-600"><Bookmark size={32} className="mx-auto mb-3 opacity-40" /><p>No bookmarks yet</p></div>
        )}

        {tab === 'history' && (
          history.length > 0
            ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {history.map((item) => <ItemCard key={item.id} item={item} />)}
              </div>
            : <div className="text-center py-12 text-zinc-600"><Activity size={32} className="mx-auto mb-3 opacity-40" /><p>No history yet</p></div>
        )}
      </div>

      {/* Avatar upload modal */}
      <AnimatePresence>
        {avatarModal && (
          <AvatarPickerModal
            onClose={() => setAvatarModal(false)}
            onSave={saveAvatar}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
