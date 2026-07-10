import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'

export default function Register() {
  const [form, setForm] = useState({ email: '', username: '', fullName: '', password: '' })
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    const result = await register(form.email, form.username, form.password, form.fullName)
    if (result.success) {
      toast.success('Account created! Complete onboarding to get personalised recommendations.')
      navigate('/profile')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold">Create account</h1>
          <p className="text-zinc-400 mt-1">Join NextRec for AI-powered recommendations</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'fullName', icon: User,  type: 'text',     placeholder: 'John Doe' },
              { label: 'Username',  key: 'username', icon: User,  type: 'text',     placeholder: 'johndoe' },
              { label: 'Email',     key: 'email',    icon: Mail,  type: 'email',    placeholder: 'you@example.com' },
              { label: 'Password',  key: 'password', icon: Lock,  type: 'password', placeholder: '••••••••' },
            ].map(({ label, key, icon: Icon, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={type} value={form[key]} onChange={set(key)}
                    className="input-field pl-9" placeholder={placeholder}
                    required={key !== 'fullName'}
                  />
                </div>
              </div>
            ))}

            <button type="submit" disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {isLoading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Create Account</span><ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
