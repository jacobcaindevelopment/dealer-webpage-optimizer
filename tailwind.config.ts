import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      colors: {
        bg: "#0a0a0a",
        surface: {
          DEFAULT: "#111111",
          2: "#181818",
          3: "#222222",
          4: "#2c2c2c",
        },
        border: {
          DEFAULT: "#2a2a2a",
          2: "#363636",
          3: "#444444",
        },
        txt: {
          DEFAULT: "#f0f0f0",
          2: "#aaaaaa",
          3: "#777777",
          4: "#555555",
        },
        red: {
          DEFAULT: "#dc2626",
          light: "#ef4444",
          dim: "rgba(220,38,38,0.12)",
          border: "rgba(220,38,38,0.3)",
        },
        grn: {
          DEFAULT: "#22c55e",
          dim: "rgba(34,197,94,0.1)",
          border: "rgba(34,197,94,0.25)",
        },
        amb: {
          DEFAULT: "#f59e0b",
          dim: "rgba(245,158,11,0.1)",
          border: "rgba(245,158,11,0.25)",
        },
        blu: {
          DEFAULT: "#3b82f6",
          dim: "rgba(59,130,246,0.1)",
          border: "rgba(59,130,246,0.25)",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.2s ease both",
        "spin-slow": "spin 1s linear infinite",
        pulse2: "pulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
