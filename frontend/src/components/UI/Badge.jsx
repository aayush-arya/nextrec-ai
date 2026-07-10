const VARIANTS = {
  purple: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  green:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  blue:   'bg-blue-500/20 text-blue-300 border-blue-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  red:    'bg-red-500/20 text-red-300 border-red-500/30',
  zinc:   'bg-zinc-700/50 text-zinc-300 border-zinc-600/50',
  gold:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
}

export default function Badge({ children, variant = 'zinc', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
