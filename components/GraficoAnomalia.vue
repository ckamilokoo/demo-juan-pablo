<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-start gap-4">
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-800">{{ titulo }}</h3>
        <p v-if="descripcion || alertaInfo.timestamp" class="text-sm text-gray-600 mt-1 leading-relaxed">
          <span class="font-medium text-gray-700">Alerta detectada:</span>
          {{ descripcion || formatearFecha(alertaInfo.timestamp) }}
          <span v-if="descripcion && alertaInfo.timestamp" class="text-gray-400">
            · {{ formatearFecha(alertaInfo.timestamp) }}
          </span>
        </p>
      </div>
      <button
        @click="refetch()"
        :disabled="isFetching"
        class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
      >
        <svg :class="['h-4 w-4 inline-block mr-1', isFetching && 'animate-spin']" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{{ isFetching ? 'Actualizando...' : 'Actualizar' }}</span>
      </button>
    </div>

    <div class="p-6">
      <!-- Skeleton (carga inicial o nueva alerta) -->
      <div v-if="isLoading" class="animate-pulse">
        <!-- 4 cards de estadísticas placeholder -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div v-for="i in 4" :key="'stat-sk-' + i" class="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <div class="h-3 w-24 rounded bg-gray-200"></div>
            <div class="h-7 w-16 rounded bg-gray-200 mt-2"></div>
          </div>
        </div>
        <!-- Periodo anómalo placeholder -->
        <div class="bg-gray-100 rounded-lg p-4 mb-6 border border-gray-200">
          <div class="h-4 w-48 rounded bg-gray-200"></div>
          <div class="h-3 w-3/4 rounded bg-gray-200 mt-2"></div>
        </div>
        <!-- Chart area placeholder -->
        <div class="bg-gray-100 rounded-lg" style="height: 400px;"></div>
        <!-- Leyenda placeholder -->
        <div class="flex justify-center gap-6 mt-4">
          <div class="h-4 w-32 rounded bg-gray-200"></div>
          <div class="h-4 w-32 rounded bg-gray-200"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMensaje" class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-red-700 font-medium">Error al cargar datos</p>
        <p class="text-red-600 text-sm mt-1">{{ errorMensaje }}</p>
      </div>

      <!-- No Data State -->
      <div v-else-if="!datosGrafico || datosGrafico.length === 0" class="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-amber-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p class="text-lg font-semibold text-amber-800 mb-2">Datos históricos no disponibles</p>
        <p class="text-amber-700 text-sm mb-3">
          Los registros del sensor para el período de esta anomalía ya no están en la base de datos.
        </p>
        <div class="bg-amber-100 rounded-lg p-3 text-left max-w-md mx-auto">
          <p class="text-xs text-amber-800 font-medium mb-1">Posibles causas:</p>
          <ul class="text-xs text-amber-700 list-disc list-inside space-y-1">
            <li>Los datos fueron rotados por mantenimiento de la base de datos</li>
            <li>El período de la anomalía es anterior a los datos almacenados actualmente</li>
          </ul>
        </div>
      </div>

      <!-- Chart -->
      <div v-else>
        <!-- Estadísticas -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p class="text-sm text-gray-600 font-medium">Total de Registros</p>
            <p class="text-2xl font-bold text-gray-800 mt-1">{{ estadisticas?.total_registros || 0 }}</p>
          </div>
          <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p class="text-sm text-purple-600 font-medium">Anomalías</p>
            <p class="text-2xl font-bold text-purple-800 mt-1">{{ estadisticas?.registros_anomalos || 0 }}</p>
          </div>
          <div class="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <p class="text-sm text-teal-600 font-medium">Normales</p>
            <p class="text-2xl font-bold text-teal-800 mt-1">{{ estadisticas?.registros_normales || 0 }}</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p class="text-sm text-blue-600 font-medium">% Anomalías</p>
            <p class="text-2xl font-bold text-blue-800 mt-1">{{ estadisticas?.porcentaje_anomalias?.toFixed(1) || 0 }}%</p>
          </div>
        </div>

        <!-- Periodo Anómalo Info -->
        <div v-if="periodoAnomalo" class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div class="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600 mr-3 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <div class="flex-1">
              <p class="font-medium text-purple-900">Periodo Anómalo Detectado</p>
              <p class="text-sm text-purple-700 mt-1">
                <span class="font-medium">Inicio:</span> {{ formatearFechaCompleta(periodoAnomalo.timestamp_inicio) }}
                <span class="mx-2">•</span>
                <span class="font-medium">Fin:</span> {{ formatearFechaCompleta(periodoAnomalo.timestamp_fin) }}
                <span class="mx-2">•</span>
                <span class="font-medium">Duración:</span> {{ periodoAnomalo.duracion_minutos }} minutos
              </p>
            </div>
          </div>
        </div>

        <!-- Canvas para Chart.js -->
        <div class="relative" style="height: 400px;">
          <canvas :id="canvasId" ref="chartCanvas"></canvas>
        </div>

        <!-- Leyenda personalizada -->
        <div class="flex justify-center gap-6 mt-4 flex-wrap">
          <div class="flex items-center">
            <div class="w-4 h-4 rounded-full mr-2" style="background-color: green;"></div>
            <span class="text-sm text-gray-700">Datos Normales</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 rounded-full mr-2" style="background-color: red;"></div>
            <span class="text-sm text-gray-700">Datos Anómalos</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, toRef, onBeforeUnmount } from 'vue';
