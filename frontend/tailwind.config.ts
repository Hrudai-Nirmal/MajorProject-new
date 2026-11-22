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
          50: "#121212",
          100: "#262626",
          200: "#393939",
          300: "#5e5e5e",
          400: "#b1b1b1",
          500: "#bababa",
          600: "#cbcbcb",
          700: "#d9d9d9",
          800: "#e7e7e7",
          900: "#f4f4f4",
        },
        indigo: accent("#242424", "#4e4e4e", "#909090", "#dedede"),
        amber: accent("#30291c", "#645137", "#b08849", "#e2c48b"),
        rose: accent("#322129", "#683e4d", "#b4627d", "#f6a9b7"),
        sky: accent("#152d31", "#305256", "#488b96", "#9ad8df"),
        violet: accent("#28243b", "#4c466c", "#8273aa", "#c9b8f2"),
        stone: accent("#23262e", "#474e5c", "#748092", "#c4cbd7"),
      },
      boxShadow: { sm: "0 1px 4px #00000033", md: "0 4px 12px #00000044" },
    },
  },
  plugins: [],
} satisfies Config;
