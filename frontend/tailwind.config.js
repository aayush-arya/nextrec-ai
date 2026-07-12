/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        surface: {
          50:  '#18181b',
          100: '#1c1c1f',
          200: '#27272a',
          300: '#3f3f46',
          400: '#52525b',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'shimmer':       'shimmer 1.8s ease-in-out infinite',
        'float':         'float 8s ease-in-out infinite',
        'float-slow':    'float 11s ease-in-out 2s infinite',
        'float-slower':  'float 14s ease-in-out 5s infinite',
        'pulse-glow':    'pulse-glow 2.5s ease-in-out infinite',
        'spin-slow':     'spin 12s linear infinite',
        'glow-pulse':    'glow-pulse 3s ease-in-out infinite',
        'slide-up':      'slide-up 0.3s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':       'fade-in 0.25s ease-out',
        'scale-in':      'scale-in 0.2s cubic-bezier(0.16,1,0.3,1)',
        'badge-pop':     'badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-22px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 4px rgba(139,92,246,0.15), 0 0 16px rgba(139,92,246,0)' },
          '50%':      { boxShadow: '0 0 12px rgba(139,92,246,0.4), 0 0 36px rgba(139,92,246,0.15)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.25' },
          '50%':      { opacity: '0.65' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(14px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%':   { transform: 'scale(0.94)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'badge-pop': {
          '0%':   { transform: 'scale(0.7)',  opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
      },
      boxShadow: {
        'glow-sm':  '0 0 12px rgba(139,92,246,0.25)',
        'glow':     '0 0 24px rgba(139,92,246,0.3)',
        'glow-lg':  '0 0 48px rgba(139,92,246,0.35)',
        'glow-cyan':'0 0 20px rgba(6,182,212,0.3)',
        'glow-pink':'0 0 20px rgba(236,72,153,0.3)',
        'card':     '0 4px 24px rgba(0,0,0,0.45)',
        'card-hover':'0 14px 56px rgba(0,0,0,0.55), 0 0 32px rgba(139,92,246,0.12)',
        'inner-top':'inset 0 1px 0 rgba(255,255,255,0.06)',
        'ring-violet':'0 0 0 2px rgba(139,92,246,0.5), 0 0 20px rgba(139,92,246,0.2)',
      },
    },
  },
  plugins: [],
}
