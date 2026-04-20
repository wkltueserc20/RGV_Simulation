/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hmi: {
          base:           '#F2F5F9',
          panel:          '#FFFFFF',
          card:           '#F8FAFC',
          elevated:       '#EEF2F7',
          border:         '#CBD5E0',
          'border-subtle':'#E2E8F0',
          'border-active':'#0078D4',
          primary:        '#1A2B3C',
          secondary:      '#4A6080',
          muted:          '#8A9BB0',
          'axis-x':       '#0078D4',
          'axis-z':       '#C96000',
          'axis-y':       '#047857',
          accent:         '#0078D4',
          success:        '#047857',
          error:          '#DC2626',
          warning:        '#B45309',
        }
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
        body:    ['IBM Plex Sans', 'sans-serif'],
        sans:    ['IBM Plex Sans', 'sans-serif'],
      },
      boxShadow: {
        'glow-x':  '0 0 8px rgba(0,120,212,0.3)',
        'glow-z':  '0 0 8px rgba(201,96,0,0.3)',
        'glow-y':  '0 0 8px rgba(4,120,87,0.3)',
        'glow-sm': '0 0 6px rgba(0,120,212,0.25)',
        'panel':   '0 2px 12px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}
