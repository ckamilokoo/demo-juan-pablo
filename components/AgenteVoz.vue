<template>
  <div class="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
    <!-- Panel de conversación. Minimizar NO corta la sesión: solo el botón Terminar. -->
    <Transition name="panel-voz">
      <div
        v-if="panelAbierto && (activo || error || mensajes.length || borrador)"
        class="w-[360px] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border shadow-2xl"
        :class="isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-800'"
      >
        <div class="flex items-center gap-2 border-b px-4 py-3" :class="isDarkMode ? 'border-slate-700' : 'border-slate-100'">
          <ThinkingOrb v-if="activo" :state="estadoOrbe" :size="40" :dark="isDarkMode" />
          <div v-else class="flex h-10 w-10 items-center justify-center rounded-full" :class="isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold">Atlas · asistente de voz</p>
            <p class="text-xs" :class="colorEstado">{{ textoEstado }}</p>
          </div>
          <button
            v-if="activo"
            class="rounded-full p-2 transition"
            :class="silenciado ? 'bg-red-100 text-red-600' : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'"
            :title="silenciado ? 'Activar micrófono' : 'Silenciar micrófono'"
            :aria-label="silenciado ? 'Activar micrófono' : 'Silenciar micrófono'"
            @click="alternarSilencio"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
              <path v-if="silenciado" d="M3 3l18 18" />
            </svg>
          </button>
          <button
            class="rounded-full p-2 transition"
            :class="isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'"
            title="Minimizar (la conversación sigue activa)"
            aria-label="Minimizar panel de voz"
            @click="alternarPanel"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </div>

        <!-- Conversación -->
        <div ref="lista" class="max-h-72 min-h-[7rem] space-y-2 overflow-y-auto px-4 py-3 text-sm">
          <p v-if="!mensajes.length && activo" class="py-6 text-center text-xs opacity-60">
            Habla con normalidad. Prueba: "muéstrame la corriente de la bomba A" o "¿qué está fallando?"
          </p>
          <template v-for="m in mensajes" :key="m.id">
            <div v-if="m.rol === 'sistema'" class="flex items-center gap-2 py-1 text-[11px] opacity-50">
              <span class="h-px flex-1 bg-current"></span>{{ m.texto }}<span class="h-px flex-1 bg-current"></span>
            </div>
            <div v-else-if="m.rol === 'accion'" class="flex justify-center">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                :class="isDarkMode ? 'bg-slate-800 text-orange-300' : 'bg-orange-50 text-orange-700'"
              >
                <span v-if="m.pendiente" class="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                <svg v-else class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5L20 7" /></svg>
                {{ m.texto }}
              </span>
            </div>
            <div v-else class="flex" :class="m.rol === 'usuario' ? 'justify-end' : 'justify-start'">
              <p
                class="max-w-[85%] rounded-2xl px-3 py-2 leading-snug"
                :class="
                  m.rol === 'usuario'
                    ? 'rounded-br-sm bg-blue-600 text-white'
                    : isDarkMode
                      ? 'rounded-bl-sm bg-slate-800'
                      : 'rounded-bl-sm bg-slate-100'
                "
              >
                {{ m.texto }}
              </p>
            </div>
          </template>
          <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{{ error }}</p>
        </div>

        <!-- Vista previa del correo: nada sale sin confirmación (voz o botón) -->
        <div v-if="borrador" class="border-t px-3 py-3 text-sm" :class="isDarkMode ? 'border-slate-700 bg-slate-800/60' : 'border-slate-100 bg-orange-50/60'">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wide text-orange-500">Borrador de correo · {{ borrador.tipo }}</span>
            <span class="text-[11px] opacity-60">Revisa y confirma</span>
          </div>
          <p class="mb-1 text-xs"><span class="opacity-60">Para:</span> {{ borrador.para.join(', ') }}</p>
          <input
            v-model="borrador.asunto"
            aria-label="Asunto del correo"
            class="mb-2 w-full rounded-md border px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-300"
            :class="isDarkMode ? 'border-slate-600 bg-slate-900' : 'border-slate-200 bg-white'"
          />
          <textarea
            v-model="borrador.cuerpo"
            rows="4"
            aria-label="Cuerpo del correo"
            class="w-full resize-none rounded-md border px-2 py-1 text-xs leading-snug outline-none focus:ring-2 focus:ring-orange-300"
            :class="isDarkMode ? 'border-slate-600 bg-slate-900' : 'border-slate-200 bg-white'"
          ></textarea>
          <p v-if="borrador.reporte" class="mt-2 rounded-md px-2 py-1 text-xs" :class="isDarkMode ? 'bg-slate-900 text-teal-300' : 'bg-teal-50 text-teal-700'">
            Incluye el reporte de turno: {{ borrador.reporte.alertas.lista.length }} alertas,
            {{ borrador.reporte.sensores.length }} sensores y {{ borrador.reporte.bitacoras.length }} bitácoras en tablas.
          </p>
          <a v-if="borrador.imagen" :href="borrador.imagen" target="_blank" rel="noopener" class="mt-2 block" title="Ver imagen completa">
            <img :src="borrador.imagen" :alt="borrador.descripcionGrafico || 'Gráfico'" class="max-h-28 w-full rounded-md border object-contain" :class="isDarkMode ? 'border-slate-600' : 'border-slate-200'" />
          </a>
          <button class="mt-2 text-xs font-medium text-blue-500 hover:underline" @click="verCorreo">Ver cómo se verá el correo ↗</button>
          <p v-if="errorCorreo" class="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">{{ errorCorreo }}</p>
          <div class="mt-2 flex justify-end gap-2">
            <button class="rounded-full px-3 py-1 text-xs font-medium opacity-70 hover:opacity-100" :disabled="enviandoCorreo" @click="descartar">Descartar</button>
            <button
              class="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              :disabled="enviandoCorreo"
              @click="enviarCorreo"
            >
              <span v-if="enviandoCorreo" class="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              {{ enviandoCorreo ? 'Enviando…' : 'Enviar correo' }}
            </button>
          </div>
        </div>

        <!-- Sesión activa: escribir (por si hay ruido) + terminar -->
        <form v-if="activo" class="flex gap-2 border-t px-3 py-2" :class="isDarkMode ? 'border-slate-700' : 'border-slate-100'" @submit.prevent="enviar">
          <input
            v-model="textoEscrito"
            type="text"
            placeholder="O escribe aquí…"
            aria-label="Mensaje escrito para Atlas"
            class="min-w-0 flex-1 rounded-full border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-300"
            :class="isDarkMode ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500' : 'border-slate-200 bg-white placeholder-slate-400'"
          />
          <button type="submit" class="rounded-full bg-orange-500 px-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50" :disabled="!textoEscrito.trim()">
            Enviar
          </button>
          <button
            type="button"
            class="flex items-center gap-1 rounded-full bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700"
            title="Terminar la conversación de voz"
            aria-label="Terminar conversación de voz"
            @click="terminar"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85a.99.99 0 0 1-1.4-.02L.29 13.08a.96.96 0 0 1 0-1.4C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.68c.39.38.39 1.02 0 1.4l-2.49 2.47a.99.99 0 0 1-1.4.02 11.3 11.3 0 0 0-2.66-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
            </svg>
            Terminar
          </button>
        </form>

        <!-- Sin sesión: retomar con el contexto de lo conversado -->
        <div v-else class="flex items-center justify-between gap-2 border-t px-3 py-2" :class="isDarkMode ? 'border-slate-700' : 'border-slate-100'">
          <button class="text-xs opacity-60 hover:underline hover:opacity-100" @click="limpiarConversacion">Borrar historial</button>
          <button
            class="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-1.5 text-sm font-semibold text-white hover:from-orange-600 hover:to-red-600"
            @click="conectar"
          >
            {{ mensajes.some((m) => m.rol === 'usuario' || m.rol === 'agente') ? 'Retomar conversación' : 'Hablar con Atlas' }}
          </button>
        </div>
      </div>
    </Transition>

    <!--
      Botón principal. Sin sesión: la inicia. Con sesión: solo muestra/oculta el
      panel (nunca abre una segunda sesión ni cuelga por accidente).
    -->
    <button
      class="relative flex h-16 w-16 items-center justify-center rounded-full shadow-xl transition hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
      :class="activo ? (isDarkMode ? 'bg-slate-900 ring-2 ring-orange-400' : 'bg-white ring-2 ring-orange-400') : 'bg-gradient-to-br from-orange-500 to-red-500'"
      :title="activo ? (panelAbierto ? 'Minimizar conversación' : 'Mostrar conversación') : 'Hablar con Atlas'"
      :aria-label="activo ? (panelAbierto ? 'Minimizar conversación' : 'Mostrar conversación') : 'Iniciar conversación de voz'"
      @click="activo ? alternarPanel() : conectar()"
    >
      <ThinkingOrb v-if="activo" :state="estadoOrbe" :size="56" :dark="isDarkMode" />
      <svg v-else class="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
      </svg>
      <!-- Indicador "en llamada" visible aunque el panel esté minimizado -->
      <span v-if="activo && !panelAbierto" class="absolute -right-0.5 -top-0.5 flex h-4 w-4">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
        <span class="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-green-500"></span>
      </span>
    </button>
  </div>
