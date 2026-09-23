// https://nuxt.com/docs/api/configuration/nuxt-config
// Demo sin backend de datos: las peticiones las responde el simulador en
// utils/authFetch.ts (mock/). El servidor Nuxt solo aloja el agente de voz
// (server/api/voz y server/api/agente), que usa OpenAI.
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
    // Solo servidor: la API key de OpenAI nunca llega al navegador (la voz
    // usa claves temporales emitidas por server/api/voz/sesion.post.ts).
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModelo: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    openaiModeloVoz: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime',
    openaiVoz: process.env.OPENAI_VOICE || 'marin',

    // Correo del agente (mismo esquema SMTP que Backend-GM). Solo servidor.
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: process.env.SMTP_PORT || '587',
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    smtpFrom: process.env.SMTP_FROM || '',
    smtpFromNombre: process.env.SMTP_FROM_NOMBRE || 'Atlas · Planta Demo',
    // Agenda: JSON {"nombre": "correo"}, p. ej. {"mantenimiento":"mant@empresa.cl"}
    contactosCorreo: process.env.CONTACTOS_CORREO || '{}',

    public: {
      // Prefijo de URL que usan los composables; el simulador lo ignora.
      apiUrl: '/api',
    },
  },
});
