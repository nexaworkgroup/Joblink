import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:       '#0A6E4A',
        'primary-dark':'#085A3C',
        'primary-light':'#E6F4EE',
        accent:        '#D4A017',
        'accent-light':'#FEF3C7',
        surface:       'var(--surface)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        hover: '0 4px 16px rgba(10,110,74,0.12), 0 2px 6px rgba(0,0,0,0.06)',
        modal: '0 20px 60px rgba(0,0,0,0.15)',
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.35s ease forwards',
        'shimmer':  'shimmer 1.5s infinite',
        'float':    'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from:{ opacity:'0', transform:'translateY(8px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        slideUp: { from:{ opacity:'0', transform:'translateY(16px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        shimmer: { '0%':{ backgroundPosition:'200% 0' }, '100%':{ backgroundPosition:'-200% 0' } },
        float:   { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-4px)' } },
      },
    },
  },
  plugins: [],
} satisfies Config
