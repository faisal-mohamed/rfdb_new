/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/(app)/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/(auth)/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/layout.{js,ts,jsx,tsx,mdx}",
    "./src/app/page.{js,ts,jsx,tsx,mdx}",
    "./src/app/providers/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { 
    extend: {
      fontFamily: {
        lexend: ["var(--font-lexend)", "system-ui", "sans-serif"],
        sans: ["var(--font-lexend)", "system-ui", "sans-serif"], // Set Lexend as default sans
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    }, 
  },
  plugins: [],
}
