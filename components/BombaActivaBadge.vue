<template>
  <div
    v-if="!isLoading"
    class="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium"
    :class="[
      isDarkMode ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200',
      'shadow-sm'
    ]"
    :title="tooltip"
  >
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

    <span class="text-gray-700">{{ label }}</span>

    <div class="flex gap-1">
      <span
        class="px-1.5 py-0.5 rounded text-[10px] font-bold"
        :class="esBombaAActiva
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-500 line-through'"
      >A</span>
      <span
        class="px-1.5 py-0.5 rounded text-[10px] font-bold"
        :class="esBombaBActiva
          ? 'bg-purple-500 text-white'
          : 'bg-gray-200 text-gray-500 line-through'"
      >B</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useBombaActiva } from "@/composables/useBombaActiva";

defineProps({
  isDarkMode: { type: Boolean, default: false },
});

const { bombaActiva, esBombaAActiva, esBombaBActiva, isLoading } = useBombaActiva();

const label = computed(() => {
  switch (bombaActiva.value) {
    case "A": return "Bomba A activa";
    case "B": return "Bomba B activa";
    case "A/B": return "Ambas bombas activas";
    case "O": return "Ninguna bomba activa";
    default: return "Estado desconocido";
  }
});

const dotClass = computed(() => {
  switch (bombaActiva.value) {
    case "A": return "bg-blue-500";
    case "B": return "bg-purple-500";
    case "A/B": return "bg-emerald-500";
    case "O": return "bg-gray-400";
    default: return "bg-gray-400";
  }
});

const tooltip = computed(() => `Estado actualizado cada 60s. Valor: ${bombaActiva.value}`);
</script>
