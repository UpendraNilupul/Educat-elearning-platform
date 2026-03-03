/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-purple': '#4a0b59',
        'brand-orange': '#ed8936', // approximate orange from text
      }
    },
  },
  plugins: [],
}
