import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        rain: {
          950: "#040810",
          900: "#07101f",
          800: "#0a1530",
          700: "#0f1e42",
          600: "#162554",
          500: "#1e3070",
          400: "#2456b8",
          300: "#3a6fc9",
          200: "#5d8ad1",
          100: "#8aaede",
          50:  "#c5d8ef",
        },
        mist: {
          700: "#374151",
          600: "#4b5563",
          500: "#6b7280",
          400: "#9ca3af",
          300: "#d1d5db",
          200: "#e5e7eb",
          100: "#f3f4f6",
          50:  "#f9fafb",
        },
        amber: {
          rain: "#b87a2a",
        },
      },
      fontFamily: {
        serif: ["'Noto Serif JP'", "serif"],
        sans:  ["'Zen Kaku Gothic New'", "'Noto Sans JP'", "sans-serif"],
        mono:  ["'JetBrains Mono'", "monospace"],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
    },
  },
  plugins: [],
}

export default config
