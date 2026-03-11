import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#020617",
        foreground: "#e5e7eb",
        card: "#020617",
        cardBorder: "#1f2933",
        accent: "#22c55e",
        accentMuted: "#064e3b",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
