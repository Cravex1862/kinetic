/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#121212',
          900: '#1f1f1f',
          800: '#2a2a2a',
          700: '#333333',
        },
        indigo: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#8b5cf6',
          700: '#7c3aed',
        },
       animation: {
        'spin-slow': 'spin 3s linear infinite',
        'shake': 'shake 0.35s ease-in-out',
       },
       keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
       }
      },
    },
  },
  plugins: [],
};
