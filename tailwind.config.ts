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
        cinema: {
          950: "#06080F",
          900: "#0B0F19",
          850: "#0F1626",
          800: "#151F36",
          700: "#1E2C4A",
          600: "#2B3F68",
          crimson: "#E50914",
          amber: "#F59E0B",
          gold: "#D97706",
          emerald: "#10B981",
          sapphire: "#3B82F6",
        },
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(245, 158, 11, 0.3)",
        "glow-crimson": "0 0 25px -5px rgba(229, 9, 20, 0.3)",
        "glow-sapphire": "0 0 25px -5px rgba(59, 130, 246, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
