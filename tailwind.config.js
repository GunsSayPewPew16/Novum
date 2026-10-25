/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { ink: "#120F0D" },
      fontFamily: { sans: ["Manrope", '"Helvetica Neue"', "sans-serif"] },
    },
  },
  plugins: [],
}
