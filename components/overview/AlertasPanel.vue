<template>
  <div class="rounded-lg shadow p-4 sm:p-6 h-full flex flex-col" :class="isDarkMode ? 'bg-gray-800' : 'bg-white'">
    <div class="flex flex-col gap-3 mb-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h3
          class="text-base sm:text-lg font-medium"
          :class="isDarkMode ? 'text-white' : 'text-[#2E4053]'"
        >
          Alertas de Sensores
        </h3>

        <!-- Selector de período -->
        <select
          v-model.number="diasSeleccionado"
          class="px-2 py-1 text-xs rounded-lg border transition-colors cursor-pointer mt-2 sm:mt-0"
          :class="isDarkMode
            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'"
        >
          <option
            v-for="opcion in opcionesPeriodo"
            :key="opcion.valor"
            :value="opcion.valor"
          >
            {{ opcion.texto }}
          </option>
        </select>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          @click="filtroActual = 'TODOS'; paginaActual = 1"
          :class="[
            'px-2 py-1 rounded-full text-xs font-medium transition-colors',
            filtroActual === 'TODOS'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          Todos ({{ alertas?.length || 0 }})
        </button>

        <button
          @click="filtroActual = 'CRITICAL'; paginaActual = 1"
          :class="[
            'px-2 py-1 rounded-full text-xs font-medium transition-colors',
            filtroActual === 'CRITICAL'
              ? 'bg-purple-600 text-white'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          ]"
        >
          Críticas ({{ conteoCritical }})
        </button>

        <button
          @click="filtroActual = 'ALERT'; paginaActual = 1"
          :class="[
            'px-2 py-1 rounded-full text-xs font-medium transition-colors',
            filtroActual === 'ALERT'
              ? 'bg-blue-500 text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          ]"
        >
          Alertas ({{ conteoAlert }})
        </button>

        <button
          @click="filtroActual = 'AVISO'; paginaActual = 1"
          :class="[
            'px-2 py-1 rounded-full text-xs font-medium transition-colors',
            filtroActual === 'AVISO'
              ? 'bg-teal-500 text-white'
              : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
          ]"
        >
          Avisos ({{ conteoAviso }})
        </button>
      </div>
    </div>

    <!-- min-h-0 + overflow-hidden: el panel puede tener alto acotado por el
         layout del Overview; sin esto el skeleton se sale de la card -->
    <div v-if="isLoading" class="flex-grow min-h-0 overflow-hidden space-y-3">
      <div
        v-for="i in 3"
        :key="'alerta-sk-' + i"
        class="p-3 rounded-lg border-l-4 animate-pulse"
        :class="isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full" :class="isDarkMode ? 'bg-gray-600' : 'bg-gray-300'"></div>
            <div class="h-4 w-16 rounded-full" :class="isDarkMode ? 'bg-gray-600' : 'bg-gray-300'"></div>
          </div>
          <div class="h-3 w-24 rounded" :class="isDarkMode ? 'bg-gray-600' : 'bg-gray-300'"></div>
        </div>
        <div class="mt-2 h-4 w-20 rounded-full" :class="isDarkMode ? 'bg-gray-600' : 'bg-gray-300'"></div>
        <div class="mt-2 space-y-1.5">
          <div class="h-3 rounded" :class="isDarkMode ? 'bg-gray-600' : 'bg-gray-300'"></div>
          <div class="h-3 w-3/4 rounded" :class="isDarkMode ? 'bg-gray-600' : 'bg-gray-300'"></div>
        </div>
      </div>
    </div>

    <div v-else class="flex-grow min-h-0 flex flex-col overflow-hidden">
      <div v-if="isError" class="h-full flex flex-col items-center justify-center gap-3 text-center px-4" :class="isDarkMode ? 'text-gray-300' : 'text-gray-600'">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" :class="isDarkMode ? 'text-red-400' : 'text-red-500'" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <p class="text-sm">No se pudo consultar las alertas. Intenta de nuevo.</p>
        <button
          @click="refetchAlertas()"
          class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
          :class="isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
        >
          Reintentar
        </button>
      </div>

      <div v-else-if="!alertas || alertas.length === 0" class="h-full flex items-center justify-center" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
        No hay alertas registradas.
      </div>

      <div v-else-if="alertasFiltradas.length === 0" class="h-full flex items-center justify-center" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
        No se encontraron resultados para el filtro seleccionado.
      </div>

      <div v-else class="space-y-3 flex-grow overflow-y-auto">
        <div
          v-for="alerta in alertasPaginadas"
          :key="alerta.id"
          :class="[
            'p-3 rounded-lg border-l-4 transition-all',
            getAlertaClaseBackground(obtenerTipoAlerta(alerta))
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center">
              <span
                :class="[
                  'inline-flex items-center justify-center w-6 h-6 rounded-full mr-2',
                  getAlertaClaseIcono(obtenerTipoAlerta(alerta))
                ]"
              >
                <svg v-if="obtenerTipoAlerta(alerta) === 'CRITICAL'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <svg v-else-if="obtenerTipoAlerta(alerta) === 'ALERT'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                </svg>
              </span>
              <span
                :class="[
                  'font-medium text-xs px-2 py-0.5 rounded-full',
                  getAlertaClaseBadge(obtenerTipoAlerta(alerta))
                ]"
              >
                {{ obtenerTipoAlerta(alerta) }}
              </span>
            </div>
            <span class="text-xs" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
              {{ formatearFecha(alerta.timestamp) }}
            </span>
          </div>

          <div class="mt-2 flex items-center flex-wrap gap-2">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                  :class="isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'">
              {{ alerta.tipo_sensor.toUpperCase() }}<template v-if="obtenerTagAlerta(alerta)"> / {{ obtenerTagAlerta(alerta) }}</template>
            </span>
          </div>

          <p class="mt-2 text-sm" :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'">
            {{ limpiarDescripcion(alerta.descripcion) }}
          </p>

          <!-- Botón para ver gráfico de anomalía si está disponible -->
          <div v-if="alerta.tiene_datos_anomalia" class="mt-3">
            <button
              @click="verGraficoAnomalia(alerta)"
              class="text-xs font-semibold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md"
              :class="getBotonAnomaliaClases(obtenerTipoAlerta(alerta))"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Ver gráfico de anomalía
            </button>
          </div>
        </div>
      </div>

      <div v-if="alertasFiltradas.length > elementosPorPagina"
            class="mt-4 flex items-center justify-between pt-3"
            :class="isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'">
        <div class="flex items-center text-xs" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
          Mostrando {{ (paginaActual - 1) * elementosPorPagina + 1 }} -
          {{ Math.min(paginaActual * elementosPorPagina, alertasFiltradas.length) }}
          de {{ alertasFiltradas.length }}
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
import { ref, computed, watch, nextTick } from "vue";
import { useAlertas } from "@/composables/useAlertas";
import { useBombaActiva } from "@/composables/useBombaActiva";
import { esSensorGeneral } from "@/config/bombasConfig";
import { buscarTagSensor } from "@/config/sensoresAnomaliasConfig";
import { useTracking } from "@/composables/useTracking";
import { useOrdenUI } from "@/composables/useControlUI";

