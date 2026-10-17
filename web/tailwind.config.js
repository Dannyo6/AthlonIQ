/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        athloniq: {
          dark: "#090A0F",
          card: "#12151E",
          surface: "#181D2A",
          border: "#1E2330",
          lime: {
            DEFAULT: "#BEF264",
            hover: "#A3E635",
            glow: "rgba(190, 242, 100, 0.25)",
            muted: "rgba(190, 242, 100, 0.12)",
          },
          emerald: {
            DEFAULT: "#10B981",
            glow: "rgba(16, 185, 129, 0.25)",
            muted: "rgba(16, 185, 129, 0.12)",
          },
          violet: {
            DEFAULT: "#8B5CF6",
            glow: "rgba(139, 92, 246, 0.25)",
            muted: "rgba(139, 92, 246, 0.12)",
          },
          amber: {
            DEFAULT: "#F59E0B",
            muted: "rgba(245, 158, 11, 0.12)",
          },
          rose: {
            DEFAULT: "#F43F5E",
            muted: "rgba(244, 63, 94, 0.12)",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        "glow-lime": "0 0 24px -4px rgba(190, 242, 100, 0.28)",
        "glow-emerald": "0 0 24px -4px rgba(16, 185, 129, 0.25)",
        "glow-violet": "0 0 24px -4px rgba(139, 92, 246, 0.25)",
        surface: "0 4px 20px -2px rgba(0, 0, 0, 0.6)",
      },
    },
  },
  plugins: [],
};
