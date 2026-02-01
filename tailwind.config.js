/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark mode palette
        background: '#0A0E17',
        surface: '#111827',
        'surface-elevated': '#1F2937',
        // Accent colors
        mint: '#3DDC97',
        coral: '#FF6B6B',
        // Text colors
        'text-primary': '#F9FAFB',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
        // Semantic colors
        error: '#EF4444',
        success: '#3DDC97',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'waveform': 'waveform 1s ease-in-out infinite',
        'waveform-fast': 'waveform 0.5s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'glow-pulse-coral': 'glow-pulse-coral 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-slide-up': 'fade-slide-up 0.4s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(61, 220, 151, 0.3), 0 0 40px rgba(61, 220, 151, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(61, 220, 151, 0.5), 0 0 80px rgba(61, 220, 151, 0.2)' },
        },
        'glow-pulse-coral': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 107, 0.3), 0 0 40px rgba(255, 107, 107, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 107, 107, 0.5), 0 0 80px rgba(255, 107, 107, 0.2)' },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'fade-slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