const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['navegar-anomalia', 'filtro-dias-cambio']);
const { push: trackEvent } = useTracking();

// Opciones de período para el selector
const opcionesPeriodo = [
  { valor: 1, texto: 'Último día' },
  { valor: 2, texto: 'Últimos 2 días' },
  { valor: 7, texto: 'Última semana' },
  { valor: 30, texto: 'Último mes' },
  { valor: 90, texto: 'Últimos 3 meses' }
];
const diasSeleccionado = ref(2);

// Avisar a index.vue (y de ahi al chatbot) que filtro de dias tiene puesto el usuario
// — para que contexto_visual.filtro_dias coincida con lo que esta viendo, no con un default fijo
watch(diasSeleccionado, (dias) => emit('filtro-dias-cambio', dias), { immediate: true });

const { alertas: alertasRaw, isLoading_alerta: isLoading, isError_alerta: isError, refetchAlertas } = useAlertas(diasSeleccionado);
const { esBombaAActiva, esBombaBActiva } = useBombaActiva();

// Filtrar alertas: sensores generales solo aparecen si su bomba de origen está activa
const alertas = computed(() => {
  if (!alertasRaw.value || !Array.isArray(alertasRaw.value)) return [];
  return alertasRaw.value.filter((a) => {
    if (!esSensorGeneral(a.tipo_sensor)) return true;
    if (a.origen === "Bomba A") return esBombaAActiva.value;
    if (a.origen === "Bomba B") return esBombaBActiva.value;
    return true;
  });
});
const filtroActual = ref('TODOS');
const paginaActual = ref(1);
const elementosPorPagina = 3;

// Función para determinar el tipo de alerta basado en la descripción
const obtenerTipoAlerta = (alerta) => {
  const desc = alerta.descripcion || '';
  if (desc.includes('CRÍTICA')) return 'CRITICAL';
  if (desc.includes('ALERTA')) return 'ALERT';
  return 'AVISO';
};

