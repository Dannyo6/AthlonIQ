/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        athloniq: {
          dark: "#080C14",
          card: "#0F172A",
          surface: "#1E293B",
          border: "#334155",
          cyan: {
            DEFAULT: "#00F0FF",
            glow: "#00F0FF40",
            hover: "#38BDF8",
          },
          emerald: {
            DEFAULT: "#10B981",
            glow: "#10B98140",
          },
          violet: {
            DEFAULT: "#8B5CF6",
            glow: "#8B5CF640",
          },
          amber: {
            DEFAULT: "#F59E0B",
          },
          rose: {
            DEFAULT: "#F43F5E",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(0, 240, 255, 0.3)",
        "glow-emerald": "0 0 25px -5px rgba(16, 185, 129, 0.3)",
        "glow-violet": "0 0 25px -5px rgba(139, 92, 246, 0.3)",
      },
    },
  },
  plugins: [],
};
