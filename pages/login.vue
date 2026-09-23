<template>
  <div class="login-v1">
    <!-- LEFT: hero con turbina 3D + info de marca -->
    <div class="hero">
      <!-- grid pattern -->
      <svg class="hero-grid" width="100%" height="100%">
        <defs>
          <pattern id="v1grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#4a7ac9" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#v1grid)" />
      </svg>

      <!-- glowing orange accent -->
      <div class="orange-glow"></div>

      <!-- Turbina 3D SVG -->
      <div class="turbine-wrap">
        <svg class="turbine" viewBox="0 0 520 520" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="tBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#4a7ac9" />
              <stop offset="0.5" stop-color="#1e3a8a" />
              <stop offset="1" stop-color="#0c1e4a" />
            </linearGradient>
            <linearGradient id="tBodyDark" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stop-color="#07102b" />
              <stop offset="1" stop-color="#1e3a8a" />
            </linearGradient>
            <radialGradient id="tCenter" cx="0.5" cy="0.5">
              <stop offset="0" stop-color="#ff8a3c" />
              <stop offset="0.6" stop-color="#e8530e" />
              <stop offset="1" stop-color="#7a2a05" />
            </radialGradient>
            <linearGradient id="tBlade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#e2e8f0" />
              <stop offset="0.5" stop-color="#94a3b8" />
              <stop offset="1" stop-color="#475569" />
            </linearGradient>
          </defs>

          <!-- outer ring shadow + ring -->
          <circle cx="260" cy="260" r="210" fill="url(#tBodyDark)" opacity="0.8" />
          <circle cx="260" cy="260" r="200" fill="url(#tBody)" />

          <!-- bolt circle -->
          <g>
            <circle
              v-for="bolt in bolts"
              :key="'bolt-' + bolt.i"
              :cx="bolt.x"
              :cy="bolt.y"
              r="4"
              fill="#0c1e4a"
              stroke="#4a7ac9"
              stroke-width="1"
            />
          </g>

          <!-- inner rim -->
          <circle cx="260" cy="260" r="170" fill="#0c1e4a" />
          <circle cx="260" cy="260" r="168" fill="none" stroke="#4a7ac9" stroke-width="1" opacity="0.5" />

          <!-- blades rotating -->
          <g class="blades">
            <g v-for="i in 8" :key="'blade-' + i" :transform="`rotate(${(i - 1) * 45} 260 260)`">
              <path
                d="M 260 260 Q 310 180 270 110 Q 260 100 250 110 Q 210 180 260 260 Z"
                fill="url(#tBlade)"
                opacity="0.92"
              />
              <path
                d="M 260 260 Q 310 180 270 110 Q 260 100 250 110 Q 210 180 260 260 Z"
                fill="none"
                stroke="#0c1e4a"
                stroke-width="1.5"
                opacity="0.6"
              />
            </g>
          </g>

          <!-- hub -->
          <circle cx="260" cy="260" r="44" fill="url(#tCenter)" />
          <circle cx="260" cy="260" r="44" fill="none" stroke="#ff8a3c" stroke-width="1" />
          <circle cx="260" cy="260" r="22" fill="#7a2a05" />
          <circle cx="260" cy="260" r="10" fill="#1a0a02" />

          <!-- gauge arc -->
          <circle cx="260" cy="260" r="230" fill="none" stroke="#4a7ac9" stroke-opacity="0.25" stroke-width="1" />
          <circle
            cx="260"
            cy="260"
            r="230"
            fill="none"
            stroke="#e8530e"
            stroke-width="2"
            stroke-dasharray="850 2000"
            stroke-linecap="round"
            transform="rotate(-90 260 260)"
          />

          <!-- telemetry dots -->
          <circle
            v-for="(dot, idx) in telemetryDots"
            :key="'dot-' + idx"
            :cx="dot.x"
            :cy="dot.y"
            r="3"
            fill="#ff8a3c"
          >
            <animate attributeName="opacity" values="0.3;1;0.3" :dur="`${2 + idx * 0.3}s`" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <!-- top-left: marca genérica de la demo -->
      <div class="corp-header">
        <svg width="40" height="40" viewBox="0 0 40 40" class="gm-logo" aria-hidden="true">
          <path d="M20 2 36 11v18L20 38 4 29V11z" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5" />
          <path d="M22 9 13 22h6l-2 9 9-13h-6z" fill="#e8530e" />
        </svg>
        <div>
          <div class="corp-name">PLANTA DEMO</div>
          <div class="corp-subtitle">MONITOREO PREDICTIVO INDUSTRIAL</div>
        </div>
      </div>

      <!-- bottom-left: headline + chips -->
      <div class="hero-content">
        <div class="eyebrow">SISTEMA DE MONITOREO</div>
        <h1 class="headline">
          Modelo IA<br />Bombas HRSG
        </h1>
        <p class="tagline">
          Monitoreo predictivo con machine learning y detección de anomalías en tiempo real para bombas de alimentación de caldera.
        </p>

        <div class="chips">
          <div v-for="s in sensores" :key="s" class="chip">
            <span class="chip-dot"></span>
            {{ s }}
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT: formulario -->
    <div class="form-panel">
      <div class="form-content">
        <div class="access-label">ACCESO SEGURO</div>
        <h2 class="welcome">Bienvenido</h2>
        <p class="welcome-desc">
          Entorno de demostración con datos simulados. Ingresa con cualquier usuario y contraseña.
        </p>

        <!-- Sin esto el usuario vuelve al login sin saber por qué -->
        <div v-if="avisoSesion" class="session-notice" role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l2.5 2.5" />
          </svg>
          <span>{{ avisoSesion }}</span>
        </div>

        <form class="login-form" @submit.prevent="login">
          <label class="field">
            <span>Usuario</span>
            <input v-model="usuario" type="text" autocomplete="username" placeholder="operador@planta.demo" />
          </label>
          <label class="field">
            <span>Contraseña</span>
            <input v-model="clave" type="password" autocomplete="current-password" placeholder="••••••••" />
          </label>

          <button class="login-btn" type="submit" :disabled="ingresando">
            <svg v-if="!ingresando" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <path d="m10 17 5-5-5-5" />
              <path d="M15 12H3" />
            </svg>
            <span v-else class="spinner" aria-hidden="true"></span>
            {{ ingresando ? 'Ingresando…' : 'Ingresar' }}
          </button>
        </form>

        <div class="sso-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          Modo demostración · Datos simulados
        </div>

        <div class="footer">
          <span>© 2026 Planta Demo</span>
          <span>demo</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

