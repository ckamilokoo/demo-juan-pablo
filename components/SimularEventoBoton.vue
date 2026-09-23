<template>
  <div class="flex items-center gap-2">
    <!-- Indicador de fase mientras corre la simulación -->
    <Transition name="fase" mode="out-in">
      <div
        v-if="fase !== 'inactivo'"
        :key="fase"
        class="hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
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
      class="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-60"
      :class="enCurso ? 'bg-gray-500' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:shadow-md'"
      :disabled="enCurso"
      title="Simula la llegada de datos de planta con una anomalía y su detección"
      @click="emit('simular')"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" />
      </svg>
      {{ enCurso ? 'Simulando…' : transmitiendo ? 'Simular evento' : 'Iniciar transmisión' }}
    </button>
  </div>
</template>

<script setup>
// Botón visible del header + indicador de fase. La lógica vive en
// useEventoDemo; el padre (pages/index.vue) navega y refresca las queries.
import { computed } from "vue";
import { useEventoDemo } from "@/composables/useEventoDemo";

const emit = defineEmits(["simular"]);

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
