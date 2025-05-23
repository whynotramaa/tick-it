// tailwind.config.js (create this file if it doesn't exist)

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          500: '#012198', // Your custom blue for Tailwind's 'blue' palette
          // You can add more shades here if needed, e.g., 400: '#lighter-blue', 600: '#darker-blue'
        },
        // You could also add it as a new custom color name if you prefer:
        'tickit-blue': '#012198', 
      },
    },
  },
  plugins: [],
}