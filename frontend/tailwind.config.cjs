/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#07080d',
          900: '#0c0f17',
          800: '#161b26',
          700: '#1f2736',
          600: '#2d384c',
          orange: '#ff5f1f',
          cyan: '#06b6d4',
          alert: '#f43f5e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'glow-orange': '0 0 15px rgba(255, 95, 31, 0.25)',
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.25)',
        'glow-red': '0 0 15px rgba(244, 63, 94, 0.25)'
      },
      animation: {
        'scanline': 'scanline 6s linear infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite'
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.01)' }
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' }
        }
      }
    },
  },
  plugins: [],
}
