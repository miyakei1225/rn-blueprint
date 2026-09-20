/** @type {import('tailwindcss').Config} */
module.exports = {
  // src/ 配下すべて。ディレクトリを増やしてもここを触らずに済むよう広めに取る
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
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
        // 操作が成功したことだけを表す色。CTA と取り違えられないよう primary とは分ける
        success: "#16A34A",
        // 削除・退会など、取り消しづらい操作に使う
        danger: "#DC2626",
      },
    },
  },
  plugins: [],
};
