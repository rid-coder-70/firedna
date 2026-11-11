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
        firedna: {
          navy: "#10243A",
          green: "#2D8A64",
          blue: "#67B7E1",
          orange: "#FF9F43",
          red: "#E85D5D",
          cream: "#F7F6EF",
          slate: "#64748B",
          dark: "#0B1928"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      }
    },
  },
  plugins: [],
}