// Obtiene el tag (señal origen) según tipo_sensor y bomba de origen
const obtenerTagAlerta = (alerta) => {
  if (!alerta?.tipo_sensor) return undefined;
  const bomba = alerta.bomba_datos === 'B' || alerta.tabla_origen === 'B' || alerta.origen === 'Bomba B' ? 'B' : 'A';
  return buscarTagSensor(alerta.tipo_sensor, bomba);
};

// Funciones para obtener clases de estilo según el tipo de alerta y el tema
const getAlertaClaseBackground = (tipo) => {
  if (props.isDarkMode) {
    switch (tipo) {
      case 'CRITICAL': return 'bg-purple-900 bg-opacity-30 border-purple-600';
      case 'ALERT': return 'bg-blue-900 bg-opacity-30 border-blue-600';
      case 'AVISO': return 'bg-teal-900 bg-opacity-30 border-teal-600';
      default: return 'bg-gray-700 border-gray-600';
    }
  } else {
    switch (tipo) {
      case 'CRITICAL': return 'bg-purple-50 border-purple-500';
      case 'ALERT': return 'bg-blue-50 border-blue-500';
      case 'AVISO': return 'bg-teal-50 border-teal-500';
      default: return 'bg-gray-50 border-gray-500';
    }
  }
};

