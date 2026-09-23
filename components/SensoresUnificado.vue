<template>
  <div class="sensors-container">
    <!-- Barra superior: selector de registros + boton iframe -->
    <div class="flex justify-between items-center p-4" :class="props.isDarkMode ? 'bg-gray-900' : 'bg-gray-100'">
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium" :class="props.isDarkMode ? 'text-gray-300' : 'text-gray-700'">
          Registros:
        </label>
        <select
          v-model.number="limiteSeleccionado"
          :disabled="isLoading"
          class="px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
          :class="[
            props.isDarkMode
              ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          ]"
        >
          <option v-for="opcion in opcionesLimite" :key="opcion.valor" :value="opcion.valor">
            {{ opcion.texto }}
          </option>
        </select>
        <span v-if="isLoading" class="text-xs" :class="props.isDarkMode ? 'text-gray-400' : 'text-gray-500'">
          Cargando...
        </span>
      </div>

    </div>

    <!-- Botones de sensores -->
    <div class="p-6" :class="props.isDarkMode ? 'bg-gray-900' : 'bg-gray-100'">
      <!-- Seccion: Sensores Bomba -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-3 h-3 rounded-full" :class="`bg-${config.sectionColor}-500`"></div>
          <h3 class="text-sm font-bold uppercase tracking-wide"
              :class="props.isDarkMode ? `text-${config.sectionColor}-400` : `text-${config.sectionColor}-700`">
            {{ config.sectionLabel }}
          </h3>
          <div class="flex-1 h-px" :class="props.isDarkMode ? `bg-${config.sectionColor}-800` : `bg-${config.sectionColor}-200`"></div>
        </div>

        <!-- Grupos por tipo (Eléctrico, Temperatura, etc.) -->
        <div class="space-y-4">
          <div
            v-for="grupo in gruposBomba"
            :key="`bomba-${grupo.tipo}`"
            class="rounded-lg p-4 border"
            :class="props.isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'"
          >
            <p class="text-xs font-semibold uppercase tracking-wider mb-3"
               :class="props.isDarkMode ? 'text-gray-400' : 'text-gray-500'">
              {{ grupo.tipo }} ({{ grupo.sensores.length }})
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <button
                v-for="[key, sensor] in grupo.sensores"
                :key="key"
                @click="toggleSensor(key)"
                :class="getButtonClass(key, sensor.buttonColor)"
              >
                <span class="text-sm text-center leading-tight">{{ sensor.label }}</span>
                <span v-if="sensor.tag" class="hidden sm:inline text-sm leading-tight">/ {{ sensor.tag }}</span>
                <span v-if="visibilidad[key]" class="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Seccion: Sensores Generales -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
          <h3 class="text-sm font-bold uppercase tracking-wide" :class="props.isDarkMode ? 'text-emerald-400' : 'text-emerald-700'">
            Sensores Generales (11)
          </h3>
          <div class="flex-1 h-px" :class="props.isDarkMode ? 'bg-emerald-800' : 'bg-emerald-200'"></div>
        </div>

        <div class="space-y-4">
          <div
            v-for="grupo in gruposGenerales"
            :key="`gen-${grupo.tipo}`"
            class="rounded-lg p-4 border"
            :class="props.isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'"
          >
            <p class="text-xs font-semibold uppercase tracking-wider mb-3"
               :class="props.isDarkMode ? 'text-gray-400' : 'text-gray-500'">
              {{ grupo.tipo }} ({{ grupo.sensores.length }})
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <button
                v-for="[key, sensor] in grupo.sensores"
                :key="key"
                @click="toggleSensor(key)"
                :class="getButtonClass(key, sensor.buttonColor)"
              >
                <span class="text-sm text-center leading-tight">{{ sensor.label }}</span>
                <span v-if="sensor.tag" class="hidden sm:inline text-sm leading-tight">/ {{ sensor.tag }}</span>
                <span v-if="visibilidad[key]" class="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tags de graficos activos -->
      <div class="mt-6 p-3 rounded-lg" :class="props.isDarkMode ? 'bg-gray-800' : 'bg-white'" v-show="Object.values(visibilidad).some(v => v)">
        <div class="flex flex-wrap items-center gap-2">
          <div class="text-sm font-medium" :class="props.isDarkMode ? 'text-gray-200' : 'text-gray-800'">Graficos activos:</div>
          <div class="flex flex-wrap gap-2">
            <span v-for="(visible, key) in visibilidad" :key="key" v-show="visible"
                  class="px-2 py-1 text-xs rounded-full"
                  :class="allSensores[key]?.tagClass || 'bg-gray-100 text-gray-800'">
              {{ allSensores[key]?.label || key }}<template v-if="allSensores[key]?.tag"> / {{ allSensores[key]?.tag }}</template>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-show="isLoading" class="text-xl font-semibold p-4">
      Cargando graficos, por favor espere...
    </div>

    <!-- Vista graficos -->
    <div v-if="!isLoading" class="overflow-x-auto overflow-y-hidden mb-6 p-4">
      <div class="flex gap-6 min-w-max">
        <template v-for="(sensorCfg, key) in allSensoresOrdenados" :key="key">
          <div v-if="visibilidad[key]"
               class="grafico flex-shrink-0 w-[calc(100vw-3.5rem)] md:w-[640px] xl:w-[1030px] rounded-lg shadow p-4 sm:p-6"
               :class="props.isDarkMode ? 'bg-gray-800' : 'bg-white'">
            <h2 class="text-lg font-semibold text-center mb-1" :class="props.isDarkMode ? 'text-gray-200' : 'text-gray-800'">
              {{ sensorCfg.titulo }} ({{ sensorCfg.unidad }})<template v-if="sensorCfg.tag"> / {{ sensorCfg.tag }}</template>
            </h2>
            <div class="flex items-center justify-center gap-4 mb-2">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                <span class="text-xs" :class="props.isDarkMode ? 'text-gray-400' : 'text-gray-500'">Normal</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                <span class="text-xs" :class="props.isDarkMode ? 'text-gray-400' : 'text-gray-500'">Anomalia</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full inline-block" style="background-color:#9CA3AF"></span>
                <span class="text-xs" :class="props.isDarkMode ? 'text-gray-400' : 'text-gray-500'">Sin clasificar</span>
              </div>
            </div>
            <div class="w-full h-[300px]">
              <div v-if="getSensorDataLength(key) === 0"
                   class="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed"
                   :class="props.isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4" :class="props.isDarkMode ? 'text-gray-500' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p class="text-lg font-medium mb-1" :class="props.isDarkMode ? 'text-gray-300' : 'text-gray-600'">
                  Sin datos disponibles
                </p>
                <p class="text-sm" :class="props.isDarkMode ? 'text-gray-400' : 'text-gray-500'">
                  No hay registros para este sensor
                </p>
              </div>
              <canvas v-else :ref="(el) => setCanvasRef(key, el)"></canvas>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, watch, nextTick, computed, onUnmounted, reactive } from "vue";
