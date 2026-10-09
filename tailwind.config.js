/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sunshine: {
          DEFAULT: '#FEE135',
          light: '#FFF176',
          dark: '#FACC15',
        },
        coral: {
          DEFAULT: '#FF4D30',
          hover: '#E03E22',
          light: '#FFE4E1',
        },
        electric: {
          DEFAULT: '#3B82F6',
          light: '#70B4F8',
          dark: '#1D4ED8',
        },
        ink: {
          DEFAULT: '#111827',
          pure: '#000000',
          muted: '#6B7280',
        },
        surface: {
          cream: '#FFFDF7',
          card: '#FFFFFF',
          soft: '#F4F4F6',
        },
        mint: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#059669',
        }
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px #000000',
        'brutal': '4px 4px 0px #000000',
        'brutal-lg': '6px 6px 0px #000000',
        'brutal-xl': '8px 8px 0px #000000',
        'brutal-coral': '4px 4px 0px #FF4D30',
        'brutal-electric': '4px 4px 0px #3B82F6',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Cabinet Grotesk', 'Impact', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
