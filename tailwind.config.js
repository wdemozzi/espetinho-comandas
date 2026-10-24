/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal da CT Conveniência (Roxo Neon / Violeta Metálico da marca)
        ember: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#8b5cf6',
          700: '#7c3aed',
          800: '#6d28d9',
          900: '#581c87',
          950: '#2e1065',
        },
        // Fundos escuros foscos com subtom violeta espacial
        charcoal: {
          700: '#261f38',
          800: '#1c172e',
          850: '#141024',
          900: '#0c0a17',
          950: '#07050d',
        },
        ct: {
          purple: '#8b5cf6',
          violet: '#7c3aed',
          neon: '#a855f7',
          light: '#c084fc',
          silver: '#e2e8f0',
          dark: '#0c0a17',
          card: '#161226',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-purple': '0 0 20px -3px rgba(139, 92, 246, 0.45), 0 0 8px -2px rgba(168, 85, 247, 0.4)',
        'neon-glow': '0 0 30px rgba(124, 58, 237, 0.35)',
      }
    },
  },
  plugins: [],
}
