<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
      <div>
        <h3 class="text-lg font-semibold text-gray-800">Comparación de Sensores</h3>
        <p class="text-sm text-gray-500 mt-1">
          {{ sensores.length }} sensores seleccionados
        </p>
      </div>
      <button
        @click="cargarTodosDatos"
        :disabled="cargando"
        class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
      >
        <svg v-if="!cargando" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{{ cargando ? 'Cargando...' : 'Actualizar' }}</span>
      </button>
    </div>

    <div class="p-6">
      <!-- Skeleton -->
      <div v-if="cargando" class="animate-pulse">
        <!-- Pills placeholder -->
        <div class="flex flex-wrap gap-2 mb-4">
          <div
            v-for="i in Math.max(sensores.length, 2)"
            :key="'pill-sk-' + i"
            class="h-8 w-44 rounded-full bg-gray-200"
          ></div>
        </div>
        <!-- Chart area -->
        <div class="bg-gray-100 rounded-lg" style="height: 500px;"></div>
        <!-- Leyenda placeholder -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex flex-wrap justify-center gap-4 mb-3">
            <div v-for="i in 4" :key="'leyenda-sk-' + i" class="h-4 w-32 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-red-700 font-medium">Error al cargar datos</p>
        <p class="text-red-600 text-sm mt-1">{{ error }}</p>
      </div>

      <!-- No Data State -->
      <div v-else-if="datasetsListos.length === 0" class="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-600 font-medium">No hay datos disponibles</p>
        <p class="text-gray-500 text-sm mt-1">No se encontraron datos para los sensores seleccionados</p>
      </div>

      <!-- Chart -->
      <div v-else>
        <!-- Resumen de sensores con formas -->
        <div class="flex flex-wrap gap-2 mb-4">
          <span
            v-for="(ds, index) in datasetsListos"
            :key="ds.label"
            class="px-3 py-1.5 rounded-full text-sm font-medium text-white flex items-center gap-2"
            :style="{ backgroundColor: getColorBorde(index), backgroundImage: 'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35))' }"
          >
            <span class="text-lg">{{ getForma(index) }}</span>
            {{ ds.label }} ({{ ds.unidad }})<template v-if="ds.tag"> / {{ ds.tag }}</template>
          </span>
        </div>

        <!-- Canvas para Chart.js -->
        <div class="relative" style="height: 500px;">
          <canvas ref="chartCanvas"></canvas>
        </div>

        <!-- Leyenda de formas -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex flex-wrap justify-center gap-4 mb-3">
            <div class="flex items-center">
              <div class="w-4 h-4 rounded-full mr-2 bg-blue-500"></div>
              <span class="text-xs text-gray-600">Sensor 1: Círculo</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 mr-2 bg-green-500"></div>
              <span class="text-xs text-gray-600">Sensor 2: Cuadrado</span>
            </div>
            <div class="flex items-center">
              <div class="w-0 h-0 mr-2 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-purple-500"></div>
              <span class="text-xs text-gray-600">Sensor 3: Triángulo</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 mr-2 bg-orange-500 rotate-45"></div>
              <span class="text-xs text-gray-600">Sensor 4: Diamante</span>
            </div>
          </div>
          <div class="flex justify-center gap-6">
            <div class="flex items-center">
              <div class="w-5 h-5 rounded-full mr-2 bg-white border-4 border-blue-500"></div>
              <span class="text-sm text-gray-600">Punto anómalo (más grande, fondo blanco)</span>
            </div>
            <div class="flex items-center text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Sensores con misma unidad comparten eje Y</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { crearGraficoCombinado } from '@/utils/chartUtils';
import { authFetch } from '~/utils/authFetch';

const props = defineProps({
  sensores: {
    type: Array,
    required: true,
    // Formato: [{ key, alertaId, label, unidad }]
  },
  bomba: {
    type: String,
    required: true,
    validator: (value) => ['A', 'B'].includes(value)
  },
  minutosContexto: {
    type: Number,
    default: 30
  }
});

const { apiUrl } = useRuntimeConfig().public;
const queryClient = useQueryClient();

// Estado
const chartCanvas = ref(null);
const cargando = ref(false);
const error = ref(null);
const datasetsListos = ref([]);

