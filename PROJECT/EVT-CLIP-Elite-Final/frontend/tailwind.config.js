/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-navy': '#060a12',
        'panel': '#0b1120',
        'cyan': {
          DEFAULT: '#00e5ff',
          dark: '#00b8cc',
        },
        'orange': {
          DEFAULT: '#ff6d00',
          dark: '#cc5700',
        }
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
