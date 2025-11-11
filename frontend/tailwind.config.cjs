module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        // Enforce Georgia across the app; Tailwind's font-sans & font-serif will both resolve to Georgia
        sans: ['Georgia', 'serif'],
        serif: ['Georgia', 'serif'],
        body: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
