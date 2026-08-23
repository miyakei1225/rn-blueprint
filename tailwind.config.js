/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4A6CF7",
          50: "#EEF2FE",
          100: "#D9E2FC",
          200: "#B3C5F9",
          300: "#8CA8F6",
          400: "#668BF3",
          500: "#4A6CF7",
          600: "#2E4FD1",
          700: "#233CA0",
          800: "#182A70",
          900: "#0D1740",
        },
      },
    },
  },
  plugins: [],
};