definePageMeta({
  layout: false,
});

useHead({
  title: "Login · Modelo IA Bombas",
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    },
  ],
});

const { $auth } = useNuxtApp();
const route = useRoute();

// El middleware y authFetch mandan aca con ?sesion=expirada|invalida cuando
// cortan la sesion por token vencido.
const avisoSesion = computed(() => {
  const motivo = route.query.sesion;
  if (motivo === "expirada") return "Tu sesión expiró. Vuelve a iniciar sesión para continuar.";
  if (motivo === "invalida") return "Tu sesión ya no es válida. Vuelve a iniciar sesión.";
  if (motivo === "cerrada") return "Cerraste sesión correctamente.";
  return null;
});

const usuario = ref("");
const clave = ref("");
const ingresando = ref(false);

// Login de demostración: acepta cualquier credencial. La pequeña espera solo
// da tiempo a que se vea el estado "Ingresando…".
const login = async () => {
  ingresando.value = true;
  await new Promise((r) => setTimeout(r, 600));
  $auth.login(usuario.value);
  await navigateTo("/");
};

const sensores = ["Corriente", "Temperatura", "Vibración", "Presión", "Gas"];

const bolts = computed(() =>
  Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return { i, x: 260 + Math.cos(a) * 185, y: 260 + Math.sin(a) * 185 };
  })
);

const telemetryDots = computed(() =>
  [15, 75, 165, 255, 345].map((deg) => {
    const r = 240;
    return {
      x: 260 + Math.cos((deg * Math.PI) / 180) * r,
      y: 260 + Math.sin((deg * Math.PI) / 180) * r,
    };
  })
);
</script>

<style scoped>
.login-v1 {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  display: flex;
  background: #0f172a;
  font-family: "Inter", -apple-system, system-ui, sans-serif;
  color: #fff;
  overflow: hidden;
}

/* LEFT HERO ------------------------------------------------------- */
.hero {
  flex: 1 1 58%;
  position: relative;
  background: radial-gradient(ellipse at 30% 40%, #1e3a8a 0%, #07102b 55%, #050a1c 100%);
  overflow: hidden;
}

.hero-grid {
  position: absolute;
  inset: 0;
  opacity: 0.18;
}

.orange-glow {
  position: absolute;
  right: -80px;
  top: 20%;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(232, 83, 14, 0.4) 0%, transparent 70%);
  filter: blur(20px);
}

.turbine-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.turbine {
  width: min(520px, 75%);
  height: auto;
  max-height: 100%;
  filter: drop-shadow(0 30px 60px rgba(0, 0, 0, 0.5));
  animation: v1float 6s ease-in-out infinite;
}

.blades {
  transform-origin: 260px 260px;
  animation: v1spin 14s linear infinite;
}

@keyframes v1spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes v1float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.corp-header {
  position: absolute;
  top: 40px;
  left: 48px;
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 2;
}

