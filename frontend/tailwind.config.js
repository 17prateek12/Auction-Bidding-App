/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      screens: {
        xl: { max: "1280px" },
        sm: { max: "640px" },
        md: { max: "768px" },
        lg: { max: "1024px" },
        navmd: { max: "900px" },
      },
    },
  },
  plugins: [],
}

