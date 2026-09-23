<template>
  <div
    v-if="!isLoading && data"
    class="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium"
    :class="[
      isDarkMode ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200',
      'shadow-sm'
    ]"
    :title="tooltip"
  >
    <!-- Punto de frescura de señales -->
    <span class="relative flex h-2.5 w-2.5">
      <span
        class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        :class="dotClass"
      ></span>
      <span
        class="relative inline-flex rounded-full h-2.5 w-2.5"
        :class="dotClass"
      ></span>
    </span>

    <!-- Icono reloj -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-3.5 w-3.5 text-gray-400 hidden sm:block"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>

    <!-- Señales -->
    <span class="text-gray-700 whitespace-nowrap">
      <span class="hidden sm:inline">Señales</span>
      <span class="sm:hidden">📡</span>
      <b class="font-semibold ml-1">{{ senalesRelativo }}</b>
    </span>

    <span class="text-gray-300">·</span>

    <!-- Bitácoras -->
    <span class="text-gray-700 whitespace-nowrap">
      <span class="hidden sm:inline">Bitácoras</span>
      <span class="sm:hidden">📋</span>
      <b class="font-semibold ml-1">{{ bitacorasRelativo }}</b>
    </span>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useUltimaCarga } from "@/composables/useUltimaCarga";

defineProps({
  isDarkMode: { type: Boolean, default: false },
});

const { data, senales, bitacoras, senalesRelativo, bitacorasRelativo, isLoading } = useUltimaCarga();

// Color del punto según qué tan fresca es la última carga de señales.
// Los sensores cargan cada ~minuto: >15 min sin cargar indica problema.
const dotClass = computed(() => {
  const min = senales.value?.hace_minutos;
  if (min === null || min === undefined) return "bg-gray-400";
  if (min <= 15) return "bg-emerald-500";
  if (min <= 60) return "bg-amber-500";
  return "bg-red-500";
});

const tooltip = computed(() => {
  const s = senales.value?.texto ?? "sin datos";
  const b = bitacoras.value?.texto ?? "sin datos";
  return `Última carga (hora de Chile)\nSeñales: ${s}\nBitácoras: ${b}`;
});
</script>
