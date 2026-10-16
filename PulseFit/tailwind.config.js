/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        lime: { DEFAULT: '#C6FF3D', 400: '#D4FF6B', 500: '#C6FF3D', 600: '#A8E01F' },
        cyan: { DEFAULT: '#22E4FF', 400: '#5CEBFF', 500: '#22E4FF' },
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(198,255,61,0.55)',
        'glow-cyan': '0 0 40px -8px rgba(34,228,255,0.5)',
        card: '0 10px 40px -12px rgba(0,0,0,0.45)',
      },
      keyframes: {
        pulseLine: { '0%': { strokeDashoffset: '300' }, '45%,100%': { strokeDashoffset: '0' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
      },
      animation: {
        pulseLine: 'pulseLine 2.4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [],
}
