/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          200: "#bfd3fe",
          300: "#93b4fd",
          400: "#608cfa",
          500: "#3b6cf6",
          600: "#2552e0",
          700: "#1d41b5",
          800: "#1e3a8a",
          900: "#14245c"
        },
        // Public website ke template rang — opacity ke saath bhi chalein (bg-site-text/5). Values themeStyle() deta hai (--text-rgb ...)
        site: {
          primary: "rgb(var(--primary-rgb) / <alpha-value>)",
          accent: "rgb(var(--accent-rgb) / <alpha-value>)",
          text: "rgb(var(--text-rgb) / <alpha-value>)",
          muted: "rgb(var(--muted-rgb) / <alpha-value>)",
          bg: "rgb(var(--bg-rgb) / <alpha-value>)",
          surface: "rgb(var(--surface-rgb) / <alpha-value>)"
        }
      }
    }
  },
  plugins: []
};