import { Chart, registerables } from "chart.js";
import { useSensores, useSensoresB } from "@/composables/useSensores";
import { getBombaConfig, getAllSensores as getAllSensoresCfg } from "@/config/sensoresConfig";
import { colorClasificacionHex } from "@/utils/chartUtils";
import { useOrdenUI } from "@/composables/useControlUI";
import { resaltar } from "~/agente/enfocar";

Chart.register(...registerables);

const props = defineProps({
  bomba: { type: String, required: true, validator: (v) => ['A', 'B'].includes(v) },
  currentView: { type: Object, default: () => ({ chartTitle: "Analisis de fallas" }) },
  isDarkMode: { type: Boolean, default: false },
  sensorSeleccionado: { type: String, default: null },
});

const emit = defineEmits(['navegarAnomalia']);

// Config por bomba
const config = getBombaConfig(props.bomba);
const allSensores = getAllSensoresCfg(props.bomba);

// Orden de categorías para agrupar sensores por tipo
const ORDEN_TIPOS = ['Temperatura', 'Vibración', 'Otros'];

const obtenerTipoSensor = (sensor) => {
  const t = (sensor.titulo || '').toLowerCase();
  if (t.includes('temp')) return 'Temperatura';
  if (t.includes('vibracion') || t.includes('vibración')) return 'Vibración';
  return 'Otros';
};

const ordenarPorTipo = (sensoresObj) => {
  const entradas = Object.entries(sensoresObj);
  entradas.sort(([, a], [, b]) => {
    const tipoA = ORDEN_TIPOS.indexOf(obtenerTipoSensor(a));
    const tipoB = ORDEN_TIPOS.indexOf(obtenerTipoSensor(b));
    if (tipoA !== tipoB) return tipoA - tipoB;
    return (a.titulo || '').localeCompare(b.titulo || '');
  });
  return Object.fromEntries(entradas);
};

// Agrupa sensores por tipo preservando el orden de ORDEN_TIPOS
const agruparPorTipo = (sensoresObj) => {
  const grupos = new Map();
  ORDEN_TIPOS.forEach((tipo) => grupos.set(tipo, []));

  Object.entries(sensoresObj).forEach(([key, sensor]) => {
    const tipo = obtenerTipoSensor(sensor);
    grupos.get(tipo).push([key, sensor]);
  });

  // Ordenar alfabéticamente dentro de cada grupo y filtrar vacíos
  return ORDEN_TIPOS
    .map((tipo) => ({
      tipo,
      sensores: (grupos.get(tipo) || []).sort(([, a], [, b]) =>
        (a.titulo || '').localeCompare(b.titulo || '')
      ),
    }))
    .filter((g) => g.sensores.length > 0);
};

