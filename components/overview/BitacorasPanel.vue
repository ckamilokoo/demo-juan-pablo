<template>
  <div class="rounded-lg shadow p-4 sm:p-6 h-full flex flex-col" :class="isDarkMode ? 'bg-gray-800' : 'bg-white'">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
      <h3
        class="text-base sm:text-lg font-medium"
        :class="isDarkMode ? 'text-white' : 'text-[#2E4053]'"
      >
        Bitacoras de Alertas y Avisos
      </h3>

      <div class="flex flex-wrap gap-2 mt-2 sm:mt-0">
        <button
          @click="filtroActual = 'TODOS'; paginaActual = 1"
          :class="[
            'px-2 py-1 rounded-full text-xs font-medium transition-colors',
            filtroActual === 'TODOS'
              ? (isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-800 text-white')
              : (isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
          ]"
        >
          Todos ({{ bitacorasConAlerta.length }})
        </button>

        <button
          @click="filtroActual = 'ALERTA'; paginaActual = 1"
          :class="[
            'px-2 py-1 rounded-full text-xs font-medium transition-colors',
            filtroActual === 'ALERTA'
              ? 'bg-red-600 text-white'
              : (isDarkMode ? 'bg-red-900 bg-opacity-30 text-red-400 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200')
          ]"
        >
          Alertas ({{ conteoAlertas }})
        </button>

        <button
          @click="filtroActual = 'AVISO'; paginaActual = 1"
          :class="[
            'px-2 py-1 rounded-full text-xs font-medium transition-colors',
            filtroActual === 'AVISO'
              ? 'bg-amber-500 text-white'
              : (isDarkMode ? 'bg-amber-900 bg-opacity-30 text-amber-400 hover:bg-amber-800' : 'bg-amber-100 text-amber-700 hover:bg-amber-200')
          ]"
        >
          Avisos ({{ conteoAvisos }})
        </button>
      </div>
    </div>

    <!-- min-h-0 + overflow-hidden: el panel puede tener alto acotado por el
         layout del Overview; sin esto el skeleton se sale de la card -->
    <div v-if="isLoading" class="flex-grow min-h-0 overflow-hidden space-y-3">
      <div
        v-for="i in 3"
        :key="'bitacora-sk-' + i"
        class="p-3 rounded-lg border-l-4 animate-pulse"
        :class="isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full" :class="isDarkMode ? 'bg-gray-600' : 'bg-gray-300'"></div>
            <div class="h-4 w-14 rounded-full" :class="isDarkMode ? 'bg-gray-600' : 'bg-gray-300'"></div>
          </div>
          <div class="h-3 w-24 rounded" :class="isDarkMode ? 'bg-gray-600' : 'bg-gray-300'"></div>
        </div>
        <div class="mt-2 space-y-1.5">
          <div class="h-3 rounded" :class="isDarkMode ? 'bg-gray-600' : 'bg-gray-300'"></div>
          <div class="h-3 w-2/3 rounded" :class="isDarkMode ? 'bg-gray-600' : 'bg-gray-300'"></div>
        </div>
      </div>
    </div>

    <div v-else class="flex-grow flex flex-col overflow-hidden">
      <div v-if="bitacorasConAlerta.length === 0" class="h-full flex items-center justify-center" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
        No se encontraron alertas ni avisos.
      </div>

      <div v-else-if="bitacorasFiltradas.length === 0" class="h-full flex items-center justify-center" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
        No se encontraron resultados para el filtro seleccionado.
      </div>

      <div v-else class="space-y-3 flex-grow overflow-y-auto">
        <div
          v-for="alerta in bitacorasPaginadas"
          :key="alerta.id"
          :class="[
            'p-3 rounded-lg border-l-4 transition-all',
            alerta.alerta_aviso === 'ALERTA'
              ? (isDarkMode ? 'bg-red-900 bg-opacity-20 border-red-600' : 'bg-red-50 border-red-500')
              : (isDarkMode ? 'bg-amber-900 bg-opacity-20 border-amber-600' : 'bg-amber-50 border-amber-500')
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center">
              <span
                :class="[
                  'inline-flex items-center justify-center w-6 h-6 rounded-full mr-2',
                  alerta.alerta_aviso === 'ALERTA'
                    ? (isDarkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-600')
                    : (isDarkMode ? 'bg-amber-800 text-amber-200' : 'bg-amber-100 text-amber-600')
                ]"
              >
                <svg v-if="alerta.alerta_aviso === 'ALERTA'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </span>
              <span
                :class="[
                  'font-medium text-xs px-2 py-0.5 rounded-full',
                  alerta.alerta_aviso === 'ALERTA'
                    ? (isDarkMode ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800')
                    : (isDarkMode ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-800')
                ]"
              >
                {{ alerta.alerta_aviso }}
              </span>
            </div>
            <span class="text-xs" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
              {{ formatearFecha(alerta.tiempo_ejecucion) }}
            </span>
          </div>

          <p
            :ref="(el) => registrarParrafo(el, alerta.id)"
            class="mt-2 text-sm whitespace-pre-line break-words"
            :class="[
              isDarkMode ? 'text-gray-300' : 'text-gray-700',
              expandidas[alerta.id] ? '' : 'line-clamp-2'
            ]"
          >
            {{ alerta.bitacora }}
          </p>
          <button
            v-if="truncadas[alerta.id] || expandidas[alerta.id]"
            type="button"
            @click="toggleExpandida(alerta.id)"
            class="mt-1 text-xs font-medium hover:underline"
            :class="alerta.alerta_aviso === 'ALERTA'
              ? (isDarkMode ? 'text-red-300' : 'text-red-700')
              : (isDarkMode ? 'text-amber-300' : 'text-amber-700')"
          >
            {{ expandidas[alerta.id] ? 'Ver menos' : 'Ver más' }}
          </button>
        </div>
      </div>

      <div v-if="bitacorasFiltradas.length > elementosPorPagina"
            class="mt-4 flex items-center justify-between pt-3"
            :class="isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'">
        <div class="flex items-center text-xs" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
          Mostrando {{ (paginaActual - 1) * elementosPorPagina + 1 }} -
          {{ Math.min(paginaActual * elementosPorPagina, bitacorasFiltradas.length) }}
          de {{ bitacorasFiltradas.length }}
        </div>

        <div class="flex gap-1">
          <button
            @click="paginaActual = Math.max(1, paginaActual - 1)"
            :disabled="paginaActual === 1"
            :class="[
              'p-1 rounded transition-colors',
              paginaActual === 1
                ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>

          <div class="flex items-center px-2 text-sm" :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'">
            {{ paginaActual }} / {{ totalPaginas }}
          </div>

          <button
            @click="paginaActual = Math.min(totalPaginas, paginaActual + 1)"
            :disabled="paginaActual === totalPaginas"
            :class="[
              'p-1 rounded transition-colors',
              paginaActual === totalPaginas
                ? (isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, nextTick } from "vue";
