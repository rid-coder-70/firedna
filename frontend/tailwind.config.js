/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strict 60-30-10 Minimal Color System
        // 60% Dominant: Cream White & Warm Ivory Surfaces
        cream: {
          DEFAULT: "#F7F6EF",
          surface: "#FCFBF7",
          muted: "#EFECE1",
          border: "#E2DEC9",
        },
        // 30% Secondary: Navy Blue Structural & Typography
        navy: {
          DEFAULT: "#10243A",
          light: "#1E3A5F",
          muted: "#4A607A",
          subtle: "#10243A14",
        },
        // 10% Accent: Fire Color (Warm Amber-Flame & Crimson)
        fire: {
          DEFAULT: "#FF6B2B",
          amber: "#FF9F43",
          crimson: "#E85D5D",
          subtle: "#FFF2EB",
        },
        // Legacy alias support
        firedna: {
          navy: "#10243A",
          green: "#2D8A64",
          blue: "#67B7E1",
          orange: "#FF9F43",
          red: "#E85D5D",
          cream: "#F7F6EF",
          slate: "#64748B",
          dark: "#0B1928",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