const sensoresBombaOrdenados = ordenarPorTipo(config.sensoresBomba);
const sensoresGeneralesOrdenados = ordenarPorTipo(config.sensoresGenerales);
const allSensoresOrdenados = { ...sensoresBombaOrdenados, ...sensoresGeneralesOrdenados };

const gruposBomba = agruparPorTipo(config.sensoresBomba);
const gruposGenerales = agruparPorTipo(config.sensoresGenerales);

// Opciones de limite
const opcionesLimite = [
  { valor: 40, texto: '40 registros' },
  { valor: 100, texto: '100 registros' },
  { valor: 200, texto: '200 registros' },
  { valor: 500, texto: '500 registros' },
];
const limiteSeleccionado = ref(40);


// Visibilidad de sensores - generada desde config
const visibilidad = reactive(
  Object.fromEntries(
    Object.keys(allSensores).map((key, i) => [key, i === 0]) // solo el primero activo
  )
);

// Composable de datos - seleccionar por bomba
const sensoresComposable = props.bomba === 'A'
  ? useSensores(limiteSeleccionado)
  : useSensoresB(limiteSeleccionado);

const { isLoading, habilitarSensor } = sensoresComposable;

// Mapear todos los datos del composable a un objeto reactivo
const sensoresData = computed(() => {
  const result = {};
  for (const key of Object.keys(allSensores)) {
    if (sensoresComposable[key]) {
      result[key] = sensoresComposable[key];
    }
  }
  return result;
});

const toggleSensor = (sensor) => {
  visibilidad[sensor] = !visibilidad[sensor];
  if (visibilidad[sensor]) {
    habilitarSensor(sensor);
    const data = sensoresData.value[sensor];
    if (data?.value && data.value.length > 0) {
      nextTick(() => actualizarGraficoIndividual(sensor));
    }
  }
};

const getSensorDataLength = (key) => {
  const data = sensoresData.value[key];
  return data?.value && Array.isArray(data.value) ? data.value.length : 0;
};

// --- Canvas y Charts ---
const canvasRefs = reactive({});
const canvasReady = reactive({});
const charts = reactive({});
const creandoGrafico = reactive({});

const setCanvasRef = (key, el) => {
  if (el) {
    canvasRefs[key] = el;
    canvasReady[key] = true;
    const data = sensoresData.value[key];
    if (data?.value && data.value.length > 0 && visibilidad[key]) {
      requestAnimationFrame(() => actualizarGraficoIndividual(key));
    }
  } else {
    canvasReady[key] = false;
    if (charts[key]) {
      try { charts[key].destroy(); } catch {}
      delete charts[key];
    }
    delete canvasRefs[key];
  }
};