import { crearGrafico, destruirGrafico } from '@/utils/chartUtils';
import { useDatosAnomaliaConContexto } from '@/composables/useAlertasAnomalias';

const props = defineProps({
  alertaId: {
    type: Number,
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  minutosContexto: {
    type: Number,
    default: 30
  },
  bomba: {
    type: String,
    required: true,
    validator: (value) => ['A', 'B'].includes(value)
  }
});

// Referencias
const chartCanvas = ref(null);
const canvasId = `chart-anomalia-${props.bomba}-${props.alertaId}`;

// Vue Query: cache automático por (alertaId + minutosContexto + bomba)
const alertaIdRef = toRef(props, 'alertaId');
const minutosRef = toRef(props, 'minutosContexto');
const bombaRef = toRef(props, 'bomba');

const {
  datosContexto,
  isLoading,
  isFetching,
  error: queryError,
  refetch,
} = useDatosAnomaliaConContexto(alertaIdRef, minutosRef, minutosRef, bombaRef);

// Error local (errores del chart) + error de la query
const errorChart = ref(null);
const errorMensaje = computed(() => errorChart.value || queryError.value?.message || null);

// Computeds
const estadisticas = computed(() => datosContexto.value?.estadisticas || null);
const periodoAnomalo = computed(() => datosContexto.value?.periodo_anomalo || null);
const alertaInfo = computed(() => ({
  timestamp: datosContexto.value?.timestamp || null
}));

// Datos transformados para el chart
const datosGrafico = computed(() => {
  const datos = datosContexto.value?.datos;
  if (!datos || !Array.isArray(datos)) return [];
  return datos.map(d => ({
    tiempo_sensor: d.tiempo_ejecucion,
    valor_sensor: d.valor_sensor,
    clasificacion: d.es_anomalia ? -1 : 1,
  }));
});

// Funciones de formateo
const formatearFecha = (fecha) => {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatearFechaCompleta = (fecha) => {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Crear/recrear chart cuando llegan datos nuevos
watch(
  [datosGrafico, isLoading],
  async ([datos, loading]) => {
    if (loading || !datos || datos.length === 0) return;
    errorChart.value = null;
    await nextTick();
    if (!chartCanvas.value) return;
    setTimeout(() => {
      try {
        crearGrafico(chartCanvas.value, datos);
      } catch (e) {
        console.error('Error al crear el gráfico:', e);
        errorChart.value = `Error al generar el gráfico: ${e.message}`;
      }
    }, 50);
  },
  { immediate: true }
);

// Destruir el grafico al desmontar (ej. usuario apaga el sensor) para no
// retener la instancia y sus datasets fuera de KeepAlive
onBeforeUnmount(() => {
  destruirGrafico(chartCanvas.value);
});
</script>
