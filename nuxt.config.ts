// https://nuxt.com/docs/api/configuration/nuxt-config
// Demo sin backend: todas las peticiones las responde el simulador en
// utils/authFetch.ts (mock/), por eso no hay proxy ni variables de Entra ID.
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  ssr: false,

  app: {
    head: {
      title: 'Modelo IA Bombas',
    },
  },

  plugins: [
    { src: "~/plugins/chartjs", mode: "client" },
    { src: "~/plugins/auth", mode: "client" },
  ],
  css: ["~/assets/main.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    public: {
      // Prefijo de URL que usan los composables; el simulador lo ignora.
      apiUrl: '/api',
    },
  },
});