const getAlertaClaseIcono = (tipo) => {
  if (props.isDarkMode) {
    switch (tipo) {
      case 'CRITICAL': return 'bg-purple-800 text-purple-200';
      case 'ALERT': return 'bg-blue-800 text-blue-200';
      case 'AVISO': return 'bg-teal-800 text-teal-200';
      default: return 'bg-gray-700 text-gray-300';
    }
  } else {
    switch (tipo) {
      case 'CRITICAL': return 'bg-purple-100 text-purple-600';
      case 'ALERT': return 'bg-blue-100 text-blue-600';
      case 'AVISO': return 'bg-teal-100 text-teal-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }
};

const getAlertaClaseBadge = (tipo) => {
  if (props.isDarkMode) {
    switch (tipo) {
      case 'CRITICAL': return 'bg-purple-800 text-purple-100';
      case 'ALERT': return 'bg-blue-800 text-blue-100';
      case 'AVISO': return 'bg-teal-800 text-teal-100';
      default: return 'bg-gray-700 text-gray-300';
    }
  } else {
    switch (tipo) {
      case 'CRITICAL': return 'bg-purple-100 text-purple-800';
      case 'ALERT': return 'bg-blue-100 text-blue-800';
      case 'AVISO': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
};

const getBotonAnomaliaClases = (tipo) => {
  if (props.isDarkMode) {
    switch (tipo) {
      case 'CRITICAL': return 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 border border-orange-400';
      case 'ALERT': return 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 border border-blue-400';
      case 'AVISO': return 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-500 hover:to-emerald-500 border border-teal-400';
      default: return 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-500';
    }
  } else {
    switch (tipo) {
      case 'CRITICAL': return 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:scale-105';
      case 'ALERT': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 hover:scale-105';
      case 'AVISO': return 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 hover:scale-105';
      default: return 'bg-gray-600 text-white hover:bg-gray-700 hover:scale-105';
    }
  }
};

// Función para navegar al gráfico de anomalía
const verGraficoAnomalia = (alerta) => {
  // Bomba donde viven los datos (campo del backend; fallback a la descripción).
  const bombaDatos =
    alerta.bomba_datos === 'A' ? 'A'
    : alerta.bomba_datos === 'B' ? 'B'
    : (alerta.descripcion || '').includes('BOMBA A') ? 'A' : 'B';

  // Los sensores generales solo se muestran en la vista de la bomba ACTIVA
  // (AnalisisAnomaliasA/B ocultan los generales cuando su bomba no está activa).
  // Por eso, para un general hay que navegar a la bomba activa, no a la de los datos.
  let bombaDestino = bombaDatos;
  if (esSensorGeneral(alerta.tipo_sensor)) {
    if (esBombaBActiva.value && !esBombaAActiva.value) bombaDestino = 'B';
    else if (esBombaAActiva.value && !esBombaBActiva.value) bombaDestino = 'A';
    // Ambas activas (A/B u O): el general aparece en las dos vistas → usar la de los datos.
  }
  const paginaDestino = bombaDestino === 'A' ? 'anomaliasA' : 'anomaliasB';

  trackEvent({
    accion: 'click',
    componente: 'AlertasPanel',
    detalle: {
      alerta_id: alerta.id,
      tipo_sensor: alerta.tipo_sensor,
      tabla_origen: alerta.tabla_origen,
      bomba_datos: alerta.bomba_datos,
      bomba_destino: bombaDestino
    },
    pagina_origen: 'Overview',
    pagina_destino: `AnalisisAnomalias${bombaDestino}`
  });

  emit('navegar-anomalia', {
    pagina: paginaDestino,
    sensorTipo: alerta.tipo_sensor
  });
};

// Propiedades computadas
const alertasFiltradas = computed(() => {
  if (!alertas.value || !Array.isArray(alertas.value)) return [];

  if (filtroActual.value === 'TODOS') {
    return alertas.value;
  }

  return alertas.value.filter(a => obtenerTipoAlerta(a) === filtroActual.value);
});

const totalPaginas = computed(() =>
  Math.ceil(alertasFiltradas.value.length / elementosPorPagina)
);

const alertasPaginadas = computed(() => {
  const start = (paginaActual.value - 1) * elementosPorPagina;
  return alertasFiltradas.value.slice(start, start + elementosPorPagina);
});

const conteoCritical = computed(() => {
  if (!alertas.value || !Array.isArray(alertas.value)) return 0;
  return alertas.value.filter(a => obtenerTipoAlerta(a) === 'CRITICAL').length;
});

const conteoAlert = computed(() => {
  if (!alertas.value || !Array.isArray(alertas.value)) return 0;
  return alertas.value.filter(a => obtenerTipoAlerta(a) === 'ALERT').length;
});

const conteoAviso = computed(() => {
  if (!alertas.value || !Array.isArray(alertas.value)) return 0;
  return alertas.value.filter(a => obtenerTipoAlerta(a) === 'AVISO').length;
});

// Watchers
watch(filtroActual, () => {
  paginaActual.value = 1;
});

watch(totalPaginas, n => {
  if (paginaActual.value > n && n > 0) paginaActual.value = n;
});

// Quita la sección "Acción recomendada" del mensaje de la alerta
const limpiarDescripcion = (desc) => {
  if (!desc) return '';
  // Corta en el primer match de "Acción recomendada"/"Accion Recomendada" (case/acento-insensitive)
  return desc.replace(/\s*(?:[|\-•·💡\n]\s*)?acci[oó]n\s+recomendada\s*[:\-]?[\s\S]*$/i, '').trim();
};

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
// Control por voz (agente): filtros, período y página del panel.
const FILTRO_POR_NIVEL = { todos: 'TODOS', critica: 'CRITICAL', alerta: 'ALERT', aviso: 'AVISO' };
const NOMBRE_FILTRO = { TODOS: 'todas', CRITICAL: 'críticas', ALERT: 'alertas', AVISO: 'avisos' };
useOrdenUI('panel_alertas', async ({ nivel, dias, pagina }) => {
  if (dias) {
    // Opción del selector más cercana a lo pedido
    const cercana = opcionesPeriodo.reduce((a, b) => (Math.abs(b.valor - dias) < Math.abs(a.valor - dias) ? b : a));
    diasSeleccionado.value = cercana.valor;
    // La consulta del nuevo período tarda un momento: esperar antes de responder.
    await nextTick();
    const limite = Date.now() + 4000;
    while (isLoading.value && Date.now() < limite) await new Promise((r) => setTimeout(r, 100));
  }
  if (nivel && FILTRO_POR_NIVEL[nivel]) filtroActual.value = FILTRO_POR_NIVEL[nivel];
  await nextTick(); // el cambio de filtro vuelve a la página 1
  if (pagina === 'siguiente') paginaActual.value = Math.min(paginaActual.value + 1, Math.max(1, totalPaginas.value));
  else if (pagina === 'anterior') paginaActual.value = Math.max(1, paginaActual.value - 1);
  else if (typeof pagina === 'number') paginaActual.value = Math.min(Math.max(1, pagina), Math.max(1, totalPaginas.value));
  await nextTick();
  const periodo = opcionesPeriodo.find((o) => o.valor === diasSeleccionado.value)?.texto ?? `${diasSeleccionado.value} días`;
  const visibles = alertasPaginadas.value
    .map((a) => `${obtenerTipoAlerta(a)} ${a.tipo_sensor} (${formatearFecha(a.timestamp)})`)
    .join('; ');
  return `Panel de alertas: ${NOMBRE_FILTRO[filtroActual.value]}, ${periodo}, página ${paginaActual.value} de ${Math.max(1, totalPaginas.value)} ` +
    `(${alertasFiltradas.value.length} en total). En pantalla: ${visibles || 'ninguna'}.`;
});
</script>
