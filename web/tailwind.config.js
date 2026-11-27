/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        athloniq: {
          dark: "#070809",
          "dark-nav": "#0A0B0D",
          card: "#0D0F11",
          "card-alt": "#111316",
          surface: "#14171A",
          "surface-alt": "#1A1E22",
          border: "#1E2226",
          "border-alt": "#262B30",
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
        display: ["'Barlow Condensed'", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
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
