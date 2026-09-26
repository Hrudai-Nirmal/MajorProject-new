import type { Config } from "tailwindcss";

const brandInk = "#334155";
const signalCobalt = "#2563eb";
const statementAmber = "#f59e0b";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: "#f5f8ff",
          100: "#e8eef7",
          200: "#d6dfec",
          300: "#b9c7dc",
          400: "#8798b0",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#243244",
          900: brandInk,
        },
        indigo: {
          50: "#eef5ff",
          100: "#dceaff",
          200: "#bad6ff",
          300: "#8bb9ff",
          400: "#5d95f7",
          500: signalCobalt,
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#172554",
        },
        amber: {
          50: "#fff8e7",
          100: "#ffefc3",
          200: "#ffe099",
          300: "#ffc85d",
          400: "#f7b331",
          500: statementAmber,
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        rose: {
          50: "#fff0ea",
          100: "#ffd9cc",
          200: "#ffad99",
          300: "#ff7a62",
          400: "#f24f38",
          500: "#d93422",
          600: "#ad2417",
          700: "#851d14",
          800: "#5c180f",
          900: "#3b100a",
        },
        sky: {
          50: "#eafffb",
          100: "#c8fff4",
          200: "#91fbea",
          300: "#49e8d6",
          400: "#19c7bd",
          500: "#079b98",
          600: "#087a7b",
          700: "#0a6062",
          800: "#0b484b",
          900: "#073033",
        },
        violet: {
          50: "#f7f0ff",
          100: "#eddcff",
          200: "#d9b7ff",
          300: "#bd85ff",
          400: "#9f55f6",
          500: "#7c2fd2",
          600: "#6322aa",
          700: "#4e1d83",
          800: "#38165f",
          900: "#25103f",
        },
      },
      boxShadow: {
        sm: "3px 3px 0 0 rgba(100, 116, 139, 0.55)",
        md: "5px 5px 0 0 rgba(100, 116, 139, 0.55)",
        lg: "8px 8px 0 0 rgba(100, 116, 139, 0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
