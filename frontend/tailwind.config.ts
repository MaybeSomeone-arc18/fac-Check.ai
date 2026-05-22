import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#030407",
        surface: "rgba(10, 11, 16, 0.6)",
        "surface-highlight": "rgba(255, 255, 255, 0.03)",
        primary: "#00daf3",
        "primary-glow": "rgba(0, 218, 243, 0.4)",
        secondary: "#8b5cf6",
        "on-surface": "#f1f5f9",
        "on-surface-variant": "#94a3b8",
        error: "#ff453a",
        "error-glow": "rgba(255, 69, 58, 0.3)"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
