/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          500: "#3b6cf6",
          600: "#2552e0",
          700: "#1d41b5",
          900: "#14245c"
        }
      }
    }
  },
  plugins: []
};
