import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "sp-app":     "var(--bg-app)",
        "sp-card":    "var(--bg-card)",
        "sp-task":    "var(--bg-task)",
        "sp-primary": "var(--color-primary)",
        "sp-accent":  "var(--color-accent)",
        "sp-text":    "var(--text-main)",
        "sp-muted":   "var(--text-muted)",
        "sp-border":  "var(--border-color)",
      },
    },
  },
  plugins: [],
};
export default config;