// Colores para los sensores (deben coincidir con COLORES_SENSORES en chartUtils.js)
const COLORES = [
  { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.2)' },   // Azul
  { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.2)' },     // Verde
  { border: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.2)' },   // Púrpura
  { border: 'rgb(249, 115, 22)', bg: 'rgba(249, 115, 22, 0.2)' },   // Naranja
  { border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.2)' },   // Rosa
  { border: 'rgb(6, 182, 212)', bg: 'rgba(6, 182, 212, 0.2)' },     // Cian
  { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.2)' },   // Ámbar
  { border: 'rgb(20, 184, 166)', bg: 'rgba(20, 184, 166, 0.2)' },   // Teal
];

// Formas para la leyenda (deben coincidir en orden con ESTILOS_PUNTOS en chartUtils.js)
const FORMAS = ['●', '■', '▲', '◆', '★', '✚', '⬟', '✕'];

const getColorBorde = (index) => COLORES[index % COLORES.length].border;
const getForma = (index) => FORMAS[index % FORMAS.length];

// Cargar datos de un sensor específico (usa cache de Vue Query si está disponible)
// La queryKey calza con useDatosAnomaliaConContexto y prefetchDatosAnomaliaContexto,
// así que reusa cache del hover prefetch / vista individual / correlacionados.
const cargarDatosSensor = async (sensor) => {
  if (!sensor.alertaId) {
    console.warn(`Sensor ${sensor.label} no tiene alertaId`);
    return null;
  }

  const bombaSensor = sensor.bomba || props.bomba;

  try {
    const data = await queryClient.fetchQuery({
      queryKey: [
        'datosAnomaliaContexto',
        sensor.alertaId,
        props.minutosContexto,
        props.minutosContexto,
        bombaSensor,
      ],
      queryFn: async () => {
        const url = `${apiUrl}/alertas_umbral/${sensor.alertaId}/datos_anomalia_contexto?minutos_antes=${props.minutosContexto}&minutos_despues=${props.minutosContexto}&bomba=${bombaSensor}`;
        const response = await authFetch(url);
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return await response.json();
      },
      staleTime: 5 * 60 * 1000,
    });

    if (!data?.datos || data.datos.length === 0) return null;

    return {
      label: sensor.label,
      unidad: sensor.unidad || 'valor',
      tag: sensor.tag,
      data: data.datos.map(d => ({
        tiempo: d.tiempo_ejecucion,
        valor: d.valor_sensor,
        esAnomalia: d.es_anomalia
      }))
    };
  } catch (err) {
    console.error(`Error cargando datos de ${sensor.label}:`, err);
    return null;
  }
};

// Cargar todos los datos en paralelo (solo sensores con anomalía; cada uno en
// su propia ventana ±minutosContexto de SU alerta).
const cargarTodosDatos = async () => {
  if (props.sensores.length === 0) {
    datasetsListos.value = [];
    return;
  }

  cargando.value = true;
  error.value = null;

  try {
    const promesas = props.sensores.map(sensor => cargarDatosSensor(sensor));
    const resultados = await Promise.all(promesas);
    const combinados = resultados.filter(r => r !== null);

    // Asignar color/forma por índice del array FINAL (evita desalineación entre
    // el color del dataset y el de las pills de leyenda, que también se pintan
    // según el índice de datasetsListos).
    datasetsListos.value = combinados.map((ds, index) => ({
      ...ds,
      color: COLORES[index % COLORES.length],
    }));

    if (datasetsListos.value.length === 0) {
      error.value = 'No se encontraron datos para ningún sensor';
      return;
    }

    // Esperar a que el DOM se actualice y crear el gráfico
    await nextTick();
    setTimeout(() => {
      if (chartCanvas.value) {
        crearGraficoCombinado(chartCanvas.value, datasetsListos.value, {
          isDarkMode: false
        });
      }
    }, 100);

  } catch (err) {
    error.value = err.message;
    console.error('Error al cargar datos combinados:', err);
  } finally {
    cargando.value = false;
  }
};

// Cargar datos cuando cambian los sensores seleccionados
watch(() => props.sensores, (nuevos) => {
  if (nuevos && nuevos.length > 0) {
    cargarTodosDatos();
  } else {
    datasetsListos.value = [];
  }
}, { deep: true, immediate: true });

onMounted(() => {
  if (props.sensores.length > 0) {
    cargarTodosDatos();
  }
});
</script>
