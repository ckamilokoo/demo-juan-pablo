<template>
  <div class="flex min-w-0 items-center gap-2">
    <!-- Indicador de fase mientras corre la simulación -->
    <Transition name="fase" mode="out-in">
      <div
        v-if="fase !== 'inactivo'"
        :key="fase"
        class="hidden lg:flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold"
        :class="estilo.pill"
        role="status"
        aria-live="polite"
      >
        <span class="relative flex h-2.5 w-2.5">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" :class="estilo.dot"></span>
          <span class="relative inline-flex h-2.5 w-2.5 rounded-full" :class="estilo.dot"></span>
        </span>
        {{ estilo.texto }}
      </div>
    </Transition>

    <button
      class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 text-sm font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-60"
      :aria-label="enCurso ? 'Simulando' : transmitiendo ? 'Simular evento' : 'Iniciar transmisión'"
      :class="enCurso ? 'bg-gray-500' : 'bg-gradient-to-r from-orange-700 to-red-600 hover:from-orange-800 hover:to-red-700 hover:shadow-md'"
      :disabled="enCurso"
      title="Simula la llegada de datos de planta con una anomalía y su detección"
      @click="emit('simular')"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" />
      </svg>
      <span class="hidden sm:inline">{{ enCurso ? 'Simulando…' : transmitiendo ? 'Simular evento' : 'Iniciar transmisión' }}</span>
    </button>

    <!-- Reporte de turno -->
    <button
      v-if="transmitiendo"
      class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-300 bg-white px-2.5 sm:px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 hover:text-gray-800"
      title="Generar el reporte de turno (últimas 8 h)"
      aria-label="Generar reporte de turno"
      @click="emit('reporte')"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" />
      </svg>
      <span class="hidden sm:inline">Reporte</span>
    </button>

    <!-- Reinicio: vuelve la demo a vacío para repetir la simulación -->
    <button
      v-if="transmitiendo"
      class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-300 bg-white px-2.5 sm:px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 hover:text-gray-800"
      aria-label="Reiniciar demo"
      title="Borra los datos simulados y deja la demo como al inicio"
      @click="emit('reiniciar')"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </svg>
      <span class="hidden sm:inline">Reiniciar</span>
    </button>
  </div>
</template>

<script setup>
// Botón visible del header + indicador de fase. La lógica vive en
// useEventoDemo; el padre (pages/index.vue) navega y refresca las queries.
import { computed } from "vue";
import { useEventoDemo } from "@/composables/useEventoDemo";

const emit = defineEmits(["simular", "reiniciar", "reporte"]);

const { fase, transmitiendo } = useEventoDemo();

const enCurso = computed(() => fase.value === "recibiendo" || fase.value === "analizando");

const FASES = {
  recibiendo: { texto: "Recibiendo datos en vivo…", pill: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  analizando: { texto: "Modelo IA analizando…", pill: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  detectada: { texto: "¡Anomalía detectada!", pill: "bg-red-100 text-red-700", dot: "bg-red-500" },
};
const estilo = computed(() => FASES[fase.value] || FASES.recibiendo);
</script>

<style scoped>
.fase-enter-active,
.fase-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fase-enter-from,
.fase-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