</template>

<script setup>
// Botón flotante + panel del agente de voz "Atlas" (OpenAI Realtime + LangGraph).
import { computed, ref, watch, nextTick } from "vue";
import ThinkingOrb from "@/components/ThinkingOrb.vue";
import { useAgenteVoz } from "@/composables/useAgenteVoz";
import { correo, enviarBorrador, descartarBorrador } from "~/agente/correoAgente";

defineProps({ isDarkMode: { type: Boolean, default: false } });

const {
  estado, mensajes, error, silenciado, panelAbierto,
  conectar, terminar, abrirPanel, registrarAccion, alternarPanel, alternarSilencio, enviarTexto, limpiarConversacion,
} = useAgenteVoz();

// --- Borrador de correo (vista previa) ---
const borrador = correo.borrador;
const enviandoCorreo = correo.enviando;
const errorCorreo = ref("");
// Al aparecer un borrador, mostrar el panel aunque estuviera minimizado.
watch(borrador, (b) => {
  errorCorreo.value = "";
  if (b) abrirPanel();
});
const enviarCorreo = async () => {
  errorCorreo.value = "";
  const r = await enviarBorrador();
  if (r.ok) registrarAccion(r.mensaje);
  else errorCorreo.value = r.mensaje;
};
// Vista previa del HTML real del correo en una pestaña nueva (no envía nada).
const verCorreo = async () => {
  const b = borrador.value;
  if (!b) return;
  const pestana = window.open("", "_blank");
  try {
    const html = await $fetch("/api/correo/vista-previa", {
      method: "POST",
      body: { asunto: b.asunto, cuerpo: b.cuerpo, tipo: b.tipo, imagen: b.imagen ?? undefined, descripcionGrafico: b.descripcionGrafico ?? undefined, reporte: b.reporte ?? undefined },
      responseType: "text",
    });
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    if (pestana) pestana.location.href = url;
  } catch (e) {
    pestana?.close();
    errorCorreo.value = "No se pudo generar la vista previa.";
  }
};

