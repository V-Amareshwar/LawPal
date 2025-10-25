/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Dark theme colors (default)
        'bg-main': '#1e1f22',
        'bg-sidebar': '#2b2d31',
        'bg-icon-bar': '#222326',
        'bg-input': '#383a40',
        'border-color': '#3a3c42',
        'accent': '#404349',
        'accent-selected': '#35373b',
        'text-primary': '#f2f3f5',
        'text-secondary': '#949ba4',
        'send-blue': '#4a69e2',
        'send-blue-hover': '#405ac8',
      },
    },
  },
  plugins: [],
}
