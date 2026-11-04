import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        soc: {
          // base surfaces
          base: "#0A0D12",
          dark: "#0B0F14",
          card: "#10151C",
          panel: "#141A22",
          elevated: "#1A212B",
          border: "#222A35",
          "border-soft": "#1C222C",
          // signal colors
          accent: "#5B8CFF",
          "accent-dim": "#3B5BA8",
          critical: "#F43F5E",
          high: "#F59E0B",
          medium: "#EAB308",
          low: "#5B8CFF",
          success: "#22D3A8",
          // legacy aliases kept for compat
          cyan: "#5B8CFF",
          amber: "#F59E0B",
          crimson: "#F43F5E",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Space Grotesk", "sans-serif"],
        sans: ["var(--font-body)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "Geist Mono", "ui-monospace", "monospace"],
        label: ["var(--font-mono)", "Geist Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(91, 140, 255, 0.15)",
        "glow-critical": "0 0 16px rgba(244, 63, 94, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
