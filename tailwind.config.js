/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F3F0EB', // Warm light beige
        surface: '#FAF9F6', // Off-white/Cream
        primary: '#A89F91', // Warm Gry
        'primary-dark': '#8C857B',
        accent: '#D4A373', // Soft Brown/Bronze
        'text-main': '#4A4238', // Dark Coffee
        'text-muted': '#8C857B',
        // Semantic Warm Colors
        'warm-blue': '#8DA9C4',
        'warm-blue-dark': '#4A6Fa5',
        'warm-green': '#A8C5A8',
        'warm-green-dark': '#5A8F69',
        'warm-red': '#D98F8F',
        'warm-red-dark': '#B85555',
        'warm-yellow': '#E6C785',
        'warm-yellow-dark': '#C99A2E',
        'warm-purple': '#BFA6C7',
        'warm-purple-dark': '#895F96',
      },
      boxShadow: {
        'clay-sm': '4px 4px 8px #d1cfc9, -4px -4px 8px #ffffff',
        'clay-md': '8px 8px 16px #d1cfc9, -8px -8px 16px #ffffff',
        'clay-lg': '12px 12px 24px #d1cfc9, -12px -12px 24px #ffffff',
        'clay-inner': 'inset 4px 4px 8px #d1cfc9, inset -4px -4px 8px #ffffff',
        'clay-btn': '6px 6px 12px #cec9bf, -6px -6px 12px #ffffff',
        'clay-btn-active': 'inset 3px 3px 6px #cec9bf, inset -3px -3px 6px #ffffff',
      },
      fontFamily: {
        sans: ['"Nunito"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'], // Suggesting a rounder font
      },
      animation: {
        'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
      },
      keyframes: {
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}