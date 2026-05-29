import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0E14",
        foreground: "#FFFFFF",
        card: "#14171D",
        cardBorder: "#1F2937",
        accent: "#4ADE80",
        accentMuted: "#064e3b",
        danger: "#ef4444",
        dash: {
          bg: "#0B0E14",
          panel: "#14171D",
          accent: "#4ADE80",
          blue: "#3B82F6",
          purple: "#A855F7",
          amber: "#FBBF24",
          border: "#1F2937",
          text: "#FFFFFF",
          muted: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
