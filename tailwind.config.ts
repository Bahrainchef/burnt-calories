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
        flame:   "#E8621A",
        leaf:    "#4A7C3F",
        charcoal:"#4A4A4A",
        gold:    "#d4aa48",
        ember:   "#0f0e0b",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "wheat-hero":
          "linear-gradient(180deg, #0f0e0b 0%, #1a1508 40%, #2c1f06 70%, #3d2a07 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