const descartar = () => {
  descartarBorrador();
  registrarAccion("El usuario descartó el borrador de correo.");
};

const activo = computed(() => !["inactivo", "error"].includes(estado.value));

const ORBE = { conectando: "shaping", escuchando: "listening", pensando: "working", hablando: "composing" };
const estadoOrbe = computed(() => ORBE[estado.value] || "listening");

const TEXTOS = {
  conectando: "Conectando…",
  escuchando: "Escuchando",
  pensando: "Ejecutando acciones…",
  hablando: "Hablando",
  error: "Sin conexión",
  inactivo: "Conversación terminada",
};
const textoEstado = computed(() => (silenciado.value && activo.value ? "Micrófono silenciado" : TEXTOS[estado.value]));
const colorEstado = computed(() =>
  estado.value === "error" ? "text-red-500" : estado.value === "hablando" ? "text-orange-500" : "opacity-60"
);

const textoEscrito = ref("");
const enviar = () => {
  enviarTexto(textoEscrito.value);
  textoEscrito.value = "";
};

// Mantener visible lo último de la conversación (también al reabrir el panel).
const lista = ref(null);
const alFinal = () => nextTick(() => lista.value && (lista.value.scrollTop = lista.value.scrollHeight));
watch(() => mensajes.value.length + (mensajes.value.at(-1)?.texto.length ?? 0), alFinal);
watch(panelAbierto, (abierto) => abierto && alFinal());
</script>

<style scoped>
.panel-voz-enter-active,
.panel-voz-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.panel-voz-enter-from,
.panel-voz-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>
