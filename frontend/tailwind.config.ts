/** Dark disclosure surfaces and semantic accents for existing dashboard components. */
import type { Config } from "tailwindcss";
const accent = (tint: string, border: string, strong: string, ink: string) => ({
  50: tint,
  100: tint,
  200: border,
  300: border,
  400: ink,
  500: strong,
  600: ink,
  700: ink,
  800: ink,
  900: ink,
});
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: "#111923",
          100: "#202b39",
          200: "#344152",
          300: "#586a80",
          400: "#a1aec0",
          500: "#afbac9",
          600: "#c0cad7",
          700: "#d1dbe7",
          800: "#dfe7f1",
          900: "#edf1f7",
        },
        indigo: accent("#16283b", "#345677", "#4887c7", "#93c4ff"),
        amber: accent("#30291c", "#645137", "#b08849", "#e2c48b"),
        rose: accent("#322129", "#683e4d", "#b4627d", "#f6a9b7"),
        sky: accent("#152d31", "#305256", "#488b96", "#9ad8df"),
        violet: accent("#28243b", "#4c466c", "#8273aa", "#c9b8f2"),
        stone: accent("#23262e", "#474e5c", "#748092", "#c4cbd7"),
      },
      boxShadow: { sm: "0 1px 4px #06091033", md: "0 4px 12px #06091044" },
    },
  },
  plugins: [],
} satisfies Config;