import { useBitacoras } from "@/composables/useBitacoras";

const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: false,
  },
});

const { bitacoras, isLoading } = useBitacoras();
const filtroActual = ref('TODOS');
const paginaActual = ref(1);
const elementosPorPagina = 3;
const expandidas = ref({});
const truncadas = ref({});
const observers = new Map();

const medirTruncado = (el, id) => {
  if (!el || expandidas.value[id]) return;
  const overflow = el.scrollHeight > el.clientHeight + 1;
  if (truncadas.value[id] !== overflow) {
    truncadas.value = { ...truncadas.value, [id]: overflow };
  }
};

const registrarParrafo = (el, id) => {
  if (!el) {
    const ro = observers.get(id);
    if (ro) {
      ro.disconnect();
      observers.delete(id);
    }
    return;
  }
  if (!observers.has(id)) {
    const ro = new ResizeObserver(() => medirTruncado(el, id));
    ro.observe(el);
    observers.set(id, ro);
  }
  nextTick(() => medirTruncado(el, id));
};

const toggleExpandida = (id) => {
  expandidas.value = { ...expandidas.value, [id]: !expandidas.value[id] };
};

onBeforeUnmount(() => {
  observers.forEach((ro) => ro.disconnect());
  observers.clear();
});

// Propiedades computadas
const bitacorasConAlerta = computed(() =>
  (bitacoras.value || []).filter(b => b.alerta_aviso != null)
);

const bitacorasFiltradas = computed(() =>
  filtroActual.value === 'TODOS'
    ? bitacorasConAlerta.value
    : bitacorasConAlerta.value.filter(b => b.alerta_aviso === filtroActual.value)
);

const totalPaginas = computed(() =>
  Math.ceil(bitacorasFiltradas.value.length / elementosPorPagina)
);

const bitacorasPaginadas = computed(() => {
  const start = (paginaActual.value - 1) * elementosPorPagina;
  return bitacorasFiltradas.value.slice(start, start + elementosPorPagina);
});

const conteoAlertas = computed(() =>
  bitacorasConAlerta.value.filter(b => b.alerta_aviso === 'ALERTA').length
);

const conteoAvisos = computed(() =>
  bitacorasConAlerta.value.filter(b => b.alerta_aviso === 'AVISO').length
);

// Watchers
watch(filtroActual, () => { paginaActual.value = 1; });

watch(totalPaginas, n => {
  if (paginaActual.value > n && n > 0) paginaActual.value = n;
});

// Utilidades
const formatearFecha = fechaStr => {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hour12: false,
      timeZone: 'America/Santiago'
    }).format(new Date(fechaStr));
  } catch {
    return fechaStr;
  }
};
</script>
