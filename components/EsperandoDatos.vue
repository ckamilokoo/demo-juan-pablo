<template>
  <Transition name="aviso">
    <div
      v-if="!transmitiendo"
      class="mb-6 flex flex-col items-start gap-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 shadow-sm sm:flex-row sm:items-center"
    >
      <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
          <path d="M2 2l20 20" />
        </svg>
      </div>
      <div class="flex-1">
        <p class="text-base font-semibold text-slate-800">Sin datos de planta</p>
        <p class="mt-1 text-sm text-slate-500">
          El sistema está en espera. Inicia la transmisión para empezar a recibir las señales de las bombas en tiempo real.
        </p>
      </div>
      <button
        class="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:from-orange-600 hover:to-red-600 hover:shadow-md"
        @click="emit('iniciar')"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" />
        </svg>
        Iniciar transmisión
      </button>
    </div>
  </Transition>
</template>

<script setup>
// Estado vacío de la demo: visible hasta que se inicia la transmisión.
import { useEventoDemo } from "@/composables/useEventoDemo";

const emit = defineEmits(["iniciar"]);
const { transmitiendo } = useEventoDemo();
</script>

<style scoped>
.aviso-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.aviso-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
