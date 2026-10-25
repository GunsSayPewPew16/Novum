/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { ink: "#120F0D" },
      fontFamily: {
        sans: ['"Neue Haas Grotesk"', '"Helvetica Neue"', "sans-serif"],
        display: ['"Neue Haas Grotesk Display"', '"Neue Haas Grotesk"', "sans-serif"],
        serif: ['"Anthropic Serif"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
}
