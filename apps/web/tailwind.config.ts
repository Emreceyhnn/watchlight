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
          dark: "#0B0F14",
          card: "#111827",
          border: "#1F2937",
          cyan: "#22D3EE",
          amber: "#F59E0B",
          crimson: "#EF4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