const crearGrafico = (canvas, data, label) => {
  if (creandoGrafico[label]) return;

  if (charts[label] && data?.value?.length > 0) {
    try {
      const tiempos = data.value.map((d) => d.tiempo_sensor);
      const valores = data.value.map((d) => d.valor_sensor);
      const puntosColores = data.value.map((d) => colorClasificacionHex(d.clasificacion));
      charts[label].data.labels = tiempos;
      charts[label].data.datasets[0].data = valores;
      charts[label].data.datasets[0].pointBackgroundColor = puntosColores;
      charts[label].update('none');
      return;
    } catch {
      try { charts[label].destroy(); } catch {}
      delete charts[label];
    }
  }

  creandoGrafico[label] = true;

  if (!canvas) { creandoGrafico[label] = false; return; }
  if (typeof document !== 'undefined' && !document.body.contains(canvas)) { creandoGrafico[label] = false; return; }
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) { creandoGrafico[label] = false; return; }

  if (!data || !data.value || data.value.length === 0) { creandoGrafico[label] = false; return; }

  try {
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
  } catch {}

  const sensorCfg = allSensores[label];
  const lineColor = '#3B82F6';

  const tiempos = data.value.map((d) => d.tiempo_sensor);
  const valores = data.value.map((d) => d.valor_sensor);
  const puntosColores = data.value.map((d) => colorClasificacionHex(d.clasificacion));

  try {
    charts[label] = new Chart(canvas, {
      type: "line",
      data: {
        labels: tiempos,
        datasets: [{
          label: sensorCfg?.titulo || label,
          data: valores,
          borderColor: lineColor,
          backgroundColor: lineColor + "33",
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: puntosColores,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: {
          legend: {
            labels: { color: props.isDarkMode ? '#E5E7EB' : '#374151', font: { size: 12 } },
          },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: {
            ticks: { color: props.isDarkMode ? '#9CA3AF' : '#6B7280', maxRotation: 45, maxTicksLimit: 15, font: { size: 10 } },
            grid: { color: props.isDarkMode ? '#374151' : '#E5E7EB' },
          },
          y: {
            ticks: { color: props.isDarkMode ? '#9CA3AF' : '#6B7280', font: { size: 10 } },
            grid: { color: props.isDarkMode ? '#374151' : '#E5E7EB' },
            title: { display: true, text: sensorCfg?.unidad || '', color: props.isDarkMode ? '#9CA3AF' : '#6B7280' },
          },
        },
      },
    });
  } catch (e) {
    console.warn(`Error creando grafico ${label}:`, e);
  } finally {
    creandoGrafico[label] = false;
  }
};

const actualizarGraficoIndividual = (key) => {
  const canvas = canvasRefs[key];
  const data = sensoresData.value[key];
  if (canvas && data && canvasReady[key]) {
    crearGrafico(canvas, data, key);
  }
};

const actualizarGraficos = async () => {
  await nextTick();
  await new Promise(resolve => requestAnimationFrame(resolve));
  Object.keys(allSensores).forEach(key => {
    if (visibilidad[key] && canvasReady[key]) {
      actualizarGraficoIndividual(key);
    }
  });
};

// --- Un solo watcher para TODOS los sensores (en vez de 25 individuales) ---
for (const key of Object.keys(allSensores)) {
  if (sensoresComposable[key]) {
    watch(sensoresComposable[key], (newData) => {
      if (newData?.length > 0 && visibilidad[key] && canvasReady[key]) {
        nextTick(() => actualizarGraficoIndividual(key));
      }
    }, { immediate: true });
  }
}

// --- Clases de botones ---
const getButtonClass = (sensor, colors) => {
  const isActive = visibilidad[sensor];
  const base = `relative font-semibold py-2 px-3 rounded-lg shadow transition duration-300 ease-in-out flex flex-col items-center justify-center gap-1 border-l-4 ${colors.border}`;
  if (isActive) return [base, `${colors.active} text-white ring-2 ring-offset-2`];
  if (props.isDarkMode) return [base, `bg-gray-800 text-gray-200 border border-gray-600 hover:bg-gray-700 ${colors.hover}`];
  return [base, `bg-white text-gray-700 border border-gray-300 ${colors.hover}`];
};

// --- Lifecycle ---
const handleResize = () => actualizarGraficos();

onMounted(() => {
  nextTick(() => actualizarGraficos());
  window.addEventListener("resize", handleResize);
});

// Re-renderizar charts al volver a la vista (KeepAlive)
onActivated(() => {
  nextTick(() => {
    try {
      Object.keys(charts).forEach((key) => {
        if (charts[key]) charts[key].resize();
      });
    } catch (e) {
      requestAnimationFrame(() => actualizarGraficos());
    }
  });
});

watch(() => props.isDarkMode, () => nextTick(() => actualizarGraficos()), { immediate: false });

watch(isLoading, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    nextTick(() => requestAnimationFrame(() => actualizarGraficos()));
  }
});

watch(() => props.sensorSeleccionado, (nuevoSensor) => {
  if (nuevoSensor && allSensores[nuevoSensor]) {
    Object.keys(visibilidad).forEach(key => {
      visibilidad[key] = key === nuevoSensor;
    });
    habilitarSensor(nuevoSensor);
    nextTick(() => actualizarGraficos());
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  Object.keys(charts).forEach(key => {
    if (charts[key]) {
      try { charts[key].destroy(); } catch {}
      charts[key] = null;
    }
  });
});
// Control por voz (agente): mostrar/ocultar gráficos de señales de esta bomba.
// `mostrar`/`ocultar`: claves localName; `ocultar: 'todas'` oculta el resto.
useOrdenUI('senales', ({ bomba, mostrar = [], ocultar = [] }) => {
  if (bomba !== props.bomba) return undefined;
  const claves = Object.keys(allSensores);
  const aOcultar = ocultar === 'todas' ? claves : ocultar;
  aOcultar.forEach((k) => {
    if (visibilidad[k] && !mostrar.includes(k)) visibilidad[k] = false;
  });
  mostrar.forEach((k) => {
    if (k in visibilidad && !visibilidad[k]) toggleSensor(k);
  });
  if (mostrar[0]) {
    // Llevar a la vista el primer gráfico pedido cuando ya esté dibujado.
    setTimeout(() => {
      const tarjeta = canvasRefs[mostrar[0]]?.closest('.rounded-lg, .rounded-xl') || canvasRefs[mostrar[0]];
      if (tarjeta) resaltar(tarjeta, 'center');
    }, 500);
  }
  const visibles = claves.filter((k) => visibilidad[k]).map((k) => allSensores[k]?.titulo || k);
  return `Señales Bomba ${props.bomba}: gráficos visibles: ${visibles.join(', ') || 'ninguno'}.`;
});
</script>
