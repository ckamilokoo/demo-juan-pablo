/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  // Clases de color construidas en tiempo de ejecución (config/sensoresConfig.ts,
  // SensoresUnificado.vue): Tailwind no las ve escritas y no las generaba.
  safelist: [
    {
      pattern:
        /^(bg|text|border|border-l|ring)-(blue|purple|cyan|orange|pink|teal|slate|violet|fuchsia|indigo|rose|sky|green|amber|lime|emerald|gray)-(100|200|400|500|600|700|800)$/,
      variants: ["hover"],
    },
  ],
  theme: {
    extend: {
      // Tokens shadcn-vue (formato HSL channels, pattern estandar Tailwind v3)
      // Solo para /demo-charts — no colisiona con clases existentes (bg-[#1a1a1a] etc)
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