.gm-logo {
  flex-shrink: 0;
}

.corp-name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
  line-height: 1.1;
}

.corp-subtitle {
  font-size: 10px;
  font-weight: 500;
  color: #93b6f0;
  letter-spacing: 1.2px;
  margin-top: 2px;
}

.hero-content {
  position: absolute;
  bottom: 56px;
  left: 48px;
  right: 48px;
  z-index: 2;
}

.eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 3px;
  color: #ff6a2c;
  margin-bottom: 14px;
}

.headline {
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  line-height: 1.05;
  letter-spacing: -0.8px;
  margin: 0;
  max-width: 480px;
}

.tagline {
  font-size: 14px;
  color: #c2d3ee;
  line-height: 1.55;
  margin-top: 16px;
  max-width: 440px;
}

.chips {
  display: flex;
  gap: 10px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.chip {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 500;
  color: #c2d3ee;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff6a2c;
  box-shadow: 0 0 8px #ff6a2c;
}

/* RIGHT FORM ------------------------------------------------------ */
.form-panel {
  flex: 0 0 42%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 48px;
  background: #0f172a;
}

.form-content {
  width: 100%;
  max-width: 380px;
}

.access-label {
  font-size: 12px;
  font-weight: 600;
  color: #e8530e;
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.welcome {
  font-size: 30px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.6px;
  color: #fff;
}

.welcome-desc {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 8px;
  line-height: 1.55;
}

.login-form {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
  letter-spacing: 0.3px;
}

.field input {
  height: 46px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field input::placeholder {
  color: #64748b;
}

.field input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-btn:disabled {
  opacity: 0.8;
  cursor: wait;
}

.login-btn {
  margin-top: 8px;
  width: 100%;
  height: 52px;
  background: #1e3a8a;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(30, 58, 138, 0.31), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: transform 150ms, box-shadow 150ms;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(30, 58, 138, 0.44), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.session-notice {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(232, 83, 14, 0.12);
  border: 1px solid rgba(232, 83, 14, 0.35);
  color: #ffb289;
  font-size: 13px;
  line-height: 1.45;
}

.session-notice svg {
  flex-shrink: 0;
}

.sso-note {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 12px;
}

.footer {
  margin-top: 56px;
  padding-top: 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #94a3b8;
}

/* Responsive ------------------------------------------------------ */

/* Tablets: reducir paddings y tamaños */
@media (max-width: 1100px) {
  .corp-header { top: 28px; left: 32px; }
  .hero-content { left: 32px; right: 32px; bottom: 40px; }
  .headline { font-size: 36px; }
  .form-panel { padding: 32px; }
}

/* Layout apilado: hero arriba, form abajo */
@media (max-width: 900px) {
  .login-v1 {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: auto;
  }
  .hero {
    flex: 0 0 auto;
    min-height: 460px;
    padding-bottom: 32px;
  }
  .hero-content {
    position: relative;
    bottom: auto;
    left: auto;
    right: auto;
    padding: 320px 32px 0;
  }
  .turbine-wrap {
    height: 320px;
    inset: auto 0 auto 0;
    top: 90px;
  }
  .turbine { width: 280px; }
  .corp-header { position: relative; top: auto; left: auto; padding: 24px 32px 0; }
  .form-panel {
    flex: 1 1 auto;
    padding: 40px 32px 32px;
    min-height: auto;
  }
  .headline { font-size: 30px; }
  .tagline { font-size: 13px; }
}

/* Móvil compacto */
@media (max-width: 600px) {
  .hero { min-height: 420px; padding-bottom: 24px; }
  .hero-content { padding: 260px 20px 0; }
  .turbine-wrap { height: 260px; top: 80px; }
  .turbine { width: 220px; }
  .corp-header { padding: 20px 20px 0; gap: 10px; }
  .corp-name { font-size: 11px; }
  .corp-subtitle { font-size: 9px; }
  .headline { font-size: 26px; letter-spacing: -0.5px; }
  .tagline { font-size: 13px; margin-top: 12px; }
  .eyebrow { font-size: 11px; letter-spacing: 2px; margin-bottom: 10px; }
  .chips { gap: 6px; margin-top: 18px; }
  .chip { padding: 5px 10px; font-size: 10px; }
  .form-panel { padding: 32px 20px 24px; }
  .welcome { font-size: 26px; }
  .footer { flex-direction: column; gap: 6px; text-align: center; }
}

/* Móvil muy estrecho */
@media (max-width: 360px) {
  .headline { font-size: 22px; }
  .turbine { width: 180px; }
  .turbine-wrap { height: 220px; top: 70px; }
  .hero-content { padding-top: 230px; }
}
</style>
